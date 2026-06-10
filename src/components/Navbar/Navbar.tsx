import { useState, Dispatch, SetStateAction, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, User, Menu, Search, X, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext'; 
import CartDrawer from '../CartDrawer/CartDrawer'; 
import './Navbar.css';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
}

const Navbar = ({ searchQuery, setSearchQuery }: NavbarProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false); 
  const { t, toggleLanguage, language } = useLanguage();
  const { cartCount } = useCart(); 

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery('');
    }
  };

  // Broadcast search query variations globally so Admin views can tap into it
  useEffect(() => {
    const event = new CustomEvent('adminSearchChanged', { detail: searchQuery });
    window.dispatchEvent(event);
  }, [searchQuery]);

  const handleMobileScroll = (targetId: string) => {
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Fallback or redirection logic if navigation elements don't exist in current admin view
        const isAdmin = window.location.pathname.includes('/admin');
        if (isAdmin) {
          window.dispatchEvent(new CustomEvent('adminNavigateTo', { detail: 'products' }));
        }
      }
    }, 150);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="navbar"
      >
        <div className="container">
          <div className="navbar-content">
            
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="navbar-logo-container"
              onClick={() => {
                if (window.location.pathname.includes('/admin')) {
                  window.dispatchEvent(new CustomEvent('adminNavigateTo', { detail: 'dashboard' }));
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              <img 
                src="/logo.jpeg" 
                alt="HOMIYAA Logo" 
                className="navbar-logo-img" 
              />
              <div className="navbar-text-group">
                <div className="navbar-logo">HOMIYAA</div>
                <span className="slogan">{t('Your Home, Your Style', 'بيتك، على ذوقك')}</span>
              </div>
            </motion.div>

            <div className="navbar-links">
              <a 
                href="#shop" 
                className="navbar-link"
                onClick={(e) => {
                  if (window.location.pathname.includes('/admin')) {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent('adminNavigateTo', { detail: 'products' }));
                  }
                }}
              >
                {t('Shop', 'المتجر')}
              </a>
              <a href="#contact" className="navbar-link">{t('Contact', 'تواصل معنا')}</a>
            </div>

            <div className="navbar-actions">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleLanguage}
                className="navbar-icon-btn lang-toggle-btn"
                type="button"
                aria-label="Toggle Language"
              >
                <Globe className="icon icon-globe-svg" />
                <span className="lang-toggle-text">
                  {language === 'en' ? 'AR' : 'EN'}
                </span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={toggleSearch}
                className={`navbar-icon-btn ${isSearchOpen ? 'active' : ''}`}
                aria-label="Toggle Search"
              >
                {isSearchOpen ? <X className="icon" /> : <Search className="icon" />}
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.85 }}
                className="navbar-icon-btn user-profile-btn"
              >
                <User className="icon" />
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setIsCartOpen(true)}
                className="navbar-icon-btn navbar-cart"
                style={{ position: 'relative' }}
              >
                <ShoppingCart className="icon" />
                {cartCount > 0 && (
                  <span className="navbar-cart-badge">
                    {cartCount}
                  </span>
                )}
              </motion.button>
              
              <motion.button 
                whileTap={{ scale: 0.85 }}
                className="navbar-mobile-menu"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? <X className="icon" /> : <Menu className="icon" />}
              </motion.button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="navbar-search-drawer"
            >
              <div className="container search-drawer-inner">
                <div className="search-input-wrapper">
                  <Search className="search-input-icon" />
                  <input
                    type="text"
                    placeholder={t('Search kitchen tools, home tools...', 'ابحث عن أدوات المطبخ، أواني الطعام...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="navbar-search-input"
                    autoFocus
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')} 
                      className="search-clear-btn"
                    >
                      <X className="icon-sm" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="navbar-mobile-dropdown-panel"
            >
              <div className="mobile-dropdown-links-wrapper">
                <button 
                  className="mobile-navbar-link-btn" 
                  onClick={() => handleMobileScroll('shop')}
                >
                  {t('Shop', 'المتجر')}
                </button>
                <button 
                  className="mobile-navbar-link-btn" 
                  onClick={() => handleMobileScroll('contact')}
                >
                  {t('Contact', 'تواصل معنا')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Navbar;