"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, Search, Copy, Edit2, Trash2, FileText,
  X, Check, ChevronDown, Tag, Sparkles, MessageSquare
} from "lucide-react";

const CATEGORIES = ["All", "General", "Sales", "Support", "Onboarding", "Follow-up", "Promotional", "Reminder"];

const VARIABLES = ["{{name}}", "{{phone}}", "{{email}}", "{{company}}", "{{date}}", "{{amount}}"];

const CATEGORY_COLORS = {
  General:     "bg-slate-100 text-slate-600",
  Sales:       "bg-emerald-50 text-emerald-700",
  Support:     "bg-sky-50 text-sky-700",
  Onboarding:  "bg-violet-50 text-violet-700",
  "Follow-up": "bg-amber-50 text-amber-700",
  Promotional: "bg-rose-50 text-rose-700",
  Reminder:    "bg-orange-50 text-orange-700",
};

function highlightVariables(text) {
  if (!text) return null;
  const parts = text.split(/({{[^}]+}})/g);
  return parts.map((part, i) =>
    /^{{.*}}$/.test(part) ? (
      <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-semibold font-mono mx-0.5">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function TemplateCard({ template, onEdit, onDelete, onCopy, copied }) {
  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 overflow-hidden flex flex-col">
      {/* Top accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate pr-2">{template.name}</h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[template.category] || "bg-gray-100 text-gray-600"}`}>
                {template.category}
              </span>
              {template.tags?.map((tag) => (
                <span key={tag} className="text-xs text-gray-400 flex items-center gap-1">
                  <Tag size={10} />{tag}
                </span>
              ))}
            </div>
          </div>
          {/* Action buttons - visible on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
            <button
              onClick={() => onCopy(template)}
              className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
              title="Copy message"
            >
              {copied === template.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
            <button
              onClick={() => onEdit(template)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(template.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* WhatsApp bubble preview */}
        <div className="flex-1 bg-[#f0fdf4] rounded-xl p-3 border border-emerald-100/80">
          <div className="bg-white rounded-xl rounded-tl-none shadow-sm px-3 py-2.5 inline-block max-w-full">
            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
              {highlightVariables(template.body)}
            </p>
            <p className="text-right text-[10px] text-gray-300 mt-1.5">✓✓</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-400">
            {new Date(template.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <MessageSquare size={10} />
            {template.body.length} chars
          </span>
        </div>
      </div>
    </div>
  );
}

function TemplateModal({ open, onClose, onSave, initial }) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("General");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showVars, setShowVars] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name || "");
      setBody(initial?.body || "");
      setCategory(initial?.category || "General");
      setTags(initial?.tags || []);
      setTagInput("");
    }
  }, [open, initial]);

  function insertVariable(v) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newBody = body.slice(0, start) + v + body.slice(end);
    setBody(newBody);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + v.length, start + v.length);
    }, 0);
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  async function handleSubmit() {
    if (!name.trim() || !body.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), body: body.trim(), category, tags });
    setSaving(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FileText size={15} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">
                {initial ? "Edit Template" : "New Template"}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Design a reusable message</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Template Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Welcome Message, Follow-up Reminder..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-3 focus:ring-emerald-100 transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-emerald-400 focus:ring-3 focus:ring-emerald-100 bg-white transition-all cursor-pointer"
              >
                {CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Message Body */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</label>
              <button
                onClick={() => setShowVars((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <Sparkles size={12} />
                Insert variable
              </button>
            </div>
            {showVars && (
              <div className="flex flex-wrap gap-2 mb-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                {VARIABLES.map((v) => (
                  <button
                    key={v}
                    onClick={() => { insertVariable(v); setShowVars(false); }}
                    className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all"
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hi {{name}}, thanks for reaching out! ..."
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-3 focus:ring-emerald-100 resize-none transition-all font-[inherit] leading-relaxed"
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-gray-400">Use {"{{name}}, {{company}}"} etc. for dynamic values</p>
              <span className={`text-xs font-medium ${body.length > 1000 ? "text-red-400" : "text-gray-400"}`}>
                {body.length}/1024
              </span>
            </div>
          </div>

          {/* Live preview */}
          {body && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Preview</label>
              <div className="bg-[#f0fdf4] rounded-xl p-4 border border-emerald-100">
                <div className="bg-white rounded-xl rounded-tl-none shadow-sm px-4 py-3 inline-block max-w-full">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                    {highlightVariables(body)}
                  </p>
                  <p className="text-right text-xs text-gray-300 mt-1.5">✓✓</p>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tags</label>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add a tag and press Enter..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-3 focus:ring-emerald-100 transition-all"
              />
              <button
                onClick={addTag}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2.5">
                {tags.map((t) => (
                  <span key={t} className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                    <Tag size={10} />{t}
                    <button onClick={() => setTags((prev) => prev.filter((x) => x !== t))} className="hover:text-red-500 transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-400">
            {initial ? "Changes saved to your workspace" : "Template saved to your workspace"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !name.trim() || !body.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-emerald-200"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Check size={14} />
              )}
              {saving ? "Saving..." : initial ? "Save Changes" : "Create Template"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [modal, setModal] = useState({ open: false, template: null });
  const [copied, setCopied] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => { setTemplates(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave(data) {
    if (modal.template) {
      const res = await fetch(`/api/templates/${modal.template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } else {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const created = await res.json();
      setTemplates((prev) => [created, ...prev]);
    }
    setModal({ open: false, template: null });
  }

  async function handleDelete(id) {
    if (!confirm("Delete this template?")) return;
    setDeleting(id);
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setDeleting(null);
  }

  function handleCopy(template) {
    navigator.clipboard.writeText(template.body);
    setCopied(template.id);
    setTimeout(() => setCopied(null), 2000);
  }

  const filtered = templates.filter((t) => {
    const matchCat = activeCategory === "All" || t.category === activeCategory;
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.body.toLowerCase().includes(search.toLowerCase()) ||
      t.tags?.some((tag) => tag.includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const counts = CATEGORIES.reduce((acc, c) => {
    acc[c] = c === "All" ? templates.length : templates.filter((t) => t.category === c).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Templates</h1>
            <p className="text-xs text-gray-400 mt-0.5">{templates.length} template{templates.length !== 1 ? "s" : ""} in your library</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden sm:block">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-3 focus:ring-emerald-100 bg-white w-56 transition-all"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <button
              onClick={() => setModal({ open: true, template: null })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200 whitespace-nowrap"
            >
              <Plus size={15} />
              New Template
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            counts[cat] > 0 || cat === "All" ? (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-emerald-200 hover:text-emerald-600"
                }`}
              >
                {cat}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeCategory === cat ? "bg-emerald-400 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {counts[cat]}
                </span>
              </button>
            ) : null
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-52 animate-pulse">
                <div className="h-4 bg-gray-100 rounded-full w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded-full w-1/3 mb-4" />
                <div className="h-24 bg-gray-50 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onEdit={(t) => setModal({ open: true, template: t })}
                onDelete={handleDelete}
                onCopy={handleCopy}
                copied={copied}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
              <FileText size={24} className="text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              {search || activeCategory !== "All" ? "No templates match your search" : "No templates yet"}
            </h3>
            <p className="text-xs text-gray-400 mb-5 max-w-xs">
              {search || activeCategory !== "All"
                ? "Try a different search term or category"
                : "Create reusable messages you can send to contacts or use in broadcasts"}
            </p>
            {!search && activeCategory === "All" && (
              <button
                onClick={() => setModal({ open: true, template: null })}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200"
              >
                <Plus size={14} />
                Create your first template
              </button>
            )}
          </div>
        )}
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