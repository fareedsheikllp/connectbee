"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, Search, Copy, Edit2, Trash2, FileText,
  X, Check, ChevronDown, Tag, Sparkles,
  Clock, CheckCircle, XCircle, AlertCircle, Info, ShoppingBag, Package, Image as ImageIcon
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────
const CATEGORIES = ["MARKETING", "UTILITY", "AUTHENTICATION"];

const CAT_COLOR = {
  MARKETING:      "bg-rose-50 text-rose-700 border-rose-200",
  UTILITY:        "bg-sky-50 text-sky-700 border-sky-200",
  AUTHENTICATION: "bg-violet-50 text-violet-700 border-violet-200",
};

const META = {
  NONE:     { label: "Not Submitted", short: "Draft",    icon: AlertCircle, color: "text-gray-400",    bg: "bg-gray-50",    border: "border-gray-200"    },
  PENDING:  { label: "Pending",       short: "Pending",  icon: Clock,       color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200"   },
  APPROVED: { label: "Approved",      short: "Approved", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  REJECTED: { label: "Rejected",      short: "Rejected", icon: XCircle,     color: "text-red-500",     bg: "bg-red-50",     border: "border-red-200"     },
};

// ─── Helpers ─────────────────────────────────────────────────────
function highlightVars(text) {
  if (!text) return null;
  return text.split(/({{[^}]+}})/g).map((p, i) =>
    /^{{.*}}$/.test(p)
      ? <span key={i} className="inline-flex items-center px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[11px] font-mono font-bold mx-0.5">{p}</span>
      : <span key={i}>{p}</span>
  );
}

// ─── Template Card ────────────────────────────────────────────────
function TemplateCard({ template, onEdit, onDelete, onCopy, onSubmit, copied }) {
  const status = META[template.metaStatus?.toUpperCase() || "NONE"];
  const StatusIcon = status.icon;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Status stripe */}
        <div className={`h-1 w-full ${
        template.metaStatus?.toUpperCase() === "APPROVED" ? "bg-emerald-400" :
        template.metaStatus?.toUpperCase() === "PENDING"  ? "bg-amber-400"   :
        template.metaStatus?.toUpperCase() === "REJECTED" ? "bg-red-400"     :
        "bg-gray-100"
      }`} />

      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Title + actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-900 truncate">{template.name}</h3>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${CAT_COLOR[template.category] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
                {template.category}
              </span>
              {template.tags?.slice(0, 2).map(tag => (
                <span key={tag} className="text-[11px] text-gray-400 flex items-center gap-0.5">
                  <Tag size={9}/>{tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={() => onCopy(template)} title="Copy"
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
              {copied === template.id ? <Check size={13} className="text-emerald-500"/> : <Copy size={13}/>}
            </button>
            {(!template.metaStatus || template.metaStatus?.toUpperCase() === "NONE") && (
              <button onClick={() => onEdit(template)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <Edit2 size={13}/>
              </button>
            )}
            <button onClick={() => onDelete(template.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 size={13}/>
            </button>
          </div>
        </div>

        {/* Message bubble */}
        <div className="flex-1 bg-[#f0fdf4] rounded-xl p-3">
          <div className="bg-white rounded-xl rounded-tl-none shadow-sm px-3 py-2.5">
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap break-words line-clamp-4">
              {highlightVars(template.body)}
            </p>
            <p className="text-right text-[9px] text-gray-300 mt-1">✓✓</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border ${status.bg} ${status.border} ${status.color}`}>
            <StatusIcon size={10}/> {status.short}
          </span>
          {(!template.metaStatus || template.metaStatus?.toUpperCase() === "NONE") && (
            <button
              onClick={() => onSubmit(template.id)}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
              Submit to Meta
            </button>
          )}
          {template.metaStatus && template.metaStatus?.toUpperCase() !== "NONE" && (
            <span className="text-[11px] text-gray-400">{template.body.length} chars</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────
function TemplateModal({ open, onClose, onSave, initial }) {
  const [name, setName]         = useState("");
  const [body, setBody]         = useState("");
  const [category, setCategory] = useState("General");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags]         = useState([]);
  const [saving, setSaving]         = useState(false);
  const [showVars, setShowVars]     = useState(false);
  const [mediaUrl, setMediaUrl]     = useState("");
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name || "");
      setBody(initial?.body || "");
      setCategory(initial?.category || "MARKETING");
      setTags(initial?.tags || []);
      setMediaUrl(initial?.mediaUrl || "");
      setTagInput("");
      setShowVars(false);
      setShowCatalog(false);
    }
  }, [open, initial]);

  function insertVar(v) {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    setBody(body.slice(0, s) + v + body.slice(e));
    setTimeout(() => { el.focus(); el.setSelectionRange(s + v.length, s + v.length); }, 0);
    setShowVars(false);
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(p => [...p, t]);
    setTagInput("");
  }
  function openCatalog() {
    setShowCatalog(true);
    if (catalogItems.length > 0) return;
    setCatalogLoading(true);
    fetch("/api/catalog").then(r => r.json()).then(d => {
      setCatalogItems(Array.isArray(d) ? d : []);
      setCatalogLoading(false);
    });
  }

  function insertProduct(item) {
    const text = `🛍️ *${item.name}*\n${item.description ? item.description + "\n" : ""}💰 ${item.currency} ${Number(item.price).toFixed(2)}\n${item.inStock ? "✅ In Stock" : "❌ Out of Stock"}${item.linkUrl ? `\n🔗 ${item.linkUrl}` : ""}`;
    setBody(prev => prev ? prev + "\n\n" + text : text);
    if (item.imageUrl) setMediaUrl(item.imageUrl);
    setShowCatalog(false);
  }
  async function submit() {
    if (!name.trim() || !body.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), body: body.trim(), category, tags, mediaUrl: mediaUrl || null });
    setSaving(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FileText size={16} className="text-emerald-600"/>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">{initial ? "Edit Template" : "New Template"}</h2>
              <p className="text-xs text-gray-400">Reusable WhatsApp message</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
            <X size={15}/>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">

          {/* Name + Category side by side */}
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-3">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Welcome Message"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Category</label>
              <div className="relative">
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 cursor-pointer transition-all">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Message</label>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={openCatalog}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                  <ShoppingBag size={11}/> Insert Product
                </button>
              </div>
            </div>

            {showCatalog && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-600">Select a Product</span>
                  <button onClick={() => setShowCatalog(false)} className="text-gray-400 hover:text-gray-600"><X size={13}/></button>
                </div>
                <div className="px-3 py-2 border-b border-gray-100">
                  <input
                    value={catalogSearch}
                    onChange={e => setCatalogSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-gray-50">
                  {catalogLoading ? (
                    <div className="py-4 text-center text-xs text-gray-400">Loading...</div>
                  ) : catalogItems.filter(i => !catalogSearch || i.name.toLowerCase().includes(catalogSearch.toLowerCase())).length === 0 ? (
                    <div className="py-4 text-center text-xs text-gray-400">No products found</div>
                  ) : (
                    catalogItems
                      .filter(i => !catalogSearch || i.name.toLowerCase().includes(catalogSearch.toLowerCase()))
                      .map(item => (
                        <button key={item.id} onClick={() => insertProduct(item)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 transition-colors text-left">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0"/>
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Package size={14} className="text-gray-400"/>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{item.name}</p>
                            <p className="text-[11px] text-gray-400">{item.currency} {Number(item.price).toFixed(2)}</p>
                          </div>
                          <span className="text-[11px] text-emerald-600 font-semibold flex-shrink-0">Insert</span>
                        </button>
                      ))
                  )}
                </div>
              </div>
            )}
            <textarea ref={textareaRef} value={body} onChange={e => setBody(e.target.value)}
              placeholder="Type your message here..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none transition-all leading-relaxed"
            />
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                <span className="flex items-center gap-1.5"><ImageIcon size={11}/> Image URL <span className="normal-case font-normal">(optional)</span></span>
              </label>
              <input
                value={mediaUrl}
                onChange={e => setMediaUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
              {mediaUrl && (
                <div className="mt-2 relative inline-block">
                  <img src={mediaUrl} alt="Preview" className="h-20 rounded-xl object-cover border border-gray-200"
                    onError={e => { e.target.style.display = "none"; }}/>
                  <button onClick={() => setMediaUrl("")}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                    <X size={10}/>
                  </button>
                </div>
              )}
            </div>
            <div className="flex justify-between mt-1">
              <span className={`text-xs font-medium ${body.length > 1000 ? "text-red-400" : "text-gray-400"}`}>{body.length}/1024</span>
            </div>
          </div>

          {/* Preview */}
          {body && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Preview</label>
              <div className="bg-[#e5ddd5] rounded-xl p-4">
                <div className="bg-white rounded-xl rounded-tl-none shadow-sm px-4 py-3 inline-block max-w-full">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                    {highlightVars(body)}
                  </p>
                  <p className="text-right text-xs text-gray-300 mt-1.5">✓✓</p>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tags <span className="normal-case font-normal">(optional)</span></label>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Type and press Enter…"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
              <button onClick={addTag} className="px-4 py-2.5 rounded-xl bg-gray-100 text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors">Add</button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2.5">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                    <Tag size={9}/>{t}
                    <button onClick={() => setTags(p => p.filter(x => x !== t))} className="hover:text-red-500 ml-0.5 transition-colors"><X size={9}/></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-7 py-5 border-t border-gray-100 bg-gray-50/40">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-white transition-colors">
            Cancel
          </button>
          <button onClick={submit} disabled={saving || !name.trim() || !body.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-40 transition-all shadow-sm">
            {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : <Check size={14}/>}
            {saving ? "Saving…" : initial ? "Save Changes" : "Create Template"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function TemplatesPage() {
  const [templates, setTemplates]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState("All");
  const [statFilter, setStatFilter] = useState("All");
  const [modal, setModal]           = useState({ open: false, template: null });
  const [copied, setCopied]         = useState(null);

  useEffect(() => {
    fetch("/api/templates")
      .then(r => r.json())
      .then(d => { setTemplates(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave(data) {
    if (modal.template) {
      const res = await fetch(`/api/templates/${modal.template.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      const updated = await res.json();
      setTemplates(p => p.map(t => t.id === updated.id ? updated : t));
    } else {
      const res = await fetch("/api/templates", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      const created = await res.json();
      setTemplates(p => [created, ...p]);
    }
    setModal({ open: false, template: null });
  }

  async function handleDelete(id) {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    setTemplates(p => p.filter(t => t.id !== id));
  }

  function handleCopy(template) {
    navigator.clipboard.writeText(template.body);
    setCopied(template.id);
    setTimeout(() => setCopied(null), 2000);
  }
  async function handleSubmit(id) {
    const res = await fetch(`/api/templates/${id}/submit`, { method: "POST" });
    const data = await res.json();
    if (data.metaStatus) {
      setTemplates(p => p.map(t => t.id === id ? { ...t, metaStatus: data.metaStatus, twilioSid: data.twilioSid } : t));
    }
  }

  // Filter logic
  const STATUS_MAP = { All: null, Approved: "APPROVED", Pending: "PENDING", "Not Submitted": "NONE", Rejected: "REJECTED" };

  const filtered = templates.filter(t => {
  const ms = t.metaStatus?.toUpperCase() || "NONE";
    if (catFilter !== "All" && t.category !== catFilter) return false;
    if (statFilter !== "All" && ms !== STATUS_MAP[statFilter]) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.body.toLowerCase().includes(q) || t.tags?.some(g => g.includes(q));
    }
    return true;
  });

  const counts = {
    approved: templates.filter(t => t.metaStatus?.toUpperCase() === "APPROVED").length,
    pending:  templates.filter(t => t.metaStatus?.toUpperCase() === "PENDING").length,
    none:     templates.filter(t => !t.metaStatus || t.metaStatus?.toUpperCase() === "NONE").length,
    rejected: templates.filter(t => t.metaStatus?.toUpperCase() === "REJECTED").length,
  };

  const catCounts = ["All", ...CATEGORIES].reduce((a, c) => {
    a[c] = c === "All" ? templates.length : templates.filter(t => t.category === c).length;
    return a;
  }, {});

  const statusTabs = [
    { key: "All",           label: "All",           count: templates.length, dot: "bg-gray-300"    },
    { key: "Approved",      label: "Approved",      count: counts.approved,  dot: "bg-emerald-400" },
    { key: "Pending",       label: "Pending",       count: counts.pending,   dot: "bg-amber-400"   },
    { key: "Not Submitted", label: "Not Submitted", count: counts.none,      dot: "bg-gray-300"    },
    { key: "Rejected",      label: "Rejected",      count: counts.rejected,  dot: "bg-red-400"     },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9f7]">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Templates</h1>
            <p className="text-xs text-gray-400">{templates.length} saved · {counts.approved} approved by Meta</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search templates…"
                className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white w-60 transition-all"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            </div>
            <button onClick={() => setModal({ open: true, template: null })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm">
              <Plus size={15}/> New Template
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-7 flex gap-7">

        {/* ── Left sidebar ── */}
        <aside className="w-52 flex-shrink-0 space-y-6">

          {/* Meta status filter */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Meta Status</p>
            <div className="space-y-1">
              {statusTabs.map(s => (
                <button key={s.key} onClick={() => setStatFilter(s.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    statFilter === s.key
                      ? "bg-emerald-500 text-white"
                      : "text-gray-600 hover:bg-white hover:shadow-sm"
                  }`}>
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot} ${statFilter === s.key ? "opacity-80" : ""}`}/>
                    {s.label}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${statFilter === s.key ? "bg-emerald-400 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {s.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Category</p>
            <div className="space-y-1">
              {["All", ...CATEGORIES].filter(c => catCounts[c] > 0 || c === "All").map(c => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    catFilter === c
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-white hover:shadow-sm"
                  }`}>
                  <span>{c}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${catFilter === c ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {catCounts[c]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Meta notice */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Info size={12} className="text-amber-500"/>
              <p className="text-xs font-bold text-amber-700">Verification Pending</p>
            </div>
            <p className="text-[11px] text-amber-600 leading-relaxed">
              Once your Meta Business is verified, you can submit templates for approval.
            </p>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0">

          {/* Active filters summary */}
          {(catFilter !== "All" || statFilter !== "All" || search) && (
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <span className="text-xs text-gray-400">Showing {filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
              {catFilter !== "All" && (
                <button onClick={() => setCatFilter("All")}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-red-200 hover:text-red-500 transition-colors">
                  {catFilter} <X size={10}/>
                </button>
              )}
              {statFilter !== "All" && (
                <button onClick={() => setStatFilter("All")}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-red-200 hover:text-red-500 transition-colors">
                  {statFilter} <X size={10}/>
                </button>
              )}
              {search && (
                <button onClick={() => setSearch("")}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-red-200 hover:text-red-500 transition-colors">
                  "{search}" <X size={10}/>
                </button>
              )}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-56 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded-full w-2/3 mb-3"/>
                  <div className="h-3 bg-gray-100 rounded-full w-1/3 mb-4"/>
                  <div className="h-24 bg-gray-50 rounded-xl mb-4"/>
                  <div className="h-3 bg-gray-100 rounded-full w-1/4"/>
                </div>
              ))}
            </div>
          )}

          {/* Grid */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(t => (
              <TemplateCard key={t.id} template={t}
                onEdit={t => setModal({ open: true, template: t })}
                onDelete={handleDelete}
                onCopy={handleCopy}
                onSubmit={handleSubmit}
                copied={copied}
              />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-4">
                <FileText size={22} className="text-gray-300"/>
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">
                {search || catFilter !== "All" || statFilter !== "All" ? "No templates match your filters" : "No templates yet"}
              </p>
              <p className="text-xs text-gray-400 mb-6 max-w-xs leading-relaxed">
                {search || catFilter !== "All" || statFilter !== "All"
                  ? "Try clearing some filters to see more templates"
                  : "Create reusable WhatsApp messages for broadcasts and quick replies"}
              </p>
              {!search && catFilter === "All" && statFilter === "All" && (
                <button onClick={() => setModal({ open: true, template: null })}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm">
                  <Plus size={14}/> Create your first template
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      <TemplateModal
        open={modal.open}
        onClose={() => setModal({ open: false, template: null })}
        onSave={handleSave}
        initial={modal.template}
      />
    </div>
  );
}