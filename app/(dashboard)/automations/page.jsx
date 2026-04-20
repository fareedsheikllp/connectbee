"use client";
import { useState, useEffect } from "react";
import {
  Plus, Trash2, Pencil, X, Zap, Clock, MessageSquare,
  ToggleLeft, ToggleRight, ChevronDown, Loader2, AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

const TRIGGERS = [
  { value: "NO_AGENT_REPLY", label: "No agent reply after...", timed: true },
  { value: "NO_CUSTOMER_REPLY", label: "No customer reply after...", timed: true },
  { value: "CONVERSATION_OPEN", label: "Conversation open for...", timed: true },
  { value: "NEW_CONVERSATION", label: "New conversation created", timed: false },
  { value: "KEYWORD", label: "Message contains keyword", timed: false },
];

const ACTION_TYPES = [
  { value: "SEND_MESSAGE", label: "Send message to customer" },
  { value: "CHANGE_STATUS", label: "Change conversation status" },
  { value: "CHANGE_PRIORITY", label: "Change priority" },
  { value: "ADD_LABEL", label: "Add label" },
];

const STATUS_OPTIONS = ["OPEN", "RESOLVED", "BOT"];
const PRIORITY_OPTIONS = ["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"];
const LABEL_OPTIONS = ["vip", "billing", "bug", "sales", "support", "followup", "onboarding"];

const TRIGGER_CONFIG = {
  NO_AGENT_REPLY:     { color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200"    },
  NO_CUSTOMER_REPLY:  { color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200"  },
  CONVERSATION_OPEN:  { color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200"   },
  NEW_CONVERSATION:   { color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200"  },
  KEYWORD:            { color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ActionRow({ action, onChange, onRemove, index }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex-1 space-y-2">
        <select
          value={action.type}
          onChange={e => onChange(index, { type: e.target.value, value: "" })}
          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 bg-white outline-none focus:border-brand-400"
        >
          {ACTION_TYPES.map(a => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>

        {action.type === "SEND_MESSAGE" && (
          <textarea
            rows={3}
            placeholder="Message to send to customer..."
            value={action.value || ""}
            onChange={e => onChange(index, { ...action, value: e.target.value })}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 bg-white outline-none focus:border-brand-400 resize-none"
          />
        )}
        {action.type === "CHANGE_STATUS" && (
          <select
            value={action.value || ""}
            onChange={e => onChange(index, { ...action, value: e.target.value })}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 bg-white outline-none focus:border-brand-400"
          >
            <option value="">Select status...</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {action.type === "CHANGE_PRIORITY" && (
          <select
            value={action.value || ""}
            onChange={e => onChange(index, { ...action, value: e.target.value })}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 bg-white outline-none focus:border-brand-400"
          >
            <option value="">Select priority...</option>
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
        {action.type === "ADD_LABEL" && (
          <select
            value={action.value || ""}
            onChange={e => onChange(index, { ...action, value: e.target.value })}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 bg-white outline-none focus:border-brand-400"
          >
            <option value="">Select label...</option>
            {LABEL_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        )}
      </div>
      <button onClick={() => onRemove(index)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
        <X size={13} />
      </button>
    </div>
  );
}

function AutomationForm({ initial, channels, onSubmit, loading, onClose }) {
  const [name, setName] = useState(initial?.name || "");
  const [trigger, setTrigger] = useState(initial?.trigger || "NO_AGENT_REPLY");
  const [delayHours, setDelayHours] = useState(initial?.delayHours || 24);
  const [keyword, setKeyword] = useState(initial?.keyword || "");
  const [channelId, setChannelId] = useState(initial?.channelId || "");
  const [conditions, setConditions] = useState(initial?.conditions || { unassignedOnly: false, priority: "ALL" });
  const [actions, setActions] = useState(initial?.actions?.length ? initial.actions : [{ type: "SEND_MESSAGE", value: "" }]);

  const triggerConfig = TRIGGERS.find(t => t.value === trigger);

  const addAction = () => setActions(a => [...a, { type: "SEND_MESSAGE", value: "" }]);
  const removeAction = (i) => setActions(a => a.filter((_, idx) => idx !== i));
  const updateAction = (i, val) => setActions(a => a.map((x, idx) => idx === i ? val : x));

  const handle = (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required");
    if (actions.length === 0) return toast.error("Add at least one action");
    if (actions.some(a => !a.value)) return toast.error("Fill in all action values");
    onSubmit({
      name,
      trigger,
      delayHours: triggerConfig?.timed ? parseInt(delayHours) : null,
      keyword: trigger === "KEYWORD" ? keyword : null,
      channelId: channelId || null,
      conditions,
      actions,
    });
  };

  return (
    <form onSubmit={handle} className="space-y-5">
      {/* Name */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-600">Automation Name *</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Follow up after 24h no reply"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
        />
      </div>

      {/* Trigger */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-600">Trigger *</label>
        <select
          value={trigger}
          onChange={e => setTrigger(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:border-brand-400 transition-all"
        >
          {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Delay hours — only for timed triggers */}
      {triggerConfig?.timed && (
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-600">Delay</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={delayHours}
              onChange={e => setDelayHours(e.target.value)}
              className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-all"
            />
            <span className="text-sm text-slate-500">hours</span>
          </div>
        </div>
      )}

      {/* Keyword */}
      {trigger === "KEYWORD" && (
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-600">Keyword *</label>
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="e.g. refund"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-brand-400 transition-all"
          />
        </div>
      )}

      {/* Channel filter */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-600">Channel Filter <span className="font-normal text-slate-400">(optional)</span></label>
        <select
          value={channelId}
          onChange={e => setChannelId(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:border-brand-400 transition-all"
        >
          <option value="">All channels</option>
          {channels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
        </select>
      </div>

      {/* Conditions */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-600">Conditions</label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={conditions.unassignedOnly || false}
            onChange={e => setConditions(c => ({ ...c, unassignedOnly: e.target.checked }))}
            className="w-4 h-4 accent-brand-500"
          />
          <span className="text-sm text-slate-700">Only fire if conversation is unassigned</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Only for priority:</span>
          <select
            value={conditions.priority || "ALL"}
            onChange={e => setConditions(c => ({ ...c, priority: e.target.value }))}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 bg-white outline-none focus:border-brand-400"
          >
            <option value="ALL">All</option>
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-slate-600">Actions *</label>
          <button type="button" onClick={addAction}
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors">
            <Plus size={12} /> Add action
          </button>
        </div>
        <div className="space-y-2">
          {actions.map((action, i) => (
            <ActionRow key={i} index={i} action={action} onChange={updateAction} onRemove={removeAction} />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {loading && <Loader2 size={14} className="animate-spin" />}
          {initial ? "Save Changes" : "Create Automation"}
        </button>
      </div>
    </form>
  );
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ar, cr] = await Promise.all([fetch("/api/automations"), fetch("/api/channels")]);
      const [ad, cd] = await Promise.all([ar.json(), cr.json()]);
      setAutomations(ad.automations || []);
      setChannels(cd.channels || []);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const createAutomation = async (form) => {
    setSaving(true);
    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Automation created!");
      setModal(null);
      fetchAll();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const editAutomation = async (form) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/automations/${modal.data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Automation updated!");
      setModal(null);
      fetchAll();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const deleteAutomation = async (id) => {
    try {
      await fetch(`/api/automations/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      fetchAll();
    } catch { toast.error("Failed to delete"); }
  };

  const toggleEnabled = async (auto) => {
    try {
      await fetch(`/api/automations/${auto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !auto.enabled }),
      });
      fetchAll();
    } catch { toast.error("Failed to update"); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Automations</h1>
          <p className="text-sm text-slate-400 mt-0.5">Auto-reply and follow up based on triggers and conditions</p>
        </div>
        <button
          onClick={() => setModal({ type: "create" })}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus size={15} />
          New Automation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Total</p>
          <p className="text-3xl font-bold text-slate-900">{automations.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Active</p>
          <p className="text-3xl font-bold text-green-600">{automations.filter(a => a.enabled).length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Paused</p>
          <p className="text-3xl font-bold text-slate-400">{automations.filter(a => !a.enabled).length}</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : automations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-20 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Zap size={28} className="text-slate-300" />
          </div>
          <p className="font-medium text-slate-500">No automations yet</p>
          <p className="text-sm text-slate-400">Create one to start automating your conversations</p>
          <button onClick={() => setModal({ type: "create" })}
            className="mt-1 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
            Create your first automation
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map(auto => {
            const tc = TRIGGER_CONFIG[auto.trigger] || TRIGGER_CONFIG.NEW_CONVERSATION;
            const triggerLabel = TRIGGERS.find(t => t.value === auto.trigger)?.label || auto.trigger;
            const channel = channels.find(c => c.id === auto.channelId);
            const actions = Array.isArray(auto.actions) ? auto.actions : [];

            return (
              <div key={auto.id} className={`bg-white rounded-2xl border ${auto.enabled ? "border-slate-200" : "border-slate-100 opacity-60"} p-5 flex items-start gap-4`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tc.bg} ${tc.border} border`}>
                  <Zap size={16} className={tc.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-800">{auto.name}</p>
                    {!auto.enabled && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Paused</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${tc.bg} ${tc.color} ${tc.border}`}>
                      {triggerLabel}{auto.delayHours ? ` ${auto.delayHours}h` : ""}
                      {auto.keyword ? `: "${auto.keyword}"` : ""}
                    </span>
                    {channel && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                        style={{ backgroundColor: channel.color + "20", color: channel.color, borderColor: channel.color + "40" }}>
                        {channel.name}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      {actions.length} action{actions.length !== 1 ? "s" : ""}: {actions.map(a => ACTION_TYPES.find(t => t.value === a.type)?.label).join(", ")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggleEnabled(auto)} title={auto.enabled ? "Pause" : "Enable"}
                    className={`p-1.5 rounded-lg transition-colors ${auto.enabled ? "text-green-500 hover:bg-green-50" : "text-slate-400 hover:bg-slate-50"}`}>
                    {auto.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                  <button onClick={() => setModal({ type: "edit", data: auto })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteAutomation(auto.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
        <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
          Time-based automations run every 30 minutes via cron job. Keyword and new conversation automations fire instantly when a message is received.
        </p>
      </div>

      {/* Modals */}
      {modal?.type === "create" && (
        <Modal title="New Automation" onClose={() => setModal(null)}>
          <AutomationForm channels={channels} onSubmit={createAutomation} loading={saving} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === "edit" && (
        <Modal title="Edit Automation" onClose={() => setModal(null)}>
          <AutomationForm initial={modal.data} channels={channels} onSubmit={editAutomation} loading={saving} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}