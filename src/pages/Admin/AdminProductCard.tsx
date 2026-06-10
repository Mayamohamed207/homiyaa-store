import { useState, useEffect } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import './AdminProductCard.css';
import { Product } from '../../components/ProductCard/ProductCard';

const AdminProductCard = ({
  p,
  onEdit,
  onDelete,
}: {
  p: Product;
  onEdit: (p: Product) => void;
  onDelete: (id: number) => void;
}) => {
  const images = p.product_images || [];
  const defaultImage = 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500&q=80';
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  useEffect(() => { setActiveImgIndex(0); }, [p]);

  const currentImageUrl =
    images.length > 0 && images[activeImgIndex]
      ? images[activeImgIndex].image_url
      : defaultImage;

  return (
    <div className="admin-product-card">
      <div className="admin-card-image">
        <img src={currentImageUrl} alt={p.name_en} />
        <div className="admin-badges">
          {p.is_popular && <span className="badge pop">Popular</span>}
          {p.is_sold_out && <span className="badge sold">Sold Out</span>}
        </div>
        {images.length > 1 && (
          <div className="card-image-dots">
            {images.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                className={`image-dot ${dotIdx === activeImgIndex ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setActiveImgIndex(dotIdx); }}
                title={`View image ${dotIdx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="admin-card-content">
        <div className="admin-card-header">
          <span className="admin-cat">{p.category_en}</span>
          <span className={`admin-stock ${p.stock_quantity === 0 ? 'empty' : ''}`}>
            Stock: {p.stock_quantity}
          </span>
        </div>
        <h4 className="admin-title">{p.name_en}</h4>
        <h4 className="admin-title-ar">{p.name_ar}</h4>
        
        {/* Render Saved Variations/Colors Circles below */}
        {p.product_colors && p.product_colors.length > 0 && (
          <div className="admin-card-colors" style={{ display: 'flex', gap: '0.35rem', margin: '0.5rem 0' }}>
            {p.product_colors.map((color, idx) => (
              <span
                key={idx}
                className="admin-color-bubble"
                style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: color.color_code,
                  border: '1px solid #cbd5e1',
                }}
                title={`${color.color_name_en} / ${color.color_name_ar}`}
              />
            ))}
          </div>
        )}

        <div className="admin-price-row">
          <span className="admin-price">{p.price} EGP</span>
          {p.discount_price && <span className="admin-discount">{p.discount_price} EGP</span>}
        </div>
      </div>

      <div className="admin-card-actions">
        <button onClick={() => onEdit(p)} className="edit-btn"><Edit2 size={16} /> Edit</button>
        <button onClick={() => p.id && onDelete(p.id)} className="delete-btn"><Trash2 size={16} /> Delete</button>
      </div>
    </div>
  );
};

export default AdminProductCard;