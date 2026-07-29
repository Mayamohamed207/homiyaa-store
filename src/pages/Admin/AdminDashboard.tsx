import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Plus, Image, Palette, X, ClipboardList, Package, Trash2, Settings, Layers, GripHorizontal, BarChart2, Tag } from 'lucide-react';
import { ReactSortable } from 'react-sortablejs';
import AdminProductCard from './AdminProductCard';
import AdminOrdersPanel, { CustomerOrder } from './AdminOrdersPanel';
import AdminSettingsPanel, { DbCategoryRecord, DbShippingRecord } from './AdminSettingsPanel';
import { Product } from '../../components/ProductCard/ProductCard';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import AdminUsagePanel from './AdminUsagePanel';
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
  is_new_arrival?: boolean;
  is_sold_out: boolean;
  product_images?: { image_url: string }[];
  product_colors?: { color_code: string; color_name_en: string; color_name_ar: string }[];
}

interface ColorInput {
  id: string;
  color_name_en: string;
  color_name_ar: string;
  color_code: string;
  // Which uploaded image (by its local UnifiedImage.id) this color should jump to when clicked.
  // null      = not explicitly set -> falls back to the old "color N -> image N+1" behavior
  //             so existing products keep working exactly as before, untouched.
  // 'NONE'    = admin explicitly said "this color has no image of its own"
  // a real id = explicitly linked to that image
  linked_image_id?: string | null;
}

interface VariantInput {
  id: string;
  variant_name_en: string;
  variant_name_ar: string;
  price: number | '';
}

interface UnifiedImage {
  id: string;
  type: 'existing' | 'new';
  url: string;
  file?: File;
} 

type SortOption = 'latest' | 'price-asc' | 'price-desc' | 'low-stock';
type ActiveTabOption = 'products' | 'orders' | 'shipping' | 'categories' | 'usage';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const ADMIN_EMAILS = ['admin@homiyaa.com', 'HomiyaaStore@gmail.com', 'mayamohamed364@gmail.com', 'hussein70mohamedeg@gmail.com'];

const initialFormState: ProductFormState = {
  name_en: '', name_ar: '', description_en: '', description_ar: '',
  price: '', discount_price: '', category_en: '', category_ar: '',
  stock_quantity: '', is_popular: false, is_sold_out: false, is_new_arrival: false,
};

const emptyColor = (): ColorInput => ({
  id: `c-${Date.now()}-${Math.random()}`,
  color_name_en: '',
  color_name_ar: '',
  color_code: '#000000',
  linked_image_id: null,
});

const emptyVariant = (): VariantInput => ({
  id: `v-${Date.now()}-${Math.random()}`,
  variant_name_en: '',
  variant_name_ar: '',
  price: '',
});

const AdminDashboard = ({ externalCategoryFilter }: { externalCategoryFilter?: string }) => {
  const { t, isRtl } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── State ──
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
  const [colors, setColors] = useState<ColorInput[]>([emptyColor()]);
  const [variants, setVariants] = useState<VariantInput[]>([emptyVariant()]);
  const [formData, setFormData] = useState<ProductFormState>(initialFormState);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [dbLiveCategories, setDbLiveCategories] = useState<DbCategoryRecord[]>([]);
  const [dbShippingRows, setDbShippingRows] = useState<DbShippingRecord[]>([]);

  const isAdmin = !!(user?.email && ADMIN_EMAILS.includes(user.email));

  // ── Effects ──

  useEffect(() => {
    if (user !== null && !isAdmin) {
      navigate('/');
      toast.error(t('Access denied.', 'غير مصرح لك بالدخول.'));
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (isAdmin) setIsAuthenticated(true);
  }, [isAdmin]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
      fetchOrders();
      fetchStoreCategories();
      fetchShippingMatrix();
    }
  }, [isAuthenticated]);

  // ── Fetchers ──

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, product_images(image_url), product_colors(color_code, color_name_en, color_name_ar, image_index)')
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

  // ── Image handlers ──

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
    // Any color that was explicitly linked to this image goes back to "not set" (auto)
    setColors(prev => prev.map(c => c.linked_image_id === idToRemove ? { ...c, linked_image_id: null } : c));
  };

  // ── Color handlers ──

  const handleAddColorRow = () => setColors(prev => [...prev, emptyColor()]);

  const handleRemoveColorRow = (id: string) => {
    setColors(prev => {
      if (prev.length === 1) return [emptyColor()];
      return prev.filter(c => c.id !== id);
    });
  };

  const handleColorChange = (id: string, field: keyof Omit<ColorInput, 'id'>, value: string) => {
    setColors(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleColorImageLink = (colorId: string, imageId: string | null) => {
    setColors(prev => prev.map(c => c.id === colorId ? { ...c, linked_image_id: imageId } : c));
  };

  // ── Variant handlers ──

  const handleAddVariantRow = () => setVariants(prev => [...prev, emptyVariant()]);

  const handleRemoveVariantRow = (id: string) => {
    setVariants(prev => {
      if (prev.length === 1) return [emptyVariant()];
      return prev.filter(v => v.id !== id);
    });
  };

 const handleVariantChange = (id: string, field: keyof Omit<VariantInput, 'id'>, value: string) => {
    setVariants(prev => prev.map(v => {
      if (v.id !== id) return v;
      if (field === 'price') {
        return { ...v, price: value === '' ? '' : Number(value) };
      }
      return { ...v, [field]: value };
    }));
  };

  // ── Form payload ──

  const getCleanPayload = () => {
    const payload = { ...formData } as any;
    delete payload.id;
    delete payload.product_images;
    delete payload.product_colors;
    payload.price = payload.price === '' ? 0 : Number(payload.price);
    payload.stock_quantity = payload.stock_quantity === '' ? 0 : Number(payload.stock_quantity);
    payload.discount_price =
      payload.discount_price === '' || payload.discount_price === null
        ? null
        : Number(payload.discount_price);
    return payload;
  };

  // ── Save product ──

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;
    setIsUploading(true);

    try {
      let productId = formData.id;
      const cleanPayload = getCleanPayload();

      if (editMode && productId) {
        // Update core product row
        const { error } = await supabase.from('products').update(cleanPayload).eq('id', productId);
        if (error) throw new Error(error.message);

        // Delete existing related rows — they'll all be re-inserted below
        await supabase.from('product_colors').delete().eq('product_id', productId);
        await supabase.from('product_variants').delete().eq('product_id', productId);
      } else {
        // Insert new product
        const { data, error } = await supabase.from('products').insert([cleanPayload]).select();
        if (error) throw new Error(error.message);
        productId = data[0].id;
      }

      if (!productId) throw new Error('No product ID after save');

      // ── Images ──
      await supabase.from('product_images').delete().eq('product_id', productId);
      const finalImageRows = [];
      // Maps each UnifiedImage's local session id -> the final position it ends up saved at,
      // so we can resolve each color's "linked_image_id" into a stable index below.
      const idToFinalIndex: Record<string, number> = {};

      for (let i = 0; i < formImages.length; i++) {
        const imgItem = formImages[i];
        idToFinalIndex[imgItem.id] = i;
        if (imgItem.type === 'existing') {
          finalImageRows.push({ product_id: productId, image_url: imgItem.url, display_order: i });
        } else if (imgItem.type === 'new' && imgItem.file) {
          const file = imgItem.file;
          const fileExtension = file.name.split('.').pop();
          const fileName = `${productId}_${Date.now()}_${i}.${fileExtension}`;
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, file);
          if (uploadError) throw uploadError;
          const { data: publicUrlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);
          finalImageRows.push({ product_id: productId, image_url: publicUrlData.publicUrl, display_order: i });
        }
      }

      if (finalImageRows.length > 0) {
        await supabase.from('product_images').insert(finalImageRows);
      }

      // ── Colors ──
      // FIX: only require at least one name field to be non-empty (not both)
      // A color row is "active" if the English name OR the Arabic name is filled
      const activeColors = colors.filter(
        c => c.color_name_en.trim() !== '' || c.color_name_ar.trim() !== ''
      );
      if (activeColors.length > 0) {
        const colorRows = activeColors.map((c, idx) => {
          let image_index: number | null = null;
          if (c.linked_image_id === 'NONE') {
            image_index = -1; // admin explicitly said this color has no image
          } else if (c.linked_image_id && idToFinalIndex[c.linked_image_id] !== undefined) {
            image_index = idToFinalIndex[c.linked_image_id]; // explicit pick
          }
          // else stays null -> old "color N -> image N+1" fallback, unchanged behavior
          return {
            product_id: productId,
            color_name_en: c.color_name_en.trim(),
            color_name_ar: c.color_name_ar.trim(),
            color_code: c.color_code.trim() || '#000000',
            display_order: idx,
            image_index,
          };
        });
        const { error: colorError } = await supabase.from('product_colors').insert(colorRows);
        if (colorError) throw new Error(`Colors save failed: ${colorError.message}`);
      }

   const activeVariants = variants.filter(
        v => v.variant_name_en.trim() !== '' || v.variant_name_ar.trim() !== ''
      );
      if (activeVariants.length > 0) {
        const variantRows = activeVariants.map((v, idx) => ({
          product_id: productId,
          variant_name_en: v.variant_name_en.trim(),
          variant_name_ar: v.variant_name_ar.trim(),
          price: v.price === '' ? null : Number(v.price),
          display_order: idx,
        }));
        const { error: variantError } = await supabase.from('product_variants').insert(variantRows);
        if (variantError) throw new Error(`Variants save failed: ${variantError.message}`);
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

  // ── Open form helpers ──

  const openAddMode = () => {
    setEditMode(false);
    setFormData(initialFormState);
    setFormImages([]);
    setColors([emptyColor()]);
    setVariants([emptyVariant()]);
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
      is_new_arrival: product.is_new_arrival ?? false,
    });

    const loadedImages = (product.product_images || []).map((img, index) => ({
      id: `existing-${index}-${Math.random()}`,
      type: 'existing' as const,
      url: img.image_url,
    }));
    setFormImages(loadedImages);

    // Fetch colors fresh from DB to avoid stale data
    const { data: fetchedColors, error: colorFetchError } = await supabase
      .from('product_colors')
      .select('*')
      .eq('product_id', product.id)
      .order('display_order', { ascending: true });

    if (colorFetchError) {
      toast.error('Failed to load colors');
      setColors([emptyColor()]);
    } else if (fetchedColors && fetchedColors.length > 0) {
      setColors(
        fetchedColors.map((c, i) => {
          let linked_image_id: string | null = null;
          if (c.image_index === -1) {
            linked_image_id = 'NONE';
          } else if (
            c.image_index !== null &&
            c.image_index !== undefined &&
            loadedImages[c.image_index]
          ) {
            linked_image_id = loadedImages[c.image_index].id;
          }
          // Older rows saved before this feature simply won't have image_index at all,
          // so linked_image_id stays null and the product card falls back to the
          // original "color N -> image N+1" behavior automatically.
          return {
            id: `c-existing-${i}-${Math.random()}`,
            color_name_en: c.color_name_en,
            color_name_ar: c.color_name_ar,
            color_code: c.color_code,
            linked_image_id,
          };
        })
      );
    } else {
      setColors([emptyColor()]);
    }

    // Fetch variants fresh from DB
    const { data: fetchedVariants, error: variantFetchError } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', product.id)
      .order('display_order', { ascending: true });

   if (variantFetchError) {
      toast.error('Failed to load variants');
      setVariants([emptyVariant()]);
    } else if (fetchedVariants && fetchedVariants.length > 0) {
      setVariants(
        fetchedVariants.map((v, i) => ({
          id: `v-existing-${i}-${Math.random()}`,
          variant_name_en: v.variant_name_en,
          variant_name_ar: v.variant_name_ar,
          price: v.price ?? '',
        }))
      );
    } else {
      setVariants([emptyVariant()]);
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
    if (selectedCategory !== 'all')
      result = result.filter(
        item => item.category_en.toLowerCase() === selectedCategory.toLowerCase()
      );
    result.sort((a, b) => {
      if (sortBy === 'price-asc') return (a.discount_price ?? a.price) - (b.discount_price ?? b.price);
      if (sortBy === 'price-desc') return (b.discount_price ?? b.price) - (a.discount_price ?? a.price);
      return b.id - a.id;
    });
    return result;
  }, [products, selectedCategory, sortBy]);

  // ── Password gate ──

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
          />
          <button type="submit">{t('Unlock Admin Page', 'فتح صفحة الادمن')}</button>
        </form>
      </div>
    );
  }

  // ── Main UI ──

  return (
    <div className="admin-container" dir={isRtl ? 'rtl' : 'ltr'}>
      {!isFormOpen && (
        <div className="admin-tabs">
          {(
            [
              { key: 'products', icon: <Package size={18} />, label: t('Products', 'المنتجات') },
              { key: 'orders', icon: <ClipboardList size={18} />, label: t('Orders', 'الطلبات') },
              { key: 'shipping', icon: <Settings size={18} />, label: t('Shipping', 'أسعار الشحن') },
              { key: 'categories', icon: <Layers size={18} />, label: t('Categories', 'الأقسام') },
              { key: 'usage', icon: <BarChart2 size={18} />, label: t('Usage', 'الاستخدام') },
            ] as { key: ActiveTabOption; icon: React.ReactNode; label: string }[]
          ).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="admin-tab-btn"
              style={{
                background: activeTab === tab.key ? 'var(--primary-800)' : 'transparent',
                color: activeTab === tab.key ? 'var(--white)' : 'var(--primary-800)',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      )}

      {!isFormOpen ? (
        activeTab === 'orders' ? (
          <AdminOrdersPanel
            orders={orders}
            setOrders={setOrders}
            loadingOrders={loadingOrders}
            onRefresh={fetchOrders}
          />
        ) : activeTab === 'usage' ? (
          <AdminUsagePanel />
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
                    <option key={cat.id} value={cat.name_en.toLowerCase()}>
                      {cat.name_en} / {cat.name_ar}
                    </option>
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
        /* ─────────────────── PRODUCT FORM ─────────────────── */
        <form onSubmit={handleSaveProduct} className="product-form">
          <div className="form-header">
            <h3>
              {editMode ? t('Edit Product', 'تعديل المنتج') : t('Add Product', 'اضافة منتج جديدة')}
            </h3>
          </div>

          <div className="form-grid">
            {/* Names — kept single-language since each input IS a specific language field */}
            <div className="field">
              <label>Product Name (EN)</label>
              <input
                type="text"
                required
                value={formData.name_en}
                onChange={e => setFormData({ ...formData, name_en: e.target.value })}
              />
            </div>
            <div className="field">
              <label>اسم المنتج (بالعربي)</label>
              <input
                type="text"
                required
                value={formData.name_ar}
                onChange={e => setFormData({ ...formData, name_ar: e.target.value })}
              />
            </div>

            {/* Category */}
            <div className="field full-width">
              <label>{t('Select Category', 'اختر القسم')}</label>
              <select
                className="admin-dropdown"
                required
                value={formData.category_en || ''}
                onChange={e => {
                  const matched = dbLiveCategories.find(c => c.name_en === e.target.value);
                  setFormData({
                    ...formData,
                    category_en: e.target.value,
                    category_ar: matched ? matched.name_ar : '',
                  });
                }}
              >
                <option value="" disabled>{t('Choose Category Option...', 'اختر قسم...')}</option>
                {dbLiveCategories.map(cat => (
                  <option key={cat.id} value={cat.name_en}>
                    {cat.name_en} / {cat.name_ar}
                  </option>
                ))}
              </select>
            </div>

            {/* Pricing */}
            <div className="field">
              <label>{t('Price (EGP)', 'السعر (ج.م)')}</label>
              <input
                type="number"
                step="1"
                required
                value={formData.price}
                onChange={e =>
                  setFormData({ ...formData, price: e.target.value === '' ? '' : Number(e.target.value) })
                }
              />
            </div>
            <div className="field">
              <label>{t('Price After Discount', 'السعر بعد الخصم')}</label>
              <input
                type="number"
                step="1"
                value={formData.discount_price ?? ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    discount_price: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="field full-width">
              <label>{t('Stock Count', 'الكمية بالمخزون')}</label>
              <input
                type="number"
                step="1"
                required
                value={formData.stock_quantity}
                onChange={e =>
                  setFormData({
                    ...formData,
                    stock_quantity: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
              />
            </div>

            {/* Descriptions — kept single-language since each input IS a specific language field */}
            <div className="field full-width">
              <label>Description (EN)</label>
              <textarea
                value={formData.description_en || ''}
                onChange={e => setFormData({ ...formData, description_en: e.target.value })}
              />
            </div>
            <div className="field full-width">
              <label>الوصف (بالعربي)</label>
              <textarea
                value={formData.description_ar || ''}
                onChange={e => setFormData({ ...formData, description_ar: e.target.value })}
              />
            </div>

            {/* ── Images ── */}
            <div className="field full-width section-block">
              <span className="section-title"><Image size={16} /> {t('Asset Media Manager', 'إدارة صور المنتج')}</span>
              <input type="file" multiple accept="image/*" onChange={handleFileChange} />
              <ReactSortable
                list={formImages}
                setList={setFormImages}
                className="image-preview-grid"
                animation={200}
                forceFallback={true}
                fallbackTolerance={5}
                delay={150}
                delayOnTouchOnly={true}
              >
                {formImages.map((img, idx) => (
                  <div key={img.id} className="image-preview-item">
                    <img src={img.url} alt="preview" />
                    <button
                      type="button"
                      className="img-delete-overlay"
                      onClick={() => removeImage(img.id)}
                    >
                      <X size={12} />
                    </button>
                    <span className="image-order-badge">{t('Slot', 'الصورة')} {idx + 1}</span>
                  </div>
                ))}
              </ReactSortable>
            </div>

            {/* ── Colors ── */}
            <div className="field full-width section-block">
              <span className="section-title"><Palette size={16} /> {t('Available Product Colors', 'ألوان المنتج المتاحة')}</span>
              <p style={{ fontSize: '0.78rem', color: 'var(--primary-500)', marginBottom: '0.5rem' }}>
                {t('Leave all rows blank if this product has no color options.', 'اتركي كل الصفوف فاضية لو المنتج مفيهوش ألوان.')}
              </p>
              <ReactSortable list={colors} setList={setColors} handle=".color-drag-handle">
                {colors.map(color => (
                  <div key={color.id} className="color-input-row-modern">
                    <div className="color-drag-handle" style={{ cursor: 'grab' }}>
                      <GripHorizontal size={16} />
                    </div>
                    <div className="color-text-inputs-inputs-wrapper">
                      <input
                        type="text"
                        placeholder={t('English Label', 'الاسم بالإنجليزي')}
                        value={color.color_name_en}
                        onChange={e => handleColorChange(color.id, 'color_name_en', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder={t('Arabic Label', 'اسم اللون بالعربي')}
                        value={color.color_name_ar}
                        onChange={e => handleColorChange(color.id, 'color_name_ar', e.target.value)}
                      />
                    </div>
                    <div className="color-picker-and-delete">
                      <div className="color-picker-swatch-container">
                        <label
                          className="color-swatch-label"
                          style={{ backgroundColor: color.color_code }}
                        >
                          <input
                            type="color"
                            className="hidden-color-input"
                            value={color.color_code}
                            onChange={e => handleColorChange(color.id, 'color_code', e.target.value)}
                          />
                        </label>
                        <span className="color-code-text">{color.color_code}</span>
                      </div>
                      <button
                        type="button"
                        className="remove-color-row-btn"
                        onClick={() => handleRemoveColorRow(color.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* ── Link this color to one specific photo ── */}
                    {formImages.length > 0 && (
                      <div className="color-image-link-picker">
                        <span className="color-image-link-label">
                          {t('Photo for this color:', 'صورة هذا اللون:')}
                        </span>
                        <div className="color-image-link-thumbs">
                          <button
                            type="button"
                            className={`color-image-link-none ${!color.linked_image_id ? 'active' : ''}`}
                            onClick={() => handleColorImageLink(color.id, null)}
                            title={t('Auto (matches old default order)', 'تلقائي (حسب الترتيب الافتراضي القديم)')}
                          >
                            {t('Auto', 'تلقائي')}
                          </button>
                          {formImages.map((img, imgIdx) => (
                            <button
                              type="button"
                              key={img.id}
                              className={`color-image-link-thumb ${color.linked_image_id === img.id ? 'active' : ''}`}
                              onClick={() => handleColorImageLink(color.id, img.id)}
                              title={t(`Photo ${imgIdx + 1}`, `الصورة ${imgIdx + 1}`)}
                            >
                              <img src={img.url} alt="" />
                            </button>
                          ))}
                          <button
                            type="button"
                            className={`color-image-link-none ${color.linked_image_id === 'NONE' ? 'active' : ''}`}
                            onClick={() => handleColorImageLink(color.id, 'NONE')}
                            title={t('This color has no photo of its own', 'هذا اللون بدون صورة خاصة به')}
                          >
                            {t('No Photo', 'بدون صورة')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </ReactSortable>
              <button
                type="button"
                onClick={handleAddColorRow}
                className="add-color-btn"
                style={{ marginTop: '0.5rem' }}
              >
                + {t('Add Color Row', 'إضافة لون جديد')}
              </button>
            </div>

            {/* ── Variants (with per-option price) ── */}
            <div className="field full-width section-block">
              <span className="section-title"><Tag size={16} /> {t('Product Variants / Options', 'خيارات المنتج')}</span>
              <p style={{ fontSize: '0.78rem', color: 'var(--primary-500)', marginBottom: '0.5rem' }}>
                {t(
                  'Use for sets, piece counts, shapes ..etc.',
                  'استخدمها للأطقم أو عدد القطع أو الأشكال.'
                )}
              </p>
              <ReactSortable list={variants} setList={setVariants} handle=".variant-drag-handle">
                {variants.map(variant => (
                  <div key={variant.id} className="color-input-row-modern">
                    <div className="variant-drag-handle color-drag-handle" style={{ cursor: 'grab' }}>
                      <GripHorizontal size={16} />
                    </div>
                    <div className="color-text-inputs-inputs-wrapper">
                      <input
                        type="text"
                        placeholder={t('Option label (EN)', 'اسم الخيار بالإنجليزي')}
                        value={variant.variant_name_en}
                        onChange={e => handleVariantChange(variant.id, 'variant_name_en', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder={t('Option label (AR)', 'اسم الخيار بالعربي')}
                        value={variant.variant_name_ar}
                        onChange={e => handleVariantChange(variant.id, 'variant_name_ar', e.target.value)}
                      />
                      <input
                        type="number"
                        step="1"
                        placeholder={t('Price (EGP) — optional', 'السعر (ج.م) - اختياري')}
                        value={variant.price}
                        onChange={e => handleVariantChange(variant.id, 'price', e.target.value)}
                      />
                    </div>
                    <div className="color-picker-and-delete">
                      <button
                        type="button"
                        className="remove-color-row-btn"
                        onClick={() => handleRemoveVariantRow(variant.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </ReactSortable>
              <button
                type="button"
                onClick={handleAddVariantRow}
                className="add-color-btn"
                style={{ marginTop: '0.5rem' }}
              >
                + {t('Add Variant Row', 'إضافة خيار جديد')}
              </button>
            </div>

            {/* Flags */}
            <div className="checkbox-field">
              <input
                type="checkbox"
                id="popular"
                checked={formData.is_popular}
                onChange={e => setFormData({ ...formData, is_popular: e.target.checked })}
              />
              <label htmlFor="popular">{t('Feature as Best Selling', 'الأكثر مبيعًا')}</label>
            </div>
            <div className="checkbox-field">
              <input
                type="checkbox"
                id="soldout"
                checked={formData.is_sold_out}
                onChange={e => setFormData({ ...formData, is_sold_out: e.target.checked })}
              />
              <label htmlFor="soldout">{t('Out Of Stock', 'نفد المخزون')}</label>
            </div>
            <div className="checkbox-field">
              <input
                type="checkbox"
                id="new_arrival"
                checked={formData.is_new_arrival ?? false}
                onChange={e => setFormData({ ...formData, is_new_arrival: e.target.checked })}
              />
              <label htmlFor="new_arrival">{t('New Arrival', 'وصل حديثاً')}</label>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => setIsFormOpen(false)}
            >
              {t('Cancel', 'إلغاء')}
            </button>
            <button
              type="submit"
              className="save-submit-btn"
              disabled={isUploading}
            >
              {isUploading ? t('Saving...', 'جاري الحفظ...') : t('Save Product', 'حفظ المنتج')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
export default AdminDashboard;