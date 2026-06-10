import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import './Hero.css';

const Hero = () => {
  const { t, isRtl } = useLanguage();

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
            onClick={() => {
              document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span>{t('Shop Now', 'تسوّق الآن')}</span>
            <ArrowRight
              className="icon"
              style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }}
            />
          </button>

          <button
            className="hero-cta-outline"
            onClick={() => {
              document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {t('Explore', 'استكشف')}
          </button>
        </motion.div>
      </div>

    </section>
  );
};

export default Hero;