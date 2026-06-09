import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import { ShoppingCart, Heart, Layers, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext'; 
import { useCart } from '../../context/CartContext'; // Connected to Cart Context Tracker Matrix

// Atomic UI components
import Card from '../ui/Card/Card';
import Badge from '../ui/Badge/Badge';
import Button from '../ui/Button/Button';
import './ProductGrid.css';

// Type Interfaces
interface ProductColor {
  color_code: string;
  color_name_en: string;
  color_name_ar: string;
}

interface Product {
  id: number;
  name_en: string;
  name_ar: string;
  category_en: string;
  category_ar: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  is_sold_out: boolean;
  is_popular: boolean;
  product_images: { image_url: string }[]; 
  product_colors: ProductColor[];
}

interface ProductGridProps {
  searchQuery: string;
}

type SortOption = 'popular' | 'price-asc' | 'price-desc' | 'latest';

/* ==========================================
   1. PRODUCT CARD ITEM COMPONENT
   ========================================== */
const ProductCardItem = ({ 
  item, 
  language, 
  onAddToCart 
}: { 
  item: Product; 
  language: 'en' | 'ar'; 
  onAddToCart: (product: Product) => void; 
}) => {
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  const name = language === 'ar' ? item.name_ar : item.name_en;
  const category = language === 'ar' ? item.category_ar : item.category_en;
  
  const images = item.product_images || [];
  const fallbackImage = 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500&q=80';
  
  const currentImageUrl = images.length > 0 && images[activeImgIndex] 
    ? images[activeImgIndex].image_url 
    : fallbackImage;

  const colors = item.product_colors || [];

  return (
    <Card className={`product-card ${item.is_sold_out ? 'sold-out' : ''}`}>
      <div className="product-image-container">
        {item.is_sold_out && (
          <Badge variant="secondary" className="product-badge sold-out-badge">
            {language === 'ar' ? 'نفذت الكمية' : 'Sold Out'}
          </Badge>
        )}
        {item.is_popular && !item.is_sold_out && (
          <Badge variant="primary" className="product-badge popular-badge">
            {language === 'ar' ? 'شائع' : 'Popular'}
          </Badge>
        )}

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="product-favorite"
          aria-label="Add to favorites"
        >
          <Heart className="icon" size={18} />
        </motion.button>

        <img src={currentImageUrl} alt={name} className="product-image" />

        {images.length > 1 && (
          <div className="card-image-dots">
            {images.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                className={`image-dot ${dotIdx === activeImgIndex ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveImgIndex(dotIdx);
                }}
                title={language === 'ar' ? `عرض الصورة ${dotIdx + 1}` : `View image ${dotIdx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="product-info">
        {colors.length > 0 && (
          <div className="product-colors">
            {colors.map((c, idx) => (
              <button 
                key={idx} 
                className="product-color" 
                style={{ backgroundColor: c.color_code }}
                title={language === 'ar' ? c.color_name_ar : c.color_name_en}
                aria-label={`Select color ${c.color_name_en}`}
              />
            ))}
          </div>
        )}

        <p className="product-category line-clamp-1">{category}</p>
        <h3 className="product-name line-clamp-2">{name}</h3>
        
        <div className="product-footer">
          <div>
            {item.discount_price ? (
              <>
                <span className="product-price">{item.discount_price} EGP</span>
                <span className="product-old-price">{item.price} EGP</span>
              </>
            ) : (
              <span className="product-price">{item.price} EGP</span>
            )}
          </div>

          <Button 
            variant="primary" 
            size="sm" 
            disabled={item.is_sold_out}
            onClick={() => onAddToCart(item)}
          >
            <ShoppingCart className="icon" size={18} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

/* ==========================================
   2. MAIN PRODUCT GRID COMPONENT
   ========================================== */
export const ProductGrid = ({ searchQuery }: ProductGridProps) => {
  const { language } = useLanguage();
  const { addToCart } = useCart(); // Destructures your custom context hook directly here
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

      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    };

    loadStoreProducts();
  }, []);

  // Maps custom DB structure schemas into the unified objects consumed by CartDrawers
  const handleAddToCartMapping = (item: Product) => {
    const activePrice = item.discount_price ? item.discount_price : item.price;
    const fallbackImage = 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500&q=80';
    const mainImage = item.product_images?.[0]?.image_url || fallbackImage;

    const cartNormalizedItem = {
      id: item.id,
      name_en: item.name_en,
      name_ar: item.name_ar,
      price: activePrice,
      image: mainImage,
      quantity: 1
    };

    // Safely executes your global context function safely, if present
    if (addToCart) {
      addToCart(cartNormalizedItem);
    } else {
      // Fallback configuration error catcher logic
      console.warn("Cart Context handler logic missing configuration contexts.");
    }
  };

  const uniqueCategories = useMemo(() => {
    const categoriesMap = new Map<string, string>();
    
    products.forEach(p => {
      if (p.category_en && p.category_ar) {
        categoriesMap.set(p.category_en.trim(), language === 'ar' ? p.category_ar.trim() : p.category_en.trim());
      }
    });

    return Array.from(categoriesMap.entries()).map(([enVal, localizedLabel]) => ({
      value: enVal,
      label: localizedLabel
    }));
  }, [products, language]);

  const processedProducts = useMemo(() => {
    let result = products.filter((item) => {
      const matchesEn = item.name_en.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.category_en.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAr = item.name_ar.includes(searchQuery) || 
                        item.category_ar.includes(searchQuery);
      return matchesEn || matchesAr;
    });

    if (selectedCategory !== 'all') {
      result = result.filter(item => item.category_en.toLowerCase() === selectedCategory.toLowerCase());
    }

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
        <div className="spinner-ring"></div>
        <p>{language === 'ar' ? 'جاري تحميل المنتجات الفاخرة...' : 'Loading premium collection...'}</p>
      </div>
    );
  }

  return (
    <section className="product-grid-section">
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
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">{language === 'ar' ? 'جميع المنتجات' : 'All Products'}</option>
              {uniqueCategories.map((cat) => (
                <option key={cat.value} value={cat.value.toLowerCase()}>
                  {cat.label}
                </option>
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
              onChange={(e) => setSortBy(e.target.value as SortOption)}
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
                : "Try altering your filter metrics or look up another term."}
            </p>
            {(selectedCategory !== 'all' || searchQuery !== '') && (
              <button 
                className="reset-filters-btn"
                onClick={() => { setSelectedCategory('all'); setSortBy('popular'); }}
              >
                {language === 'ar' ? 'إعادة تعيين' : 'Reset Filters'}
              </button>
            )}
          </div>
        ) : (
          <div className="product-grid">
            {processedProducts.map((item) => (
              <ProductCardItem 
                key={item.id} 
                item={item} 
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