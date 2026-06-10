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

  const ADMIN_EMAILS = ['admin@homiyaa.com', 'mayamohamed364@gmail.com', 'hussein70mohamedeg@gmail.com'];
  const isAdmin = user && user.email && ADMIN_EMAILS.includes(user.email);

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery('');
    }
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

  // Closes open menu overlays when switching page views
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

  // SMART ROUTING: Navigates back home if on /account or /product pages, then smoothly scrolls down
  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, targetId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } else {
      const element = document.getElementById(targetId);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            
            {/* Logo Workspace Box Container */}
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

            {/* Desktop-Only Anchored Layout Section Links */}
            <div className="navbar-links">
              <a href="#shop" className="navbar-link" onClick={(e) => handleNavigation(e, 'shop')}>
                {t('Shop', 'المتجر')}
              </a>
              <a href="#contact" className="navbar-link" onClick={(e) => handleNavigation(e, 'contact')}>
                {t('Contact', 'تواصل معنا')}
              </a>
            </div>

            {/* Universal System Operations Panel View Actions */}
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
              
              {/* Account Authorization Menu Node Setup */}
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
              
              {/* Basket Tracking Operation Icon Button */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setIsCartOpen(true)}
                className="navbar-icon-btn navbar-cart"
              >
                <ShoppingCart className="icon" />
                {cartCount > 0 && <span className="navbar-cart-badge">{cartCount}</span>}
              </motion.button>
              
              {/* Triple Bar Hamburger Trigger Display Element Button for Small Screen Mobile Viewports */}
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

        {/* ── Sticked Mobile Search Strip (Always visible outside icon drawer on mobile layout) ── */}
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

        {/* Desktop Header Global Slide-Down Expanded Search Area Drawer Section Panel */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="navbar-search-drawer"
            >
              <div className="container search-drawer-inner">
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

        {/* Responsive Mobile Drawer Container Layout Dropdown Panel Overlay */}
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
    </>
  );
};

export default Navbar;