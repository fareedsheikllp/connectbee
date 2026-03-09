"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Users, MessageSquare, Clock, CheckCircle,
  XCircle, Edit2, Trash2, Calendar, Bot,
  TrendingUp, AlertCircle, RefreshCw, BarChart2,
  Target, Zap, ChevronRight, Info, Download, Send
} from "lucide-react";

const normalizeStatus = (s) => s?.toLowerCase() ?? "draft";

const STATUS_CONFIG = {
  sent:     { label: "Sent",     icon: CheckCircle, pill: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  draft:    { label: "Draft",    icon: Edit2,       pill: "bg-zinc-100 text-zinc-600 border-zinc-200"         },
  sending:  { label: "Sending",  icon: RefreshCw,   pill: "bg-sky-50 text-sky-700 border-sky-200"            },
  scheduled:{ label: "Scheduled",icon: Clock,       pill: "bg-sky-50 text-sky-700 border-sky-200"            },
  failed:   { label: "Failed",   icon: XCircle,     pill: "bg-red-50 text-red-600 border-red-200"            },
};

const REC_STATUS = {
  sent:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed:  "bg-red-50 text-red-600 border-red-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  sending: "bg-sky-50 text-sky-700 border-sky-200",
};

const ERROR_LABELS = {
  "21211": "Invalid phone number",
  "21408": "Permission denied for region",
  "21610": "Number is unsubscribed",
  "21614": "Not a valid mobile number",
  "63003": "Channel could not authenticate",
  "63007": "WhatsApp number not registered",
  "63016": "Message blocked by WhatsApp",
  "63032": "Outside allowed messaging window",
};

function friendlyError(reason, code) {
  if (code && ERROR_LABELS[code]) return ERROR_LABELS[code];
  if (!reason) return "Unknown error";
  if (reason.length > 70) return reason.slice(0, 70) + "…";
  return reason;
}

function highlightVars(text) {
  if (!text) return null;
  return text.split(/({{[^}]+}})/g).map((p, i) =>
    /^{{.*}}$/.test(p)
      ? <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-sm font-mono font-bold mx-0.5">{p}</span>
      : <span key={i}>{p}</span>
  );
}

function exportCSV(recipients, broadcastName) {
  const rows = [
    ["Name", "Phone", "Status", "Failure Reason", "Error Code", "Sent At"],
    ...recipients.map(r => [
      r.contact?.name || "Unknown",
      r.contact?.phone || "",
      normalizeStatus(r.status),
      r.failureReason || "",
      r.errorCode || "",
      r.sentAt ? new Date(r.sentAt).toLocaleString() : "",
    ]),
  ];
  const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${broadcastName.replace(/\s+/g, "_")}_report.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function DonutChart({ sent, failed, pending, total }) {
  if (total === 0) return (
    <div className="flex items-center justify-center w-40 h-40 rounded-full border-[12px] border-gray-100">
      <span className="text-sm text-gray-300">No data</span>
    </div>
  );
  const r = 54, cx = 68, cy = 68, circ = 2 * Math.PI * r;
  let offset = 0;
  const slice = (pct, color) => {
    if (pct <= 0) return null;
    const dash = pct * circ;
    const gap = circ - dash;
    const el = (
      <circle key={color} cx={cx} cy={cy} r={r}
        fill="none" stroke={color} strokeWidth="16"
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset * circ}
      />
    );
    offset += pct;
    return el;
  };
  return (
    <svg width="136" height="136" viewBox="0 0 136 136" className="-rotate-90">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="16" />
      {slice(sent / total, "#34d399")}
      {slice(failed / total, "#f87171")}
      {slice(pending / total, "#fbbf24")}
    </svg>
  );
}

function MiniBar({ value, max, color = "bg-emerald-400" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right tabular-nums">{pct}%</span>
    </div>
  );
}

const TABS = ["Overview", "Recipients", "Report"];

export default function BroadcastDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [broadcast, setBroadcast]         = useState(null);
  const [loading, setLoading]             = useState(true);
  const [deleting, setDeleting]           = useState(false);
  const [sending, setSending]             = useState(false);
  const [sendModal, setSendModal]         = useState(false);
  const [tab, setTab]                     = useState("Overview");
  const [failFilter, setFailFilter]       = useState("all");
  const [searchQ, setSearchQ]             = useState("");
  const [editModal, setEditModal]         = useState(false);
  const [editData, setEditData]           = useState({ name: "", message: "" });
  const [saving, setSaving]               = useState(false);
  const [retargetModal, setRetargetModal] = useState(false);
  const [retargeting, setRetargeting]     = useState(false);
  const [retargetDone, setRetargetDone]   = useState(false);
  const [selectedIds, setSelectedIds]     = useState([]);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/broadcasts/${id}`)
      .then(r => r.json())
      .then(d => {
        setBroadcast(d);
        setEditData({ name: d.name || "", message: d.message || "" });
        const failedIds = (d.recipients || [])
          .filter(r => normalizeStatus(r.status) === "failed")
          .map(r => r.contactId);
        setSelectedIds(failedIds);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleSend() {
    setSending(true);
    setSendModal(false);
    const res = await fetch(`/api/broadcasts/${id}/send`, { method: "POST" });
    const data = await res.json();
    setSending(false);
    if (data.success) {
      load(); // Refresh to show updated statuses
    } else {
      alert(data.error || "Failed to send broadcast");
    }
  }

  function openRetargetModal() {
    const failedIds = (broadcast?.recipients || [])
      .filter(r => normalizeStatus(r.status) === "failed")
      .map(r => r.contactId);
    setSelectedIds(failedIds);
    setRetargetModal(true);
  }

  function toggleContact(contactId) {
    setSelectedIds(prev =>
      prev.includes(contactId) ? prev.filter(i => i !== contactId) : [...prev, contactId]
    );
  }

  function toggleAll(failedRecipients) {
    if (selectedIds.length === failedRecipients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(failedRecipients.map(r => r.contactId));
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this broadcast permanently?")) return;
    setDeleting(true);
    await fetch(`/api/broadcasts/${id}`, { method: "DELETE" });
    router.push("/broadcasts");
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/broadcasts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });
    const updated = await res.json();
    setBroadcast(prev => ({ ...prev, ...updated }));
    setEditModal(false);
    setSaving(false);
  }

  async function handleRetarget() {
    if (selectedIds.length === 0) return;
    setRetargeting(true);
    const res = await fetch(`/api/broadcasts/${id}/retarget`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactIds: selectedIds }),
    });
    const data = await res.json();
    setRetargeting(false);
    if (data.id) {
      setRetargetDone(true);
      setRetargetModal(false);
      setTimeout(() => router.push(`/broadcasts/${data.id}`), 800);
    } else {
      alert(data.error || "Failed to create retarget campaign");
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!broadcast || broadcast.error) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <p className="text-gray-400">Broadcast not found</p>
      <button onClick={() => router.push("/broadcasts")} className="text-emerald-600 hover:underline">← Back</button>
    </div>
  );

  const status       = normalizeStatus(broadcast.status);
  const cfg          = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const SIcon        = cfg.icon;
  const recipients   = broadcast.recipients || [];
  const sentCount    = recipients.filter(r => normalizeStatus(r.status) === "sent").length;
  const failedCount  = recipients.filter(r => normalizeStatus(r.status) === "failed").length;
  const pendingCount = recipients.filter(r => normalizeStatus(r.status) === "pending").length;
  const total        = recipients.length;
  const deliveryRate = total > 0 ? Math.round((sentCount / total) * 100) : 0;
  const failRate     = total > 0 ? Math.round((failedCount / total) * 100) : 0;
  const failedRecipients = recipients.filter(r => normalizeStatus(r.status) === "failed");

  const failReasonMap = {};
  failedRecipients.forEach(r => {
    const label = friendlyError(r.failureReason, r.errorCode);
    failReasonMap[label] = (failReasonMap[label] || 0) + 1;
  });
  const failReasons = Object.entries(failReasonMap).sort((a, b) => b[1] - a[1]);

  const filtered = recipients.filter(r => {
    const s = normalizeStatus(r.status);
    const matchStatus = failFilter === "all" || s === failFilter;
    const matchSearch = !searchQ
      || r.contact?.name?.toLowerCase().includes(searchQ.toLowerCase())
      || r.contact?.phone?.includes(searchQ);
    return matchStatus && matchSearch;
  });

  const isDraft = status === "draft";
  const isSent  = status === "sent";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => router.push("/broadcasts")}
              className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0">
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">{broadcast.name}</h1>
              <p className="text-sm text-gray-400">
                Created {new Date(broadcast.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full border ${cfg.pill}`}>
              <SIcon size={13} className={status === "sending" ? "animate-spin" : ""} /> {cfg.label}
            </span>

            {/* Export CSV — always visible */}
            <button onClick={() => exportCSV(recipients, broadcast.name)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              <Download size={14} /> Export CSV
            </button>

            {/* Edit — draft only */}
            {isDraft && (
              <button onClick={() => setEditModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                <Edit2 size={14} /> Edit
              </button>
            )}

            {/* Send — draft only */}
            {isDraft && (
              <button onClick={() => setSendModal(true)} disabled={sending || total === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50">
                {sending
                  ? <><RefreshCw size={14} className="animate-spin"/> Sending…</>
                  : <><Send size={14}/> Send Now</>
                }
              </button>
            )}

            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50">
              <Trash2 size={14} />
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex gap-1">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`relative px-5 py-3 text-sm font-semibold transition-colors ${
                  tab === t ? "text-emerald-700" : "text-gray-400 hover:text-gray-600"
                }`}>
                {t}
                {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Draft banner — no recipients warning */}
      {isDraft && total === 0 && (
        <div className="max-w-6xl mx-auto px-8 pt-5">
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              This draft has no recipients. Go back to the broadcasts list and add contacts before sending.
            </p>
          </div>
        </div>
      )}

      {/* ── Metric strip ── */}
      <div className="max-w-6xl mx-auto px-8 pt-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total",     value: total,        icon: Users,       accent: "text-gray-700",    ring: "ring-gray-200",    bg: "bg-white"        },
            { label: "Delivered", value: sentCount,    icon: CheckCircle, accent: "text-emerald-600", ring: "ring-emerald-200", bg: "bg-emerald-50/50"},
            { label: "Failed",    value: failedCount,  icon: XCircle,     accent: "text-red-500",     ring: "ring-red-200",     bg: "bg-red-50/50"    },
            { label: "Pending",   value: pendingCount, icon: Clock,       accent: "text-amber-600",   ring: "ring-amber-200",   bg: "bg-amber-50/50"  },
          ].map(m => {
            const Icon = m.icon;
            return (
              <div key={m.label} className={`${m.bg} rounded-2xl border border-gray-100 px-6 py-5 flex items-center gap-4 shadow-sm`}>
                <div className={`w-11 h-11 rounded-xl bg-white flex items-center justify-center flex-shrink-0 ring-1 ${m.ring} shadow-sm`}>
                  <Icon size={16} className={m.accent} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{m.label}</p>
                  <p className={`text-3xl font-bold leading-none ${m.accent}`}>{m.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="max-w-6xl mx-auto px-8 py-7 space-y-6">

        {/* ════ OVERVIEW ════ */}
        {tab === "Overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
              {isSent && total > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <TrendingUp size={13}/> Delivery Rate
                  </p>
                  <div className="flex items-end gap-4 mb-4">
                    <span className="text-5xl font-extrabold text-gray-900 tabular-nums">{deliveryRate}%</span>
                    <span className="text-sm text-gray-400 mb-2">{sentCount} of {total} delivered</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex mb-3">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000" style={{ width: `${deliveryRate}%` }} />
                    <div className="h-full bg-red-400 transition-all duration-1000" style={{ width: `${failRate}%` }} />
                  </div>
                  <div className="flex gap-5 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"/>Delivered: {sentCount}</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"/>Failed: {failedCount}</span>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
                  <MessageSquare size={15} className="text-gray-400" />
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Message</h2>
                </div>
                <div className="bg-[#e5ddd5] p-6">
                  <div className="bg-white rounded-2xl rounded-tl-none shadow-sm px-5 py-4 max-w-[85%]">
                    <p className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed break-words">
                      {highlightVars(broadcast.message)}
                    </p>
                    <p className="text-right text-xs text-gray-400 mt-3">
                      {new Date(broadcast.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} ✓✓
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Details</p>
                {[
                  { icon: BarChart2,     label: "Status",     value: <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.pill}`}>{cfg.label}</span> },
                  { icon: Calendar,      label: "Created",    value: new Date(broadcast.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                  ...(broadcast.scheduledAt ? [{ icon: Clock, label: "Scheduled for", value: new Date(broadcast.scheduledAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }) }] : []),                  { icon: Users,         label: "Recipients", value: `${total} contact${total !== 1 ? "s" : ""}` },
                  { icon: MessageSquare, label: "Msg length", value: `${broadcast.message?.length || 0} chars` },
                ].map((row, i) => {
                  const Icon = row.icon;
                  return (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-400 flex items-center gap-2"><Icon size={13}/> {row.label}</span>
                      <span className="text-sm font-medium text-gray-700">{row.value}</span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Auto-Reply Bot</p>
                {broadcast.chatbots?.length > 0 ? broadcast.chatbots.map(bot => (
                  <div key={bot.id} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="w-9 h-9 rounded-xl bg-emerald-200 flex items-center justify-center flex-shrink-0">
                      <Bot size={15} className="text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">{bot.name}</p>
                      <p className="text-xs text-emerald-600 mt-0.5">Handling replies automatically</p>
                    </div>
                  </div>
                )) : (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <Bot size={15} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">No bot attached</p>
                      <p className="text-xs text-gray-400 mt-0.5">Replies go to Inbox</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Send CTA on overview for drafts */}
              {isDraft && total > 0 && (
                <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Send size={16} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Ready to send</p>
                      <p className="text-xs text-gray-400 mt-0.5">{total} contact{total !== 1 ? "s" : ""} will receive this message</p>
                    </div>
                  </div>
                  <button onClick={() => setSendModal(true)} disabled={sending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm disabled:opacity-50">
                    <Send size={14}/> Send to {total} Contact{total !== 1 ? "s" : ""}
                  </button>
                </div>
              )}

              {failedCount > 0 && (
                <div className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                      <Target size={16} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Retarget Failed Contacts</p>
                      <p className="text-xs text-gray-400 mt-0.5">{failedCount} contacts didn't receive your message</p>
                    </div>
                  </div>
                  <button onClick={openRetargetModal}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all shadow-sm">
                    <Zap size={14}/> Create Retarget Campaign
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ RECIPIENTS ════ */}
        {tab === "Recipients" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 shadow-sm">
                {["all","sent","failed","pending"].map(f => (
                  <button key={f} onClick={() => setFailFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                      failFilter === f ? "bg-emerald-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"
                    }`}>
                    {f} {f !== "all" && (
                      <span className="ml-1 opacity-60">
                        {f==="sent" ? sentCount : f==="failed" ? failedCount : pendingCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="Search by name or phone…"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-100 text-sm bg-white shadow-sm focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
              {failedCount > 0 && (
                <button onClick={openRetargetModal}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all shadow-sm flex-shrink-0">
                  <Target size={14}/> Retarget {failedCount} Failed
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              {filtered.length === 0 ? (
                <div className="py-20 text-center">
                  <Users size={28} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No recipients match this filter</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-50 bg-gray-50/70">
                        {["Contact","Phone","Status","Failure Reason","Sent At"].map(h => (
                          <th key={h} className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map(r => {
                        const rs = normalizeStatus(r.status);
                        return (
                          <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 flex-shrink-0">
                                  {r.contact?.name?.[0]?.toUpperCase() || "?"}
                                </div>
                                <span className="text-sm font-semibold text-gray-800">{r.contact?.name || "Unknown"}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 font-mono">{r.contact?.phone || "—"}</td>
                            <td className="px-6 py-4">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${REC_STATUS[rs] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                {rs}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {rs === "failed" ? (
                                <div className="flex items-center gap-2">
                                  <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
                                  <span className="text-sm text-red-600">{friendlyError(r.failureReason, r.errorCode)}</span>
                                  {r.errorCode && (
                                    <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">#{r.errorCode}</span>
                                  )}
                                </div>
                              ) : <span className="text-gray-300 text-sm">—</span>}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">
                              {r.sentAt ? new Date(r.sentAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ REPORT ════ */}
        {tab === "Report" && (
          <div className="space-y-6">
            {total === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-20 text-center shadow-sm">
                <BarChart2 size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No data yet — send this broadcast to see analytics</p>
              </div>
            ) : (
              <>
                <div className="flex justify-end">
                  <button onClick={() => exportCSV(recipients, broadcast.name)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                    <Download size={14} /> Download CSV Report
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {[
                    { label: "Delivery Rate", value: `${deliveryRate}%`, sub: `${sentCount} delivered`,  color: "text-emerald-600", bg: "bg-emerald-50/80", border: "border-emerald-100" },
                    { label: "Failure Rate",  value: `${failRate}%`,     sub: `${failedCount} failed`,   color: "text-red-500",    bg: "bg-red-50/80",    border: "border-red-100"   },
                    { label: "Pending",       value: `${pendingCount}`,  sub: "not yet processed",       color: "text-amber-600",  bg: "bg-amber-50/80",  border: "border-amber-100" },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-2xl border ${s.border} px-6 py-5 shadow-sm`}>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{s.label}</p>
                      <p className={`text-4xl font-extrabold tabular-nums ${s.color}`}>{s.value}</p>
                      <p className="text-sm text-gray-400 mt-1">{s.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Outcome Breakdown</p>
                    <div className="flex items-center gap-6">
                      <div className="relative flex-shrink-0">
                        <DonutChart sent={sentCount} failed={failedCount} pending={pendingCount} total={total} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-extrabold text-gray-800">{total}</span>
                          <span className="text-xs text-gray-400 uppercase tracking-wide">total</span>
                        </div>
                      </div>
                      <div className="space-y-4 flex-1">
                        {[
                          { label: "Delivered", count: sentCount,    color: "bg-emerald-400" },
                          { label: "Failed",    count: failedCount,  color: "bg-red-400"     },
                          { label: "Pending",   count: pendingCount, color: "bg-amber-400"   },
                        ].map(l => (
                          <div key={l.label}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="flex items-center gap-2 text-sm text-gray-600">
                                <span className={`w-2.5 h-2.5 rounded-full ${l.color}`}/>
                                {l.label}
                              </span>
                              <span className="text-sm font-bold text-gray-700">{l.count}</span>
                            </div>
                            <MiniBar value={l.count} max={total} color={l.color} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle size={13} className="text-red-400"/> Failure Reasons
                      </p>
                      {failedCount > 0 && (
                        <button onClick={() => { setTab("Recipients"); setFailFilter("failed"); }}
                          className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1">
                          See all <ChevronRight size={12}/>
                        </button>
                      )}
                    </div>
                    {failReasons.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-28 gap-2">
                        <CheckCircle size={24} className="text-emerald-300" />
                        <p className="text-sm text-gray-400">No failures — great delivery! 🎉</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {failReasons.map(([reason, count]) => (
                          <div key={reason} className="p-4 rounded-xl bg-red-50/60 border border-red-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-red-700 flex items-center gap-2">
                                <AlertCircle size={13} className="flex-shrink-0"/> {reason}
                              </span>
                              <span className="text-sm font-bold text-red-600">{count}</span>
                            </div>
                            <MiniBar value={count} max={failedCount || 1} color="bg-red-400" />
                          </div>
                        ))}
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                          <p className="text-xs text-amber-700 flex items-start gap-2">
                            <Info size={12} className="mt-0.5 flex-shrink-0"/>
                            Fix invalid numbers and unsubscribed contacts before retargeting to improve future delivery.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <Zap size={13} className="text-emerald-500"/> Recommendations
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      failedCount > 0 && {
                        icon: Target, color: "text-red-500", bg: "bg-red-50", border: "border-red-100",
                        title: "Retarget failed contacts",
                        body: `${failedCount} contacts missed your message. Create a retarget campaign.`,
                        cta: "Retarget now", action: openRetargetModal,
                      },
                      {
                        icon: BarChart2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100",
                        title: deliveryRate >= 80 ? "Strong delivery rate!" : "Room to improve",
                        body: deliveryRate >= 80
                          ? "Your broadcast performed well. Keep your contact list clean for continued success."
                          : "Clean up invalid numbers and unsubscribed contacts to improve your delivery rate.",
                        cta: null,
                      },
                    ].filter(Boolean).map((rec, i) => {
                      const Icon = rec.icon;
                      return (
                        <div key={i} className={`p-5 rounded-xl border ${rec.bg} ${rec.border}`}>
                          <Icon size={16} className={`${rec.color} mb-3`} />
                          <p className="text-sm font-bold text-gray-800 mb-1">{rec.title}</p>
                          <p className="text-sm text-gray-500 leading-relaxed">{rec.body}</p>
                          {rec.cta && (
                            <button onClick={rec.action}
                              className="mt-3 text-sm font-bold text-red-600 hover:underline flex items-center gap-1">
                              {rec.cta} <ChevronRight size={12}/>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Send Confirmation Modal ── */}
      {sendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSendModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                <Send size={24} className="text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Send Broadcast Now?</h3>
              <p className="text-sm text-gray-500 text-center leading-relaxed mb-6">
                This will send <span className="font-semibold text-gray-800">"{broadcast.name}"</span> to{" "}
                <span className="font-bold text-emerald-600">{total} contact{total !== 1 ? "s" : ""}</span> immediately via WhatsApp. This cannot be undone.
              </p>
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-6">
                <p className="text-xs text-gray-500 font-mono leading-relaxed line-clamp-3">{broadcast.message}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSendModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSend}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm">
                  <Send size={14}/> Send Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Retarget Modal ── */}
      {retargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setRetargetModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center">
                  <Target size={18} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Create Retarget Campaign</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Select which contacts to retarget</p>
                </div>
              </div>
              <button onClick={() => setRetargetModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
                <XCircle size={16} />
              </button>
            </div>

            <div className="px-7 py-3 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
              <span className="text-sm text-gray-500">
                <span className="font-bold text-gray-800">{selectedIds.length}</span> of {failedRecipients.length} selected
              </span>
              <button onClick={() => toggleAll(failedRecipients)}
                className="text-xs font-semibold text-emerald-600 hover:underline">
                {selectedIds.length === failedRecipients.length ? "Deselect all" : "Select all"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-4 space-y-2">
              {failedRecipients.map(r => {
                const checked = selectedIds.includes(r.contactId);
                return (
                  <button key={r.id} onClick={() => toggleContact(r.contactId)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      checked ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100 opacity-50"
                    }`}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      checked ? "bg-red-500 border-red-500" : "border-gray-300 bg-white"
                    }`}>
                      {checked && <CheckCircle size={12} className="text-white" strokeWidth={3} />}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-600 flex-shrink-0">
                      {r.contact?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{r.contact?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-400 font-mono">{r.contact?.phone}</p>
                    </div>
                    <p className="text-xs text-red-500 max-w-[120px] truncate text-right flex-shrink-0">
                      {friendlyError(r.failureReason, r.errorCode)}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="px-7 py-5 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button onClick={() => setRetargetModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleRetarget} disabled={retargeting || retargetDone || selectedIds.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition-all shadow-sm">
                {retargetDone ? <><CheckCircle size={15}/> Redirecting…</> :
                 retargeting  ? <><RefreshCw size={15} className="animate-spin"/> Creating…</> :
                                <><Zap size={15}/> Retarget {selectedIds.length} Contact{selectedIds.length !== 1 ? "s" : ""}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setEditModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-7 py-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Edit2 size={15} className="text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-900">Edit Broadcast</h3>
              </div>
              <button onClick={() => setEditModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
                <XCircle size={16} />
              </button>
            </div>
            <div className="p-7 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Campaign Name</label>
                <input value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Message</label>
                <textarea value={editData.message} onChange={e => setEditData(d => ({ ...d, message: e.target.value }))}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-7 pb-7">
              <button onClick={() => setEditModal(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-sm">
                {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle size={14} />}
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}