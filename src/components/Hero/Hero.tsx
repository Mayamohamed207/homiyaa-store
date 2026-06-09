import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import './Hero.css';

const Hero = () => {
  const { t, isRtl } = useLanguage();

  return (
    <section className="hero">
      <div className="hero-container">
        
        {/* Left Side Frame */}
        <div className="hero-body">
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
              'Premium kitchen & home essentials, curated for warmth and everyday beauty.',
              'أدوات منزلية وأواني مطبخ فاخرة — مصنوعة لدفء حياتك اليومية.'
            )}
          </motion.p>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
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
          </motion.button>
        </div>

        {/* Right Side Frame */}
        <motion.div 
          className="hero-image-wrapper"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <div className="hero-img-frame">
            <img
              className="hero-bg-img"
              src="/hero.jpeg"
              alt="Homiyaa Premium Collection"
            />
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default Hero;