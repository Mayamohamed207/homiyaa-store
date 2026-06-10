import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { Layers, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import ProductCard, { Product, ProductColor } from '../ProductCard/ProductCard';
import './ProductGrid.css';

interface ProductGridProps {
  searchQuery: string;
}

type SortOption = 'popular' | 'price-asc' | 'price-desc' | 'latest';

export const ProductGrid = ({ searchQuery }: ProductGridProps) => {
  const { language } = useLanguage();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  useEffect(() => {
    const loadStoreProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(image_url), product_colors(color_code, color_name_en, color_name_ar)')
        .order('id', { ascending: false });

      if (!error && data) setProducts(data);
      setLoading(false);
    };

    loadStoreProducts();
  }, []);

  // Listen for category selection events published by the Footer layout
  useEffect(() => {
    const handleGlobalCategoryChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setSelectedCategory(customEvent.detail);
      }
    };

    window.addEventListener('storeCategoryChanged', handleGlobalCategoryChange);
    return () => {
      window.removeEventListener('storeCategoryChanged', handleGlobalCategoryChange);
    };
  }, []);

  // Sync dropdown shifts outwards to footer layout references
  const handleDropdownCategorySelect = (value: string) => {
    setSelectedCategory(value);
    const event = new CustomEvent('storeCategoryChanged', { detail: value });
    window.dispatchEvent(event);
  };

  const handleAddToCartMapping = (item: Product, chosenColor: ProductColor) => {
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
        selected_color: chosenColor
      });
    }
  };

  const uniqueCategories = useMemo(() => {
    const categoriesMap = new Map<string, string>();
    products.forEach(p => {
      if (p.category_en && p.category_ar)
        categoriesMap.set(p.category_en.trim(), language === 'ar' ? p.category_ar.trim() : p.category_en.trim());
    });
    return Array.from(categoriesMap.entries()).map(([enVal, localizedLabel]) => ({ value: enVal, label: localizedLabel }));
  }, [products, language]);

  const processedProducts = useMemo(() => {
    let result = products.filter(item => {
      const matchesEn = item.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.category_en.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAr = item.name_ar.includes(searchQuery) || item.category_ar.includes(searchQuery);
      return matchesEn || matchesAr;
    });

    if (selectedCategory !== 'all')
      result = result.filter(item => item.category_en.toLowerCase() === selectedCategory.toLowerCase());

    result.sort((a, b) => {
      const priceA = a.discount_price ?? a.price;
      const priceB = b.discount_price ?? b.price;
      if (sortBy === 'popular') {
        if (a.is_popular && !b.is_popular) return -1;
        if (!a.is_popular && b.is_popular) return 1;
        return b.id - a.id;
      }
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'latest') return b.id - a.id;
      return 0;
    });

    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-ring" />
        <p>{language === 'ar' ? 'جاري تحميل المنتجات الفاخرة...' : 'Loading premium collection...'}</p>
      </div>
    );
  }

  return (
    <section id="shop" className="product-grid-section">
      <div className="container">
        <div className="store-controls-wrapper">
          <div className="control-group">
            <label className="control-label">
              <Layers size={16} />
              {language === 'ar' ? 'التصنيف' : 'Category'}
            </label>
            <select
              className="store-control-select"
              value={selectedCategory}
              onChange={e => handleDropdownCategorySelect(e.target.value)}
            >
              <option value="all">{language === 'ar' ? 'جميع المنتجات' : 'All Products'}</option>
              {uniqueCategories.map(cat => (
                <option key={cat.value} value={cat.value.toLowerCase()}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">
              <ArrowUpDown size={16} />
              {language === 'ar' ? 'ترتيب حسب' : 'Sort By'}
            </label>
            <select
              className="store-control-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
            >
              <option value="popular">{language === 'ar' ? 'الشعبية أولاً' : 'Popular First'}</option>
              <option value="latest">{language === 'ar' ? 'المضاف حديثاً' : 'Latest Arrivals'}</option>
              <option value="price-asc">{language === 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
              <option value="price-desc">{language === 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
            </select>
          </div>
        </div>

        {processedProducts.length === 0 ? (
          <div className="empty-store-state">
            <h3>{language === 'ar' ? 'لم يتم العثور على نتائج' : 'No products found'}</h3>
            <p>
              {language === 'ar'
                ? 'جرب تغيير خيارات التصفية أو البحث عن منتجات أخرى.'
                : 'Try altering your filter metrics or look up another term.'}
            </p>
            {(selectedCategory !== 'all' || searchQuery !== '') && (
              <button
                className="reset-filters-btn"
                onClick={() => { handleDropdownCategorySelect('all'); setSortBy('popular'); }}
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