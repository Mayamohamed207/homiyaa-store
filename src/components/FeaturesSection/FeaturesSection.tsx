import { motion } from 'framer-motion';
import { Truck, Shield, Sparkles, Award } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { Feature } from '../../types';
import './FeaturesSection.css';

const FeaturesSection = () => {
  const { t } = useLanguage();

  const features: Feature[] = [
    {
      icon: Truck,
      title: t('Free Shipping', 'شحن مجاني'),
      description: t('On orders over 1000', 'للطلبات الأكثر من 1000'),
      color: 'feature-primary',
    },
    {
      icon: Shield,
      title: t('Secure Payment', 'دفع آمن مئة بالمئة'),
      description: t('100% protected', 'حماية بياناتك بنسبة 100%'),
      color: 'feature-secondary',
    },
    {
      icon: Sparkles,
      title: t('Premium Quality', 'جودة ممتازة'),
      description: t('Handpicked products', 'منتجات مختارة بعناية فائقة'),
      color: 'feature-warm',
    },
    {
      icon: Award,
      title: t('Best Offers', 'أفضل العروض'),
      description: t('On all products', 'خصومات حصرية على جميع المنتجات'),
      color: 'feature-primary',
    },
  ];

  return (
    <section className="features-section">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="features-grid"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="feature-card"
              >
                <div className={`feature-icon ${feature.color}`}>
                  <Icon className="icon-large" />
                </div>
                <h3 className="feature-title">
                  {feature.title}
                </h3>
                <p className="feature-description">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;