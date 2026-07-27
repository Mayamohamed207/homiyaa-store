import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { ArrowUpDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import ProductCard, { Product, ProductColor, ProductVariant } from '../ProductCard/ProductCard';
import './ProductGrid.css';

interface ProductGridProps {
  searchQuery: string;
}

type SortOption = 'popular' | 'price-asc' | 'price-desc' | 'latest';

export const ProductGrid = ({ searchQuery }: ProductGridProps) => {
  const { language } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [products, setProducts] = useState<(Product & { is_hidden?: boolean })[]>([]);
  const [storeCategories, setStoreCategories] = useState<{ name_en: string; name_ar: string }[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  useEffect(() => {
    if (!user) { setWishlistIds(new Set()); return; }
    supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setWishlistIds(new Set((data || []).map((w: any) => w.product_id)));
      });
  }, [user]);

  const loadStoreProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(image_url), product_colors(color_code, color_name_en, color_name_ar), product_variants(id, variant_name_en, variant_name_ar, display_order)')
      .order('display_order', { ascending: true });
    if (!error && data) setProducts(data);
    setLoading(false);
  }, []);

  const loadStoreCategories = useCallback(async () => {
    const { data } = await supabase
      .from('store_categories')
      .select('name_en, name_ar')
      .order('name_en', { ascending: true });
    if (data) setStoreCategories(data);
  }, []);

  useEffect(() => {
    loadStoreProducts();
  }, [loadStoreProducts]);

  useEffect(() => {
    loadStoreCategories();
  }, [loadStoreCategories]);

  useEffect(() => {
    const handleGlobalCategoryChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) setSelectedCategory(customEvent.detail);
    };
    window.addEventListener('storeCategoryChanged', handleGlobalCategoryChange);
    return () => window.removeEventListener('storeCategoryChanged', handleGlobalCategoryChange);
  }, []);

  useEffect(() => {
    const handleCategoriesUpdated = () => {
      loadStoreProducts();
      loadStoreCategories();
    };
    window.addEventListener('storeCategoriesUpdated', handleCategoriesUpdated);
    return () => window.removeEventListener('storeCategoriesUpdated', handleCategoriesUpdated);
  }, [loadStoreProducts, loadStoreCategories]);

 const handleCategorySelect = (value: string) => {
  setSelectedCategory(value);
  window.dispatchEvent(new CustomEvent('storeCategoryChanged', { detail: value }));

  const productsSection = document.getElementById('shop') || document.getElementById('products') || document.getElementById('products-section');
  if (productsSection) {
    productsSection.scrollIntoView({ behavior: 'smooth' });
  } else {
    window.scrollTo({ top: 500, behavior: 'smooth' });
  }
};

  const handleAddToCartMapping = (
    item: Product,
    chosenColor: ProductColor,
    chosenVariant?: ProductVariant | null
  ) => {
    const activePrice = item.discount_price ? item.discount_price : item.price;
    const fallbackImage = 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500&q=80';
    const dynamicMainImage = item.product_images?.[0]?.image_url || fallbackImage;
    if (addToCart) {
      addToCart({
        id: item.id,
        name_en: item.name_en,
        name_ar: item.name_ar,
        price: activePrice,
        image: dynamicMainImage,
        quantity: 1,
        selected_color: chosenColor,
        selected_variant: chosenVariant ?? null,
      });
    }
  };

  const uniqueCategories = useMemo(() => {
    return storeCategories.map(cat => ({
      value: cat.name_en,
      label: language === 'ar' ? cat.name_ar : cat.name_en,
    }));
  }, [storeCategories, language]);

  const processedProducts = useMemo(() => {
    let result = products.filter(item => !item.is_hidden);

    result = result.filter(item => {
      const matchesEn =
        item.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category_en.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAr =
        item.name_ar.includes(searchQuery) || item.category_ar.includes(searchQuery);
      return matchesEn || matchesAr;
    });

    if (selectedCategory === '__wishlist__') {
      result = result.filter(item => wishlistIds.has(item.id));
    } else if (selectedCategory === '__new_arrivals__') {
      result = result.filter(item => item.is_new_arrival === true);
    } else if (selectedCategory === '__sales__') {
      result = result.filter(item => item.discount_price !== null && item.discount_price > 0);
    } else if (selectedCategory !== 'all') {
      result = result.filter(
        item => item.category_en.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    result.sort((a, b) => {
      if (a.is_sold_out && !b.is_sold_out) return 1;
      if (!a.is_sold_out && b.is_sold_out) return -1;
      const priceA = a.discount_price ?? a.price;
      const priceB = b.discount_price ?? b.price;
      if (sortBy === 'popular') {
        if (a.is_popular && !b.is_popular) return -1;
        if (!a.is_popular && b.is_popular) return 1;
        return ((a as any).display_order ?? 0) - ((b as any).display_order ?? 0);
      }
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      return ((a as any).display_order ?? 0) - ((b as any).display_order ?? 0);
    });

    return result;
  }, [products, searchQuery, selectedCategory, sortBy, wishlistIds]);

  const sortLabel = {
    popular:      language === 'ar' ? 'الأكثر مبيعاً'  : 'Best Selling',
    latest:       language === 'ar' ? 'الأحدث'        : 'Latest',
    'price-asc':  language === 'ar' ? 'السعر: الأقل'  : 'Price ↑',
    'price-desc': language === 'ar' ? 'السعر: الأعلى' : 'Price ↓',
  }[sortBy];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-ring" />
        <p>{language === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading collection...'}</p>
      </div>
    );
  }

  return (
    <section id="shop" className="product-grid-section">
      <div className="container">

        <div className="section-header" style={{ marginBottom: '0.75rem' }}>
          <h2 className="section-title">
            {language === 'ar' ? 'الأقسام' : 'Categories'}
          </h2>
        </div>

        <div className="category-pills-row">
          <button
            className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => handleCategorySelect('all')}
          >
            {language === 'ar' ? 'الكل' : 'All'}
          </button>

          <button
            className={`category-pill ${selectedCategory === '__sales__' ? 'active' : ''}`}
            onClick={() => handleCategorySelect('__sales__')}
          >
            {language === 'ar' ? '🏷️ التخفيضات' : '🏷️ Sales'}
          </button>

          <button
            className={`category-pill ${selectedCategory === '__new_arrivals__' ? 'active' : ''}`}
            onClick={() => handleCategorySelect('__new_arrivals__')}
          >
            {language === 'ar' ? '✦ وصل حديثاً' : '✦ New Arrivals'}
          </button>

          {user && (
            <button
              className={`category-pill ${selectedCategory === '__wishlist__' ? 'active' : ''}`}
              onClick={() => handleCategorySelect('__wishlist__')}
            >
              {language === 'ar' ? '❤️ المفضلة' : '❤️ Favorites'}
            </button>
          )}

          {uniqueCategories.map(cat => (
            <button
              key={cat.value}
              className={`category-pill ${selectedCategory === cat.value.toLowerCase() ? 'active' : ''}`}
              onClick={() => handleCategorySelect(cat.value.toLowerCase())}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="section-header">
          <h2 className="section-title">
            {selectedCategory === '__sales__'
              ? (language === 'ar' ? 'العروض الحالية' : 'Active Deals')
              : selectedCategory === '__new_arrivals__'
              ? (language === 'ar' ? 'وصل حديثاً' : 'New Arrivals')
              : (language === 'ar' ? 'المنتجات' : 'Products')
            }
          </h2>
          <div className="sort-wrapper">
            <button className="sort-btn">
              <ArrowUpDown size={13} />
              {language === 'ar' ? 'ترتيب' : 'Sort'} · {sortLabel}
            </button>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
            >
              <option value="popular">{language === 'ar' ? 'الأكثر مبيعاً' : 'Best Selling'}</option>
              <option value="price-asc">{language === 'ar' ? 'السعر: الأقل للأعلى' : 'Price: Low to High'}</option>
              <option value="price-desc">{language === 'ar' ? 'السعر: الأعلى للأقل' : 'Price: High to Low'}</option>
            </select>
          </div>
        </div>

        {processedProducts.length === 0 ? (
          <div className="empty-store-state">
            <h3>{language === 'ar' ? 'لم يتم العثور على نتائج' : 'No products found'}</h3>
            <p>
              {language === 'ar'
                ? 'جرب تغيير خيارات التصفية أو البحث عن منتجات أخرى.'
                : 'Try altering your filters or search for something else.'}
            </p>
            {(selectedCategory !== 'all' || searchQuery !== '') && (
              <button
                className="reset-filters-btn"
                onClick={() => { handleCategorySelect('all'); setSortBy('popular'); }}
              >
                {language === 'ar' ? 'إعادة تعيين' : 'Reset Filters'}
              </button>
            )}
          </div>
        ) : (
          <div className="product-grid">
            {processedProducts.map(item => (
              <ProductCard
                key={item.id}
                product={item}
                language={language}
                onAddToCart={handleAddToCartMapping}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

export default ProductGrid;