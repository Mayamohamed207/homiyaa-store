import { useState, Dispatch, SetStateAction, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, User, Menu, Search, X, Globe, LogOut, Heart, Package, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext'; 
import CartDrawer from '../CartDrawer/CartDrawer';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom'; 
import toast from 'react-hot-toast';
import './Navbar.css';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  onOpenAuth: () => void;
}

const WHATSAPP_NUMBER = '201554016885';

const Navbar = ({ searchQuery, setSearchQuery, onOpenAuth }: NavbarProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  
  const { t, toggleLanguage, language } = useLanguage();
  const { cartCount } = useCart(); 
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isRtl = language === 'ar';

  const ADMIN_EMAILS = ['admin@homiyaa.com', 'HomiyaaStore@gmail.com','mayamohamed364@gmail.com', 'hussein70mohamedeg@gmail.com'];
  const isAdmin = user && user.email && ADMIN_EMAILS.includes(user.email);

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) setSearchQuery('');
  };

  useEffect(() => {
    const event = new CustomEvent('adminSearchChanged', { detail: searchQuery });
    window.dispatchEvent(event);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsDropdownOpen(false);
      setIsMobileMenuOpen(false);
      toast.success(isRtl ? 'تم تسجيل الخروج بنجاح' : 'Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error(isRtl ? 'حدث خطأ أثناء تسجيل الخروج' : 'Error signing out');
    }
  };

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, targetId: string) => {
  e.preventDefault();
  setIsMobileMenuOpen(false);

  const scrollToTarget = () => {
    const element = document.getElementById(targetId);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (location.pathname !== '/') {
    navigate('/');
    setTimeout(scrollToTarget, 300);
  } else {
    // Give mobile menu time to close before scrolling
    setTimeout(scrollToTarget, 300);
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
        {/* ── Main navbar row ── */}
        <div className="navbar-inner">
          <div className="navbar-content">
            
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="navbar-logo-container"
              onClick={() => {
                navigate('/');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setIsMobileMenuOpen(false);
              }}
            >
              <img src="/logo.jpeg" alt="HOMIYAA Logo" className="navbar-logo-img" />
              <div className="navbar-text-group">
                <div className="navbar-logo">HOMIYAA</div>
                <span className="slogan">{t('Your Home, Your Style', 'بيتك، على ذوقك')}</span>
              </div>
            </motion.div>

            <div className="navbar-links">
              <a href="#shop" className="navbar-link" onClick={(e) => handleNavigation(e, 'shop')}>
                {t('Shop', 'المتجر')}
              </a>
              <a href="#contact" className="navbar-link" onClick={(e) => handleNavigation(e, 'contact')}>
                {t('Contact', 'تواصل معنا')}
              </a>
            </div>

            <div className="navbar-actions">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleLanguage}
                className="navbar-icon-btn lang-toggle-btn"
                type="button"
              >
                <Globe className="icon icon-globe-svg" />
                <span className="lang-toggle-text">{language === 'en' ? 'AR' : 'EN'}</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={toggleSearch}
                className={`navbar-icon-btn desk-search-btn ${isSearchOpen ? 'active' : ''}`}
              >
                {isSearchOpen ? <X className="icon" /> : <Search className="icon" />}
              </motion.button>
              
              <div className="user-profile-relative-wrapper" ref={dropdownRef}>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => user ? setIsDropdownOpen(!isDropdownOpen) : onOpenAuth()}
                  className={`navbar-icon-btn user-profile-btn ${user ? 'user-authenticated' : ''}`}
                  type="button"
                >
                  <User className="icon" />
                </motion.button>

                <AnimatePresence>
                  {user && isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={`navbar-user-dropdown ${isRtl ? 'dropdown-rtl' : 'dropdown-ltr'}`}
                    >
                      <div className="dropdown-user-info">
                        <span className="user-welcome-text">{t('Welcome back,', 'مرحباً بك،')}</span>
                        <p className="user-display-email">{user?.user_metadata?.full_name || user?.email}</p>
                      </div>
                      <hr className="dropdown-divider" />
                      <button onClick={() => navigate('/account')} className="dropdown-item">
                        <Package size={16} />
                        <span>{t('My Orders', 'طلباتي')}</span>
                      </button>
                      <button onClick={() => navigate('/account')} className="dropdown-item">
                        <Heart size={16} />
                        <span>{t('Favorites', 'قائمة المفضلة')}</span>
                      </button>
                      {isAdmin && (
                        <button onClick={() => navigate('/admin')} className="dropdown-item admin-link-item">
                          <ShieldAlert size={16} />
                          <span>{t('Admin Panel', 'لوحة التحكم')}</span>
                        </button>
                      )}
                      <hr className="dropdown-divider" />
                      <button onClick={handleSignOut} className="dropdown-item logout-item">
                        <LogOut size={16} />
                        <span>{t('Sign Out', 'تسجيل الخروج')}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setIsCartOpen(true)}
                className="navbar-icon-btn navbar-cart"
              >
                <ShoppingCart className="icon" />
                {cartCount > 0 && <span className="navbar-cart-badge">{cartCount}</span>}
              </motion.button>
              
              <motion.button 
                whileTap={{ scale: 0.85 }}
                className="navbar-mobile-menu"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="icon" /> : <Menu className="icon" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* ── Mobile search strip ── */}
        <div className="mobile-sticky-search-bar">
          <div className="mobile-search-strip-inner">
            <Search className="mobile-strip-search-icon" size={16} />
            <input
              type="text"
              className="mobile-strip-search-input"
              placeholder={t('Search products...', 'ابحث عن المنتجات...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="mobile-strip-clear-btn" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Desktop search drawer ── */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="navbar-search-drawer"
            >
              <div className="search-drawer-inner">
                <div className="search-input-wrapper">
                  <Search className="search-input-icon" />
                  <input
                    type="text"
                    className="navbar-search-input"
                    placeholder={t('Search products...', 'ابحث عن المنتجات...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {searchQuery && (
                    <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mobile menu drawer ── */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="navbar-mobile-drawer-container"
            >
              <div className="mobile-drawer-wrapper">                
                <button onClick={(e) => handleNavigation(e, 'shop')} className="mobile-drawer-nav-item">
                  {t('Shop', 'المتجر')}
                </button>
                <button onClick={(e) => handleNavigation(e, 'contact')} className="mobile-drawer-nav-item">
                  {t('Contact', 'تواصل معنا')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* ── Persistent floating WhatsApp button — visible on every page, no motion ── */}
      <a
       href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('Chat with us on WhatsApp', 'تواصل معنا عبر واتساب')}
        className="floating-whatsapp-btn"
      >
        <svg viewBox="0 0 448 512" fill="currentColor" width="24" height="24">
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
        </svg>
      </a>
    </>
  );
};

export default Navbar;