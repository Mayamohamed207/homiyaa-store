import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card/Card';
import Badge from '../ui/Badge/Badge';
import Button from '../ui/Button/Button';
import './ProductCard.css';
import toast from 'react-hot-toast';

export interface ProductColor {
  color_code: string;
  color_name_en: string;
  color_name_ar: string;
}

export interface Product {
  id: number;
  name_en: string;
  name_ar: string;
  category_en: string;
  category_ar: string;
  description_en?: string;
  description_ar?: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  is_sold_out: boolean;
  is_popular: boolean;
  is_new_arrival?: boolean;
  product_images: { image_url: string }[];
  product_colors: ProductColor[];
}

interface ProductCardProps {
  product: Product;
  language: 'en' | 'ar';
  isAdminMode?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (id: number) => void;
  onAddToCart?: (product: Product, selectedColor: ProductColor) => void;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500&q=80';

const ProductCard = ({
  product,
  language,
  isAdminMode = false,
  onEdit,
  onDelete,
  onAddToCart
}: ProductCardProps) => {
  const navigate = useNavigate();
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [chosenColorIndex, setChosenColorIndex] = useState<number | null>(null);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const { user } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .maybeSingle()
      .then(({ data }) => setWishlisted(!!data));
  }, [user, product.id]);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error(language === 'ar' ? 'سجل دخولك أولاً' : 'Please sign in first');
      return;
    }
    if (wishlisted) {
      await supabase.from('wishlists').delete().match({ user_id: user.id, product_id: product.id });
      setWishlisted(false);
      toast.success(language === 'ar' ? 'تم الحذف من المفضلة' : 'Removed from Favorites');
    } else {
      await supabase.from('wishlists').insert({ user_id: user.id, product_id: product.id });
      setWishlisted(true);
      toast.success(language === 'ar' ? 'تمت الإضافة للمفضلة' : 'Added to Favorites');
    }
  };

  const name = language === 'ar' ? product.name_ar : product.name_en;
  
  // Get initial value based on active language selection
  let category = language === 'ar' ? product.category_ar : product.category_en;

  // Clean raw database entries that mistakenly contain combined dual-language names (e.g., "MUGS / مجات حرارية")
  if (category && category.includes(' / ')) {
    const parts = category.split(' / ');
    category = language === 'ar' ? parts[1] : parts[0];
  }

  const images = product.product_images || [];
  const currentImageUrl = images.length > 0 && images[activeImgIndex] ? images[activeImgIndex].image_url : FALLBACK_IMAGE;
  const colors = product.product_colors || [];

  const handleCardRedirection = () => {
    if (!isAdminMode) {
      navigate(`/product/${product.id}`);
    }
  };

  const handleCartClick = () => {
    if (product.is_sold_out || !onAddToCart) return;
    if (colors.length > 0 && chosenColorIndex === null) {
      toast.error(
        language === 'ar'
          ? '⚠️ يرجى اختيار لون أولاً!'
          : '⚠️ Please select a color!'
      );
      return;
    }
    const assignedColor = colors.length > 0
      ? colors[chosenColorIndex!]
      : { color_code: '#000000', color_name_en: 'Default', color_name_ar: 'افتراضي' };
    
    onAddToCart(product, assignedColor);
    
    toast.success(
      language === 'ar' ? 'تمت الإضافة إلى السلة بنجاح' : 'Added to cart successfully'
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (images.length <= 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 40 && dy < 60) {
      if (dx < 0) {
        setActiveImgIndex(i => (i + 1) % images.length);
      } else {
        setActiveImgIndex(i => (i - 1 + images.length) % images.length);
      }
    }
  };

  return (
    <Card
      className={`product-card ${product.is_sold_out ? 'sold-out' : ''} ${isAdminMode ? 'admin-card-layout' : ''}`}
      onClick={handleCardRedirection}
      style={{ cursor: isAdminMode ? 'default' : 'pointer' }}
    >
      <div
        className="product-image-container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {product.is_sold_out && (
          <Badge variant="secondary" className="product-badge sold-out-badge">
            {language === 'ar' ? 'نفذت الكمية' : 'Sold Out'}
          </Badge>
        )}
        {product.is_popular && !product.is_sold_out && (
          <Badge variant="primary" className="product-badge popular-badge">
            {language === 'ar' ? 'الأكثر مبيعاً' : 'Best Selling'}
          </Badge>
        )}

        {!isAdminMode && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`product-favorite ${wishlisted ? 'wishlisted' : ''}`}
            aria-label="Toggle wishlist"
            onClick={handleWishlistToggle}
          >
            <Heart
              className="icon"
              size={18}
              fill={wishlisted ? '#ef4444' : 'none'}
              color={wishlisted ? '#ef4444' : 'currentColor'}
            />
          </motion.button>
        )}

        <img src={currentImageUrl} alt={name} className="product-image" />

        {images.length > 1 && (
          <div className="card-image-dots">
            {images.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                className={`image-dot ${dotIdx === activeImgIndex ? 'active' : ''}`}
                onClick={e => {
                  e.stopPropagation();
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
                type="button"
                className={`product-color ${chosenColorIndex === idx ? 'selected' : ''}`}
                style={{ backgroundColor: c.color_code }}
                title={language === 'ar' ? c.color_name_ar : c.color_name_en}
                aria-label={`Select color ${c.color_name_en}`}
                onClick={e => {
                  e.stopPropagation();
                  const newIndex = chosenColorIndex === idx ? null : idx;
                  setChosenColorIndex(newIndex);
                  if (newIndex !== null && images[newIndex + 1]) {
                    setActiveImgIndex(newIndex + 1);
                  } else {
                    setActiveImgIndex(0);
                  }
                }}
              />
            ))}
          </div>
        )}

        <h1 className="product-name line-clamp-2">{name}</h1>
        <h6 className="product-category line-clamp-1">{category}</h6>

        <div className="product-footer">
          <div>
            {product.discount_price ? (
              <>
                <span className="product-price">{product.discount_price} EGP</span>
                <span className="product-old-price" style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '0.85em', marginInlineStart: '0.3rem' }}>{product.price} EGP</span>
              </>
            ) : (
              <span className="product-price">{product.price} EGP</span>
            )}
          </div>

          {isAdminMode ? (
            <div className="admin-actions-wrapper" onClick={e => e.stopPropagation()}>
              <button type="button" className="admin-edit-action-btn" onClick={() => onEdit?.(product)} title="Edit configuration">
                <Edit size={16} />
              </button>
              <button type="button" className="admin-delete-action-btn" onClick={() => onDelete?.(product.id)} title="Remove listing">
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <div onClick={e => e.stopPropagation()}>
              <Button
                variant="primary"
                size="sm"
                disabled={product.is_sold_out}
                onClick={() => handleCartClick()}
              >
                <ShoppingCart className="icon" size={18} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;