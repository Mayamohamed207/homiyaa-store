import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, ArrowLeft, FolderPlus, List, Image, Palette, Loader2, X, ClipboardList, Package } from 'lucide-react';
import AdminProductCard, { Product } from './AdminProductCard';
import AdminOrdersPanel, { CustomerOrder } from './AdminOrdersPanel';
import './AdminDashboard.css';

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

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

const initialFormState: Product = {
  name_en: '', name_ar: '', description_en: '', description_ar: '',
  price: '', discount_price: '', category_en: '', category_ar: '',
  stock_quantity: '', is_popular: false, is_sold_out: false,
};

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formImages, setFormImages] = useState<UnifiedImage[]>([]);
  const [colors, setColors] = useState<ColorInput[]>([{ color_name_en: '', color_name_ar: '', color_code: '' }]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Product>(initialFormState);

  useEffect(() => {
    if (isAuthenticated) { fetchProducts(); fetchOrders(); }
  }, [isAuthenticated]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, product_images(image_url)')
      .order('id', { ascending: false });
    if (data) setProducts(data);
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    const { data, error } = await supabase.from('orders').select('*').order('id', { ascending: false });
    if (!error && data) setOrders(data);
    setLoadingOrders(false);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ADMIN_PASSWORD) {
      alert('Admin password is not configured. Set VITE_ADMIN_PASSWORD in your .env file.');
      return;
    }
    if (password === ADMIN_PASSWORD) setIsAuthenticated(true);
    else alert('Incorrect password!');
    setPassword('');
  };

  // ── Image helpers ─────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file, index) => ({
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

  const handleDragStart = (index: number) => setDraggedIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const reordered = [...formImages];
    const item = reordered[draggedIndex];
    reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, item);
    setDraggedIndex(index);
    setFormImages(reordered);
  };

  const handleDragEnd = () => setDraggedIndex(null);

  // ── Color helpers ─────────────────────────────────────────
  const handleAddColorRow = () =>
    setColors([...colors, { color_name_en: '', color_name_ar: '', color_code: '' }]);

  const handleColorChange = (index: number, field: keyof ColorInput, value: string) => {
    const updated = [...colors];
    updated[index][field] = value;
    setColors(updated);
  };

  // ── Save product ──────────────────────────────────────────
  const getCleanPayload = () => {
    const payload = { ...formData };
    delete payload.id;
    delete payload.product_images;
    if (payload.price === '') payload.price = 0;
    if (payload.stock_quantity === '') payload.stock_quantity = 0;
    if (payload.discount_price === '') payload.discount_price = null;
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
          color_code: c.color_code.trim() || null,
        }));
        const { error: colorError } = await supabase.from('product_colors').insert(colorRows);
        if (colorError) throw new Error(`Color Insert Error: ${colorError.message}`);
      }

      formImages.forEach(img => { if (img.type === 'new') URL.revokeObjectURL(img.url); });
      setIsFormOpen(false);
      setFormImages([]);
      setColors([{ color_name_en: '', color_name_ar: '', color_code: '' }]);
      fetchProducts();
      alert('Product saved successfully! ✅');
    } catch (err: any) {
      alert(`Error: ${err.message || err}`);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Form open helpers ─────────────────────────────────────
  const closeForm = () => {
    formImages.forEach(img => { if (img.type === 'new') URL.revokeObjectURL(img.url); });
    setIsFormOpen(false);
  };

  const openAddMode = () => {
    setEditMode(false);
    setIsCustomCategory(false);
    setFormData(initialFormState);
    setFormImages([]);
    setColors([{ color_name_en: '', color_name_ar: '', color_code: '' }]);
    setIsFormOpen(true);
  };

  const openEditMode = (product: Product) => {
    setEditMode(true);
    setIsCustomCategory(false);
    setFormData(product);
    setFormImages((product.product_images || []).map((img, index) => ({
      id: `existing-${index}-${Math.random()}`,
      type: 'existing',
      url: img.image_url,
    })));
    setColors([{ color_name_en: '', color_name_ar: '', color_code: '' }]);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
    }
  };

  // ── Lock screen ───────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="admin-lock-screen">
        <form onSubmit={handlePasswordSubmit} className="lock-card">
          <h3>Homiyaa Console</h3>
          <input
            type="password"
            placeholder="Enter Admin Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button type="submit">Unlock Console</button>
        </form>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────
  return (
    <div className="admin-container" style={{ maxWidth: '1250px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>

      {!isFormOpen && (
        <div className="admin-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.75rem 1.5rem',
              background: activeTab === 'products' ? '#0f172a' : 'none',
              color: activeTab === 'products' ? '#fff' : '#475569',
              border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            <Package size={18} />
            Products Inventory ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.75rem 1.5rem',
              background: activeTab === 'orders' ? '#0f172a' : 'none',
              color: activeTab === 'orders' ? '#fff' : '#475569',
              border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            <ClipboardList size={18} />
            Customer Orders Log ({orders.length})
          </button>
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
        ) : (
          <>
            <div className="admin-header">
              <h2>Homiyaa Control Panel</h2>
              <button onClick={openAddMode} className="add-btn"><Plus size={18} /> Add New Product</button>
            </div>
            <div className="product-admin-grid">
              {products.map(p => (
                <AdminProductCard key={p.id} p={p} onEdit={openEditMode} onDelete={handleDeleteProduct} />
              ))}
            </div>
          </>
        )
      ) : (
        <form onSubmit={handleSaveProduct} className="product-form">
          <div className="form-header">
            <button type="button" onClick={closeForm} className="back-btn" disabled={isUploading}>
              <ArrowLeft size={16} /> Back
            </button>
            <h3>{editMode ? 'Edit Product Configuration' : 'Create Complete Product Listing'}</h3>
          </div>

          <div className="form-grid">
            <div className="field">
              <label>Product Name (EN) *</label>
              <input type="text" required disabled={isUploading} value={formData.name_en}
                onChange={e => setFormData({ ...formData, name_en: e.target.value })} />
            </div>
            <div className="field">
              <label>Product Name (AR) *</label>
              <input type="text" required disabled={isUploading} value={formData.name_ar}
                onChange={e => setFormData({ ...formData, name_ar: e.target.value })} dir="rtl" />
            </div>

            <div className="field full-width">
              <div className="category-label-row">
                <label>{isCustomCategory ? 'Enter Custom Category *' : 'Select Category *'}</label>
                <button
                  type="button" disabled={isUploading} className="category-toggle-btn"
                  onClick={() => { setIsCustomCategory(!isCustomCategory); setFormData({ ...formData, category_en: '', category_ar: '' }); }}
                >
                  {isCustomCategory ? <><List size={14} /> View Dropdown</> : <><FolderPlus size={14} /> Create Category</>}
                </button>
              </div>
              {!isCustomCategory ? (
                <select
                  required disabled={isUploading} className="admin-dropdown"
                  value={formData.category_en ? `${formData.category_en}|${formData.category_ar}` : ''}
                  onChange={e => {
                    const [en, ar] = e.target.value.split('|');
                    setFormData({ ...formData, category_en: en || '', category_ar: ar || '' });
                  }}
                >
                  <option value="">-- Choose Option --</option>
                  <option value="Mugs|مجات حرارية">Mugs / مجات حرارية</option>
                  <option value="Kitchen Essentials|لوازم مطبخ">Kitchen Essentials / لوازم مطبخ</option>
                  <option value="Bathroom Essentials|لوازم حمام">Bathroom Essentials / لوازم حمام</option>
                  <option value="Home Essentials|لوازم منزلية">Home Essentials / لوازم منزلية</option>
                </select>
              ) : (
                <div className="custom-category-inputs">
                  <input type="text" required disabled={isUploading} placeholder="Category (EN)"
                    value={formData.category_en} onChange={e => setFormData({ ...formData, category_en: e.target.value })} />
                  <input type="text" required disabled={isUploading} placeholder="القسم (AR)"
                    value={formData.category_ar} onChange={e => setFormData({ ...formData, category_ar: e.target.value })} dir="rtl" />
                </div>
              )}
            </div>

            <div className="field">
              <label>Price (EGP) *</label>
              <input type="number" required disabled={isUploading} placeholder="0" value={formData.price}
                onWheel={e => (e.target as HTMLInputElement).blur()}
                onKeyDown={e => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                onChange={e => setFormData({ ...formData, price: e.target.value === '' ? '' : Number(e.target.value) })} />
            </div>
            <div className="field">
              <label>Discount Price (EGP)</label>
              <input type="number" disabled={isUploading} placeholder="0" value={formData.discount_price ?? ''}
                onWheel={e => (e.target as HTMLInputElement).blur()}
                onKeyDown={e => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                onChange={e => setFormData({ ...formData, discount_price: e.target.value === '' ? '' : Number(e.target.value) })} />
            </div>
            <div className="field full-width">
              <label>Available Stock Units *</label>
              <input type="number" required disabled={isUploading} placeholder="0" value={formData.stock_quantity}
                onWheel={e => (e.target as HTMLInputElement).blur()}
                onKeyDown={e => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                onChange={e => setFormData({ ...formData, stock_quantity: e.target.value === '' ? '' : Number(e.target.value) })} />
            </div>

            <div className="field full-width section-block">
              <label className="section-title"><Image size={16} /> Manage Product Images *</label>
              <input
                type="file" accept="image/*" multiple
                required={formImages.length === 0} disabled={isUploading}
                onChange={handleFileChange} className="file-upload-picker"
              />
              <p className="file-hint-text">Add images above. Drag and drop to reorder. Click X to remove.</p>
              {formImages.length > 0 && (
                <div className="image-preview-grid" style={{ marginTop: '15px' }}>
                  {formImages.map((imgItem, idx) => (
                    <div
                      key={imgItem.id}
                      className={`image-preview-item draggable ${draggedIndex === idx ? 'dragging' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={e => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                    >
                      <button type="button" className="remove-image-btn" onClick={() => removeImage(imgItem.id)}><X size={14} /></button>
                      <img src={imgItem.url} alt={`Preview ${idx}`} draggable={false} />
                      <span className="drag-index-badge" style={{ backgroundColor: imgItem.type === 'existing' ? '#4F46E5' : '#10B981' }}>
                        {idx + 1} {imgItem.type === 'existing' ? '(Saved)' : '(New)'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="field full-width section-block">
              <div className="category-label-row">
                <label className="section-title"><Palette size={16} /> Color Variants Matrix</label>
                <button type="button" disabled={isUploading} onClick={handleAddColorRow} className="add-color-btn">+ Add Color Variation</button>
              </div>
              {colors.map((color, idx) => (
                <div key={idx} className="color-input-row">
                  <input type="text" disabled={isUploading} placeholder="Color Name (EN)"
                    value={color.color_name_en} onChange={e => handleColorChange(idx, 'color_name_en', e.target.value)} />
                  <input type="text" disabled={isUploading} placeholder="اسم اللون (AR)"
                    value={color.color_name_ar} onChange={e => handleColorChange(idx, 'color_name_ar', e.target.value)} dir="rtl" />
                  <input type="color" disabled={isUploading} className="color-picker-input"
                    value={color.color_code || '#000000'} onChange={e => handleColorChange(idx, 'color_code', e.target.value)} />
                </div>
              ))}
            </div>

            <div className="field full-width">
              <label>Description (EN)</label>
              <textarea disabled={isUploading} value={formData.description_en}
                onChange={e => setFormData({ ...formData, description_en: e.target.value })} />
            </div>
            <div className="field full-width">
              <label>Description (AR)</label>
              <textarea disabled={isUploading} value={formData.description_ar}
                onChange={e => setFormData({ ...formData, description_ar: e.target.value })} dir="rtl" />
            </div>

            <div className="checkbox-field">
              <input type="checkbox" id="popular" disabled={isUploading} checked={formData.is_popular}
                onChange={e => setFormData({ ...formData, is_popular: e.target.checked })} />
              <label htmlFor="popular">Feature in Popular Trends</label>
            </div>
            <div className="checkbox-field">
              <input type="checkbox" id="soldout" disabled={isUploading} checked={formData.is_sold_out}
                onChange={e => setFormData({ ...formData, is_sold_out: e.target.checked })} />
              <label htmlFor="soldout">Out Of Stock</label>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-submit-btn" disabled={isUploading}>
              {isUploading
                ? <span className="loading-spinner-wrapper"><Loader2 className="spinner" size={18} /> Saving...</span>
                : 'Save Product'}
            </button>
            <button type="button" className="cancel-btn" onClick={closeForm} disabled={isUploading}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminDashboard;