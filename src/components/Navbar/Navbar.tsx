import { useState, Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, User, Menu, Search, X, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext'; // Added Cart State Hook Integration
import CartDrawer from '../CartDrawer/CartDrawer'; // Reference Path to Drawer Panel File
import './Navbar.css';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
}

const Navbar = ({ searchQuery, setSearchQuery }: NavbarProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false); // Added Drawer View State
  const { t, toggleLanguage, language } = useLanguage();
  const { cartCount } = useCart(); // Read Live Quantity Counts

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery('');
    }
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
            
            {/* Logo and Brand Title - Locked to the Left Side */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="navbar-logo-container"
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

            {/* Navigation Links - Centered */}
            <div className="navbar-links">
              <a href="#" className="navbar-link">{t('Shop', 'المتجر')}</a>
              <a href="#" className="navbar-link">{t('Products', 'المنتجات')}</a>
              <a href="#" className="navbar-link">{t('About', 'من نحن')}</a>
              <a href="#" className="navbar-link">{t('Contact', 'اتصل بنا')}</a>
            </div>

            {/* Actions & Controls - Locked to the Right Side */}
            <div className="navbar-actions">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleLanguage}
                className="navbar-icon-btn lang-toggle-btn"
                type="button"
                aria-label="Toggle Language"
              >
                <Globe size={18} className="icon" />
                <span className="lang-toggle-text">
                  {language === 'en' ? 'العربية' : 'EN'}
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
                className="navbar-icon-btn"
              >
                <User className="icon" />
              </motion.button>
              
              {/* Dynamic Shopping Cart Icon Badge - Opens Slider Sheet */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setIsCartOpen(true)}
                className="navbar-icon-btn navbar-cart"
                style={{ position: 'relative' }}
              >
                <ShoppingCart className="icon" />
                {cartCount > 0 && (
                  <span className="navbar-cart-badge" style={{
                    position: 'absolute',
                    top: '-5px',
                    right: language === 'ar' ? 'auto' : '-5px',
                    left: language === 'ar' ? '-5px' : 'auto',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    padding: '2px 6px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold'
                  }}>
                    {cartCount}
                  </span>
                )}
              </motion.button>
              
              <motion.button 
                whileTap={{ scale: 0.85 }}
                className="navbar-mobile-menu"
              >
                <Menu className="icon" />
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
      </motion.nav>

      {/* Render Sliding Side Panel Component */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Navbar;