import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card/Card';
import Badge from '../ui/Badge/Badge';
import Button from '../ui/Button/Button';
import './ProductCard.css';

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

  const name = language === 'ar' ? product.name_ar : product.name_en;
  const category = language === 'ar' ? product.category_ar : product.category_en;
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
    alert(language === 'ar' ? '⚠️ يرجى اختيار لون أولاً!' : '⚠️ Please select a color!');
    return;
  }

  const assignedColor = colors.length > 0 ? colors[chosenColorIndex!] : { color_code: '#000000', color_name_en: 'Default', color_name_ar: 'افتراضي' };
  onAddToCart(product, assignedColor);
};

  return (
    <Card
      className={`product-card ${product.is_sold_out ? 'sold-out' : ''} ${isAdminMode ? 'admin-card-layout' : ''}`}
      onClick={handleCardRedirection}
      style={{ cursor: isAdminMode ? 'default' : 'pointer' }}
    >
      <div className="product-image-container">
        {product.is_sold_out && (
          <Badge variant="secondary" className="product-badge sold-out-badge">
            {language === 'ar' ? 'نفذت الكمية' : 'Sold Out'}
          </Badge>
        )}
        {product.is_popular && !product.is_sold_out && (
          <Badge variant="primary" className="product-badge popular-badge">
            {language === 'ar' ? 'شائع' : 'Popular'}
          </Badge>
        )}

        {!isAdminMode && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="product-favorite"
            aria-label="Add to favorites"
            onClick={e => e.stopPropagation()}
          >
            <Heart className="icon" size={18} />
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
                  setChosenColorIndex(chosenColorIndex === idx ? null : idx);
                }}
              />
            ))}
          </div>
        )}

        <p className="product-category line-clamp-1">{category}</p>
        <h3 className="product-name line-clamp-2">{name}</h3>

        <div className="product-footer">
          <div>
            {product.discount_price ? (
              <>
                <span className="product-price">{product.discount_price} EGP</span>
                <span className="product-old-price">{product.price} EGP</span>
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
              // Highlight-start
              onClick={() => handleCartClick()} 
              // Highlight-end
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