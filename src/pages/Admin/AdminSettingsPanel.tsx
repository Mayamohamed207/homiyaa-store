import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Trash2, Edit2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import './AdminSettingsPanel.css';

export interface DbShippingRecord {
  id: number;
  key_code: string;
  name_en: string;
  name_ar: string;
  cost: number;
}

export interface DbCategoryRecord {
  id: number;
  name_en: string;
  name_ar: string;
}

interface AdminSettingsPanelProps {
  activeTab: 'shipping' | 'categories';
  dbLiveCategories: DbCategoryRecord[];
  dbShippingRows: DbShippingRecord[];
  fetchStoreCategories: () => void;
  fetchShippingMatrix: () => void;
}

const AdminSettingsPanel: React.FC<AdminSettingsPanelProps> = ({
  activeTab,
  dbLiveCategories,
  dbShippingRows,
  fetchStoreCategories,
  fetchShippingMatrix,
}) => {
  const { t } = useLanguage();

  // Local states for New Item creation
  const [newCatEn, setNewCatEn] = useState('');
  const [newCatAr, setNewCatAr] = useState('');
  
  const [newGovEn, setNewGovEn] = useState('');
  const [newGovAr, setNewGovAr] = useState('');
  const [newGovCost, setNewGovCost] = useState<number | ''>('');

  // Local states for Category Inline Editing
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editCatEn, setEditCatEn] = useState('');
  const [editCatAr, setEditCatAr] = useState('');

  // Local states for Shipping Inline Editing
  const [editingShipId, setEditingShipId] = useState<number | null>(null);
  const [editShipEn, setEditShipEn] = useState('');
  const [editShipAr, setEditShipAr] = useState('');
  const [editShipCost, setEditShipCost] = useState<number | ''>('');

  // --- Categories Handlers ---
  const handleCreateCategoryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatEn.trim() || !newCatAr.trim()) return;
    const { error } = await supabase.from('store_categories').insert([{ name_en: newCatEn.trim(), name_ar: newCatAr.trim() }]);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('Category Added!', 'تم إضافة القسم!'));
      setNewCatEn('');
      setNewCatAr('');
      fetchStoreCategories();
    }
  };

  const handleDeleteCategoryItem = (id: number) => {
    toast((tToast) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <span style={{ fontWeight: 600, color: 'var(--primary-900)' }}>
          {t('Delete this store category?', 'هل أنت متأكد من حذف هذا القسم؟')}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => toast.dismiss(tToast.id)}
            style={{ background: 'var(--primary-100)', color: 'var(--primary-800)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >
            {t('Cancel', 'إلغاء')}
          </button>
          <button
            onClick={async () => {
              toast.dismiss(tToast.id);
              await supabase.from('store_categories').delete().eq('id', id);
              fetchStoreCategories();
              toast.success(t('Category Removed', 'تم حذف القسم'));
            }}
            style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >
            {t('Yes, Delete', 'نعم، احذف')}
          </button>
        </div>
      </div>
    ), 
    { 
      duration: Infinity,
      position: 'top-center',
      style: { marginTop: '40vh', minWidth: '320px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' } 
    });
  };

  const handleDeleteShippingItem = (id: number) => {
    toast((tToast) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <span style={{ fontWeight: 600, color: 'var(--primary-900)' }}>
          {t('Remove this governorate route?', 'هل أنت متأكد من حذف مسار الشحن هذا؟')}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => toast.dismiss(tToast.id)}
            style={{ background: 'var(--primary-100)', color: 'var(--primary-800)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >
            {t('Cancel', 'إلغاء')}
          </button>
          <button
            onClick={async () => {
              toast.dismiss(tToast.id);
              await supabase.from('shipping_matrix').delete().eq('id', id);
              fetchShippingMatrix();
              toast.success(t('Location removed.', 'تم حذف الموقع.'));
            }}
            style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >
            {t('Yes, Delete', 'نعم، احذف')}
          </button>
        </div>
      </div>
    ), 
    { 
      duration: Infinity,
      position: 'top-center',
      style: { marginTop: '40vh', minWidth: '320px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' } 
    });
  };

  const startEditingCategory = (cat: DbCategoryRecord) => {
    setEditingCatId(cat.id);
    setEditCatEn(cat.name_en);
    setEditCatAr(cat.name_ar);
  };

  const saveCategoryEdit = async (id: number) => {
    if (!editCatEn.trim() || !editCatAr.trim()) return;
    const { error } = await supabase.from('store_categories').update({
      name_en: editCatEn.trim(),
      name_ar: editCatAr.trim()
    }).eq('id', id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('Category updated!', 'تم تحديث القسم!'));
      setEditingCatId(null);
      fetchStoreCategories();
    }
  };

  // --- Shipping Handlers ---
  const handleCreateShippingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGovEn.trim() || !newGovAr.trim() || newGovCost === '') return;
    
    const generatedKey = newGovEn.toLowerCase().trim().replace(/\s+/g, '_');

    const { error } = await supabase.from('shipping_matrix').insert([{
      key_code: generatedKey,
      name_en: newGovEn.trim(),
      name_ar: newGovAr.trim(),
      cost: Number(newGovCost)
    }]);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('Governorate Pricing Added!', 'تمت إضافة تسعيرة المحافظة!'));
      setNewGovEn(''); setNewGovAr(''); setNewGovCost('');
      fetchShippingMatrix();
    }
  };

  const startEditingShipping = (row: DbShippingRecord) => {
    setEditingShipId(row.id);
    setEditShipEn(row.name_en);
    setEditShipAr(row.name_ar);
    setEditShipCost(row.cost);
  };

  const saveShippingEdit = async (id: number) => {
    if (!editShipEn.trim() || !editShipAr.trim() || editShipCost === '') return;
    const { error } = await supabase.from('shipping_matrix').update({
      name_en: editShipEn.trim(),
      name_ar: editShipAr.trim(),
      cost: Number(editShipCost)
    }).eq('id', id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('Shipping info updated!', 'تم تحديث معلومات الشحن!'));
      setEditingShipId(null);
      fetchShippingMatrix();
    }
  };

  if (activeTab === 'shipping') {
    return (
      <div className="settings-panel">
        <h3>{t('Governorate Shipping Setup', 'إعدادات شحن المحافظات')}</h3>
        <form onSubmit={handleCreateShippingItem} className="settings-form">
          <input type="text" placeholder={t('English Name', 'الاسم بالإنجليزي')} required value={newGovEn} onChange={e => setNewGovEn(e.target.value)} className="settings-input" />
          <input type="text" placeholder={t('Arabic Name', 'الاسم بالعربي')} required value={newGovAr} onChange={e => setNewGovAr(e.target.value)} className="settings-input" />
          <input type="number" placeholder={t('Cost EGP', 'التكلفة ج.م')} required value={newGovCost} onChange={e => setNewGovCost(e.target.value === '' ? '' : Number(e.target.value))} className="settings-input" />
          <button type="submit" className="settings-btn">{t('Add Location', 'إضافة محافظة')}</button>
        </form>
        
        <div className="shipping-modern-list">
          {dbShippingRows.map(row => (
            <div key={row.id} className="shipping-card">
              {editingShipId === row.id ? (
                <div className="inline-edit-mode">
                  <div className="inline-edit-inputs">
                    <input type="text" value={editShipEn} onChange={(e) => setEditShipEn(e.target.value)} placeholder="English" />
                    <input type="text" value={editShipAr} onChange={(e) => setEditShipAr(e.target.value)} placeholder="عربي" />
                    <input type="number" value={editShipCost} onChange={(e) => setEditShipCost(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Cost" />
                  </div>
                  <div className="inline-edit-actions">
                    <button onClick={() => saveShippingEdit(row.id)} className="admin-action-btn btn-save" title={t('Save', 'حفظ')}><Check size={16} /></button>
                    <button onClick={() => setEditingShipId(null)} className="admin-action-btn btn-edit" title={t('Cancel', 'إلغاء')}><X size={16} /></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="shipping-info">
                    <span className="shipping-names">{row.name_en} / {row.name_ar}</span>
                  </div>
                  
                  <div className="shipping-controls">
                    <div className="shipping-price-badge">
                      {row.cost} {t('EGP', 'ج.م')}
                    </div>
                    
                    <div className="action-buttons-group">
                      <button onClick={() => startEditingShipping(row)} className="admin-action-btn btn-edit" title={t('Edit', 'تعديل')}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteShippingItem(row.id)} className="admin-action-btn btn-delete" title={t('Delete', 'حذف')}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'categories') {
    return (
      <div className="settings-panel">
        <h3>{t('Product Categories Management', 'إدارة أقسام المنتجات')}</h3>
        <form onSubmit={handleCreateCategoryItem} className="settings-form">
          <input type="text" placeholder={t('English Name', 'اسم القسم بالإنجليزي')} required value={newCatEn} onChange={e => setNewCatEn(e.target.value)} className="settings-input" />
          <input type="text" placeholder={t('Arabic Name', 'اسم القسم بالعربي')} required value={newCatAr} onChange={e => setNewCatAr(e.target.value)} className="settings-input" />
          <button type="submit" className="settings-btn">{t('Create Category', 'إنشاء قسم')}</button>
        </form>
        
        <div className="categories-grid">
          {dbLiveCategories.map(cat => (
            <div key={cat.id} className="category-card">
              {editingCatId === cat.id ? (
                <div className="inline-edit-mode">
                  <div className="inline-edit-inputs">
                    <input type="text" value={editCatEn} onChange={(e) => setEditCatEn(e.target.value)} placeholder="English" />
                    <input type="text" value={editCatAr} onChange={(e) => setEditCatAr(e.target.value)} placeholder="عربي" />
                  </div>
                  <div className="inline-edit-actions">
                    <button onClick={() => saveCategoryEdit(cat.id)} className="admin-action-btn btn-save" title={t('Save', 'حفظ')}><Check size={16} /></button>
                    <button onClick={() => setEditingCatId(null)} className="admin-action-btn btn-edit" title={t('Cancel', 'إلغاء')}><X size={16} /></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="category-card-titles">
                    <span className="cat-title-en">{cat.name_en}</span>
                    <span className="cat-title-ar">{cat.name_ar}</span>
                  </div>
                  <div className="action-buttons-group">
                    <button onClick={() => startEditingCategory(cat)} className="admin-action-btn btn-edit" title={t('Edit', 'تعديل')}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteCategoryItem(cat.id)} className="admin-action-btn btn-delete" title={t('Remove', 'حذف')}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default AdminSettingsPanel;