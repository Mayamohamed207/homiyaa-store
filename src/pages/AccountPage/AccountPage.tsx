import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../supabaseClient';
import { Package, Heart, Loader2, ShoppingBag, MapPin, Calendar, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import './AccountPage.css';

interface OrderItem {
  id: number;
  product_title: string;
  quantity: number;
  price: number;
  image?: string;
  colorChosen?: string;
  colorChosenAr?: string;
  color_code?: string;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  shipping_cost: number;
  subtotal: number;
  governorate: string;
  detailed_address: string;
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

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500&q=80';

const useTranslateStatus = (t: Function) => (status: string) => {
  switch (status) {
    case 'Pending':   return t('Pending',   ' انتظار التأكيد');
    case 'Confirmed': return t('Confirmed', 'تم التأكيد');
    case 'Shipped':   return t('Shipped',   'تم الشحن');
    case 'Completed': return t('Completed', 'تم التوصيل');
    case 'Cancelled': return t('Cancelled', 'ملغي');
    default: return status;
  }
};

const AccountPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const translateStatus = useTranslateStatus(t);

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist'>('orders');
  const [orders, setOrders]       = useState<Order[]>([]);
  const [wishlist, setWishlist]   = useState<WishlistItem[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  const isRtl = language === 'ar';

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error(t('Please sign in to view your account', 'يرجى تسجيل الدخول لعرض حسابك'));
      navigate('/');
    }
  }, [user, authLoading, navigate, t]);

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      setDataLoading(true);
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        const missingIds: number[] = [];
        (ordersData || []).forEach((order: any) => {
          (order.items || []).forEach((item: any) => {
            if (!item.image && item.id) missingIds.push(Number(item.id));
          });
        });

        let imageMap: Record<number, string> = {};
        if (missingIds.length > 0) {
          const uniqueIds = [...new Set(missingIds)];
          const { data: imgData } = await supabase
            .from('product_images')
            .select('product_id, image_url')
            .in('product_id', uniqueIds);

          (imgData || []).forEach((row: any) => {
            if (!imageMap[row.product_id]) imageMap[row.product_id] = row.image_url;
          });
        }

     const formattedOrders: Order[] = (ordersData || []).map((order: any) => ({
      id:               order.id,
      created_at:       order.created_at,
      total_amount:     order.total,
      subtotal:         order.subtotal,
      shipping_cost:    order.shipping_cost,
      governorate:      order.governorate,
      detailed_address: order.detailed_address,
      status:           order.status,
      items: (order.items || []).map((item: any) => ({
        id:            item.id,
        product_title: isRtl ? item.name_ar : item.name_en,
        quantity:      item.quantity,
        price:         item.price,
        image:         item.image || imageMap[Number(item.id)] || FALLBACK_IMAGE,
        colorChosen:   item.colorChosen ?? null,
        colorChosenAr: item.colorChosenAr ?? null,
        color_code:    item.color_code ?? null,
      })),
    }));

        const { data: wishlistData, error: wishlistError } = await supabase
          .from('wishlists')
          .select('id, product_id, products(name_en, name_ar, price, product_images(image_url))')
          .eq('user_id', user.id);

        if (wishlistError) throw wishlistError;

        const formattedWishlist: WishlistItem[] = (wishlistData || []).map((item: any) => ({
          id:         item.id,
          product_id: item.product_id,
          title:      (isRtl ? item.products?.name_ar : item.products?.name_en) || t('Product Unavailable', 'منتج غير متوفر'),
          price:      item.products?.price || 0,
          image_url:  item.products?.product_images?.[0]?.image_url || FALLBACK_IMAGE,
        }));

        setOrders(formattedOrders);
        setWishlist(formattedWishlist);
      } catch (error: any) {
        console.error('Error loading account data:', error);
        toast.error(t('Error loading account information', 'حدث خطأ أثناء تحميل بيانات الحساب'));
      } finally {
        setDataLoading(false);
      }
    };

    fetchUserData();

    const channel = supabase
      .channel(`user-orders-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === payload.new.id
                ? { ...o, status: payload.new.status }
                : o
            )
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, t, isRtl]);

  if (authLoading || (dataLoading && !user)) {
    return (
      <div className="account-loading-fallback">
        <Loader2 className="spinning" size={32} />
        <p>{t('Loading your dashboard...', 'جاري تحميل لوحة التحكم...')}</p>
      </div>
    );
  }

  return (
    <div className="account-page-container container" dir={isRtl ? 'rtl' : 'ltr'}>

      <div className="account-hero-profile-card">
        <div className="profile-avatar-circle">
          <span className="avatar-initial">
            {(user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}
          </span>
        </div>
        <div className="profile-meta-details">
          <h2>{user?.user_metadata?.full_name || t('Valued Customer', 'عميلنا العزيز')}</h2>
          <p>{user?.email}</p>
        </div>
      </div>

      <div className="account-tab-headers">
        <button onClick={() => setActiveTab('orders')} className={`account-tab-btn ${activeTab === 'orders' ? 'active-tab' : ''}`} type="button">
          <Package size={17} />
          <span>{t('My Orders', 'طلباتي')} ({orders.length})</span>
        </button>
        <button onClick={() => setActiveTab('wishlist')} className={`account-tab-btn ${activeTab === 'wishlist' ? 'active-tab' : ''}`} type="button">
          <Heart size={17} />
          <span>{t('Your Favorites', 'المفضلة')} ({wishlist.length})</span>
        </button>
      </div>

      <div className="account-tab-content-area">
        {dataLoading ? (
          <div className="tab-internal-loader"><Loader2 className="spinning" size={24} /></div>
        ) : activeTab === 'orders' ? (
          <div>
            {orders.length === 0 ? (
              <div className="account-empty-state-card">
                <ShoppingBag size={44} className="empty-state-icon" />
                <h3>{t('No Orders Yet', 'لا توجد طلبات بعد')}</h3>
                <p>{t('Place your first order and it will appear here.', 'أضف منتجات وابدأ طلبك الأول.')}</p>
              </div>
            ) : (
              <div className="orders-list-grid-wrapper">
                {orders.map((order) => (
                  <div key={order.id} className="order-history-row-card">
                    <div className="order-card-header">
                      <div className="order-header-left">
                        <div className="order-meta-chip">
                          <Hash size={11} />
                          <span>{String(order.id).slice(0, 8).toUpperCase()}</span>
                        </div>
                        <div className="order-meta-chip">
                          <Calendar size={11} />
                          <span>
                            {new Date(order.created_at).toLocaleDateString(
                              language === 'ar' ? 'ar-EG' : 'en-US',
                              { year: 'numeric', month: 'short', day: 'numeric' }
                            )}
                          </span>
                        </div>
                        {order.governorate && (
                          <div className="order-meta-chip">
                            <MapPin size={11} />
                            <span>{order.governorate}</span>
                          </div>
                        )}
                      </div>
                      <span className={`status-badge-pill status-${order.status.toLowerCase()}`}>
                        {translateStatus(order.status)}
                      </span>
                    </div>

                    <div className="order-items-body">
                      {(order.items || []).map((item, idx) => (
                        <div key={item.id ?? idx} className="order-item-receipt-row">
                          <div className="order-item-img-wrap">
                            <img
                              src={item.image || FALLBACK_IMAGE}
                              alt={item.product_title}
                              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                            />
                          </div>
                          <div className="order-item-info">
                           <p className="order-item-name">{item.product_title}</p>
                            {(item as any).colorChosen && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}>
                                {(item as any).color_code && (
                                  <span style={{
                                    display: 'inline-block',
                                    width: '10px', height: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: (item as any).color_code,
                                    border: '1px solid rgba(0,0,0,0.15)',
                                  }} />
                                )}
                                <span style={{ fontSize: '0.72rem', color: 'var(--primary-500)', fontWeight: 500 }}>
                                  {isRtl ? (item as any).colorChosenAr || (item as any).colorChosen : (item as any).colorChosen}
                                </span>
                              </div>
                            )}
                            <div className="order-item-sub-row">
                              <span className="order-item-qty-badge">×{item.quantity}</span>
                              <span className="order-item-unit-price">{item.price} {t('EGP', 'ج.م')}</span>
                            </div>
                          </div>
                          <span className="order-item-line-total">
                            {item.price * item.quantity} {t('EGP', 'ج.م')}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="order-card-footer">
                      <div className="order-footer-breakdown">
                        {order.subtotal > 0 && (
                          <div className="order-footer-row">
                            <span>{t('Subtotal', 'سعر المنتج')}</span>
                            <span>{order.subtotal} {t('EGP', 'ج.م')}</span>
                          </div>
                        )}
                        {order.shipping_cost > 0 && (
                          <div className="order-footer-row">
                            <span>{t('Shipping', 'الشحن')}</span>
                            <span>{order.shipping_cost} {t('EGP', 'ج.م')}</span>
                          </div>
                        )}
                      </div>
                      <div className="order-footer-total-row">
                        <span>{t('Total', 'الإجمالي')}</span>
                        <strong className="order-footer-total-cost">{order.total_amount} {t('EGP', 'ج.م')}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="account-orders-global-footer">
              <button onClick={() => navigate('/')} className="empty-state-shop-btn">
                {t('Shop Now', 'تسوق الآن')}
              </button>
            </div>
          </div>
        ) : (
          wishlist.length === 0 ? (
            <div className="account-empty-state-card">
              <Heart size={44} className="empty-state-icon" />
              <h3>{t('Wishlist is Empty', 'قائمة المفضلة فارغة')}</h3>
              <p>{t('Save items you love and find them here.', 'احفظ المنتجات التي تعجبك لمراجعتها لاحقاً.')}</p>
              <button onClick={() => navigate('/')} className="empty-state-shop-btn">{t('Discover Products', 'اكتشف المنتجات')}</button>
            </div>
          ) : (
            <div className="wishlist-products-flex-grid">
              {wishlist.map((item) => (
                <div key={item.id} className="wishlist-product-item-card" onClick={() => navigate(`/product/${item.product_id}`)}>
                  <div className="wishlist-image-container">
                    <img src={item.image_url} alt={item.title} onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
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