import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Image, Palette, X, ClipboardList, Package, Trash2, Settings, Layers, GripHorizontal } from 'lucide-react';
import { ReactSortable } from 'react-sortablejs'; 
import AdminProductCard from './AdminProductCard';
import AdminOrdersPanel, { CustomerOrder } from './AdminOrdersPanel';
import AdminSettingsPanel, { DbCategoryRecord, DbShippingRecord } from './AdminSettingsPanel';
import { Product } from '../../components/ProductCard/ProductCard';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

interface ProductFormState {
  id?: number;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  price: number | '';
  discount_price: number | null | '';
  category_en: string;
  category_ar: string;
  stock_quantity: number | '';
  is_popular: boolean;
  is_sold_out: boolean;
  product_images?: { image_url: string }[];
  product_colors?: { color_code: string; color_name_en: string; color_name_ar: string }[];
}

interface ColorInput {
  id: string;
  color_name_en: string;
  color_name_ar: string;
  color_code: string;
}

interface UnifiedImage {
  id: string;
  type: 'existing' | 'new';
  url: string;
  file?: File;
}

type SortOption = 'latest' | 'price-asc' | 'price-desc' | 'low-stock';
type ActiveTabOption = 'products' | 'orders' | 'shipping' | 'categories';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

const initialFormState: ProductFormState = {
  name_en: '', name_ar: '', description_en: '', description_ar: '',
  price: '', discount_price: '', category_en: '', category_ar: '',
  stock_quantity: '', is_popular: false, is_sold_out: false,
};

const AdminDashboard = ({ externalCategoryFilter }: { externalCategoryFilter?: string }) => {
  const { t, isRtl } = useLanguage();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ActiveTabOption>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [formImages, setFormImages] = useState<UnifiedImage[]>([]);
  const [colors, setColors] = useState<ColorInput[]>([{ id: `c-${Date.now()}`, color_name_en: '', color_name_ar: '', color_code: '#000000' }]);
  const [formData, setFormData] = useState<ProductFormState>(initialFormState);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('latest');

  // Shared state for the Settings Panel
  const [dbLiveCategories, setDbLiveCategories] = useState<DbCategoryRecord[]>([]);
  const [dbShippingRows, setDbShippingRows] = useState<DbShippingRecord[]>([]);

  const { user } = useAuth();
  const ADMIN_EMAILS = ['admin@homiyaa.com', 'mayamohamed364@gmail.com', 'hussein70mohamedeg@gmail.com'];

  useEffect(() => {
    if (user?.email && ADMIN_EMAILS.includes(user.email)) {
      setIsAuthenticated(true);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) { 
      fetchProducts(); 
      fetchOrders(); 
      fetchStoreCategories();
      fetchShippingMatrix();
    }
  }, [isAuthenticated]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, product_images(image_url), product_colors(color_code, color_name_en, color_name_ar)')
      .order('id', { ascending: false });
    if (data) setProducts(data as Product[]);
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    const { data, error } = await supabase.from('orders').select('*').order('id', { ascending: false });
    if (!error && data) setOrders(data as CustomerOrder[]);
    setLoadingOrders(false);
  };

  const fetchStoreCategories = async () => {
    const { data } = await supabase.from('store_categories').select('*').order('name_en', { ascending: true });
    if (data) setDbLiveCategories(data);
  };

  const fetchShippingMatrix = async () => {
    const { data } = await supabase.from('shipping_matrix').select('*').order('id', { ascending: true });
    if (data) setDbShippingRows(data);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success(t('Welcome back, Admin! 👋', 'مرحباً بك مجدداً أيها المسؤول! 👋'));
    } else {
      toast.error(t('Incorrect password!', 'كلمة المرور غير صحيحة!'));
    }
    setPassword('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file: File, index: number) => ({
        id: `new-${Date.now()}-${index}-${Math.random()}`,
        type: 'new' as const,
        url: URL.createObjectURL(file),
        file,
      }));
      setFormImages(prev => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  const removeImage = (idToRemove: string) => {
    setFormImages(prev => {
      prev.filter(img => img.id === idToRemove).forEach(img => {
        if (img.type === 'new') URL.revokeObjectURL(img.url);
      });
      return prev.filter(img => img.id !== idToRemove);
    });
  };

  const handleAddColorRow = () =>
    setColors([...colors, { id: `c-${Date.now()}-${Math.random()}`, color_name_en: '', color_name_ar: '', color_code: '#000000' }]);

  const handleRemoveColorRow = (id: string) => {
    if (colors.length === 1) {
      setColors([{ id: `c-${Date.now()}`, color_name_en: '', color_name_ar: '', color_code: '#000000' }]);
    } else {
      setColors(colors.filter(c => c.id !== id));
    }
  };

  const handleColorChange = (id: string, field: keyof Omit<ColorInput, 'id'>, value: string) => {
    setColors(colors.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const getCleanPayload = () => {
    const payload = { ...formData } as any;
    delete payload.id;
    delete payload.product_images;
    delete payload.product_colors;
    payload.price = payload.price === '' ? 0 : Number(payload.price);
    payload.stock_quantity = payload.stock_quantity === '' ? 0 : Number(payload.stock_quantity);
    payload.discount_price = payload.discount_price === '' || payload.discount_price === null ? null : Number(payload.discount_price);
    return payload;
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;
    setIsUploading(true);

    try {
      let productId = formData.id;
      const cleanPayload = getCleanPayload();

      if (editMode && productId) {
        const { error } = await supabase.from('products').update(cleanPayload).eq('id', productId);
        if (error) throw new Error(error.message);
        await supabase.from('product_colors').delete().eq('product_id', productId);
      } else {
        const { data, error } = await supabase.from('products').insert([cleanPayload]).select();
        if (error) throw new Error(error.message);
        productId = data[0].id;
      }

      if (productId) {
        await supabase.from('product_images').delete().eq('product_id', productId);
        const finalImageRows = [];

        for (let i = 0; i < formImages.length; i++) {
          const imgItem = formImages[i];
          if (imgItem.type === 'existing') {
            finalImageRows.push({ product_id: productId, image_url: imgItem.url, display_order: i });
          } else if (imgItem.type === 'new' && imgItem.file) {
            const file = imgItem.file;
            const fileExtension = file.name.split('.').pop();
            const fileName = `${productId}_${Date.now()}_${i}.${fileExtension}`;
            const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
            finalImageRows.push({ product_id: productId, image_url: publicUrlData.publicUrl, display_order: i });
          }
        }

        if (finalImageRows.length > 0) {
          await supabase.from('product_images').insert(finalImageRows);
        }
      }

      const activeColors = colors.filter(c => c.color_name_en.trim() && c.color_name_ar.trim());
      if (activeColors.length > 0 && productId) {
        const colorRows = activeColors.map(c => ({
          product_id: productId,
          color_name_en: c.color_name_en.trim(),
          color_name_ar: c.color_name_ar.trim(),
          color_code: c.color_code.trim() || '#000000',
        }));
        await supabase.from('product_colors').insert(colorRows);
      }

      setIsFormOpen(false);
      fetchProducts();
      toast.success(t('Product saved successfully!', 'تم حفظ المنتج بنجاح!'));
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const openAddMode = () => {
    setEditMode(false);
    setFormData(initialFormState);
    setFormImages([]);
    setColors([{ id: `c-${Date.now()}`, color_name_en: '', color_name_ar: '', color_code: '#000000' }]);
    setIsFormOpen(true);
  };

  const openEditMode = async (product: Product) => {
    setEditMode(true);
    setFormData({
      id: product.id,
      name_en: product.name_en,
      name_ar: product.name_ar,
      description_en: product.description_en ?? '',
      description_ar: product.description_ar ?? '',
      price: product.price,
      discount_price: product.discount_price,
      category_en: product.category_en,
      category_ar: product.category_ar,
      stock_quantity: product.stock_quantity,
      is_popular: product.is_popular,
      is_sold_out: product.is_sold_out,
    });
    setFormImages((product.product_images || []).map((img, index) => ({
      id: `existing-${index}-${Math.random()}`,
      type: 'existing',
      url: img.image_url,
    })));

    const { data: fetchedColors } = await supabase.from('product_colors').select('*').eq('product_id', product.id);
    if (fetchedColors && fetchedColors.length > 0) {
      setColors(fetchedColors.map((c, i) => ({ id: `c-${i}`, color_name_en: c.color_name_en, color_name_ar: c.color_name_ar, color_code: c.color_code })));
    } else {
      setColors([{ id: `c-${Date.now()}`, color_name_en: '', color_name_ar: '', color_code: '#000000' }]);
    }
    setIsFormOpen(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm(t('Are you sure you want to delete this product?', 'هل أنت متأكد من حذف هذا المنتج؟'))) {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
      toast.success('Product deleted.');
    }
  };

  const processedProducts = useMemo(() => {
    let result = [...products];
    if (selectedCategory !== 'all') result = result.filter(item => item.category_en.toLowerCase() === selectedCategory.toLowerCase());
    result.sort((a, b) => {
      if (sortBy === 'price-asc') return (a.discount_price ?? a.price) - (b.discount_price ?? b.price);
      if (sortBy === 'price-desc') return (b.discount_price ?? b.price) - (a.discount_price ?? a.price);
      return b.id - a.id;
    });
    return result;
  }, [products, selectedCategory, sortBy]);

  if (!isAuthenticated) {
    return (
      <div className="admin-lock-screen" dir={isRtl ? 'rtl' : 'ltr'}>
        <form onSubmit={handlePasswordSubmit} className="lock-card">
          <h3>{t('Homiyaa Admin', 'ادمن هوميا')}</h3>
          <input type="password" placeholder={t('Enter Admin Password', 'أدخل كلمة مرور الادمن')} value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit">{t('Unlock Admin Page', 'فتح صفحة الادمن')}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-container" dir={isRtl ? 'rtl' : 'ltr'}>
      {!isFormOpen && (
        <div className="admin-tabs">
          <button onClick={() => setActiveTab('products')} className="admin-tab-btn" style={{ background: activeTab === 'products' ? 'var(--primary-800)' : 'transparent', color: activeTab === 'products' ? 'var(--white)' : 'var(--primary-800)' }}>
            <Package size={18} /> {t('Products', 'المنتجات')}
          </button>
          <button onClick={() => setActiveTab('orders')} className="admin-tab-btn" style={{ background: activeTab === 'orders' ? 'var(--primary-800)' : 'transparent', color: activeTab === 'orders' ? 'var(--white)' : 'var(--primary-800)' }}>
            <ClipboardList size={18} /> {t('Orders', 'الطلبات')}
          </button>
          <button onClick={() => setActiveTab('shipping')} className="admin-tab-btn" style={{ background: activeTab === 'shipping' ? 'var(--primary-800)' : 'transparent', color: activeTab === 'shipping' ? 'var(--white)' : 'var(--primary-800)' }}>
            <Settings size={18} /> {t('Shipping', 'أسعار الشحن')}
          </button>
          <button onClick={() => setActiveTab('categories')} className="admin-tab-btn" style={{ background: activeTab === 'categories' ? 'var(--primary-800)' : 'transparent', color: activeTab === 'categories' ? 'var(--white)' : 'var(--primary-800)' }}>
            <Layers size={18} /> {t('Categories', 'الأقسام')}
          </button>
        </div>
      )}

      {!isFormOpen ? (
        activeTab === 'orders' ? (
          <AdminOrdersPanel orders={orders} setOrders={setOrders} loadingOrders={loadingOrders} onRefresh={fetchOrders} />
        ) : activeTab === 'shipping' || activeTab === 'categories' ? (
          <AdminSettingsPanel 
            activeTab={activeTab}
            dbLiveCategories={dbLiveCategories}
            dbShippingRows={dbShippingRows}
            fetchStoreCategories={fetchStoreCategories}
            fetchShippingMatrix={fetchShippingMatrix}
          />
        ) : (
          <>
            <div className="admin-header">
              <h2>{t('Homiyaa Admin', 'إدارة المنتجات')}</h2>
              <button onClick={openAddMode} className="add-btn">
                <Plus size={18} /> {t('New Product', 'منتج جديد')}
              </button>
            </div>

            <div className="admin-filter-bar">
              <div className="filter-select-wrapper">
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                  <option value="all">{t('All Categories', 'جميع الأقسام')}</option>
                  {dbLiveCategories.map(cat => (
                    <option key={cat.id} value={cat.name_en.toLowerCase()}>{cat.name_en} / {cat.name_ar}</option>
                  ))}
                </select>
              </div>

              <div className="filter-select-wrapper">
                <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)}>
                  <option value="latest">{t('Latest Added', 'المضاف حديثاً')}</option>
                  <option value="price-asc">{t('Price: Low to High', 'السعر: من الأقل للأعلى')}</option>
                  <option value="price-desc">{t('Price: High to Low', 'السعر: من الأعلى للأقل')}</option>
                </select>
              </div>
            </div>

            <div className="product-admin-grid">
              {processedProducts.map((p: Product) => (
                <AdminProductCard key={p.id} p={p} onEdit={openEditMode} onDelete={handleDeleteProduct} />
              ))}
            </div>
          </>
        )
      ) : (
        <form onSubmit={handleSaveProduct} className="product-form">
          <div className="form-header">
            <h3>{editMode ? t('Edit Product', 'تعديل المنتج') : t('Add Product', 'اضافة منتج جديدة')}</h3>
          </div>

          <div className="form-grid">
            <div className="field">
              <label>Product Name (EN)</label>
              <input type="text" required value={formData.name_en} onChange={e => setFormData({ ...formData, name_en: e.target.value })} />
            </div>
            <div className="field">
              <label>اسم المنتج (بالعربي)</label>
              <input type="text" required value={formData.name_ar} onChange={e => setFormData({ ...formData, name_ar: e.target.value })} />
            </div>

            <div className="field full-width">
              <label>Select Category Lookup Channel</label>
              <select 
                className="admin-dropdown" 
                required 
                value={formData.category_en || ''}
                onChange={e => {
                  const matched = dbLiveCategories.find(c => c.name_en === e.target.value);
                  setFormData({
                    ...formData,
                    category_en: e.target.value,
                    category_ar: matched ? matched.name_ar : ''
                  });
                }}
              >
                <option value="" disabled>Choose Category Option...</option>
                {dbLiveCategories.map(cat => (
                  <option key={cat.id} value={cat.name_en}>{cat.name_en} / {cat.name_ar}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Price (EGP)</label>
              <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value === '' ? '' : Number(e.target.value) })} />
            </div>
            <div className="field">
              <label>Discount Price</label>
              <input type="number" step="0.01" value={formData.discount_price ?? ''} onChange={e => setFormData({ ...formData, discount_price: e.target.value === '' ? '' : Number(e.target.value) })} />
            </div>
            <div className="field full-width">
              <label> Stock Count</label>
              <input type="number" required value={formData.stock_quantity} onChange={e => setFormData({ ...formData, stock_quantity: e.target.value === '' ? '' : Number(e.target.value) })} />
            </div>

            <div className="field full-width">
              <label>Description (EN)</label>
              <textarea value={formData.description_en || ''} onChange={e => setFormData({ ...formData, description_en: e.target.value })} />
            </div>
            <div className="field full-width">
              <label>الوصف (بالعربي)</label>
              <textarea value={formData.description_ar || ''} onChange={e => setFormData({ ...formData, description_ar: e.target.value })} />
            </div>

            <div className="field full-width section-block">
              <span className="section-title"><Image size={16} /> Asset Media Manager</span>
              <input type="file" multiple accept="image/*" onChange={handleFileChange} />
              <ReactSortable list={formImages} setList={setFormImages} className="image-preview-grid" animation={200}>
                {formImages.map((img, idx) => (
                  <div key={img.id} className="image-preview-item">
                    <img src={img.url} alt="preview" />
                    <button type="button" className="img-delete-overlay" onClick={() => removeImage(img.id)}><X size={12} /></button>
                    <span className="image-order-badge">Slot {idx + 1}</span>
                  </div>
                ))}
              </ReactSortable>
            </div>

            <div className="field full-width section-block">
              <span className="section-title"><Palette size={16} /> Available Product Colors</span>
              <ReactSortable list={colors} setList={setColors} handle=".color-drag-handle">
                {colors.map(color => (
                  <div key={color.id} className="color-input-row-modern">
                    <div className="color-drag-handle" style={{ cursor: 'grab' }}><GripHorizontal size={16} /></div>
                    
                    <div className="color-text-inputs-inputs-wrapper">
                      <input type="text" placeholder="English Label" value={color.color_name_en} onChange={e => handleColorChange(color.id, 'color_name_en', e.target.value)} />
                      <input type="text" placeholder="اسم اللون بالعربي" value={color.color_name_ar} onChange={e => handleColorChange(color.id, 'color_name_ar', e.target.value)} />
                    </div>
                    
                    <div className="color-picker-and-delete">
                      <div className="color-picker-swatch-container">
                        <label className="color-swatch-label" style={{ backgroundColor: color.color_code }}>
                          <input type="color" className="hidden-color-input" value={color.color_code} onChange={e => handleColorChange(color.id, 'color_code', e.target.value)} />
                        </label>
                        <span className="color-code-text">{color.color_code}</span>
                      </div>
                      <button type="button" className="remove-color-row-btn" onClick={() => handleRemoveColorRow(color.id)}><Trash2 size={16} /></button>
                    </div>

                  </div>
                ))}
              </ReactSortable>
              <button type="button" onClick={handleAddColorRow} className="add-color-btn" style={{ marginTop: '0.5rem' }}>+ Add Color Row</button>
            </div>

            <div className="checkbox-field">
              <input type="checkbox" id="popular" checked={formData.is_popular} onChange={e => setFormData({ ...formData, is_popular: e.target.checked })} />
              <label htmlFor="popular">Feature in Popular Trends</label>
            </div>
            <div className="checkbox-field">
              <input type="checkbox" id="soldout" checked={formData.is_sold_out} onChange={e => setFormData({ ...formData, is_sold_out: e.target.checked })} />
              <label htmlFor="soldout">Out Of Stock</label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => setIsFormOpen(false)}>{t('Cancel', 'إلغاء')}</button>
            <button type="submit" className="save-submit-btn" disabled={isUploading}>{isUploading ? 'Saving...' : t('Save Product', 'حفظ المنتج')}</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminDashboard;