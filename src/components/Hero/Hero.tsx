import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, History } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import './Hero.css';

const Hero = () => {
  const { t, isRtl } = useLanguage();
  const navigate = useNavigate();

  const [newArrivals, setNewArrivals] = useState<{
    id: number;
    image_url: string;
    name_en: string;
    name_ar: string;
  }[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const touchStartXRef = useRef(0);
  const touchMovedRef = useRef(false);

  useEffect(() => {
    supabase
      .from('products')
      .select('id, name_en, name_ar, product_images(image_url)')
      .eq('is_new_arrival', true)
      .order('id', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const slides = data
            .filter((p: any) => p.product_images?.[0]?.image_url)
            .map((p: any) => ({
              id: p.id,
              image_url: p.product_images[0].image_url,
              name_en: p.name_en,
              name_ar: p.name_ar,
            }));
          setNewArrivals(slides);
        }
      });
  }, []);

  useEffect(() => {
    if (newArrivals.length < 2) return;
    const timer = setInterval(() => {
      setSlideIndex(i => (i + 1) % newArrivals.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [newArrivals]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchMovedRef.current = false;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(dx) > 40) {
      touchMovedRef.current = true;
      if (dx < 0) setSlideIndex(i => (i + 1) % newArrivals.length);
      else setSlideIndex(i => (i - 1 + newArrivals.length) % newArrivals.length);
    }
  };

  const handleImageClick = () => {
    // Don't navigate if the user was swiping
    if (touchMovedRef.current) return;
    const current = newArrivals[slideIndex];
    if (current) navigate(`/product/${current.id}`);
  };

  const handleSalesClick = () => {
    const element = document.getElementById('shop');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('storeCategoryChanged', { detail: '__sales__' }));
    }, 100);
  };

  const currentSlide = newArrivals[slideIndex];

  return (
    <section className="hero">
      <motion.div
        className="hero-image-wrapper"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="hero-badge">✦ {t('New Arrivals', 'وصل حديثاً')}</div>

        <div
          className="hero-img-frame"
          style={{ position: 'relative', overflow: 'hidden', cursor: currentSlide ? 'pointer' : 'default' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleImageClick}
        >
          <AnimatePresence mode="wait">
            {currentSlide ? (
              <motion.img
                key={currentSlide.image_url}
                className="hero-bg-img"
                src={currentSlide.image_url}
                alt={isRtl ? currentSlide.name_ar : currentSlide.name_en}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.6 }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                draggable={false}
              />
            ) : (
              <motion.img
                key="fallback"
                className="hero-bg-img"
                src="/hero.jpeg"
                alt="Homiyaa Premium Collection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              />
            )}
          </AnimatePresence>

          {/* Product name overlay at bottom */}
          {currentSlide && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)',
              padding: '1.5rem 0.75rem 2.5rem',
              zIndex: 2,
              pointerEvents: 'none',
            }}>
              <p style={{
                color: '#fff', fontSize: '0.78rem', fontWeight: 700,
                margin: 0, letterSpacing: '0.03em',
                textShadow: '0 1px 4px rgba(0,0,0,0.4)',
              }}>
                {isRtl ? currentSlide.name_ar : currentSlide.name_en}
              </p>
            </div>
          )}

          {/* Dot indicators */}
          {newArrivals.length > 1 && (
            <div style={{
              position: 'absolute', bottom: '12px', left: '50%',
              transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 3,
            }}>
              {newArrivals.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setSlideIndex(i); }}
                  style={{
                    width: i === slideIndex ? '20px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: i === slideIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          )}

          {/* Arrow buttons */}
          {newArrivals.length > 1 && (
            <>
             <button
              className="hero-arrow hero-arrow-left"
              onClick={e => { e.stopPropagation(); setSlideIndex(i => (i - 1 + newArrivals.length) % newArrivals.length); }}
              style={{ direction: 'ltr' }}
            >
              ‹
            </button>
            <button
              className="hero-arrow hero-arrow-right"
              onClick={e => { e.stopPropagation(); setSlideIndex(i => (i + 1) % newArrivals.length); }}
              style={{ direction: 'ltr' }}
            >
              ›
            </button>
            </>
          )}
        </div>
      </motion.div>

      <div className="hero-body">
        <p className="hero-eyebrow">{t('HOME ESSENTIALS', 'أساسيات المنزل')}</p>
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="hero-title"
        >
          {isRtl
            ? (<>بيتك<br /><em>على ذوقك.</em></>)
            : (<>Make home<br /><em>feel like you.</em></>)
          }
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="hero-subtitle"
        >
          {t(
            'Home essentials, kitchenware, and gifts, chosen with care for quality that lasts.',
            'مستلزمات منزلية وأدوات مطبخ وهدايا، مختارة بعناية وجودة تدوم'          )}
        </motion.p>
        <motion.div
          className="hero-actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <button className="hero-cta" onClick={handleSalesClick}>
            <span>{t('See Our Sales', 'عروضنا')}</span>
            <ArrowRight className="icon" style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
          </button>
          <button
            className="hero-cta-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => navigate('/account')}
          >
            <History size={14} />
            <span>{t('Order History', 'طلباتك')}</span>
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;