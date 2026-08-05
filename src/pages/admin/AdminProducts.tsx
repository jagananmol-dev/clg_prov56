/**
 * @file pages/admin/AdminProducts.tsx
 * @description Admin product management at /admin/products.
 *
 * Features:
 *  - Table of all products (image, name, category, price, tag)
 *  - "Add Product" slide-in form with full Zod-validated input
 *  - Delete product with confirmation dialog
 */
import { useState, useEffect, FormEvent, useRef } from 'react';
import { Plus, Trash2, X, Package, AlertCircle, Upload, ImageIcon as ImageIconIcon, Star } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import AdminLayout from './AdminLayout';

const API_BASE = import.meta.env.VITE_ADMIN_API_URL ?? 'http://localhost:4000';

interface Product {
  id: string; name: string; category_id: string; price: number;
  original_price: number; image: string; tag: string | null; description: string;
  is_featured?: boolean;
  categories?: { name: string };
}
interface Category { id: string; name: string; }

const EMPTY_FORM = {
  name: '', category_id: '', price: '', original_price: '',
  image: '', tag: '', description: '', is_featured: false,
};

export default function AdminProducts() {
  const { adminFetch, token } = useAdminAuth();
  const [products,    setProducts]    = useState<Product[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [formError,   setFormError]   = useState<string | null>(null);
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [imgPreview,  setImgPreview]  = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, cats] = await Promise.all([
        adminFetch('/api/admin/products').then(r => r.json()),
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/categories?select=id,name`, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` }
        }).then(r => r.json()),
      ]);
      setProducts(pRes.products ?? []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch { /* backend not ready yet */ }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line

  /** Upload file to Supabase Storage via the backend upload route */
  async function handleFileUpload(file: File) {
    setUploading(true);
    setFormError(null);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch(`${API_BASE}/api/admin/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      setForm(f => ({ ...f, image: data.url }));
      setImgPreview(data.url);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    // Client-side: make sure an image was uploaded
    if (!form.image) {
      setFormError('Please upload a product image before adding.');
      return;
    }

    setSaving(true);

    const res = await adminFetch('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        price:          parseInt(form.price),
        original_price: parseInt(form.original_price),
        tag:            form.tag || null,
        is_featured:    form.is_featured,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setFormError(data.details?.join(' · ') ?? data.error ?? 'Failed to add product.');
      return;
    }

    setForm(EMPTY_FORM);
    setImgPreview('');
    setShowForm(false);
    loadData();
  }

  async function handleDelete(id: string) {
    const res = await adminFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) { setDeleteId(null); loadData(); }
  }

  async function handleToggleFeatured(id: string, currentStatus: boolean) {
    const res = await adminFetch(`/api/admin/products/${id}/featured`, {
      method: 'PATCH',
      body: JSON.stringify({ is_featured: !currentStatus }),
    });
    if (res.ok) {
      loadData();
    }
  }

  const field = (key: keyof typeof EMPTY_FORM, label: string, type = 'text', extra?: object) => (
    <div>
      <label className="block text-xs font-medium text-[#5A5A5A] mb-1">{label}</label>
      {key === 'description' ? (
        <textarea
          required value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          rows={3}
          className="w-full border border-[#E8DDD0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A265]/40 resize-none"
          {...extra}
        />
      ) : (
        <input
          type={type} value={form[key]} required={key !== 'tag'}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full border border-[#E8DDD0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A265]/40"
          {...extra}
        />
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1C1C1C]">Products</h1>
            <p className="text-sm text-[#8A8A8A]">{products.length} products in catalog</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#3D2B0E] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#5A3F1A] transition-colors"
          >
            <Plus size={15} /> Add Product
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-sm text-[#8A8A8A]">Loading products…</p>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8DDD0] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF7F2] text-xs uppercase tracking-wide text-[#5A5A5A]">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Product</th>
                  <th className="px-5 py-3 text-left font-medium">Category</th>
                  <th className="px-5 py-3 text-left font-medium">Price</th>
                  <th className="px-5 py-3 text-left font-medium">Tag</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DDD0]">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-[#FAF7F2]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-[#FAF7F2]" loading="lazy" />
                        <span className="font-medium text-[#1C1C1C] line-clamp-1">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[#5A5A5A]">{p.categories?.name ?? p.category_id}</td>
                    <td className="px-5 py-3 font-medium text-[#3D2B0E]">₹{p.price}</td>
                    <td className="px-5 py-3">
                      {p.tag && (
                        <span className="bg-[#E8DDD0] text-[#7C5A2A] text-xs px-2.5 py-1 rounded-full">{p.tag}</span>
                      )}
                      {p.is_featured && (
                        <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full ml-1">⭐ Featured</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleToggleFeatured(p.id, !!p.is_featured)}
                        title={p.is_featured ? 'Remove from Best Sellers' : 'Mark as Best Seller'}
                        className="text-[#8A8A8A] hover:text-amber-500 transition-colors mr-3"
                      >
                        <Star size={16} className={p.is_featured ? 'fill-amber-500 text-amber-500' : ''} />
                      </button>
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="text-[#8A8A8A] hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="py-16 text-center">
                <Package size={32} className="text-[#E8DDD0] mx-auto mb-3" />
                <p className="text-sm text-[#8A8A8A]">No products yet. Add your first one.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add Product Slide-in Form ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="w-full max-w-md bg-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#E8DDD0]">
              <h2 className="font-semibold text-[#1C1C1C]">Add New Product</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-[#5A5A5A]" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  {formError}
                </div>
              )}

              {field('name', 'Product Name')}

              {/* Category dropdown */}
              <div>
                <label className="block text-xs font-medium text-[#5A5A5A] mb-1">Category</label>
                <select
                  required value={form.category_id}
                  onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                  className="w-full border border-[#E8DDD0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A265]/40"
                >
                  <option value="">Select a category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {field('price', 'Price (₹)', 'number', { min: 1 })}
                {field('original_price', 'Original Price (₹)', 'number', { min: 1 })}
              </div>

              {/* Image — file upload */}
              <div>
                <label className="block text-xs font-medium text-[#5A5A5A] mb-1">Product Image</label>

                {/* Upload button */}
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex w-full justify-center items-center gap-2 bg-[#FAF7F2] border-2 border-dashed border-[#E8DDD0] text-[#5A5A5A] px-3 py-4 rounded-xl text-sm font-medium hover:bg-[#F0E8DC] disabled:opacity-60 transition-colors"
                  >
                    <Upload size={16} />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </button>
                </div>
                <input
                  ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                />

                {/* Live preview */}
                {imgPreview && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={imgPreview} alt="preview"
                      className="w-16 h-16 rounded-xl object-cover border border-[#E8DDD0] bg-[#FAF7F2]"
                      onError={e => (e.currentTarget.style.display = 'none')}
                    />
                    <span className="text-xs text-[#8A8A8A]">Image uploaded</span>
                  </div>
                )}
                {!imgPreview && (
                  <div className="mt-2 w-16 h-16 rounded-xl border-2 border-dashed border-[#E8DDD0] flex items-center justify-center">
                    <ImageIcon size={20} className="text-[#C4A265]/40" />
                  </div>
                )}
              </div>
              {field('tag', 'Badge (optional)', 'text', { placeholder: 'Best Seller / New / Premium' })}
              {field('description', 'Description')}

              {/* Featured / Best Seller toggle */}
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={form.is_featured}
                  onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                  className="w-4 h-4 accent-[#C4A265] rounded"
                />
                <label htmlFor="is_featured" className="text-sm text-[#5A5A5A] cursor-pointer">
                  ⭐ Mark as <strong>Best Seller</strong> (shown on homepage)
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#3D2B0E] text-white py-3 rounded-full text-sm font-medium hover:bg-[#5A3F1A] disabled:opacity-60 mt-2"
              >
                {saving ? 'Saving…' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Dialog ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl mx-4">
            <h3 className="font-semibold text-[#1C1C1C] mb-2">Delete Product?</h3>
            <p className="text-sm text-[#5A5A5A] mb-5">This will permanently remove the product and its associated order items. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-[#E8DDD0] py-2.5 rounded-full text-sm font-medium">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-red-500 text-white py-2.5 rounded-full text-sm font-medium hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
