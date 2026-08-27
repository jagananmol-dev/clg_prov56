/**
 * @file pages/admin/AdminCategories.tsx
 * @description Admin category management at /admin/categories.
 *
 * Categories back two storefront spots directly:
 *  - the homepage "Shop by Category" tiles (Categories.tsx)
 *  - the Shop page category filter sidebar
 * Both are DB-driven, so a name or image change here shows up there
 * immediately — no code deploy needed.
 *
 * Features:
 *  - Table of all categories (image, name, slug, live product count)
 *  - Add/Edit slide-in form with image upload to Supabase Storage
 *  - Slug (id) is the primary key products.category_id references, so
 *    it's set once at creation and locked afterward — only name/image
 *    can change on an existing category.
 *  - Delete blocked (with a clear reason) while any product still
 *    uses that category, instead of silently orphaning them.
 */
import { useState, useEffect, FormEvent, useRef } from 'react';
import { Plus, Trash2, X, FolderKanban, AlertCircle, Upload, ImageIcon, Pencil } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import AdminLayout from './AdminLayout';

interface Category {
  id: string;
  name: string;
  image: string;
  product_count: number;
}

const EMPTY_FORM = { id: '', name: '', image: '' };

/** Lowercase, hyphenate, strip anything that isn't a-z0-9 — matches the
 * slug shape the backend requires and the existing seed categories use. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminCategories() {
  const { adminFetch, token } = useAdminAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false); // user hand-edited the slug — stop auto-deriving it
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteError,  setDeleteError]  = useState<string | null>(null);
  const [uploading,  setUploading]  = useState(false);
  const [imgPreview, setImgPreview] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const API_BASE = import.meta.env.VITE_ADMIN_API_URL ?? 'http://localhost:4000';

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/categories');
      const data = await res.json();
      setCategories(data.categories ?? []);
    } catch (e) {
      console.error('[AdminCategories] loadData error:', e);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line

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

  function resetForm() {
    setForm(EMPTY_FORM);
    setImgPreview('');
    setFormError(null);
    setEditingId(null);
    setSlugTouched(false);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(c: Category) {
    setForm({ id: c.id, name: c.name, image: c.image });
    setImgPreview(c.image);
    setFormError(null);
    setEditingId(c.id);
    setSlugTouched(true); // editing an existing slug — never auto-derive over it
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError('Category name is required.');
      return;
    }
    if (!editingId && !slugify(form.id)) {
      setFormError('Please provide a valid slug (e.g. "gift-wrap").');
      return;
    }
    if (!form.image) {
      setFormError('Please upload a category image.');
      return;
    }

    setSaving(true);

    const isEditing = !!editingId;
    const res = await adminFetch(
      isEditing ? `/api/admin/categories/${editingId}` : '/api/admin/categories',
      {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify(
          isEditing
            ? { name: form.name.trim(), image: form.image }
            : { id: slugify(form.id), name: form.name.trim(), image: form.image }
        ),
      }
    );

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setFormError(data.details?.join(' · ') ?? data.error ?? `Failed to ${isEditing ? 'save' : 'add'} category.`);
      return;
    }

    resetForm();
    setShowForm(false);
    loadData();
  }

  async function handleDelete(c: Category) {
    setDeleteError(null);
    const res = await adminFetch(`/api/admin/categories/${c.id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleteTarget(null);
      loadData();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setDeleteError(data.error ?? 'Failed to delete category.');
  }

  return (
    <AdminLayout>
      <div className="p-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1C1C1C]">Categories</h1>
            <p className="text-sm text-[#8A8A8A]">
              {categories.length} categories · shown on the homepage and Shop filters
            </p>
          </div>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 bg-[#3D2B0E] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#5A3F1A] transition-colors"
          >
            <Plus size={15} /> Add Category
          </button>
        </div>

        {/* ── Categories Table ── */}
        {loading ? (
          <p className="text-sm text-[#8A8A8A]">Loading categories…</p>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8DDD0] overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-[#FAF7F2] text-xs uppercase tracking-wide text-[#5A5A5A]">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Category</th>
                  <th className="px-5 py-3 text-left font-medium">Slug</th>
                  <th className="px-5 py-3 text-left font-medium">Products</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DDD0]">
                {categories.map(c => (
                  <tr key={c.id} className="hover:bg-[#FAF7F2]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img src={c.image} alt={c.name} className="w-10 h-10 rounded-lg object-cover bg-[#FAF7F2]" loading="lazy" />
                        <span className="font-medium text-[#1C1C1C] line-clamp-1">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[#5A5A5A] font-mono text-xs">{c.id}</td>
                    <td className="px-5 py-3 text-[#5A5A5A]">{c.product_count}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => openEditForm(c)}
                        title="Edit category"
                        className="text-[#8A8A8A] hover:text-[#3D2B0E] transition-colors mr-3"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => { setDeleteError(null); setDeleteTarget(c); }}
                        title="Delete category"
                        className="text-[#8A8A8A] hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {categories.length === 0 && (
              <div className="py-16 text-center">
                <FolderKanban size={32} className="text-[#E8DDD0] mx-auto mb-3" />
                <p className="text-sm text-[#8A8A8A]">No categories yet. Add your first one.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add/Edit Category Slide-in Form ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => { setShowForm(false); resetForm(); }} />
          <div className="w-full max-w-md bg-white shadow-2xl overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#E8DDD0]">
              <h2 className="font-semibold text-[#1C1C1C]">{editingId ? 'Edit Category' : 'Add New Category'}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }}>
                <X size={18} className="text-[#5A5A5A]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">

              {formError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  {formError}
                </div>
              )}

              {/* Category Name */}
              <div>
                <label className="block text-xs font-medium text-[#5A5A5A] mb-1">Category Name *</label>
                <input
                  type="text" required value={form.name}
                  onChange={e => {
                    const name = e.target.value;
                    setForm(f => ({ ...f, name, id: (!editingId && !slugTouched) ? slugify(name) : f.id }));
                  }}
                  placeholder="e.g. Gift Wrap"
                  className="w-full border border-[#E8DDD0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A265]/40"
                />
              </div>

              {/* Slug — only settable at creation; locked once other rows reference it */}
              <div>
                <label className="block text-xs font-medium text-[#5A5A5A] mb-1">
                  Slug {editingId ? '(locked — used by existing products & links)' : '* (auto-filled from the name, editable)'}
                </label>
                <input
                  type="text"
                  required={!editingId}
                  disabled={!!editingId}
                  value={form.id}
                  onChange={e => { setSlugTouched(true); setForm(f => ({ ...f, id: e.target.value })); }}
                  placeholder="gift-wrap"
                  className="w-full border border-[#E8DDD0] rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C4A265]/40 disabled:bg-[#FAF7F2] disabled:text-[#8A8A8A]"
                />
                {!editingId && (
                  <p className="text-[11px] text-[#8A8A8A] mt-1">
                    Used in the Shop page URL (?category={slugify(form.id) || '…'}) — lowercase letters, numbers, hyphens only.
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-medium text-[#5A5A5A] mb-1">Category Image *</label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full justify-center items-center gap-2 bg-[#FAF7F2] border-2 border-dashed border-[#E8DDD0] text-[#5A5A5A] px-3 py-4 rounded-xl text-sm font-medium hover:bg-[#F0E8DC] disabled:opacity-60 transition-colors"
                >
                  <Upload size={16} />
                  {uploading ? 'Uploading…' : form.image ? 'Change Image' : 'Click to Upload Image'}
                </button>
                <input
                  ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                />
                {imgPreview ? (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={imgPreview} alt="preview"
                      className="w-16 h-16 rounded-xl object-cover border border-[#E8DDD0]"
                      onError={e => (e.currentTarget.style.display = 'none')}
                    />
                    <span className="text-xs text-green-700 font-medium">✓ Image uploaded</span>
                  </div>
                ) : (
                  <div className="mt-2 w-16 h-16 rounded-xl border-2 border-dashed border-[#E8DDD0] flex items-center justify-center">
                    <ImageIcon size={20} className="text-[#C4A265]/40" />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={saving || uploading}
                className="w-full bg-[#3D2B0E] text-white py-3 rounded-full text-sm font-medium hover:bg-[#5A3F1A] disabled:opacity-60 mt-2 transition-colors"
              >
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Category'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Dialog ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl mx-4">
            <h3 className="font-semibold text-[#1C1C1C] mb-2">Delete Category?</h3>
            <p className="text-sm text-[#5A5A5A] mb-4">
              This removes <strong>{deleteTarget.name}</strong> from the homepage and Shop filters. This cannot be undone.
            </p>
            {deleteError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                {deleteError}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-[#E8DDD0] py-2.5 rounded-full text-sm font-medium">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteTarget)} className="flex-1 bg-red-500 text-white py-2.5 rounded-full text-sm font-medium hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
