import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../supabaseClient';
import { Package, Heart, ArrowLeft, Loader2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import './AccountPage.css';

interface OrderItem {
  id: string;
  product_title: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  items?: OrderItem[];
}

interface WishlistItem {
  id: string;
  product_id: string;
  title: string;
  price: number;
  image_url: string;
}

const AccountPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  const isRtl = language === 'ar';

  // Redirect unprotected guests out of account route dashboard
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error(t('Please sign in to view your account', 'يرجى تسجيل الدخول لعرض حسابك'));
      navigate('/');
    }
  }, [user, authLoading, navigate, t]);

  // Fetch orders and wishlist data
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      setDataLoading(true);
      try {
        // Fetch Orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // Fetch Wishlist joined with basic product details
        const { data: wishlistData, error: wishlistError } = await supabase
          .from('wishlists')
          .select('id, product_id, products(title, price, image_url)')
          .eq('user_id', user.id);

        if (wishlistError) throw wishlistError;

        // Format Orders structure safely
        const formattedOrders = (ordersData || []).map((order: any) => ({
          id: order.id,
          created_at: order.created_at,
          total_amount: order.total_amount,
          status: order.status,
          items: (order.order_items || []).map((item: any) => ({
            id: item.id,
            product_title: item.product_title,
            quantity: item.quantity,
            price: item.price,
          })),
        }));

        // Format Wishlist items flatten fields safely
        const formattedWishlist = (wishlistData || []).map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          title: item.products?.title || t('Product Unavailable', 'منتج غير متوفر'),
          price: item.products?.price || 0,
          image_url: item.products?.image_url || '/placeholder.jpeg',
        }));

        setOrders(formattedOrders);
        setWishlist(formattedWishlist);
      } catch (error: any) {
        console.error('Error loading account files data:', error);
        toast.error(t('Error loading account information', 'حدث خطأ أثناء تحميل بيانات الحساب'));
      } finally {
        setDataLoading(false);
      }
    };

    fetchUserData();
  }, [user, t]);

  if (authLoading || (dataLoading && !user)) {
    return (
      <div className="account-loading-fallback">
        <Loader2 className="spinning" size={32} />
        <p>{t('Loading your dashboard...', 'جاري تحميل لوحة التحكم الخاصة بك...')}</p>
      </div>
    );
  }

  return (
    <div className="account-page-container container">
      
      {/* 🔙 TOP BACK TO SHOP ACTION HEADER */}
      <div className="account-top-nav-bar">
        <button 
          onClick={() => navigate('/')} 
          className="account-back-home-btn"
          type="button"
        >
          <ArrowLeft size={18} className="account-back-arrow-icon" />
          <span>{t('Back to Home Page', 'الرجوع للمتجر الرئيسي')}</span>
        </button>
      </div>

      {/* User Header Info Hero block */}
      <div className="account-hero-profile-card">
        <div className="profile-avatar-circle">
          <span className="avatar-initial">
            {(user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}
          </span>
        </div>
        <div className="profile-meta-details text-start">
          <h2>{user?.user_metadata?.full_name || t('Valued Customer', 'عميلنا العزيز')}</h2>
          <p>{user?.email}</p>
        </div>
      </div>

      {/* Dashboard Toggle Segment Control Tabs */}
      <div className="account-tab-headers">
        <button
          onClick={() => setActiveTab('orders')}
          className={`account-tab-btn ${activeTab === 'orders' ? 'active-tab' : ''}`}
          type="button"
        >
          <Package size={18} />
          <span>{t('My Orders', 'طلباتي')} ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`account-tab-btn ${activeTab === 'wishlist' ? 'active-tab' : ''}`}
          type="button"
        >
          <Heart size={18} />
          <span>{t('My Wishlist', 'قائمة مفضلاتي')} ({wishlist.length})</span>
        </button>
      </div>

      {/* Active Area View Render Blocks */}
      <div className="account-tab-content-area">
        {dataLoading ? (
          <div className="tab-internal-loader">
            <Loader2 className="spinning" size={24} />
          </div>
        ) : activeTab === 'orders' ? (
          /* ORDERS TAB RENDER */
          orders.length === 0 ? (
            <div className="account-empty-state-card">
              <ShoppingBag size={48} className="empty-state-icon" />
              <h3>{t('No Orders Placed Yet', 'لم تقم بأي طلبات حتى الآن')}</h3>
              <p>{t('Explore our store grids to place your first order!', 'تصفح منتجاتنا المميزة وابدأ طلبك الأول الآن!')}</p>
              <button onClick={() => navigate('/')} className="empty-state-shop-btn">
                {t('Shop Our Products', 'اذهب للتسوق')}
              </button>
            </div>
          ) : (
            <div className="orders-list-grid-wrapper">
              {orders.map((order) => (
                <div key={order.id} className="order-history-row-card">
                  <div className="order-card-header">
                    <div>
                      <span className="order-id-label">{t('Order Reference ID:', 'رقم مرجع الطلب:')}</span>
                      <p className="order-id-hash">#{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="order-meta-right">
                      <span className="order-date-text">
                        {new Date(order.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </span>
                      <span className={`status-badge-pill status-${order.status.toLowerCase()}`}>
                        {t(order.status, order.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="order-items-subtable">
                    {order.items?.map((item) => (
                      <div key={item.id} className="order-item-inline-row">
                        <span className="order-item-title">{item.product_title}</span>
                        <span className="order-item-qty">x{item.quantity}</span>
                        <span className="order-item-price">{item.price} {t('EGP', 'ج.م')}</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-card-footer">
                    <span>{t('Total Summary Payment:', 'إجمالي المبلغ المدفوع:')}</span>
                    <strong className="order-footer-total-cost">{order.total_amount} {t('EGP', 'ج.م')}</strong>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* WISHLIST TAB RENDER */
          wishlist.length === 0 ? (
            <div className="account-empty-state-card">
              <Heart size={48} className="empty-state-icon" />
              <h3>{t('Your Wishlist is Empty', 'قائمة مفضلاتك فارغة')}</h3>
              <p>{t('Save items you love here to check them out later.', 'احفظ المنتجات التي تنال إعجابك هنا لمراجعتها لاحقاً.')}</p>
              <button onClick={() => navigate('/')} className="empty-state-shop-btn">
                {t('Discover items', 'اكتشف المنتجات')}
              </button>
            </div>
          ) : (
            <div className="wishlist-products-flex-grid">
              {wishlist.map((item) => (
                <div 
                  key={item.id} 
                  className="wishlist-product-item-card"
                  onClick={() => navigate(`/product/${item.product_id}`)}
                >
                  <div className="wishlist-image-container">
                    <img src={item.image_url} alt={item.title} />
                  </div>
                  <div className="wishlist-card-details">
                    <h4 className="wishlist-item-title">{item.title}</h4>
                    <p className="wishlist-item-price">{item.price} {t('EGP', 'ج.م')}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AccountPage;