import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../supabaseClient';
import emailjs from '@emailjs/browser';
import { X, Trash2, ShoppingBag, Loader2, ShoppingCart } from 'lucide-react';
import './CartDrawer.css';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

const GOVERNORATE_SHIPPING_MATRIX: Record<string, { en: string; ar: string; cost: number }> = {
  cairo: { en: 'Cairo', ar: 'القاهرة', cost: 50 },
  giza: { en: 'Giza', ar: 'الجيزة', cost: 50 },
  alexandria: { en: 'Alexandria', ar: 'الإسكندرية', cost: 65 },
  fayoum: { en: 'Fayoum', ar: 'الفيوم', cost: 80 },
  qalyubia: { en: 'Qalyubia', ar: 'القليوبية', cost: 55 },
  sharqia: { en: 'Sharqia', ar: 'الشرقية', cost: 70 },
  dakahlia: { en: 'Dakahlia', ar: 'الدقهلية', cost: 70 },
  beheira: { en: 'Beheira', ar: 'البحيرة', cost: 75 },
  gharbia: { en: 'Gharbia', ar: 'الغربية', cost: 70 },
  monufia: { en: 'Monufia', ar: 'المنوفية', cost: 70 },
  ismailia: { en: 'Ismailia', ar: 'الإسماعيلية', cost: 75 },
  suez: { en: 'Suez', ar: 'السويس', cost: 75 },
  port_said: { en: 'Port Said', ar: 'بورسعيد', cost: 75 },
  luxor: { en: 'Luxor', ar: 'الأقصر', cost: 100 },
  aswan: { en: 'Aswan', ar: 'أسوان', cost: 110 },
  minya: { en: 'Minya', ar: 'المنيا', cost: 90 },
  sohag: { en: 'Sohag', ar: 'سوهاج', cost: 95 },
  qena: { en: 'Qena', ar: 'قنا', cost: 100 },
  asyut: { en: 'Asyut', ar: 'أسيوط', cost: 90 },
  beni_suef: { en: 'Beni Suef', ar: 'بني سويف', cost: 80 },
  kafr_el_sheikh: { en: 'Kafr El Sheikh', ar: 'كفر الشيخ', cost: 75 },
  damietta: { en: 'Damietta', ar: 'دمياط', cost: 75 },
  north_sinai: { en: 'North Sinai', ar: 'شمال سيناء', cost: 90 },
  south_sinai: { en: 'South Sinai', ar: 'جنوب سيناء', cost: 95 },
  red_sea: { en: 'Red Sea', ar: 'البحر الأحمر', cost: 100 },
  matrouh: { en: 'Matrouh', ar: 'مطروح', cost: 100 },
  new_valley: { en: 'New Valley', ar: 'الوادي الجديد', cost: 110 },
};

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gov, setGov] = useState('cairo');
  const [address, setAddress] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = cart.length > 0 ? GOVERNORATE_SHIPPING_MATRIX[gov].cost : 0;
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

    // Send to customer
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      { ...sharedParams, to_email: email },
      EMAILJS_PUBLIC_KEY
    );

    // Send to admin with full customer details in customer_name field
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        ...sharedParams,
        to_email: ADMIN_EMAIL,
        customer_name: `${name} | 📞 ${phone} | 📍 ${govName} — ${address}`,
      },
      EMAILJS_PUBLIC_KEY
    );
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || loading) return;
    setLoading(true);

    const selectedGov = GOVERNORATE_SHIPPING_MATRIX[gov];
    const govName = language === 'ar' ? selectedGov.ar : selectedGov.en;

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
      })),
      subtotal,
      shipping_cost: shippingCost,
      total: grandTotal,
      status: 'Pending',
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
      setGov('cairo');
      setAddress('');
      onClose();

      alert(
        language === 'ar'
          ? `تم تسجيل طلبك بنجاح! ✅ تحقق من بريدك الإلكتروني لتفاصيل الطلب.`
          : `Order placed successfully! ✅ Check your email for order details.`
      );
    } catch (err: any) {
      alert(`Checkout Error: ${err.message}`);
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
                      <button type="button" onClick={() => updateQuantity(item.id, -1)}>-</button>
                      <span className="count-qty">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, 1)}>+</button>
                    </div>
                  </div>
                  <button type="button" className="remove-item-btn" onClick={() => removeFromCart(item.id)}>
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
                <select value={gov} onChange={e => setGov(e.target.value)} className="gov-native-dropdown">
                  {Object.entries(GOVERNORATE_SHIPPING_MATRIX).map(([key, value]) => (
                    <option key={key} value={key}>
                      {language === 'ar' ? value.ar : value.en} (+{value.cost} EGP)
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