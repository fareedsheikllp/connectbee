"use client";
import { useState, useEffect, useRef } from "react";
import {
  MessageSquare, Search, Send, Phone, CheckCheck,
  Bot, Circle, Loader2, Tag, Flag, X, ChevronDown,
  Clock, AlertCircle, Zap, FileText, Plus, Trash2,
  StickyNote, RefreshCw, PanelRightOpen, PanelRightClose,
  Filter, Lock
} from "lucide-react";
import toast from "react-hot-toast";

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  ALL:      { label: "All",      dot: null             },
  OPEN:     { label: "Open",     dot: "bg-emerald-500" },
  BOT:      { label: "Bot",      dot: "bg-blue-500"    },
  RESOLVED: { label: "Resolved", dot: "bg-slate-400"   },
};

const PRIORITY_CONFIG = {
  NONE:   { label: "No Priority", color: "text-slate-400",  bg: "bg-slate-50",  dot: "bg-slate-300",  border: "border-slate-200"  },
  LOW:    { label: "Low",         color: "text-sky-600",    bg: "bg-sky-50",    dot: "bg-sky-400",    border: "border-sky-200"    },
  MEDIUM: { label: "Medium",      color: "text-amber-600",  bg: "bg-amber-50",  dot: "bg-amber-400",  border: "border-amber-200"  },
  HIGH:   { label: "High",        color: "text-orange-600", bg: "bg-orange-50", dot: "bg-orange-500", border: "border-orange-200" },
  URGENT: { label: "Urgent",      color: "text-red-600",    bg: "bg-red-50",    dot: "bg-red-500",    border: "border-red-200"    },
};

const LABEL_CFG = {
  vip:        { pill: "bg-purple-100 text-purple-700 border-purple-200",    dot: "bg-purple-400"  },
  billing:    { pill: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-400" },
  bug:        { pill: "bg-red-100 text-red-700 border-red-200",             dot: "bg-red-400"     },
  sales:      { pill: "bg-blue-100 text-blue-700 border-blue-200",          dot: "bg-blue-400"    },
  support:    { pill: "bg-amber-100 text-amber-700 border-amber-200",       dot: "bg-amber-400"   },
  followup:   { pill: "bg-pink-100 text-pink-700 border-pink-200",          dot: "bg-pink-400"    },
  onboarding: { pill: "bg-teal-100 text-teal-700 border-teal-200",          dot: "bg-teal-400"    },
};
const ALL_LABELS = Object.keys(LABEL_CFG);
const PRIORITY_ORDER = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3, NONE: 4 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLabels(str) { return str ? str.split(",").filter(Boolean) : []; }

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return new Date(date).toLocaleDateString([], { month: "short", day: "numeric" });
}

function isDueOverdue(d) { return d ? new Date(d) < new Date() : false; }
function isDueSoon(d) { if (!d) return false; const diff = new Date(d) - new Date(); return diff > 0 && diff < 7200000; }
function formatDue(d) {
  if (!d) return null;
  const now = new Date();
  const due = new Date(d);
  const diff = due - now;
  const abs = Math.abs(diff);
  const totalMins = Math.floor(abs / 60000);
  const totalHrs = Math.floor(abs / 3600000);
  const totalDays = Math.floor(abs / 86400000);

  let label;
  if (totalDays >= 2) {
    label = due.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } else if (totalDays === 1) {
    label = `${totalHrs}h ${totalMins % 60}m`;
  } else if (totalHrs >= 1) {
    label = `${totalHrs}h ${totalMins % 60}m`;
  } else {
    label = `${totalMins}m`;
  }

  return diff < 0 ? `Overdue by ${label}` : `Due in ${label}`;
}
// ── FixedDropdown — backdrop closes on outside click, nothing blocks inside ───

function FixedDropdown({ triggerRef, open, onClose, children, width = 160, align = "left" }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const left = align === "right" ? r.right - width : r.left;
      setPos({ top: r.bottom + 6, left });
    }
  }, [open]);

  if (!open) return null;
  return (
    <>
      {/* Invisible full-screen backdrop — click it to close */}
      <div className="fixed inset-0" style={{ zIndex: 9998 }} onMouseDown={onClose} />
      {/* Menu renders on top of backdrop */}
      <div
        style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999, width }}
        className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden"
      >
        {children}
      </div>
    </>
  );
}

// ── Priority Picker ───────────────────────────────────────────────────────────

function PriorityPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const cfg = PRIORITY_CONFIG[value] || PRIORITY_CONFIG.NONE;

  return (
    <>
      <button ref={btnRef} onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border transition-all ${cfg.bg} ${cfg.color} ${cfg.border}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
        {cfg.label}
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <FixedDropdown triggerRef={btnRef} open={open} onClose={() => setOpen(false)} width={160} align="left">
        <div className="py-1">
          {Object.entries(PRIORITY_CONFIG).map(([key, c]) => (
            <button key={key}
              onClick={() => { onChange(key); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-all ${value === key ? "bg-slate-50" : ""}`}
            >
              <span className={`w-2 h-2 rounded-full ${c.dot}`} />
              <span className={c.color}>{c.label}</span>
              {value === key && <CheckCheck size={11} className="ml-auto text-emerald-500" />}
            </button>
          ))}
        </div>
      </FixedDropdown>
    </>
  );
}

// ── Label Manager ─────────────────────────────────────────────────────────────

function LabelManager({ labels, onChange }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);

  function toggle(label) {
    const s = new Set(labels);
    s.has(label) ? s.delete(label) : s.add(label);
    onChange(Array.from(s));
  }

  return (
    <>
      <button ref={btnRef} onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border transition-all ${
          labels.length > 0 ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
        }`}
      >
        <Tag size={11} />
        {labels.length > 0 ? `${labels.length} Label${labels.length > 1 ? "s" : ""}` : "Labels"}
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <FixedDropdown triggerRef={btnRef} open={open} onClose={() => setOpen(false)} width={192} align="left">
        <div className="py-1">
          <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Toggle Labels</p>
          {ALL_LABELS.map(label => {
            const active = labels.includes(label);
            const lc = LABEL_CFG[label];
            return (
              <button key={label}
                onClick={() => toggle(label)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 transition-all"
              >
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${lc.pill}`}>{label}</span>
                {active && <CheckCheck size={11} className="text-emerald-500" />}
              </button>
            );
          })}
        </div>
      </FixedDropdown>
    </>
  );
}

// ── Due Date Picker ───────────────────────────────────────────────────────────

function DueDatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const overdue = isDueOverdue(value);
  const soon = isDueSoon(value);
  const formatted = formatDue(value);
  const [dueDate, setDueDate] = useState(value ? new Date(value).toISOString().slice(0, 10) : "");
  const [dueTime, setDueTime] = useState(value ? new Date(value).toTimeString().slice(0, 5) : "12:00");

  const quickOptions = [
    { label: "1 hour",   ms: 3600000   },
    { label: "4 hours",  ms: 14400000  },
    { label: "Tomorrow", ms: 86400000  },
    { label: "2 days",   ms: 172800000 },
    { label: "1 week",   ms: 604800000 },
  ];

  return (
    <>
      <button ref={btnRef} onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border transition-all ${
          overdue ? "bg-red-50 text-red-600 border-red-200" :
          soon    ? "bg-amber-50 text-amber-600 border-amber-200" :
          value   ? "bg-slate-100 text-slate-600 border-slate-200" :
                    "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
        }`}
      >
        {overdue ? <AlertCircle size={11} /> : <Clock size={11} />}
        {formatted || "Due Date"}
        {value
          ? <X size={10} className="ml-0.5" onClick={e => { e.stopPropagation(); onChange(null); }} />
          : <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        }
      </button>
      <FixedDropdown triggerRef={btnRef} open={open} onClose={() => setOpen(false)} width={208} align="left">
        <div className="py-1">
          <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Set</p>
          {quickOptions.map(opt => (
            <button key={opt.label}
              onClick={() => { onChange(new Date(Date.now() + opt.ms).toISOString()); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all"
            >
              <Clock size={11} className="text-slate-400" /> {opt.label}
            </button>
          ))}
          {/* Custom date input — stopPropagation so clicking the input doesn't trigger backdrop */}
          <div className="border-t border-slate-100 px-3 pt-2 pb-2" onClick={e => e.stopPropagation()}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Custom</p>
            <div className="flex gap-1 w-full" onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
              <input
                type="date"
                className="w-1/2 text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 outline-none focus:border-amber-400"
                value={dueDate}
                onChange={e => {
                  setDueDate(e.target.value);
                  if (e.target.value && dueTime) {
                    onChange(new Date(`${e.target.value}T${dueTime}:00`).toISOString());
                  }
                }}
              />
              <input
                type="time"
                className="w-1/2 text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 outline-none focus:border-amber-400"
                value={dueTime}
                onChange={e => {
                  setDueTime(e.target.value);
                  if (dueDate && e.target.value) {
                    onChange(new Date(`${dueDate}T${e.target.value}:00`).toISOString());
                  }
                }}
              />
            </div>
          </div>
          {value && (
            <div className="border-t border-slate-100 px-3 py-2">
              <button
                onClick={() => { onChange(null); setOpen(false); }}
                className="text-xs text-red-500 hover:text-red-600 font-medium"
              >
                Remove due date
              </button>
            </div>
          )}
        </div>
      </FixedDropdown>
    </>
  );
}

// ── Filter Popover ────────────────────────────────────────────────────────────

function FilterPopover({ priorityFilter, setPriorityFilter, labelFilter, setLabelFilter, activeCount, onClear }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);

  return (
    <>
      <button ref={btnRef} onClick={() => setOpen(o => !o)}
        className={`relative flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border transition-all ${
          activeCount > 0 ? "bg-brand-500 text-white border-brand-500" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
        }`}
      >
        <Filter size={12} />
        Filter
        {activeCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-white text-brand-600 text-[10px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <FixedDropdown triggerRef={btnRef} open={open} onClose={() => setOpen(false)} width={260} align="left">
        <div className="p-3 space-y-3">

          {/* Priority */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Priority</p>
            <div className="flex flex-wrap gap-1">
              {["ALL", "URGENT", "HIGH", "MEDIUM", "LOW", "NONE"].map(p => {
                const active = priorityFilter === p;
                const pc = p !== "ALL" ? PRIORITY_CONFIG[p] : null;
                return (
                  <button key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-semibold border transition-all ${
                      active
                        ? "bg-brand-500 text-white border-brand-500"
                        : pc
                          ? `${pc.bg} ${pc.color} ${pc.border}`
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {pc && !active && <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />}
                    {p === "ALL" ? "All" : pc?.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Label */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Label</p>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setLabelFilter("ALL")}
                className={`h-6 px-2.5 rounded-full text-[11px] font-semibold border transition-all ${
                  labelFilter === "ALL" ? "bg-brand-500 text-white border-brand-500" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                }`}
              >All</button>
              {ALL_LABELS.map(lbl => {
                const active = labelFilter === lbl;
                const lc = LABEL_CFG[lbl];
                return (
                  <button key={lbl}
                    onClick={() => setLabelFilter(active ? "ALL" : lbl)}
                    className={`flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-semibold border transition-all ${
                      active ? "bg-brand-500 text-white border-brand-500" : lc.pill
                    }`}
                  >
                    {!active && <span className={`w-1.5 h-1.5 rounded-full ${lc.dot}`} />}
                    {lbl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clear */}
          {activeCount > 0 && (
            <button
              onClick={() => { onClear(); setOpen(false); }}
              className="w-full h-7 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 border border-red-100 transition-all"
            >
              Clear all filters
            </button>
          )}
        </div>
      </FixedDropdown>
    </>
  );
}

// ── Canned Responses Modal ────────────────────────────────────────────────────

function CannedResponsesModal({ onClose, onInsert }) {
  const [canned, setCanned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ shortcut: "", title: "", content: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/inbox/canned").then(r => r.json())
      .then(d => { setCanned(d.canned || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!form.shortcut.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/inbox/canned", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortcut: form.shortcut.trim(), title: form.title.trim() || form.shortcut.trim(), content: form.content.trim() }),
      });
      const data = await res.json();
      setCanned(c => [...c, data.canned]);
      setForm({ shortcut: "", title: "", content: "" });
      setShowForm(false);
      toast.success("Saved");
    } catch { toast.error("Failed"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    await fetch("/api/inbox/canned", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setCanned(c => c.filter(x => x.id !== id));
    toast.success("Deleted");
  }

  const filtered = canned.filter(c =>
    c.shortcut.includes(search.toLowerCase()) || c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col" style={{ maxHeight: "80vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
              <Zap size={15} className="text-brand-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Canned Responses</h3>
              <p className="text-[11px] text-slate-400">Type / in reply box · {canned.length} saved</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowForm(f => !f)}
              className="flex items-center gap-1.5 h-8 px-3 bg-brand-500 text-white rounded-lg text-xs font-semibold hover:bg-brand-600 transition-all"
            >
              <Plus size={12} /> New
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-all">
              <X size={15} />
            </button>
          </div>
        </div>

        {showForm && (
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Shortcut</label>
                <div className="flex items-center h-9 border border-slate-200 rounded-lg bg-white overflow-hidden focus-within:border-brand-400 transition-all">
                  <span className="px-2 text-slate-400 text-sm font-mono">/</span>
                  <input value={form.shortcut} onChange={e => setForm(f => ({ ...f, shortcut: e.target.value }))}
                    placeholder="refund" className="flex-1 h-full pr-2 text-xs text-slate-700 outline-none"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Refund Policy"
                  className="w-full h-9 border border-slate-200 rounded-lg px-3 text-xs text-slate-700 outline-none bg-white focus:border-brand-400 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Message</label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Hi! Our refund policy is..." rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none bg-white focus:border-brand-400 resize-none transition-all"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="h-8 px-3 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={handleAdd} disabled={saving || !form.shortcut.trim() || !form.content.trim()}
                className="h-8 px-4 rounded-lg text-xs font-semibold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 flex items-center gap-1.5 transition-all"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : null} Save
              </button>
            </div>
          </div>
        )}

        <div className="px-5 py-3 border-b border-slate-100">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shortcuts..."
              className="w-full h-9 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 text-xs placeholder:text-slate-300 outline-none focus:border-brand-400 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5">
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={18} className="animate-spin text-brand-500" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <FileText size={28} className="text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">{search ? "No matches" : "No canned responses yet"}</p>
              {!search && <p className="text-xs text-slate-300 mt-1">Click New to create your first one</p>}
            </div>
          ) : (
            filtered.map(c => (
              <div key={c.id} className="group flex items-start gap-3 p-3 border border-slate-100 rounded-xl hover:border-brand-200 hover:bg-brand-50/30 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <code className="text-[11px] font-bold text-brand-600 bg-brand-50 border border-brand-100 px-1.5 py-0.5 rounded">/{c.shortcut}</code>
                    <span className="text-xs font-semibold text-slate-700 truncate">{c.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{c.content}</p>
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                  <button onClick={() => { onInsert(c.content); onClose(); }}
                    className="h-7 px-2.5 bg-brand-500 text-white rounded-lg text-xs font-semibold hover:bg-brand-600 transition-all"
                  >Use</button>
                  <button onClick={() => handleDelete(c.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                  ><Trash2 size={13} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Notes Panel ───────────────────────────────────────────────────────────────

function NotesPanel({ conversationId, onClose, onNotesLoaded }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    fetch(`/api/inbox/${conversationId}/messages`).then(r => r.json())
      .then(d => {
  const n = (d.messages || []).filter(m => m.isInternal);
  setNotes(n);
  setLoading(false);
  if (onNotesLoaded) onNotesLoaded(n.length);
})      .catch(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [notes]);

  async function addNote(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/inbox/${conversationId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim(), isInternal: true }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error("Failed"); return; }
      setNotes(n => {
        const updated = [...n, data.message];
        if (onNotesLoaded) onNotesLoaded(updated.length);
        return updated;
      });
      setText("");
    } catch { toast.error("Something went wrong"); }
    finally { setSaving(false); }
  }

  return (
    <div className="w-64 flex-shrink-0 flex flex-col border-l border-amber-200 bg-amber-50/60">
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200 bg-amber-50">
        <div className="flex items-center gap-2">
          <Lock size={13} className="text-amber-500" />
          <span className="text-xs font-bold text-amber-800">Internal Notes</span>
          {notes.length > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-200 text-amber-700 text-[10px] font-bold flex items-center justify-center">
              {notes.length}
            </span>
          )}
        </div>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-amber-100 text-amber-400 hover:text-amber-600 transition-all">
          <X size={13} />
        </button>
      </div>
      <p className="px-3 py-1.5 bg-amber-50 border-b border-amber-100 text-[10px] text-amber-500 font-medium">
        Only visible to you · never sent to customer
      </p>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={15} className="animate-spin text-amber-400" /></div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <StickyNote size={24} className="text-amber-200 mb-2" />
            <p className="text-xs font-semibold text-amber-400">No notes yet</p>
            <p className="text-[10px] text-amber-300 mt-0.5">Write one below</p>
          </div>
        ) : (
          notes.map(note => (
            <div key={note.id} className="bg-white border border-amber-200 rounded-xl p-3 shadow-sm">
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
              <p className="text-[10px] text-amber-400 mt-1.5">
                {new Date(note.sentAt).toLocaleDateString([], { month: "short", day: "numeric" })} · {new Date(note.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-amber-200 bg-amber-50">
        <form onSubmit={addNote} className="space-y-2">
          <textarea
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNote(e); } }}
            placeholder="Add a note... (Enter to save)"
            rows={3}
            className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 placeholder:text-amber-300 outline-none focus:border-amber-400 resize-none transition-all"
          />
          <button type="submit" disabled={!text.trim() || saving}
            className="w-full h-8 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <StickyNote size={12} />}
            Save Note
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Inbox ────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [labelFilter, setLabelFilter] = useState("ALL");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showCanned, setShowCanned] = useState(false);
  const [cannedSuggestions, setCannedSuggestions] = useState([]);
  const [allCanned, setAllCanned] = useState([]);
  const bottomRef = useRef(null);
  const [lastSeenAt, setLastSeenAt] = useState({});
  const [notesCount, setNotesCount] = useState(0);

  useEffect(() => {
    fetch("/api/inbox/canned").then(r => r.json()).then(d => setAllCanned(d.canned || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (reply.startsWith("/") && reply.length > 1) {
      const q = reply.slice(1).toLowerCase();
      setCannedSuggestions(allCanned.filter(c => c.shortcut.startsWith(q) || c.title.toLowerCase().includes(q)).slice(0, 5));
    } else {
      setCannedSuggestions([]);
    }
  }, [reply, allCanned]);

  useEffect(() => {
    fetchConversations();
    const iv = setInterval(async () => {
      try { const r = await fetch("/api/inbox"); const d = await r.json(); setConversations(d.conversations || []); } catch {}
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetchMessages(selected.id);
    setNotesCount(0);
    fetch(`/api/inbox/${selected.id}/messages`)
      .then(r => r.json())
      .then(d => {
        const count = (d.messages || []).filter(m => m.isInternal).length;
        setNotesCount(count);
      })
      .catch(() => {});
    setLastSeenAt(p => ({ ...p, [selected.id]: new Date().toISOString() }));
    const iv = setInterval(async () => {
      try {
        const r = await fetch(`/api/inbox/${selected.id}/messages`);
        const d = await r.json();
        const incoming = (d.messages || []).filter(m => !m.isInternal);
        setMessages(prev => {
          const ids = new Set(prev.map(m => m.id));
          const merged = [...prev];
          incoming.forEach(m => { if (!ids.has(m.id)) merged.push(m); });
          return merged.length !== prev.length ? merged : prev;
        });
        setLastSeenAt(p => ({ ...p, [selected.id]: new Date().toISOString() }));
      } catch {}
    }, 3000);
    return () => clearInterval(iv);
  }, [selected]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function fetchConversations(silent = false) {
    if (!silent) setLoading(true);
    try {
      const r = await fetch("/api/inbox"); const d = await r.json();
      setConversations(d.conversations || []);
      if (d.conversations?.length > 0 && !selected) {
        const first = d.conversations[0];
        setSelected(first);
        fetch(`/api/inbox/${first.id}/messages`)
          .then(r => r.json())
          .then(d => {
            const count = (d.messages || []).filter(m => m.isInternal).length;
            setNotesCount(count);
          })
          .catch(() => {});
      }
    } catch { if (!silent) toast.error("Failed to load"); }
    finally { if (!silent) setLoading(false); }
  }

  async function fetchMessages(convId, silent = false) {
    if (!silent) setMsgLoading(true);
    try {
      const r = await fetch(`/api/inbox/${convId}/messages`); const d = await r.json();
      setMessages((d.messages || []).filter(m => !m.isInternal));
    } catch { if (!silent) toast.error("Failed"); }
    finally { if (!silent) setMsgLoading(false); }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const res = await fetch(`/api/inbox/${selected.id}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply, isInternal: false }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed"); return; }
      setMessages(m => m.find(x => x.id === data.message.id) ? m : [...m, data.message]);
      setReply("");
      const now = new Date().toISOString();
      setConversations(c => c.map(x => x.id === selected.id ? { ...x, lastMessage: reply, updatedAt: now } : x));
      setLastSeenAt(p => ({ ...p, [selected.id]: now }));
    } catch { toast.error("Something went wrong"); }
    finally { setSending(false); }
  }

  async function updateConv(patch, msg) {
    try {
      const res = await fetch(`/api/inbox/${selected.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) { toast.error("Failed to update"); return; }
      setSelected(s => ({ ...s, ...patch }));
      setConversations(c => c.map(x => x.id === selected.id ? { ...x, ...patch } : x));
      if (msg) toast.success(msg);
    } catch { toast.error("Something went wrong"); }
  }

  const filtered = conversations.filter(c => {
    if (search && !c.contact?.name?.toLowerCase().includes(search.toLowerCase()) && !c.contact?.phone?.includes(search)) return false;
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (priorityFilter !== "ALL" && (c.priority || "NONE") !== priorityFilter) return false;
    if (labelFilter !== "ALL" && !getLabels(c.labels).includes(labelFilter)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 4, pb = PRIORITY_ORDER[b.priority] ?? 4;
    if (pa !== pb) return pa - pb;
    if (a.dueAt && !b.dueAt) return -1;
    if (!a.dueAt && b.dueAt) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  const counts = { ALL: filtered.length };
  filtered.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
  const activeFilterCount = (priorityFilter !== "ALL" ? 1 : 0) + (labelFilter !== "ALL" ? 1 : 0);

  return (
    <div className="flex h-[calc(100vh-128px)] -m-6 lg:-m-8 animate-fade-in">

      {/* ── LEFT: Sidebar ─────────────────────────────────────────────── */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-slate-200 bg-white">

        {/* Search + Filter row */}
        <div className="px-3 pt-3 pb-2 flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className="w-full h-9 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-300 outline-none focus:border-brand-400 focus:bg-white transition-all"
            />
          </div>
          <FilterPopover
            priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter}
            labelFilter={labelFilter} setLabelFilter={setLabelFilter}
            activeCount={activeFilterCount}
            onClear={() => { setPriorityFilter("ALL"); setLabelFilter("ALL"); }}
          />
          <button onClick={() => fetchConversations(true)}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all"
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Status tabs */}
        <div className="px-3 pb-2 flex items-center gap-1">
          {["ALL", "OPEN", "BOT", "RESOLVED"].map(s => {
            const active = statusFilter === s;
            const sc = STATUS_CONFIG[s];
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold transition-all flex-1 justify-center border ${
                  active ? "bg-brand-500 text-white border-brand-500" : "text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {sc.dot && !active && <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />}
                {sc.label}
                {counts[s] > 0 && (
                  <span className={`text-[10px] font-bold ml-0.5 ${active ? "text-brand-200" : "text-slate-400"}`}>
                    {counts[s] || 0}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Result count */}
        <div className="px-4 pb-1.5">
          <p className="text-[11px] text-slate-400">
            <span className="font-semibold text-slate-600">{sorted.length}</span> conversation{sorted.length !== 1 ? "s" : ""}
            {activeFilterCount > 0 && <span className="text-slate-300"> · filtered</span>}
          </p>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto border-t border-slate-100">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 size={18} className="animate-spin text-brand-500" /></div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <MessageSquare size={28} className="text-slate-200 mb-2" />
              <p className="text-sm font-semibold text-slate-400">No conversations</p>
              <p className="text-xs text-slate-300 mt-0.5">{search || activeFilterCount > 0 ? "Try different filters" : "Connect WhatsApp to start"}</p>
            </div>
          ) : (
            sorted.map(conv => {
              const sc = STATUS_CONFIG[conv.status] || STATUS_CONFIG.OPEN;
              const pc = PRIORITY_CONFIG[conv.priority] || PRIORITY_CONFIG.NONE;
              const convLabels = getLabels(conv.labels);
              const isActive = selected?.id === conv.id;
              const overdue = isDueOverdue(conv.dueAt);
              const hasBadge = (() => { const seen = lastSeenAt[conv.id]; return seen && new Date(conv.updatedAt) > new Date(seen); })();

              return (
                <button key={conv.id}
                  onClick={() => { setSelected(conv); setLastSeenAt(p => ({ ...p, [conv.id]: new Date().toISOString() })); }}
                  className={`w-full text-left px-4 py-3.5 border-b border-slate-50 transition-all ${
                    isActive ? "bg-brand-50 border-l-[3px] border-l-brand-500" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold">
                        {(conv.contact?.name?.[0] || conv.contact?.phone?.[0] || "?").toUpperCase()}
                      </div>
                      {sc.dot && <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${sc.dot}`} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-sm truncate ${hasBadge ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                            {conv.contact?.name || conv.contact?.phone || "Unknown"}
                          </span>
                          {conv.priority && conv.priority !== "NONE" && (
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${pc.dot}`} title={`${pc.label} priority`} />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          {hasBadge && <span className="w-2 h-2 rounded-full bg-brand-500" />}
                          <span className="text-[10px] text-slate-400">{timeAgo(conv.updatedAt)}</span>
                        </div>
                      </div>
                      <p className={`text-xs truncate mb-1.5 ${hasBadge ? "text-slate-700 font-medium" : "text-slate-400"}`}>
                        {conv.lastMessage || "No messages yet"}
                      </p>
                      {(convLabels.length > 0 || conv.dueAt) && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {convLabels.slice(0, 2).map(lbl => (
                            <span key={lbl} className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${LABEL_CFG[lbl]?.pill || "bg-slate-100 text-slate-500"}`}>
                              {lbl}
                            </span>
                          ))}
                          {convLabels.length > 2 && <span className="text-[10px] text-slate-400">+{convLabels.length - 2}</span>}
                          {conv.dueAt && (
                            <span className={`flex items-center gap-0.5 text-[10px] font-semibold ml-auto ${overdue ? "text-red-500" : isDueSoon(conv.dueAt) ? "text-amber-500" : "text-slate-400"}`}>
                              {overdue ? <AlertCircle size={9} /> : <Clock size={9} />}
                              {formatDue(conv.dueAt)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT: Chat + Notes ──────────────────────────────────────────── */}
      <div className="flex-1 flex min-w-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center mb-4">
                <MessageSquare size={28} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-500 mb-1">Select a conversation</p>
              <p className="text-sm text-slate-400">Pick one from the left to start</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-5 py-3 bg-white border-b border-slate-200 flex-shrink-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {(selected.contact?.name?.[0] || selected.contact?.phone?.[0] || "?").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-bold text-slate-800">{selected.contact?.name || selected.contact?.phone}</p>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          selected.status === "OPEN"     ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          selected.status === "BOT"      ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          selected.status === "RESOLVED" ? "bg-slate-100 text-slate-600 border border-slate-200" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {STATUS_CONFIG[selected.status]?.label || selected.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone size={10} className="text-slate-400" />
                        <span className="text-xs text-slate-400">{selected.contact?.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action toolbar */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <PriorityPicker
                      value={selected.priority || "NONE"}
                      onChange={p => updateConv({ priority: p }, `Priority: ${PRIORITY_CONFIG[p].label}`)}
                    />
                    <LabelManager
                      labels={getLabels(selected.labels)}
                      onChange={lbls => updateConv({ labels: lbls.join(",") })}
                    />
                    <DueDatePicker
                      value={selected.dueAt}
                      onChange={d => updateConv({ dueAt: d }, d ? "Due date set" : "Removed")}
                    />

                    <div className="w-px h-5 bg-slate-200 mx-0.5" />

                    {selected.status === "OPEN" && (
                      <button onClick={() => updateConv({ status: "RESOLVED" }, "Resolved")}
                        className="flex items-center gap-1.5 h-8 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-all"
                      >
                        <CheckCheck size={12} /> Resolve
                      </button>
                    )}
                    {selected.status === "RESOLVED" && (
                      <button onClick={() => updateConv({ status: "OPEN" }, "Reopened")}
                        className="flex items-center gap-1.5 h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all"
                      >
                        <Circle size={12} /> Reopen
                      </button>
                    )}
                    <button onClick={() => updateConv({ status: "BOT" })}
                      className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        selected.status === "BOT" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <Bot size={12} /> Bot
                    </button>

                    <div className="w-px h-5 bg-slate-200 mx-0.5" />

                    <button onClick={() => setShowNotes(n => !n)}
                      className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        showNotes ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                    {showNotes ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
                      Notes
                      {notesCount > 0 && (
                        <span className={`ml-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${showNotes ? "bg-white text-amber-600" : "bg-amber-500 text-white"}`}>
                          {notesCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Labels + overdue strip */}
                {(getLabels(selected.labels).length > 0 || isDueOverdue(selected.dueAt)) && (
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    {getLabels(selected.labels).map(lbl => (
                      <button key={lbl}
                        onClick={() => updateConv({ labels: getLabels(selected.labels).filter(l => l !== lbl).join(",") })}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border hover:opacity-70 transition-all ${LABEL_CFG[lbl]?.pill || "bg-slate-100 text-slate-600 border-slate-200"}`}
                      >
                        {lbl} <X size={9} />
                      </button>
                    ))}
                    {isDueOverdue(selected.dueAt) && (
                      <div className="flex items-center gap-1.5 ml-auto bg-red-50 border border-red-100 rounded-lg px-2.5 py-1">
                        <AlertCircle size={11} className="text-red-500" />
                        <span className="text-xs text-red-600 font-medium">{formatDue(selected.dueAt)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%2394a894' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
              >
                {msgLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 size={18} className="animate-spin text-brand-500" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-sm text-slate-400">No messages yet in this conversation</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isOut = msg.direction === "OUTBOUND";
                    const msgDate = new Date(msg.sentAt);
                    const prevDate = i > 0 ? new Date(messages[i - 1].sentAt) : null;
                    const isNewDay = !prevDate || msgDate.toDateString() !== prevDate.toDateString();
                    const today = new Date();
                    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
                    const dateLabel = msgDate.toDateString() === today.toDateString() ? "Today"
                    : msgDate.toDateString() === yesterday.toDateString() ? "Yesterday"
                    : msgDate.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" }).toUpperCase();
                    return (
                      <div key={msg.id}>
                        {isNewDay && (
                          <div className="flex items-center justify-center my-3">
                            <span className="text-[11px] text-slate-500 bg-white/90 px-4 py-1.5 rounded-lg shadow-sm font-medium tracking-wide">
                              {dateLabel}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 shadow-sm ${isOut ? "bg-brand-100 rounded-br-sm" : "bg-white rounded-bl-sm border border-slate-100"}`}>
                          <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          <div className={`flex items-center gap-1 mt-1.5 ${isOut ? "justify-end" : "justify-start"}`}>
                            <span className="text-[10px] text-slate-400">
                            {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {isOut && <CheckCheck size={11} className={msg.status === "READ" ? "text-brand-500" : "text-slate-300"} />}
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Reply Box */}
              <div className="px-4 py-3 bg-white border-t border-slate-200 flex-shrink-0">
                {cannedSuggestions.length > 0 && (
                  <div className="mb-2 border border-slate-200 rounded-xl overflow-hidden shadow-lg bg-white">
                    {cannedSuggestions.map(c => (
                      <button key={c.id} onClick={() => { setReply(c.content); setCannedSuggestions([]); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-left transition-all border-b border-slate-50 last:border-0"
                      >
                        <code className="text-[11px] font-bold text-brand-600 bg-brand-50 border border-brand-100 px-1.5 py-0.5 rounded flex-shrink-0">/{c.shortcut}</code>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700">{c.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">{c.content}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <form onSubmit={sendMessage} className="flex items-end gap-2">
                  <textarea
                    value={reply} onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
                    placeholder="Type a message... or / for canned responses"
                    rows={2}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 focus:bg-white resize-none transition-all"
                  />
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button type="submit" disabled={!reply.trim() || sending}
                      className="w-10 h-10 bg-brand-500 hover:bg-brand-600 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                    >
                      {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    </button>
                    <button type="button" onClick={() => setShowCanned(true)}
                      className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl flex items-center justify-center transition-all"
                      title="Canned responses"
                    >
                      <Zap size={14} />
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>

        {/* Notes panel */}
        {showNotes && selected && (
          <NotesPanel conversationId={selected.id} onClose={() => setShowNotes(false)} onNotesLoaded={count => setNotesCount(count)} />
        )}
      </div>

      {showCanned && (
        <CannedResponsesModal onClose={() => setShowCanned(false)} onInsert={text => setReply(text)} />
      )}
    </div>
  );
}