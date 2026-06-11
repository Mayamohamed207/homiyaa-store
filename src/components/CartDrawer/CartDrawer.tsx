import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../supabaseClient';
import emailjs from '@emailjs/browser';
import { X, Trash2, ShoppingBag, Loader2, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import './CartDrawer.css';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

interface DbShippingRecord {
  key_code: string;
  name_en: string;
  name_ar: string;
  cost: number;
}

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [sendConfirmation, setSendConfirmation] = useState(true);

  const [shippingOptions, setShippingOptions] = useState<DbShippingRecord[]>([]);
  const [selectedGovKey, setSelectedGovKey] = useState('');

  // Pre-fill from logged-in user
  useEffect(() => {
    if (isOpen && user) {
      setEmail(user.email ?? '');
      setName(user.user_metadata?.full_name ?? '');
      setPhone(user.user_metadata?.phone ?? '');
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen) {
      supabase
        .from('shipping_matrix')
        .select('key_code, name_en, name_ar, cost')
        .order('name_en', { ascending: true })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setShippingOptions(data);
            const hasCairo = data.find(item => item.key_code === 'cairo');
            setSelectedGovKey(hasCairo ? 'cairo' : data[0].key_code);
          }
        });
    }
  }, [isOpen]);

  const activeGovRecord = shippingOptions.find(o => o.key_code === selectedGovKey);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = cart.length > 0 && activeGovRecord ? Number(activeGovRecord.cost) : 0;
  const grandTotal = subtotal + shippingCost;

  const buildOrderDetailsHtml = () => {
    const rows = cart.map(item => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;">
          ${item.name_en} / ${item.name_ar}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:center;color:#555;">
          x${item.quantity}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;color:#111;white-space:nowrap;">
          ${item.price * item.quantity} EGP
        </td>
      </tr>
    `).join('');

    return `
      <thead>
        <tr style="background:#fafafa;">
          <th style="padding:8px 0;text-align:left;font-size:12px;color:#999;font-weight:600;text-transform:uppercase;border-bottom:2px solid #eee;">Product</th>
          <th style="padding:8px 0;text-align:center;font-size:12px;color:#999;font-weight:600;text-transform:uppercase;border-bottom:2px solid #eee;">Qty</th>
          <th style="padding:8px 0;text-align:right;font-size:12px;color:#999;font-weight:600;text-transform:uppercase;border-bottom:2px solid #eee;">Price</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    `;
  };

  const sendConfirmationEmail = async (orderId: string) => {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        order_id: orderId,
        customer_name: name,
        order_details_html: buildOrderDetailsHtml(),
        subtotal: `${subtotal}`,
        shipping_cost: `${shippingCost}`,
        total_price: `${grandTotal}`,
        to_email: email,
        reply_to: email,
      },
      EMAILJS_PUBLIC_KEY
    );
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || loading || !activeGovRecord) return;

    // If email entered and send confirmation checked, validate email format
    if (email.trim() && sendConfirmation) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        toast.error(language === 'ar' ? 'البريد الإلكتروني غير صالح' : 'Invalid email address');
        return;
      }
    }

    setLoading(true);

    const govName = language === 'ar' ? activeGovRecord.name_ar : activeGovRecord.name_en;

    const orderPayload = {
      customer_name: name,
      customer_email: email.trim() || null,
      customer_phone: phone,
      governorate: govName,
      detailed_address: address,
      items: cart.map(i => ({
        id: i.id,
        name_en: i.name_en,
        name_ar: i.name_ar,
        quantity: i.quantity,
        price: i.price,
        image: i.image ?? null,
      })),
      subtotal,
      shipping_cost: shippingCost,
      total: grandTotal,
      status: 'Pending',
      user_id: user?.id ?? null,
    };

    try {
      const { data, error } = await supabase.from('orders').insert([orderPayload]).select();
      if (error) throw error;

      const orderId = String(data?.[0]?.id || 'N/A');

      // Only send email if email was entered AND user opted in
      if (email.trim() && sendConfirmation) {
        await sendConfirmationEmail(orderId);
      }

      clearCart();
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setSendConfirmation(true);
      onClose();

      toast.success(
        language === 'ar'
          ? 'تم تسجيل طلبك بنجاح!'
          : 'Order placed successfully!'
      );
    } catch (err: any) {
      toast.error(
        language === 'ar'
          ? `حدث خطأ: ${err.message}`
          : `Checkout failed: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cart-drawer-backdrop" onClick={onClose}>
      <div
        className="cart-drawer-panel"
        onClick={e => e.stopPropagation()}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="cart-drawer-header">
          <h3>{language === 'ar' ? 'حقيبة المشتريات' : 'Shopping Cart'}</h3>
          <button className="close-panel-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty-state">
            <ShoppingBag size={48} className="empty-icon" />
            <p>{language === 'ar' ? 'حقيبتك فارغة، أضف بعض المنتجات!' : 'Your bag is empty! Add products to begin.'}</p>
          </div>
        ) : (
          <div className="cart-drawer-content">

            {/* Cart items */}
            <div className="cart-items-wrapper-list">
              {cart.map(item => (
                <div key={`${item.id}-${item.selected_color?.color_code ?? 'none'}`} className="cart-item-row">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500&q=80'}
                    alt={item.name_en}
                    className="cart-thumb"
                  />
                  <div className="cart-details-info">
                    <h4>{language === 'ar' ? item.name_ar : item.name_en}</h4>
                    {item.selected_color && (
                      <span className="cart-color-chip" style={{ backgroundColor: item.selected_color.color_code }}>
                        &nbsp;
                      </span>
                    )}
                    <span className="cart-price-tag">{item.price} EGP</span>
                    <div className="cart-counter-controls">
                      <button type="button" onClick={() => updateQuantity(item.id, -1, item.selected_color ?? undefined)}>-</button>
                      <span className="count-qty">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, 1, item.selected_color ?? undefined)}>+</button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="remove-item-btn"
                    onClick={() => removeFromCart(item.id, item.selected_color ?? undefined)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Checkout form */}
            <form onSubmit={handleCheckoutSubmit} className="checkout-shipping-form">
              <h3>{language === 'ar' ? 'تفاصيل الطلب والشحن' : 'Order & Shipping Details'}</h3>

              {/* Name */}
              <div className="input-group">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={language === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
                />
              </div>

              {/* Phone */}
              <div className="input-group">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder={language === 'ar' ? 'رقم الهاتف *' : 'Phone Number *'}
                />
              </div>

              {/* Email — optional */}
              <div className="input-group">
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (!e.target.value.trim()) setSendConfirmation(false);
                    else setSendConfirmation(true);
                  }}
                  placeholder={
                    language === 'ar'
                      ? 'البريد الإلكتروني (اختياري)'
                      : 'Email Address (optional)'
                  }
                />
              </div>

              {/* Confirmation checkbox — only show if email entered */}
              {email.trim() && (
                <div className="input-group confirmation-check-row">
                  <label className="confirmation-check-label">
                    <input
                      type="checkbox"
                      checked={sendConfirmation}
                      onChange={e => setSendConfirmation(e.target.checked)}
                    />
                    <span>
                      {language === 'ar'
                        ? 'أرسل لي تأكيداً على بريدي الإلكتروني'
                        : 'Send me an order confirmation email'}
                    </span>
                  </label>
                </div>
              )}

              {/* Governorate */}
              <div className="input-group select-wrapper">
                <label className="select-caption">
                  {language === 'ar' ? 'اختر المحافظة' : 'Select Governorate'}
                </label>
                <select
                  value={selectedGovKey}
                  onChange={e => setSelectedGovKey(e.target.value)}
                  className="gov-native-dropdown"
                >
                  {shippingOptions.map(option => (
                    <option key={option.key_code} value={option.key_code}>
                      {language === 'ar' ? option.name_ar : option.name_en} (+{option.cost} EGP)
                    </option>
                  ))}
                </select>
              </div>

              {/* Address */}
              <div className="input-group">
                <input
                  type="text"
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder={language === 'ar' ? 'العنوان بالتفصيل *' : 'Detailed Address *'}
                />
              </div>

              {/* Summary */}
              <div className="checkout-summary-financial-card">
                <div className="financial-row">
                  <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  <span>{subtotal} EGP</span>
                </div>
                <div className="financial-row">
                  <span>{language === 'ar' ? 'تكلفة الشحن' : 'Shipping'}</span>
                  <span>{shippingCost} EGP</span>
                </div>
                <div className="financial-row final-total-row">
                  <span>{language === 'ar' ? 'الإجمالي الكلي' : 'Grand Total'}</span>
                  <span>{grandTotal} EGP</span>
                </div>
              </div>

              <button type="submit" className="submit-checkout-btn-cta" disabled={loading}>
                {loading ? (
                  <Loader2 className="spinning-loader" size={18} />
                ) : (
                  <>
                    <ShoppingCart size={18} />
                    <span>{language === 'ar' ? 'تأكيد وشراء الطلب' : 'Confirm & Place Order'}</span>
                  </>
                )}
              </button>
            </form>

          </div>
        )}
      </div>
    </div>
  );
}

/*
import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../supabaseClient';
import emailjs from '@emailjs/browser';
import { X, Trash2, ShoppingBag, Loader2, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import './CartDrawer.css';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

interface DbShippingRecord {
  key_code: string;
  name_en: string;
  name_ar: string;
  cost: number;
}

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Dynamic database shipping states
  const [shippingOptions, setShippingOptions] = useState<DbShippingRecord[]>([]);
  const [selectedGovKey, setSelectedGovKey] = useState('');

  // Fetch real-time configurations on open
  useEffect(() => {
    if (isOpen) {
      supabase
        .from('shipping_matrix')
        .select('key_code, name_en, name_ar, cost')
        .order('name_en', { ascending: true })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setShippingOptions(data);
            const hasCairo = data.find(item => item.key_code === 'cairo');
            setSelectedGovKey(hasCairo ? 'cairo' : data[0].key_code);
          }
        });
    }
  }, [isOpen]);

  const activeGovRecord = shippingOptions.find(o => o.key_code === selectedGovKey);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = cart.length > 0 && activeGovRecord ? Number(activeGovRecord.cost) : 0;
  const grandTotal = subtotal + shippingCost;

  const buildOrderDetailsHtml = () => {
    const rows = cart.map(item => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">
          ${item.name_en} / ${item.name_ar}
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: center; color: #555;">
          x${item.quantity}
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 600; color: #111; white-space: nowrap;">
          ${item.price * item.quantity} EGP
        </td>
      </tr>
    `).join('');

    return `
      <thead>
        <tr style="background: #fafafa;">
          <th style="padding: 8px 0; text-align: left; font-size: 12px; color: #999; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #eee;">Product</th>
          <th style="padding: 8px 0; text-align: center; font-size: 12px; color: #999; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #eee;">Qty</th>
          <th style="padding: 8px 0; text-align: right; font-size: 12px; color: #999; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #eee;">Price</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    `;
  };

  const sendEmails = async (orderId: string, govName: string) => {
    const orderDetailsHtml = buildOrderDetailsHtml();

    const sharedParams = {
      order_id: orderId,
      customer_name: name,
      order_details_html: orderDetailsHtml,
      subtotal: `${subtotal}`,
      shipping_cost: `${shippingCost}`,
      total_price: `${grandTotal}`,
    };

    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { ...sharedParams, to_email: email }, EMAILJS_PUBLIC_KEY);
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      ...sharedParams,
      to_email: ADMIN_EMAIL,
      customer_name: `${name} | 📞 ${phone} | 📍 ${govName} — ${address}`,
    }, EMAILJS_PUBLIC_KEY);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || loading || !activeGovRecord) return;
    setLoading(true);

    const govName = language === 'ar' ? activeGovRecord.name_ar : activeGovRecord.name_en;

    const orderPayload = {
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      governorate: govName,
      detailed_address: address,
      items: cart.map(i => ({
        id: i.id,
        name_en: i.name_en,
        name_ar: i.name_ar,
        quantity: i.quantity,
        price: i.price,
        image: i.image ?? null,
      })),
      subtotal,
      shipping_cost: shippingCost,
      total: grandTotal,
      status: 'Pending',
      user_id: user?.id ?? null,
    };

    try {
      const { data, error } = await supabase.from('orders').insert([orderPayload]).select();
      if (error) throw error;

      const orderId = String(data?.[0]?.id || 'N/A');
      await sendEmails(orderId, govName);

      clearCart();
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      onClose();

      toast.success(language === 'ar' ? 'تم تسجيل طلبك بنجاح! تحقق من بريدك الإلكتروني' : 'Order placed! Check your email for details');
    } catch (err: any) {
      toast.error(language === 'ar' ? `حدث خطأ: ${err.message}` : `Checkout failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cart-drawer-backdrop" onClick={onClose}>
      <div className="cart-drawer-panel" onClick={e => e.stopPropagation()} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="cart-drawer-header">
          <h3>{language === 'ar' ? 'حقيبة المشتريات' : 'Shopping Cart Bag'}</h3>
          <button className="close-panel-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty-state">
            <ShoppingBag size={48} className="empty-icon" />
            <p>{language === 'ar' ? 'حقيبتك فارغة، أضف بعض المنتجات!' : 'Your bag is empty! Add products to begin.'}</p>
          </div>
        ) : (
          <div className="cart-drawer-content">
            <div className="cart-items-wrapper-list">
              {cart.map(item => (
                <div key={item.id} className="cart-item-row">
                  <img src={item.image || 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500&q=80'} alt={item.name_en} className="cart-thumb" />
                  <div className="cart-details-info">
                    <h4>{language === 'ar' ? item.name_ar : item.name_en}</h4>
                    <span className="cart-price-tag">{item.price} EGP</span>
                    <div className="cart-counter-controls">
                      <button type="button" onClick={() => updateQuantity(item.id, -1, item.selected_color ?? undefined)}>-</button>
                      <span className="count-qty">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, 1, item.selected_color ?? undefined)}>+</button>
                    </div>
                  </div>
                  <button type="button" className="remove-item-btn" onClick={() => removeFromCart(item.id, item.selected_color ?? undefined)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleCheckoutSubmit} className="checkout-shipping-form">
              <h3>{language === 'ar' ? 'تفاصيل المشتري وشحن الطلب' : 'Customer & Shipping Details'}</h3>

              <div className="input-group">
                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full Name'} />
              </div>
              <div className="input-group">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} />
              </div>
              <div className="input-group">
                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone Number'} />
              </div>

              <div className="input-group select-wrapper">
                <label className="select-caption">{language === 'ar' ? 'اختر المحافظة' : 'Select Governorate'}</label>
                <select value={selectedGovKey} onChange={e => setSelectedGovKey(e.target.value)} className="gov-native-dropdown">
                  {shippingOptions.map(option => (
                    <option key={option.key_code} value={option.key_code}>
                      {language === 'ar' ? option.name_ar : option.name_en} (+{option.cost} EGP)
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <input type="text" required value={address} onChange={e => setAddress(e.target.value)} placeholder={language === 'ar' ? 'العنوان بالتفصيل' : 'Detailed Address'} />
              </div>

              <div className="checkout-summary-financial-card">
                <div className="financial-row">
                  <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  <span>{subtotal} EGP</span>
                </div>
                <div className="financial-row">
                  <span>{language === 'ar' ? 'تكلفة الشحن' : 'Shipping'}</span>
                  <span>{shippingCost} EGP</span>
                </div>
                <div className="financial-row final-total-row">
                  <span>{language === 'ar' ? 'الإجمالي الكلي' : 'Grand Total'}</span>
                  <span>{grandTotal} EGP</span>
                </div>
              </div>

              <button type="submit" className="submit-checkout-btn-cta" disabled={loading}>
                {loading ? <Loader2 className="spinning-loader" size={18} /> : (
                  <>
                    <ShoppingCart size={18} />
                    <span>{language === 'ar' ? 'تأكيد وشراء الطلب' : 'Confirm & Place Order'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
*/