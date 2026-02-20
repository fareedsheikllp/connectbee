"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, Search, Package, Edit2, Trash2, X, Check,
  Tag, DollarSign, Image, ToggleLeft, ToggleRight, ShoppingBag
} from "lucide-react";
import toast from "react-hot-toast";

const CURRENCIES = ["CAD", "USD", "EUR", "GBP"];
const CATEGORIES = ["General", "Food & Drink", "Clothing", "Electronics", "Beauty", "Home", "Services", "Other"];

// ── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ item, onEdit, onDelete, onToggleStock }) {
  return (
    <div className="bg-white rounded-2xl border border-surface-200 shadow-soft overflow-hidden hover:shadow-medium transition-all group">
      {/* Image */}
<div className="relative h-44 bg-surface-100 overflow-hidden">
  {item.imageUrl ? (
    <img
      src={item.imageUrl}
      alt={item.name}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      onError={(e) => {
        e.target.style.display = "none";
        e.target.nextSibling.style.display = "flex";
      }}
    />
  ) : null}
  <div
    className="w-full h-full flex items-center justify-center"
    style={{ display: item.imageUrl ? "none" : "flex" }}
  >
    <Package size={36} className="text-surface-300" />
  </div>
        {/* Stock badge */}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
          item.inStock ? "bg-brand-500 text-white" : "bg-red-100 text-red-600"
        }`}>
          {item.inStock ? "In Stock" : "Out of Stock"}
        </div>
        {/* Category badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/80 backdrop-blur-sm text-ink-600">
          {item.category}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-ink-800 truncate mb-1">{item.name}</h3>
        {item.description && (
          <p className="text-xs text-ink-400 line-clamp-2 mb-3">{item.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-brand-600">
            {item.currency} {parseFloat(item.price).toFixed(2)}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onToggleStock(item)}
              className="p-1.5 rounded-lg hover:bg-surface-100 text-ink-400 hover:text-ink-600 transition-colors"
              title={item.inStock ? "Mark out of stock" : "Mark in stock"}
            >
              {item.inStock ? <ToggleRight size={16} className="text-brand-500" /> : <ToggleLeft size={16} />}
            </button>
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg hover:bg-surface-100 text-ink-400 hover:text-ink-600 transition-colors"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-ink-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
function ProductModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    name: item?.name || "",
    description: item?.description || "",
    price: item?.price || "",
    currency: item?.currency || "CAD",
    imageUrl: item?.imageUrl || "",
    category: item?.category || "General",
    inStock: item?.inStock !== false,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || form.price === "") return toast.error("Name and price are required");
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-large w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <h2 className="font-semibold text-ink-800 font-display">
            {item ? "Edit Product" : "Add Product"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 text-ink-400">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Image preview */}
          <div className="h-32 rounded-xl bg-surface-50 border border-surface-200 flex items-center justify-center overflow-hidden">
            {form.imageUrl ? (
              <img src={form.imageUrl} alt="" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="text-center text-ink-300">
                <Image size={28} className="mx-auto mb-1" />
                <p className="text-xs">Image preview</p>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-ink-500 mb-1 block">Image URL</label>
            <div className="relative">
              <Image size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-ink-500 mb-1 block">Product Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Premium Wireless Headphones"
              className="w-full px-3 py-2.5 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-ink-500 mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Short product description..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-ink-500 mb-1 block">Price *</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-500 mb-1 block">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
              >
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-ink-500 mb-1 block">Category</label>
            <div className="relative">
              <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-ink-700">In Stock</p>
              <p className="text-xs text-ink-400">Toggle product availability</p>
            </div>
            <button
              onClick={() => set("inStock", !form.inStock)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.inStock ? "bg-brand-500" : "bg-surface-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.inStock ? "translate-x-5" : ""}`} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-100 bg-surface-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-ink-600 hover:text-ink-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? "Saving..." : <><Check size={14} /> {item ? "Save Changes" : "Add Product"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function CatalogPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/catalog");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Failed to load catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async (form) => {
    try {
      const url = editItem ? `/api/catalog/${editItem.id}` : "/api/catalog";
      const method = editItem ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(editItem ? "Product updated!" : "Product added!");
      setShowModal(false);
      setEditItem(null);
      fetchItems();
    } catch (e) {
      toast.error(e.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await fetch(`/api/catalog/${id}`, { method: "DELETE" });
      toast.success("Product deleted");
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleToggleStock = async (item) => {
    try {
      await fetch(`/api/catalog/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inStock: !item.inStock }),
      });
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, inStock: !i.inStock } : i));
    } catch {
      toast.error("Failed to update");
    }
  };

  const allCategories = ["All", ...new Set(items.map((i) => i.category).filter(Boolean))];

  const filtered = items.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.description || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "All" || i.category === filterCategory;
    return matchSearch && matchCat;
  });

  const inStockCount = items.filter((i) => i.inStock).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 font-display">Catalog</h1>
          <p className="text-sm text-ink-400 mt-0.5">
            {items.length} products · {inStockCount} in stock
          </p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition-colors shadow-brand-sm"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-surface-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {allCategories.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                filterCategory === c
                  ? "bg-brand-500 text-white shadow-brand-sm"
                  : "bg-white border border-surface-200 text-ink-500 hover:border-brand-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-surface-200 h-56 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              onEdit={(i) => { setEditItem(i); setShowModal(true); }}
              onDelete={handleDelete}
              onToggleStock={handleToggleStock}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-200 py-20 text-center">
          <ShoppingBag size={40} className="mx-auto text-surface-300 mb-3" />
          <p className="font-medium text-ink-700 mb-1">
            {search || filterCategory !== "All" ? "No products match your search" : "No products yet"}
          </p>
          <p className="text-sm text-ink-400 mb-4">
            {search || filterCategory !== "All" ? "Try a different search or category" : "Add your first product to get started"}
          </p>
          {!search && filterCategory === "All" && (
            <button
              onClick={() => { setEditItem(null); setShowModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition-colors"
            >
              <Plus size={14} /> Add First Product
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ProductModal
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
