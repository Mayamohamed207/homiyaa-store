import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, ArrowLeft, FolderPlus, List, Image, Palette, Loader2, X, ClipboardList, Package, Trash2, Layers, ArrowUpDown } from 'lucide-react';
import { ReactSortable } from 'react-sortablejs'; 
import AdminProductCard from './AdminProductCard';
import AdminOrdersPanel, { CustomerOrder } from './AdminOrdersPanel';
import { Product } from '../../components/ProductCard/ProductCard';
import { useLanguage } from '../../context/LanguageContext';
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

interface ProductImageRelation {
  image_url: string;
}

type SortOption = 'latest' | 'price-asc' | 'price-desc' | 'low-stock';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

const initialFormState: ProductFormState = {
  name_en: '', name_ar: '', description_en: '', description_ar: '',
  price: '', discount_price: '', category_en: '', category_ar: '',
  stock_quantity: '', is_popular: false, is_sold_out: false,
};

interface AdminDashboardProps {
  externalCategoryFilter?: string; 
}

const AdminDashboard = ({ externalCategoryFilter }: AdminDashboardProps) => {
  const { t, isRtl, language } = useLanguage();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [formImages, setFormImages] = useState<UnifiedImage[]>([]);
  const [colors, setColors] = useState<ColorInput[]>([{ color_name_en: '', color_name_ar: '', color_code: '#000000' }]);
  const [formData, setFormData] = useState<ProductFormState>(initialFormState);

  // Global & Dropdown state controls
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) { 
      fetchProducts(); 
      fetchOrders(); 
    }
  }, [isAuthenticated]);

  // Handle all explicit global cross-component communications (Navbar, Footer, Tabs layout overrides)
  useEffect(() => {
    const handleGlobalSearch = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== undefined) {
        setAdminSearchQuery(customEvent.detail);
      }
    };

    const handleGlobalCategory = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setSelectedCategory(customEvent.detail.toLowerCase());
      }
    };

    const handleGlobalNavigation = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === 'products') {
        setActiveTab('products');
        setIsFormOpen(false); // Make sure form overlay collapses to see list immediately
      } else if (customEvent.detail === 'orders') {
        setActiveTab('orders');
        setIsFormOpen(false);
      }
    };

    window.addEventListener('adminSearchChanged', handleGlobalSearch);
    window.addEventListener('adminCategoryChanged', handleGlobalCategory);
    window.addEventListener('adminNavigateTo', handleGlobalNavigation);

    return () => {
      window.removeEventListener('adminSearchChanged', handleGlobalSearch);
      window.removeEventListener('adminCategoryChanged', handleGlobalCategory);
      window.removeEventListener('adminNavigateTo', handleGlobalNavigation);
    };
  }, []);

  // Backwards compatibility sync for standard React structural component trees 
  useEffect(() => {
    if (externalCategoryFilter) {
      setSelectedCategory(externalCategoryFilter.toLowerCase());
    }
  }, [externalCategoryFilter]);

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

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ADMIN_PASSWORD) {
      alert(t('Admin password is not configured. Set VITE_ADMIN_PASSWORD.', 'كلمة مرور المسؤول غير مهيأة في النظام.'));
      return;
    }
    if (password === ADMIN_PASSWORD) setIsAuthenticated(true);
    else alert(t('Incorrect password!', 'كلمة المرور غير صحيحة!'));
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
      prev.filter((img: UnifiedImage) => img.id === idToRemove).forEach((img: UnifiedImage) => {
        if (img.type === 'new') URL.revokeObjectURL(img.url);
      });
      return prev.filter((img: UnifiedImage) => img.id !== idToRemove);
    });
  };

  const handleAddColorRow = () =>
    setColors([...colors, { color_name_en: '', color_name_ar: '', color_code: '#000000' }]);

  const handleRemoveColorRow = (index: number) => {
    if (colors.length === 1) {
      setColors([{ color_name_en: '', color_name_ar: '', color_code: '#000000' }]);
    } else {
      setColors(colors.filter((_, i: number) => i !== index));
    }
  };

  const handleColorChange = (index: number, field: keyof ColorInput, value: string) => {
    const updated = [...colors];
    updated[index][field] = value;
    setColors(updated);
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
        if (error) throw new Error(`Database Update Error: ${error.message}`);
        await supabase.from('product_colors').delete().eq('product_id', productId);
      } else {
        const { data, error } = await supabase.from('products').insert([cleanPayload]).select();
        if (error) throw new Error(`Database Insert Error: ${error.message}`);
        if (!data || data.length === 0) throw new Error('No data returned from database.');
        productId = data[0].id;
      }

      if (productId) {
        await supabase.from('product_images').delete().eq('product_id', productId);
        const finalImageRows: { product_id: number; image_url: string; display_order: number }[] = [];

        for (let i = 0; i < formImages.length; i++) {
          const imgItem = formImages[i];
          if (imgItem.type === 'existing') {
            finalImageRows.push({ product_id: productId, image_url: imgItem.url, display_order: i });
          } else if (imgItem.type === 'new' && imgItem.file) {
            const file = imgItem.file;
            const fileExtension = file.name.split('.').pop();
            const fileName = `${productId}_${Date.now()}_${i}.${fileExtension}`;
            const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);
            if (uploadError) throw new Error(`Storage Upload Error: ${uploadError.message}`);
            const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
            if (!publicUrlData?.publicUrl) throw new Error('Could not get public URL.');
            finalImageRows.push({ product_id: productId, image_url: publicUrlData.publicUrl, display_order: i });
          }
        }

        if (finalImageRows.length > 0) {
          const { error: imgError } = await supabase.from('product_images').insert(finalImageRows);
          if (imgError) throw new Error(`Image Linking Error: ${imgError.message}`);
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
        const { error: colorError } = await supabase.from('product_colors').insert(colorRows);
        if (colorError) throw new Error(`Color Insert Error: ${colorError.message}`);
      }

      formImages.forEach((img: UnifiedImage) => { if (img.type === 'new') URL.revokeObjectURL(img.url); });
      setIsFormOpen(false);
      setFormImages([]);
      setColors([{ color_name_en: '', color_name_ar: '', color_code: '#000000' }]);
      fetchProducts();
      alert(t('Product saved successfully! ✅', 'تم حفظ المنتج بنجاح! ✅'));
    } catch (err: any) {
      alert(`Error: ${err.message || err}`);
    } finally {
      setIsUploading(false);
    }
  };

  const closeForm = () => {
    formImages.forEach((img: UnifiedImage) => { if (img.type === 'new') URL.revokeObjectURL(img.url); });
    setIsFormOpen(false);
  };

  const openAddMode = () => {
    setEditMode(false);
    setIsCustomCategory(false);
    setFormData(initialFormState);
    setFormImages([]);
    setColors([{ color_name_en: '', color_name_ar: '', color_code: '#000000' }]);
    setIsFormOpen(true);
  };

  const openEditMode = async (product: Product) => {
    setEditMode(true);
    setIsCustomCategory(false);
    
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

    setFormImages((product.product_images || []).map((img: ProductImageRelation, index: number) => ({
      id: `existing-${index}-${Math.random()}`,
      type: 'existing' as const,
      url: img.image_url,
    })));

    if (product.id) {
      const { data: fetchedColors, error } = await supabase
        .from('product_colors')
        .select('color_name_en, color_name_ar, color_code')
        .eq('product_id', product.id);

      if (!error && fetchedColors && fetchedColors.length > 0) {
        setColors(fetchedColors.map(c => ({
          color_name_en: c.color_name_en || '',
          color_name_ar: c.color_name_ar || '',
          color_code: c.color_code || '#000000'
        })));
      } else {
        setColors([{ color_name_en: '', color_name_ar: '', color_code: '#000000' }]);
      }
    } else {
      setColors([{ color_name_en: '', color_name_ar: '', color_code: '#000000' }]);
    }
    setIsFormOpen(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm(t('Are you sure you want to delete this product?', 'هل أنت متأكد من حذف هذا المنتج؟'))) {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
    }
  };

  const dbCategories = useMemo(() => {
    const categoriesMap = new Map<string, string>();
    products.forEach(p => {
      if (p.category_en && p.category_ar) {
        categoriesMap.set(p.category_en.trim(), language === 'ar' ? p.category_ar.trim() : p.category_en.trim());
      }
    });
    return Array.from(categoriesMap.entries()).map(([enVal, localizedLabel]) => ({ value: enVal, label: localizedLabel }));
  }, [products, language]);

  const processedProducts = useMemo(() => {
    let result = [...products];

    // 1. Live Categorization filtration array checks
    if (selectedCategory !== 'all') {
      result = result.filter(item => item.category_en.toLowerCase() === selectedCategory.toLowerCase());
    }

    // 2. Navbar Query Text Input matching filter checks
    if (adminSearchQuery.trim() !== '') {
      const searchLower = adminSearchQuery.toLowerCase().trim();
      result = result.filter(item => 
        item.name_en.toLowerCase().includes(searchLower) ||
        item.name_ar.toLowerCase().includes(searchLower) ||
        (item.description_en && item.description_en.toLowerCase().includes(searchLower)) ||
        (item.description_ar && item.description_ar.toLowerCase().includes(searchLower)) ||
        item.category_en.toLowerCase().includes(searchLower) ||
        item.category_ar.toLowerCase().includes(searchLower)
      );
    }

    // 3. Sorting Engine Configurations
    result.sort((a, b) => {
      const priceA = a.discount_price ?? a.price;
      const priceB = b.discount_price ?? b.price;
      
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'low-stock') return (Number(a.stock_quantity) || 0) - (Number(b.stock_quantity) || 0);
      return b.id - a.id; 
    });

    return result;
  }, [products, selectedCategory, sortBy, adminSearchQuery]);

  if (!isAuthenticated) {
    return (
      <div className="admin-lock-screen" dir={isRtl ? 'rtl' : 'ltr'}>
        <form onSubmit={handlePasswordSubmit} className="lock-card">
          <h3>{t('Homiyaa Admin', 'ادمن هوميا')}</h3>
          <input
            type="password"
            placeholder={t('Enter Admin Password', 'أدخل كلمة مرور الادمن')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button type="submit">{t('Unlock Admin Page', 'فتح صفحة الادمن')}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-container" dir={isRtl ? 'rtl' : 'ltr'}>
      {!isFormOpen && (
        <div className="admin-tabs">
          <button
            onClick={() => {
              setActiveTab('products');
              window.dispatchEvent(new CustomEvent('adminNavigateTo', { detail: 'products' }));
            }}
            className="admin-tab-btn"
            style={{
              background: activeTab === 'products' ? '#0f172a' : 'none',
              color: activeTab === 'products' ? '#fff' : '#475569',
            }}
          >
            <Package size={18} /> {t('Products Inventory', 'مخزون المنتجات')} ({processedProducts.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('orders');
              window.dispatchEvent(new CustomEvent('adminNavigateTo', { detail: 'orders' }));
            }}
            className="admin-tab-btn"
            style={{
              background: activeTab === 'orders' ? '#0f172a' : 'none',
              color: activeTab === 'orders' ? '#fff' : '#475569',
            }}
          >
            <ClipboardList size={18} /> {t('Customer Orders Log', 'سجل طلبات العملاء')} ({orders.length})
          </button>
        </div>
      )}

      {adminSearchQuery && !isFormOpen && (
        <div className="search-query-indicator" style={{ padding: '0.5rem 1rem', background: '#f1f5f9', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem' }}>
          <span>{t('Showing results for:', 'نتائج البحث عن:')} <strong>"{adminSearchQuery}"</strong></span>
          <button onClick={() => { setAdminSearchQuery(''); window.dispatchEvent(new CustomEvent('adminSearchChanged', { detail: '' })); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 'bold' }}>{t('Clear Search', 'إلغاء البحث')}</button>
        </div>
      )}

      {!isFormOpen ? (
        activeTab === 'orders' ? (
          <AdminOrdersPanel orders={orders} setOrders={setOrders} loadingOrders={loadingOrders} onRefresh={fetchOrders} />
        ) : (
          <>
            <div className="admin-header">
              <h2>{t('Homiyaa Control Panel', 'لوحة التحكم وإدارة المنتجات')}</h2>
              <button onClick={openAddMode} className="add-btn"><Plus size={18} /> {t('Add New Product', 'إضافة منتج جديد')}</button>
            </div>

            {/* Combined Admin Side-by-Side Filter Bar */}
            <div className="admin-filter-bar">
              <div className="filter-select-wrapper">
                <Layers size={15} className="select-icon" />
                <select value={selectedCategory} onChange={e => {
                  setSelectedCategory(e.target.value);
                  window.dispatchEvent(new CustomEvent('adminCategoryChanged', { detail: e.target.value }));
                }}>
                  <option value="all">{t('All Categories', 'جميع الأقسام')}</option>
                  {dbCategories.map(cat => (
                    <option key={cat.value} value={cat.value.toLowerCase()}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="filter-select-wrapper">
                <ArrowUpDown size={15} className="select-icon" />
                <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)}>
                  <option value="latest">{t('Latest Added', 'المضاف حديثاً')}</option>
                  <option value="price-asc">{t('Price: Low to High', 'السعر: من الأقل للأعلى')}</option>
                  <option value="price-desc">{t('Price: High to Low', 'السعر: من الأعلى للأقل')}</option>
                  <option value="low-stock">{t('Critical Low Stock', 'المنخفض في المخزن أولاً')}</option>
                </select>
              </div>
            </div>

            {processedProducts.length === 0 ? (
              <div className="admin-empty-state">
                <p>{t('No items match your filters.', 'لا توجد عناصر تطابق تصفية البحث الحالية.')}</p>
              </div>
            ) : (
              <div className="product-admin-grid">
                {processedProducts.map((p: Product) => (
                  <AdminProductCard key={p.id} p={p} onEdit={openEditMode} onDelete={handleDeleteProduct} />
                ))}
              </div>
            )}
          </>
        )
      ) : (
        <form onSubmit={handleSaveProduct} className="product-form">
          <div className="form-header">
            <button type="button" onClick={closeForm} className="back-btn" disabled={isUploading}>
              <ArrowLeft size={16} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} /> {t('Back', 'رجوع')}
            </button>
            <h3>{editMode ? t('Edit Product Configuration', 'تعديل بيانات المنتج') : t('Create Complete Product Listing', 'إنشاء قائمة منتج جديدة')}</h3>
          </div>

          <div className="form-grid">
            <div className="field">
              <label>{t('Product Name (EN) *', 'اسم المنتج (بالإنجليزي) *')}</label>
              <input type="text" required disabled={isUploading} value={formData.name_en} onChange={e => setFormData({ ...formData, name_en: e.target.value })} />
            </div>

            <div className="field">
              <label>{t('Product Name (AR) *', 'اسم المنتج (بالعربي) *')}</label>
              <input type="text" required disabled={isUploading} value={formData.name_ar} onChange={e => setFormData({ ...formData, name_ar: e.target.value })} dir="rtl" />
            </div>

            <div className="field full-width">
              <div className="category-label-row">
                <label>{isCustomCategory ? t('Custom Category Setup *', 'إعداد قسم مخصص *') : t('Assigned Product Category *', 'قسم المنتج الحالي *')}</label>
                <button type="button" className="category-toggle-btn" onClick={() => setIsCustomCategory(!isCustomCategory)}>
                  {isCustomCategory ? <List size={14} /> : <FolderPlus size={14} />}
                  {isCustomCategory ? t('Pick Existing', 'اختر من الأقسام الحالية') : t('Define Brand New Category', 'إنشاء قسم جديد تماماً')}
                </button>
              </div>

              {!isCustomCategory ? (
                <select className="admin-dropdown" required disabled={isUploading} value={formData.category_en || ''}
                  onChange={e => {
                    const selectedEn = e.target.value;
                    const matched = dbCategories.find(c => c.value === selectedEn);
                    setFormData({ 
                      ...formData, 
                      category_en: selectedEn, 
                      category_ar: matched ? matched.label : '' 
                    });
                  }}>
                  <option value="" disabled>{t('Select from live store channels...', 'اختر القسم من تصنيفات المتجر...')}</option>
                  {dbCategories.map((cat, idx) => (
                    <option key={idx} value={cat.value}>
                      {cat.label} / {cat.value}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="custom-category-inputs">
                  <input type="text" placeholder={t('Category Name English', 'اسم القسم بالإنجليزي')} required disabled={isUploading} value={formData.category_en} onChange={e => setFormData({ ...formData, category_en: e.target.value })} />
                  <input type="text" placeholder={t('Category Name Arabic', 'اسم القسم بالعربي')} required disabled={isUploading} value={formData.category_ar} onChange={e => setFormData({ ...formData, category_ar: e.target.value })} dir="rtl" />
                </div>
              )}
            </div>

            <div className="field">
              <label>{t('Base Retail Price (EGP) *', 'سعر التجزئة الأساسي (ج.م) *')}</label>
              <input 
                type="number" 
                step="0.01" 
                required 
                disabled={isUploading} 
                value={formData.price} 
                onChange={e => setFormData({ 
                  ...formData, 
                  price: e.target.value === '' ? '' : Number(e.target.value) 
                })} 
              />
            </div>

            <div className="field">
              <label>{t('Markdown Campaign Price (EGP - Optional)', 'السعر بعد التخفيض (ج.م - اختياري)')}</label>
              <input 
                type="number" 
                step="0.01" 
                disabled={isUploading} 
                value={formData.discount_price ?? ''} 
                onChange={e => setFormData({ 
                  ...formData, 
                  discount_price: e.target.value === '' ? '' : Number(e.target.value) 
                })} 
              />
            </div>

            <div className="field full-width">
              <label>{t('Physical Warehouse Stock Count *', 'كمية المخزون الفعلي في المخزن *')}</label>
              <input 
                type="number" 
                required 
                disabled={isUploading} 
                value={formData.stock_quantity} 
                onChange={e => setFormData({ 
                  ...formData, 
                  stock_quantity: e.target.value === '' ? '' : Number(e.target.value) 
                })} 
              />
            </div>

            <div className="field full-width section-block">
              <span className="section-title"><Image size={16} /> {t('Asset Media Manager', 'إدارة صور المنتج')}</span>
              <p className="file-hint-text">{t('Hold and drag thumbnails below to rearrange priority listing sequence.', 'اضغط واسحب الصور المصغرة بالأسفل لترتيب تسلسل العرض للعملاء.')}</p>
              <input type="file" id="bulk-image-uploader" multiple accept="image/*" className="file-upload-picker" disabled={isUploading} onChange={handleFileChange} />
              
              <ReactSortable
                list={formImages}
                setList={(newState) => setFormImages(newState)}
                animation={200}
                delay={10}
                delayOnTouchOnly={false}
                className="image-preview-grid"
                ghostClass="sortable-ghost"
                chosenClass="drag-selected-item"
              >
                {formImages.map((img: UnifiedImage, index: number) => (
                  <div key={img.id} className="image-preview-item" style={{ cursor: 'grab' }}>
                    <img src={img.url} alt="Listing setup view" draggable={false} style={{ pointerEvents: 'none' }} />
                    <button type="button" className="img-delete-overlay" onClick={(e) => { e.stopPropagation(); removeImage(img.id); }} disabled={isUploading} title="Remove image">
                      <X size={12} />
                    </button>
                    <span className="image-order-badge">{t('Slot', 'موقع رقم')} {index + 1}</span>
                  </div>
                ))}
              </ReactSortable>
            </div>

            <div className="field full-width section-block">
              <span className="section-title"><Palette size={16} /> {t('Attribute Variations (Colors - Optional)', 'تخصيص الألوان المتاحة (اختياري)')}</span>
              {colors.map((color: ColorInput, index: number) => (
                <div key={index} className="color-input-row-modern">
                  <div className="color-text-inputs-inputs-wrapper">
                    <input type="text" placeholder={t('English Label', 'اسم اللون بالإنجليزي')} disabled={isUploading} value={color.color_name_en} onChange={e => handleColorChange(index, 'color_name_en', e.target.value)} />
                    <input type="text" placeholder={t('Arabic Label', 'اسم اللون بالعربي')} disabled={isUploading} value={color.color_name_ar} onChange={e => handleColorChange(index, 'color_name_ar', e.target.value)} dir="rtl" />
                  </div>
                  <div className="color-picker-swatch-container">
                    <label className="color-swatch-label" style={{ backgroundColor: color.color_code || '#000000' }}>
                      <input type="color" className="hidden-color-input" disabled={isUploading} value={color.color_code || '#000000'} onChange={e => handleColorChange(index, 'color_code', e.target.value)} />
                    </label>
                    <span className="color-code-text">{color.color_code.toUpperCase()}</span>
                  </div>
                  <button type="button" className="remove-color-row-btn" onClick={() => handleRemoveColorRow(index)} disabled={isUploading}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <div style={{ marginTop: '1rem' }}>
                <button type="button" className="add-color-btn" onClick={handleAddColorRow} disabled={isUploading}>
                  {t('+ Add Variant Row', '+ إضافة لون جديد')}
                </button>
              </div>
            </div>

            <div className="field full-width">
              <label>{t('Description (EN)', 'الوصف (بالإنجليزي)')}</label>
              <textarea disabled={isUploading} value={formData.description_en || ''} onChange={e => setFormData({ ...formData, description_en: e.target.value })} />
            </div>

            <div className="field full-width">
              <label>{t('Description (AR)', 'الوصف (بالعربي)')}</label>
              <textarea disabled={isUploading} value={formData.description_ar || ''} onChange={e => setFormData({ ...formData, description_ar: e.target.value })} dir="rtl" />
            </div>

            <div className="checkbox-field">
              <input type="checkbox" id="popular" disabled={isUploading} checked={formData.is_popular} onChange={e => setFormData({ ...formData, is_popular: e.target.checked })} />
              <label htmlFor="popular">{t('Feature in Popular Trends', 'إضافة إلى المنتجات الأكثر رواجاً')}</label>
            </div>
            
            <div className="checkbox-field">
              <input type="checkbox" id="soldout" disabled={isUploading} checked={formData.is_sold_out} onChange={e => setFormData({ ...formData, is_sold_out: e.target.checked })} />
              <label htmlFor="soldout">{t('Out Of Stock', 'نفد من المخزون')}</label>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-submit-btn" disabled={isUploading}>
              {isUploading ? (
                <span className="loading-spinner-wrapper"><Loader2 className="spinner" size={18} /> {t('Saving...', 'جاري الحفظ...')}</span>
              ) : (
                t('Save Product', 'حفظ المنتج')
              )}
            </button>
            <button type="button" className="cancel-btn" onClick={closeForm} disabled={isUploading}>{t('Cancel', 'إلغاء')}</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminDashboard;