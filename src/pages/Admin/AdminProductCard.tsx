import { useState, useEffect, useRef } from 'react';
import { Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import './AdminProductCard.css';
import { Product } from '../../components/ProductCard/ProductCard';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';

const AdminProductCard = ({
  p,
  onEdit,
  onDelete,
}: {
  p: Product & { is_hidden?: boolean; is_new_arrival?: boolean };
  onEdit: (p: any) => void;
  onDelete: (id: number) => void;
}) => {
  const { t, isRtl } = useLanguage();
  const images = p.product_images || [];
  const defaultImage = 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500&q=80';

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isHidden, setIsHidden] = useState(p.is_hidden ?? false);
  const [isToggling, setIsToggling] = useState(false);

  // Local toggle states for the three flags
  const [isPopular, setIsPopular] = useState(p.is_popular ?? false);
  const [isSoldOut, setIsSoldOut] = useState(p.is_sold_out ?? false);
  const [isNewArrival, setIsNewArrival] = useState(p.is_new_arrival ?? false);
  const [isSavingFlags, setIsSavingFlags] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    setActiveImgIndex(0);
    setIsHidden(p.is_hidden ?? false);
    setIsPopular(p.is_popular ?? false);
    setIsSoldOut(p.is_sold_out ?? false);
    setIsNewArrival(p.is_new_arrival ?? false);
  }, [p]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (images.length <= 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 40 && dy < 60) {
      if (dx < 0) setActiveImgIndex(i => (i + 1) % images.length);
      else setActiveImgIndex(i => (i - 1 + images.length) % images.length);
    }
  };

  const toggleVisibility = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!p.id || isToggling) return;
    setIsToggling(true);
    const next = !isHidden;
    const { error } = await supabase.from('products').update({ is_hidden: next }).eq('id', p.id);
    if (error) {
      toast.error(t('Failed to update visibility', 'فشل تحديث الرؤية'));
    } else {
      setIsHidden(next);
      toast.success(next
        ? t('Product hidden from store', 'تم إخفاء المنتج')
        : t('Product visible to everyone', 'المنتج مرئي للجميع'));
    }
    setIsToggling(false);
  };

  // Save all three flag checkboxes in one DB call
  const handleFlagToggle = async (
    field: 'is_popular' | 'is_sold_out' | 'is_new_arrival',
    value: boolean
  ) => {
    if (!p.id || isSavingFlags) return;
    setIsSavingFlags(true);

    // Optimistic update
    if (field === 'is_popular') setIsPopular(value);
    if (field === 'is_sold_out') setIsSoldOut(value);
    if (field === 'is_new_arrival') setIsNewArrival(value);

    const { error } = await supabase
      .from('products')
      .update({ [field]: value })
      .eq('id', p.id);

    if (error) {
      toast.error(t('Update failed', 'فشل التحديث'));
      // Revert on error
      if (field === 'is_popular') setIsPopular(!value);
      if (field === 'is_sold_out') setIsSoldOut(!value);
      if (field === 'is_new_arrival') setIsNewArrival(!value);
    }
    setIsSavingFlags(false);
  };

  const currentImageUrl =
    images.length > 0 && images[activeImgIndex]
      ? images[activeImgIndex].image_url
      : defaultImage;

  return (
    <div
      className="admin-product-card"
      style={isHidden ? { opacity: 0.65 } : {}}
    >
      {/* ── Image ── */}
      <div
        className="admin-card-image"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'pan-y', userSelect: 'none' }}
      >
        <img src={currentImageUrl} alt={t(p.name_en, p.name_ar)} />

        <div className="admin-badges">
          {isPopular && <span className="badge pop">{t('Best Selling', 'الأكثر مبيعًا')}</span>}
          {isSoldOut && <span className="badge sold">{t('Sold Out', 'نفد')}</span>}
          {isNewArrival && <span className="badge new">{t('New', 'جديد')}</span>}
        </div>

        {images.length > 1 && (
          <div className="card-image-dots">
            {images.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                className={`image-dot ${dotIdx === activeImgIndex ? 'active' : ''}`}
                onClick={e => { e.stopPropagation(); setActiveImgIndex(dotIdx); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Info + Flag Panel ── */}
<div className="admin-card-body-row" dir={isRtl ? 'rtl' : 'ltr'}>
  <div className="admin-card-content">
    <div className="admin-card-header">
      <span className="admin-cat">{t(p.category_en, p.category_ar)}</span>
      <span className={`admin-stock ${p.stock_quantity === 0 ? 'empty' : ''}`}>
        {t('Stock', 'مخزون')}: {p.stock_quantity}
      </span>
    </div>

    <h4 className="admin-title">{p.name_en}</h4>
    <h4 className="admin-title-ar">{p.name_ar}</h4>

    {p.product_colors && p.product_colors.length > 0 && (
      <div style={{ display: 'flex', gap: '0.35rem', margin: '0.4rem 0' }}>
        {p.product_colors.map((color, idx) => (
          <span
            key={idx}
            style={{
              width: 14, height: 14, borderRadius: '50%',
              backgroundColor: color.color_code,
              border: '1px solid #cbd5e1', cursor: 'pointer',
              outline: activeImgIndex === idx + 1 ? '2px solid #0f172a' : 'none',
              outlineOffset: 2,
            }}
            title={`${color.color_name_en} / ${color.color_name_ar}`}
            onClick={() => { if (images[idx + 1]) setActiveImgIndex(idx + 1); }}
          />
        ))}
      </div>
    )}
  </div>

        <div className="admin-bottom-row">
          <div className="admin-price-row">
            {p.discount_price ? (
              <>
                <span className="admin-price">{p.discount_price} {t('EGP', 'ج.م')}</span>
                <span className="admin-discount">{p.price} {t('EGP', 'ج.م')}</span>
              </>
            ) : (
              <span className="admin-price">{p.price} {t('EGP', 'ج.م')}</span>
            )}
          </div>

          <div className="admin-flag-panel">
            <label className="flag-check">
              <input type="checkbox" checked={isPopular} disabled={isSavingFlags}
                onChange={e => handleFlagToggle('is_popular', e.target.checked)} />
              <span>{t('Best Selling', 'الأكثر مبيعًا')}</span>
            </label>
            <label className="flag-check">
              <input type="checkbox" checked={isSoldOut} disabled={isSavingFlags}
                onChange={e => handleFlagToggle('is_sold_out', e.target.checked)} />
              <span>{t('Out of Stock', 'نفد المخزون')}</span>
            </label>
            <label className="flag-check">
              <input type="checkbox" checked={isNewArrival} disabled={isSavingFlags}
                onChange={e => handleFlagToggle('is_new_arrival', e.target.checked)} />
              <span>{t('New Arrival', 'وصل حديثاً')}</span>
            </label>
          </div>
        </div>
      </div>

      {/* ── Bottom actions ── */}
      <div className="admin-card-actions">
        <button onClick={() => onEdit(p)} className="edit-btn">
          <Edit2 size={15} /> {t('Edit', 'تعديل')}
        </button>

        <button
          onClick={toggleVisibility}
          disabled={isToggling}
          className={`visibility-btn ${isHidden ? 'is-hidden' : ''}`}
        >
          {isHidden
            ? <><EyeOff size={15} /> {t('Show', 'إظهار')}</>
            : <><Eye size={15} /> {t('Hide', 'إخفاء')}</>}
        </button>

        <button onClick={() => p.id && onDelete(p.id)} className="delete-btn">
          <Trash2 size={15} /> {t('Delete', 'حذف')}
        </button>
      </div>
    </div>
  );
};

export default AdminProductCard;