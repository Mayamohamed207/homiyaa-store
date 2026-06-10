import { motion } from 'framer-motion';
import { ArrowRight, History } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  const { t, isRtl } = useLanguage();
  const navigate = useNavigate();

  const handleSalesClick = () => {
    // 1. Instantly focus scroll alignment onto the products grid section
    const element = document.getElementById('shop');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // 2. Fire custom window event to switch store filters directly to sales view
    setTimeout(() => {
      const event = new CustomEvent('storeCategoryChanged', { detail: '__sales__' });
      window.dispatchEvent(event);
    }, 100);
  };

  return (
    <section className="hero">

      {/* Image on top */}
      <motion.div
        className="hero-image-wrapper"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="hero-badge">✦ {t('New Arrivals', 'وصل حديثاً')}</div>
        <div className="hero-img-frame">
          <img
            className="hero-bg-img"
            src="/hero.jpeg"
            alt="Homiyaa Premium Collection"
          />
        </div>
      </motion.div>

      {/* Text below */}
      <div className="hero-body">
        <p className="hero-eyebrow">{t('HOME ESSENTIALS', 'أساسيات المنزل')}</p>

        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="hero-title"
        >
          {isRtl ? (
            <>بيتك<br /><em>على ذوقك.</em></>
          ) : (
            <>Make home<br /><em>feel like you.</em></>
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="hero-subtitle"
        >
          {t(
            'Premium kitchen & home pieces, curated for warmth and beauty.',
            'أدوات منزلية وأواني مطبخ فاخرة — مصنوعة لدفء حياتك اليومية.'
          )}
        </motion.p>

        <motion.div
          className="hero-actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <button
            className="hero-cta"
            onClick={handleSalesClick}
          >
            <span>{t('See Our Sales', 'شاهد عروضنا')}</span>
            <ArrowRight
              className="icon"
              style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }}
            />
          </button>

          <button
            className="hero-cta-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => navigate('/account')}
          >
            <History size={14} />
            <span>{t('Order History', 'سجل الطلبات')}</span>
          </button>
        </motion.div>
      </div>

    </section>
  );
};

export default Hero;