"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, X, Search,
  FileText, Package, Bot, Sparkles, Users,
  ChevronDown, Calendar, Send, Clock, Tag,
  MessageSquare, ShoppingBag, Zap, Image as ImageIcon,
  CheckCircle
} from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────

function highlightVars(text) {
  if (!text) return null;
  return text.split(/({{[^}]+}})/g).map((p, i) =>
    /^{{.*}}$/.test(p)
      ? <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs font-mono font-bold mx-0.5">{p}</span>
      : <span key={i}>{p}</span>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepBar({ step }) {
  const steps = ["Compose", "Audience", "Review"];
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        return (
          <div key={label} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                done ? "bg-emerald-500 text-white" :
                active ? "bg-emerald-500 text-white ring-4 ring-emerald-100" :
                "bg-gray-100 text-gray-400"
              }`}>
                {done ? <Check size={13} /> : idx}
              </div>
              <span className={`text-sm font-medium transition-colors ${active ? "text-gray-800" : done ? "text-emerald-600" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-4 h-px w-12 transition-colors ${step > idx ? "bg-emerald-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Template picker modal ────────────────────────────────────────────────────

function TemplatePicker({ onSelect, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => { setTemplates(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const filtered = templates.filter((t) =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-emerald-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Choose a Template</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400"><X size={15} /></button>
        </div>
        <div className="px-6 py-3 border-b border-gray-50">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              autoFocus
            />
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No templates found</div>
          ) : (
            filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelect(t)}
                className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all group"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <span className="font-semibold text-sm text-gray-800 group-hover:text-emerald-700 transition-colors">{t.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full ml-2 flex-shrink-0">{t.category}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{t.body}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Catalog picker modal ─────────────────────────────────────────────────────

function CatalogPicker({ onInsert, onClose }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d) => { setItems(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const filtered = items.filter((i) =>
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  );

  function buildProductText(item) {
    return `🛍️ *${item.name}*\n${item.description ? item.description + "\n" : ""}💰 ${item.currency} ${Number(item.price).toFixed(2)}\n${item.inStock ? "✅ In Stock" : "❌ Out of Stock"}${item.linkUrl ? `\n🔗 ${item.linkUrl}` : ""}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} className="text-emerald-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Insert Product from Catalog</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400"><X size={15} /></button>
        </div>
        <div className="px-6 py-3 border-b border-gray-50">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              autoFocus
            />
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No products found in catalog</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => onInsert(buildProductText(item), item.imageUrl || "")}
                className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all group flex items-center gap-4"
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" onError={(e) => { e.target.style.display = "none"; }} />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Package size={18} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 group-hover:text-emerald-700 truncate transition-colors">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.currency} {Number(item.price).toFixed(2)} · {item.inStock ? "In Stock" : "Out of Stock"}</p>
                </div>
                <span className="text-xs font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  Insert →
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Chatbot picker modal ─────────────────────────────────────────────────────

function ChatbotPicker({ selected, onSelect, onClose }) {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch("/api/chatbot")
    .then((r) => r.json())
    .then((d) => {
      // handle both array and wrapped { chatbots: [] }
      const list = Array.isArray(d) ? d : d.chatbots || d.data || [];
      setBots(list);
      setLoading(false);
    });
}, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-emerald-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Attach a Chatbot</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400"><X size={15} /></button>
        </div>
        <p className="px-6 py-3 text-xs text-gray-500 border-b border-gray-50 bg-gray-50/50">
          When contacts reply to this broadcast, the selected chatbot will automatically respond.
        </p>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          <button
            onClick={() => onSelect(null)}
            className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
              !selected ? "border-emerald-300 bg-emerald-50" : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
              <X size={14} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">No chatbot</p>
              <p className="text-xs text-gray-400">Replies go to your Inbox</p>
            </div>
          </button>
          {loading ? (
            [...Array(2)].map((_, i) => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)
          ) : bots.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No chatbots created yet</div>
          ) : (
            bots.map((bot) => (
              <button
                key={bot.id}
                onClick={() => onSelect(bot)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
                  selected?.id === bot.id ? "border-emerald-300 bg-emerald-50" : "border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/40"
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bot.active ? "bg-emerald-100" : "bg-gray-100"}`}>
                  <Bot size={14} className={bot.active ? "text-emerald-600" : "text-gray-400"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{bot.name}</p>
                  <p className="text-xs text-gray-400">{bot.active ? "Active" : "Inactive"}</p>
                </div>
                {selected?.id === bot.id && <Check size={14} className="text-emerald-500 flex-shrink-0" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const VARIABLES = ["{{name}}", "{{phone}}", "{{email}}", "{{company}}"];

export default function NewBroadcastPage() {
  const router = useRouter();
  const textareaRef = useRef(null);

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1 — Compose
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [sendNow, setSendNow] = useState(true);
  const [showVars, setShowVars] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [showBotPicker, setShowBotPicker] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");

  // Step 2 — Audience
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [contactSearch, setContactSearch] = useState("");
  const [audienceLoaded, setAudienceLoaded] = useState(false);
const [attachedBots, setAttachedBots] = useState([]);

useEffect(() => {
  fetch("/api/chatbot")
    .then(r => r.json())
    .then(d => {
      const list = Array.isArray(d) ? d : d.chatbots || [];
      const defaultBots = list.filter(b => b.isDefault);
      if (defaultBots.length > 0) setAttachedBots(defaultBots);
    });
}, []);
  function loadAudience() {
    if (audienceLoaded) return;
    Promise.all([
      fetch("/api/contacts").then((r) => r.json()),
      fetch("/api/groups").then((r) => r.json()),
    ]).then(([c, g]) => {
      setContacts(Array.isArray(c) ? c : []);
      setGroups(Array.isArray(g) ? g : []);
      setAudienceLoaded(true);
    });
  }

  function goStep2() {
    if (!name.trim() || !message.trim()) return;
    loadAudience();
    setStep(2);
  }

  function insertVar(v) {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    setMessage(message.slice(0, s) + v + message.slice(e));
    setTimeout(() => { el.focus(); el.setSelectionRange(s + v.length, s + v.length); }, 0);
  }

  function insertCatalogText(text, imageUrl) {
    setMessage((prev) => (prev ? prev + "\n\n" + text : text));
    if (imageUrl) setMediaUrl(imageUrl);
    setShowCatalogPicker(false);
  }

  function toggleGroup(g) {
    const ids = (g.members || []).map((m) => m.contactId || m.contact?.id).filter(Boolean);
    const allOn = ids.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) => allOn ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]);
  }

  function toggleContact(id) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  const filteredContacts = contacts.filter((c) =>
    !contactSearch || c.name?.toLowerCase().includes(contactSearch.toLowerCase()) || c.phone?.includes(contactSearch)
  );

  async function handleSubmit() {
    if (!selectedIds.length) return;
    setSaving(true);
    const res = await fetch("/api/broadcasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        message: message.trim(),
        mediaUrl: mediaUrl || null,
        contactIds: selectedIds,
        scheduledAt: sendNow ? null : scheduledAt || null,
        status: sendNow ? "sent" : scheduledAt ? "scheduled" : "draft",
        chatbotIds: attachedBots.map(b => b.id),
      }),
    });
    if (res.ok) router.push("/broadcasts");
    else setSaving(false);
  }

  const selectedContacts = contacts.filter((c) => selectedIds.includes(c.id));

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : router.push("/broadcasts")}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={17} />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900">New Broadcast</h1>
              <p className="text-xs text-gray-400">Send a message campaign to your contacts</p>
            </div>
          </div>
          <StepBar step={step} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* ─── STEP 1: Compose ─── */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left — editor */}
            <div className="lg:col-span-3 space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Campaign Name *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Summer Sale Announcement"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowTemplatePicker(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
                  >
                    <FileText size={12} /> Use Template
                  </button>
                  <button
                    onClick={() => setShowCatalogPicker(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
                  >
                    <ShoppingBag size={12} /> Insert Product
                  </button>
                  <button
                    onClick={() => setShowVars((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
                  >
                    <Sparkles size={12} /> Variables
                  </button>
                </div>

                {showVars && (
                  <div className="flex flex-wrap gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    {VARIABLES.map((v) => (
                      <button
                        key={v}
                        onClick={() => { insertVar(v); setShowVars(false); }}
                        className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Message *</label>
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={7}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none transition-all leading-relaxed"
                  />
                  <div className="flex justify-between mt-1.5">
                    <p className="text-xs text-gray-400">Use {"{{name}}"} for personalization</p>
                    <span className={`text-xs font-medium ${message.length > 1000 ? "text-red-400" : "text-gray-400"}`}>{message.length}/1024</span>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Timing</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSendNow(true)}
                    className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      sendNow ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <Send size={14} />
                    Send Immediately
                  </button>
                  <button
                    onClick={() => setSendNow(false)}
                    className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      !sendNow ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <Clock size={14} />
                    Schedule
                  </button>
                </div>
                {!sendNow && (
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                )}
              </div>

              {/* Chatbot attachment */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Auto-Reply Chatbot</h3>
                    <p className="text-xs text-gray-400">Handle replies automatically when contacts respond</p>
                  </div>
                  <button
                    onClick={() => setShowBotPicker(true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all flex-shrink-0 ml-4"
                  >
                    <Bot size={13} />
                    {attachedBots?.length > 0 ? "Add Another Bot" : "Attach Bot"}
                  </button>
                </div>
                {attachedBots?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachedBots.map(bot => (
                      <div key={bot.id} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <div className="w-7 h-7 rounded-lg bg-emerald-200 flex items-center justify-center">
                          <Bot size={13} className="text-emerald-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-emerald-800 truncate">{bot.name}</p>
                          <p className="text-xs text-emerald-600">Will handle replies</p>
                        </div>
                        <button
                          onClick={() => setAttachedBots(prev => prev.filter(b => b.id !== bot.id))}
                          className="text-emerald-500 hover:text-emerald-700 transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right — preview */}
            <div className="lg:col-span-2">
              <div className="sticky top-28 space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Phone chrome */}
                  <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-300/30 flex items-center justify-center">
                      <Users size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Your Contact</p>
                      <p className="text-xs text-emerald-200/70">WhatsApp</p>
                    </div>
                  </div>
                  <div className="bg-[#ECE5DD] p-4 min-h-36">
                    {message ? (
                      <div className="bg-white rounded-xl rounded-tl-none shadow-sm px-3 py-2.5 max-w-[85%]">
                        <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed break-words">
                          {highlightVars(message)}
                        </p>
                        <p className="text-right text-[10px] text-gray-400 mt-1.5">
                          {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} ✓✓
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-28 text-gray-400 text-xs">
                        Preview will appear here
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={goStep2}
                  disabled={!name.trim() || !message.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-emerald-200"
                >
                  Continue to Audience <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Audience ─── */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-0.5">Choose Audience</h2>
                <p className="text-sm text-gray-400">Select groups or individual contacts to receive this broadcast</p>
              </div>

              {/* Groups */}
              {!audienceLoaded ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
                </div>
              ) : groups.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Users size={11} /> Groups
                  </p>
                  <div className="space-y-2">
                    {groups.map((g) => {
                      const mIds = (g.members || []).map((m) => m.contactId || m.contact?.id).filter(Boolean);
                      const allOn = mIds.length > 0 && mIds.every((id) => selectedIds.includes(id));
                      const someOn = mIds.some((id) => selectedIds.includes(id));
                      return (
                        <div
                          key={g.id}
                          onClick={() => toggleGroup(g)}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                            allOn ? "border-emerald-400 bg-emerald-50" : someOn ? "border-emerald-200 bg-emerald-50/50" : "border-gray-100 hover:border-emerald-200 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              allOn ? "bg-emerald-500 border-emerald-500" : someOn ? "bg-emerald-200 border-emerald-300" : "border-gray-300"
                            }`}>
                              {allOn && <Check size={11} className="text-white" />}
                              {someOn && !allOn && <div className="w-2 h-0.5 bg-emerald-700 rounded" />}
                            </div>
                            <span className="font-medium text-gray-800 text-sm">{g.name}</span>
                          </div>
                          <span className="text-xs text-gray-400">{g.members?.length || 0} members</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Individual contacts */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MessageSquare size={11} /> Individual Contacts
                </p>
                <div className="relative mb-3">
                  <input
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Search contacts..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white transition-all"
                  />
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <div className="rounded-xl border border-gray-100 overflow-hidden max-h-64 overflow-y-auto divide-y divide-gray-50">
                  {!audienceLoaded ? (
                    [...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-50 animate-pulse" />)
                  ) : filteredContacts.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400">No contacts found</div>
                  ) : (
                    filteredContacts.map((c) => {
                      const on = selectedIds.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => toggleContact(c.id)}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${on ? "bg-emerald-50" : "hover:bg-gray-50/80"}`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${on ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`}>
                            {on && <Check size={11} className="text-white" />}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 flex-shrink-0">
                            {c.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.phone}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Selected count */}
            {selectedIds.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-700">
                    {selectedIds.length} contact{selectedIds.length !== 1 ? "s" : ""} selected
                  </span>
                </div>
                <button onClick={() => setSelectedIds([])} className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">Clear all</button>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={selectedIds.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-emerald-200"
              >
                Review <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Review ─── */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto space-y-5">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Campaign</p>
                <p className="font-bold text-gray-900 text-sm truncate">{name}</p>
                <p className="text-xs text-gray-400 mt-1">{sendNow ? "Sends immediately" : scheduledAt ? `Scheduled for ${new Date(scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}` : "Draft"}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recipients</p>
                <p className="font-bold text-gray-900 text-3xl">{selectedIds.length}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedContacts.slice(0, 2).map((c) => c.name).join(", ")}
                  {selectedContacts.length > 2 ? ` +${selectedContacts.length - 2} more` : ""}
                </p>
              </div>
            </div>

            {/* Message preview */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
                <MessageSquare size={14} className="text-gray-400" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Message Preview</p>
              </div>
              <div className="bg-[#ECE5DD] p-5">
                <div className="bg-white rounded-xl rounded-tl-none shadow-sm px-4 py-3 max-w-[85%]">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed break-words">
                    {highlightVars(message)}
                  </p>
                  <p className="text-right text-xs text-gray-400 mt-2">
                    {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} ✓✓
                  </p>
                </div>
              </div>
            </div>

            {/* Chatbot */}
            {attachedBots.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Auto-Reply Bots</p>
                {attachedBots.map(bot => (
                  <div key={bot.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Bot size={16} className="text-emerald-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{bot.name}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-md shadow-emerald-200"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                {saving ? "Sending..." : sendNow ? `Send to ${selectedIds.length} contacts` : "Schedule Broadcast"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showTemplatePicker && (
        <TemplatePicker
          onSelect={(t) => { setMessage(t.body); setShowTemplatePicker(false); }}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}
      {showCatalogPicker && (
        <CatalogPicker
          onInsert={insertCatalogText}
          onClose={() => setShowCatalogPicker(false)}
        />
      )}
      {showBotPicker && (
        <ChatbotPicker
          selected={attachedBots}
          onSelect={(bot) => { if (bot) setAttachedBots(prev => prev.find(b => b.id === bot.id) ? prev : [...prev, bot]); setShowBotPicker(false); }}
          onClose={() => setShowBotPicker(false)}
        />
      )}
    </div>
  );
}