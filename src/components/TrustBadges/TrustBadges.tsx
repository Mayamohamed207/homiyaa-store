import { motion } from 'framer-motion';
import { Truck, Banknote, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import './TrustBadges.css';

const TrustBadges = () => {
  const { t } = useLanguage();

  const badges = [
    {
      icon: Truck,
      colorClass: 'icon-truck',
      title: t('Fast Delivery', 'شحن سريع'),
      subtitle: t('To all governorates', 'لكافة المحافظات'),
    },
    {
      icon: Banknote,
      colorClass: 'icon-cash',
      title: t('Cash on Delivery', 'الدفع عند الاستلام'),
      subtitle: t('Pay safely at your door', 'تسوّق بأمان'),
    },
    {
      icon: RefreshCw,
      colorClass: 'icon-returns',
      title: t('14 Day Returns', 'استبدال واسترجاع'),
      subtitle: t('Exchange & refund within 14 days', 'خلال 14 يوم'),
    },
  ];

  return (
    <section className="trust-badges">
      <div className="trust-badges-container">
        <h3 className="trust-badges-title">
          {t('Your Trust, Our Priority', 'ثقتك أولويتنا')}
        </h3>

        <div className="trust-badges-grid">
          {badges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={idx}
                className="trust-badge-item"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
              >
                <div className={`trust-badge-icon-wrapper ${badge.colorClass}`}>
                  <Icon className="trust-badge-icon" strokeWidth={2.2} />
                </div>
                <p className="trust-badge-item-title">{badge.title}</p>
                <p className="trust-badge-item-subtitle">{badge.subtitle}</p>
              </motion.div>
            );
          })}
        </div>

        <p className="trust-badges-note">
          {t(
            'Shop with confidence! Review your order and pay in cash when it arrives.',
            'تسوّق بأمان. يمكنك الدفع كاش عند استلام طلبك ومراجعته قبل الدفع.'
          )}
        </p>
      </div>
    </section>
  );
};

export default TrustBadges;