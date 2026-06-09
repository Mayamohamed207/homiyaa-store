import { motion } from 'framer-motion';
import { Facebook, Instagram } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="container footer-container">
        
        {/* Brand Block */}
        <div className="footer-brand">
          <div className="footer-logo-wrapper">
            <img src="/logo.jpeg" alt="HOMIYAA Logo" className="footer-logo-img" />
            <span className="footer-logo-text">HOMIYAA</span>
          </div>
          <p className="footer-slogan">{t('Your Home, Your Style', 'بيتك، على ذوقك')}</p>
          <p className="footer-description">
            {t(
              'Premium home appliances and kitchen tools curated carefully to bring style and inspiration to your everyday living spaces.',
              'أجهزة منزلية وأدوات مطبخ ممتازة تم اختيارها بعناية لإضفاء الأناقة والإلهام على مساحاتك المعيشية اليومية.'
            )}
          </p>
        </div>

        {/* Quick Links Group */}
        <div className="footer-links-group">
          <h4 className="footer-title">{t('Shop Collections', 'تسوق المجموعات')}</h4>
          <ul className="footer-links-list">
            <li><a href="#" className="footer-link">{t('Shop All Products', 'جميع المنتجات')}</a></li>
            <li><a href="#" className="footer-link">{t('Mugs', 'مجات حرارية')}</a></li>
            <li><a href="#" className="footer-link">{t('Kitchen Essentials', 'لوازم المطبخ')}</a></li>
            <li><a href="#" className="footer-link">{t('Bathroom Essentials', 'لوازم الحمام')}</a></li>
            <li><a href="#" className="footer-link">{t('Home Essentials', 'لوازم المنزل')}</a></li>
          </ul>
        </div>

        {/* Social Media Connections */}
        <div className="footer-social-section">
          <h4 className="footer-title">{t('Connect With Us', 'تواصل معنا')}</h4>
          <p className="footer-social-subtitle">
            {t(
              'Follow our journey for home inspiration, deals, and daily updates.',
              'تابع رحلتنا للحصول على إلهام لمنزلك، العروض، والتحديثات اليومية.'
            )}
          </p>
          
          <div className="footer-social-icons">
            {/* WhatsApp */}
            <motion.a 
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              href="http://wa.me/201554016885" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-icon-link whatsapp-hover"
              aria-label="Contact us on WhatsApp"
            >
              <svg 
                viewBox="0 0 448 512" 
                fill="currentColor" 
                className="footer-icon whatsapp-svg"
              >
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
              </svg>
            </motion.a>

            {/* TikTok */}
            <motion.a 
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              href="https://www.tiktok.com/@homiyaa.store" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-icon-link tiktok-hover"
              aria-label="Follow us on TikTok"
            >
              <svg 
                viewBox="0 0 448 512" 
                fill="currentColor" 
                className="footer-icon"
                style={{ width: '18px', height: '18px' }}
              >
                <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a72.58,72.58,0,1,0,50.23,69.57V0h89.87a100,100,0,0,0,12.92,52.53,101,101,0,0,0,45.41,37.89,102.3,102.3,0,0,0,64.57,5.55Z"/>
              </svg>
            </motion.a>

            {/* Instagram */}
            <motion.a 
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              href="https://www.instagram.com/homiyaa.store" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-icon-link instagram-hover"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="footer-icon" />
            </motion.a>

            {/* Facebook */}
            <motion.a 
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              href="https://www.facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-icon-link facebook-hover"
              aria-label="Follow us on Facebook"
            >
              <Facebook className="footer-icon" />
            </motion.a>
          </div>
        </div>

      </div>
      
      <div className="footer-copyright" style={{ textAlign: 'center', padding: '1.5rem 0', borderTop: '1px solid var(--warm-100)', fontSize: '0.85rem', color: 'var(--warm-500)' }}>
        &copy; {currentYear} HOMIYAA. {t('All Rights Reserved.', 'جميع الحقوق محفوظة.')}
      </div>
    </footer>
  );
};

export default Footer;