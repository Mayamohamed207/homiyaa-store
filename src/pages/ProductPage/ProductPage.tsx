import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './ProductPage.css';

interface ProductColor {
  color_code: string;
  color_name_en: string;
  color_name_ar: string;
}

interface ProductVariant {
  id: number;
  variant_name_en: string;
  variant_name_ar: string;
  display_order: number;
}

interface Product {
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
  product_variants: ProductVariant[];
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500&q=80';

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const isRTL = language === 'ar';
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  const { user } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    if (!user || !product) return;
    supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .maybeSingle()
      .then(({ data }) => setWishlisted(!!data));
  }, [user, product?.id]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(
          '*, product_images(image_url), product_colors(color_code, color_name_en, color_name_ar), product_variants(id, variant_name_en, variant_name_ar, display_order)'
        )
        .eq('id', id)
        .single();

      if (!error && data) {
        // Sort variants by display_order
        if (data.product_variants) {
          data.product_variants.sort(
            (a: ProductVariant, b: ProductVariant) => a.display_order - b.display_order
          );
        }
        setProduct(data);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="pp-loading">
        <div className="pp-spinner" />
        <p>{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pp-not-found">
        <p>{isRTL ? 'المنتج غير موجود' : 'Product not found'}</p>
        <button className="pp-back-btn" onClick={() => navigate('/')}>
          <BackIcon size={18} />
          {isRTL ? 'العودة للمتجر' : 'Back to Store'}
        </button>
      </div>
    );
  }

  const images = product.product_images || [];
  const colors = product.product_colors || [];
  const variants = product.product_variants || [];
  const currentImage = images.length > 0 ? images[activeIdx].image_url : FALLBACK_IMAGE;
  const mainProductCartImage = images.length > 0 ? images[0].image_url : FALLBACK_IMAGE;

  const name = isRTL ? product.name_ar : product.name_en;
  const category = isRTL ? product.category_ar : product.category_en;
  const description = isRTL ? product.description_ar : product.description_en;
  const displayPrice = product.discount_price ?? product.price;

  const goNext = () => {
    if (images.length > 1) setActiveIdx(i => (i + 1) % images.length);
  };
  const goPrev = () => {
    if (images.length > 1) setActiveIdx(i => (i - 1 + images.length) % images.length);
  };

  const handleAddToCart = () => {
    if (!addToCart || product.is_sold_out) return;

    if (colors.length > 0 && selectedColor === null) {
      toast.error(
        isRTL
          ? '⚠️ يجب اختيار لون للمنتج أولاً قبل إضافته إلى السلة!'
          : '⚠️ Please pick a color before adding to cart!'
      );
      return;
    }

    if (variants.length > 0 && selectedVariant === null) {
      toast.error(
        isRTL
          ? '⚠️ يجب اختيار الخيار المطلوب أولاً!'
          : '⚠️ Please select an option before adding to cart!'
      );
      return;
    }

    let chosenColorPayload = null;
    if (selectedColor !== null && colors[selectedColor]) {
      chosenColorPayload = {
        color_code: colors[selectedColor].color_code,
        color_name_en: colors[selectedColor].color_name_en,
        color_name_ar: colors[selectedColor].color_name_ar,
      };
    }

    let chosenVariantPayload = null;
    if (selectedVariant !== null && variants[selectedVariant]) {
      chosenVariantPayload = {
        variant_name_en: variants[selectedVariant].variant_name_en,
        variant_name_ar: variants[selectedVariant].variant_name_ar,
      };
    }

    addToCart({
      id: product.id,
      name_en: product.name_en,
      name_ar: product.name_ar,
      price: displayPrice,
      image: mainProductCartImage,
      quantity: 1,
      selected_color: chosenColorPayload,
      selected_variant: chosenVariantPayload,
    });

    toast.success(isRTL ? 'تمت الإضافة إلى السلة' : 'Added to cart');
  };

  return (
    <div className="pp-page" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="pp-container">
        <button className="pp-back-btn" onClick={() => navigate(-1)}>
          <BackIcon size={18} />
          {isRTL ? 'العودة' : 'Back'}
        </button>

        <div className="pp-layout">
          {/* Gallery */}
          <div className="pp-gallery-col">
            <div
              className="pp-main-image-wrap"
              onTouchStart={e => {
                touchStartX.current = e.touches[0].clientX;
                touchStartY.current = e.touches[0].clientY;
              }}
              onTouchEnd={e => {
                const dx = e.changedTouches[0].clientX - touchStartX.current;
                const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
                if (Math.abs(dx) > 40 && dy < 60) {
                  dx < 0
                    ? isRTL ? goPrev() : goNext()
                    : isRTL ? goNext() : goPrev();
                }
              }}
            >
              <motion.img
                key={activeIdx}
                src={currentImage}
                alt={name}
                className="pp-main-image"
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                draggable={false}
              />

              <div className="pp-img-badges">
                {product.is_sold_out && (
                  <span className="pp-badge pp-badge-sold">
                    {isRTL ? 'نفذت الكمية' : 'Sold Out'}
                  </span>
                )}
                {product.is_popular && !product.is_sold_out && (
                  <span className="pp-badge pp-badge-pop">{isRTL ? 'شائع' : 'Popular'}</span>
                )}
              </div>

              <button
                className={`pp-wishlist-btn ${wishlisted ? 'wishlisted' : ''}`}
                aria-label="Wishlist"
                onClick={async () => {
                  if (!user) {
                    toast.error(isRTL ? 'سجل دخولك أولاً' : 'Please sign in first');
                    return;
                  }
                  if (wishlisted) {
                    await supabase
                      .from('wishlists')
                      .delete()
                      .match({ user_id: user.id, product_id: product.id });
                    setWishlisted(false);
                    toast.success(isRTL ? 'تم الحذف من المفضلة' : 'Removed from wishlist');
                  } else {
                    await supabase
                      .from('wishlists')
                      .insert({ user_id: user.id, product_id: product.id });
                    setWishlisted(true);
                    toast.success(isRTL ? 'تمت الإضافة للمفضلة' : 'Added to wishlist');
                  }
                }}
              >
                <Heart
                  size={18}
                  fill={wishlisted ? '#ef4444' : 'none'}
                  color={wishlisted ? '#ef4444' : 'currentColor'}
                />
              </button>

              {images.length > 1 && (
                <>
                  <button className="pp-arrow pp-arrow-prev" onClick={goPrev} aria-label="Previous">
                    <PrevIcon size={20} />
                  </button>
                  <button className="pp-arrow pp-arrow-next" onClick={goNext} aria-label="Next">
                    <NextIcon size={20} />
                  </button>
                  <div className="pp-dots">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        className={`pp-dot ${i === activeIdx ? 'active' : ''}`}
                        onClick={() => setActiveIdx(i)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="pp-thumb-strip">
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`pp-thumb ${i === activeIdx ? 'active' : ''}`}
                    onClick={() => setActiveIdx(i)}
                  >
                    <img src={img.image_url} alt="" draggable={false} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="pp-details-col">
            <p className="pp-cat-tag">{category}</p>
            <h1 className="pp-title">{name}</h1>

            <div className="pp-price-row">
              <span className="pp-price">{displayPrice} EGP</span>
              {product.discount_price && (
                <span className="pp-old-price">{product.price} EGP</span>
              )}
              {product.discount_price && (
                <span className="pp-savings-tag">
                  {Math.round(((product.price - product.discount_price) / product.price) * 100)}%{' '}
                  {isRTL ? 'خصم' : 'OFF'}
                </span>
              )}
            </div>

            {!product.is_sold_out && (
              <p className="pp-stock-note">
                {product.stock_quantity <= 5
                  ? `⚡ ${isRTL ? 'متبقي' : 'Only'} ${product.stock_quantity} ${isRTL ? 'قطع فقط' : 'left in stock'}`
                  : `✓ ${isRTL ? 'متوفر في المخزون' : 'In stock'}`}
              </p>
            )}

            <hr className="pp-divider" />

            {/* Color selector */}
            {colors.length > 0 && (
              <div className="pp-colors-section">
                <p className="pp-section-label">
                  {isRTL ? 'اختر اللون / الشكل' : 'Select Color/Shape'}
                  {selectedColor !== null && (
                    <span className="pp-selected-color-name">
                      {': '}
                      {isRTL
                        ? colors[selectedColor].color_name_ar
                        : colors[selectedColor].color_name_en}
                    </span>
                  )}
                </p>
                <div className="pp-color-row">
                  {colors.map((c, idx) => (
                    <button
                      key={idx}
                      className={`pp-color-dot ${selectedColor === idx ? 'selected' : ''}`}
                      style={{ backgroundColor: c.color_code }}
                      onClick={() => {
                        const newIndex = selectedColor === idx ? null : idx;
                        setSelectedColor(newIndex);
                        if (newIndex !== null && images[newIndex + 1]) {
                          setActiveIdx(newIndex + 1);
                        } else {
                          setActiveIdx(0);
                        }
                      }}
                      title={isRTL ? c.color_name_ar : c.color_name_en}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Variant selector */}
            {variants.length > 0 && (
              <div className="pp-variants-section">
                <p className="pp-section-label">
                  {isRTL ? 'اختر الخيار' : 'Select Option'}
                  {selectedVariant !== null && (
                    <span className="pp-selected-color-name">
                      {': '}
                      {isRTL
                        ? variants[selectedVariant].variant_name_ar
                        : variants[selectedVariant].variant_name_en}
                    </span>
                  )}
                </p>
                <div className="pp-variant-row">
                  {variants.map((v, idx) => (
                    <button
                      key={idx}
                      className={`pp-variant-pill ${selectedVariant === idx ? 'selected' : ''}`}
                      onClick={() => setSelectedVariant(selectedVariant === idx ? null : idx)}
                    >
                      {isRTL ? v.variant_name_ar : v.variant_name_en}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {description && (
              <div className="pp-desc-section">
                <p className="pp-section-label">
                  {isRTL ? 'تفاصيل المنتج' : 'Product Details'}
                </p>
                <p className="pp-desc-text">{description}</p>
              </div>
            )}

            <div className="pp-cta-wrapper">
              <button
                className={`pp-add-btn ${product.is_sold_out ? 'disabled' : ''}`}
                disabled={product.is_sold_out}
                onClick={handleAddToCart}
              >
                <ShoppingCart size={20} />
                {product.is_sold_out
                  ? isRTL ? 'نفذت الكمية' : 'Out of Stock'
                  : isRTL ? 'أضف إلى السلة' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;