"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Users, MessageSquare, Clock, CheckCircle,
  XCircle, Send, Edit2, Trash2, Calendar, BarChart2,
  Bot, FileText, TrendingUp
} from "lucide-react";

const STATUS = {
  SENT:      { label: "Sent",      icon: CheckCircle, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  DRAFT:     { label: "Draft",     icon: Edit2,       cls: "bg-amber-50 text-amber-700 border-amber-200"      },
  SCHEDULED: { label: "Scheduled", icon: Clock,       cls: "bg-sky-50 text-sky-700 border-sky-200"            },
  FAILED:    { label: "Failed",    icon: XCircle,     cls: "bg-red-50 text-red-600 border-red-200"            },
};

const REC_STATUS = {
  SENT:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED:  "bg-red-50 text-red-600 border-red-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
};

function highlightVars(text) {
  if (!text) return null;
  return text.split(/({{[^}]+}})/g).map((p, i) =>
    /^{{.*}}$/.test(p)
      ? <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs font-mono font-bold mx-0.5">{p}</span>
      : <span key={i}>{p}</span>
  );
}

export default function BroadcastDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [broadcast, setBroadcast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: "", message: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/broadcasts/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setBroadcast(d);
        setEditData({ name: d.name || "", message: d.message || "" });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm("Delete this broadcast permanently? This cannot be undone.")) return;
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
    setBroadcast((prev) => ({ ...prev, ...updated }));
    setEditModal(false);
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!broadcast || broadcast.error) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-sm">Broadcast not found</p>
        <button onClick={() => router.push("/broadcasts")} className="text-emerald-600 text-sm hover:underline">← Back to Broadcasts</button>
      </div>
    );
  }

  const s = STATUS[broadcast.status?.toUpperCase()] || STATUS.DRAFT;
  const SIcon = s.icon;
  const recipients = broadcast.recipients || [];
const sentCount = recipients.filter((r) => r.status === "SENT").length;
const failedCount = recipients.filter((r) => r.status === "FAILED").length;
const pendingCount = recipients.filter((r) => r.status === "PENDING").length;
  const deliveryRate = recipients.length > 0 ? Math.round((sentCount / recipients.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/broadcasts")}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={17} />
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate">{broadcast.name}</h1>
              <p className="text-xs text-gray-400">
                Created {new Date(broadcast.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${s.cls}`}>
              <SIcon size={11} /> {s.label}
            </span>
            {broadcast.status === "draft" && (
              <button
                onClick={() => setEditModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Edit2 size={13} /> Edit
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <Trash2 size={13} />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Top metrics row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Recipients",  value: recipients.length, icon: Users,      color: "text-gray-700",    bg: "bg-white"        },
            { label: "Delivered",   value: sentCount,         icon: CheckCircle, color: "text-emerald-700", bg: "bg-emerald-50"   },
            { label: "Failed",      value: failedCount,       icon: XCircle,     color: "text-red-600",     bg: "bg-red-50"       },
            { label: "Pending",     value: pendingCount,      icon: Clock,       color: "text-amber-700",   bg: "bg-amber-50"     },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className={`${m.bg} rounded-2xl border border-gray-100 p-5 flex items-center gap-3`}>
                <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Icon size={15} className={m.color} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-0.5">{m.label}</p>
                  <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column */}
          <div className="lg:col-span-3 space-y-5">
            {/* Delivery progress */}
            {broadcast.status === "sent" && recipients.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={15} className="text-gray-400" />
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivery Rate</h2>
                </div>
                <div className="flex items-end gap-3 mb-3">
                  <span className="text-4xl font-bold text-gray-900">{deliveryRate}%</span>
                  <span className="text-sm text-gray-400 mb-1">{sentCount} of {recipients.length} delivered</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${deliveryRate}%` }}
                  />
                </div>
                {failedCount > 0 && (
                  <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full"
                      style={{ width: `${Math.round((failedCount / recipients.length) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Message */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
                <MessageSquare size={14} className="text-gray-400" />
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</h2>
              </div>
              <div className="bg-[#ECE5DD] p-5">
                <div className="bg-white rounded-xl rounded-tl-none shadow-sm px-4 py-3 max-w-[85%]">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed break-words">
                    {highlightVars(broadcast.message)}
                  </p>
                  <p className="text-right text-xs text-gray-400 mt-2">
                    {new Date(broadcast.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} ✓✓
                  </p>
                </div>
              </div>
            </div>

            {/* Recipients table */}
            {recipients.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
                  <Users size={14} className="text-gray-400" />
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipients ({recipients.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-50 bg-gray-50/50">
                        <th className="text-left text-xs font-semibold text-gray-400 px-6 py-3">Name</th>
                        <th className="text-left text-xs font-semibold text-gray-400 px-6 py-3 hidden sm:table-cell">Phone</th>
                        <th className="text-left text-xs font-semibold text-gray-400 px-6 py-3">Status</th>
                        <th className="text-left text-xs font-semibold text-gray-400 px-6 py-3 hidden md:table-cell">Sent At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recipients.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 flex-shrink-0">
                                {r.contact?.name?.[0]?.toUpperCase() || "?"}
                              </div>
                              <span className="text-sm font-medium text-gray-800">{r.contact?.name || "Unknown"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-500 hidden sm:table-cell">{r.contact?.phone || "—"}</td>
                          <td className="px-6 py-3">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${REC_STATUS[r.status?.toLowerCase()] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
                              {r.status || "pending"}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-400 hidden md:table-cell">
                            {r.sentAt ? new Date(r.sentAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {recipients.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Users size={20} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-400">No recipients added to this broadcast</p>
              </div>
            )}
          </div>

          {/* Right column — meta info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Details card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-400 flex items-center gap-1.5"><BarChart2 size={11} /> Status</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${s.cls}`}>{s.label}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-400 flex items-center gap-1.5"><Calendar size={11} /> Created</span>
                  <span className="text-xs font-medium text-gray-700">
                    {new Date(broadcast.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                {broadcast.scheduledAt && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5"><Clock size={11} /> Scheduled</span>
                    <span className="text-xs font-medium text-gray-700">
                      {new Date(broadcast.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-gray-400 flex items-center gap-1.5"><MessageSquare size={11} /> Message length</span>
                  <span className="text-xs font-medium text-gray-700">{broadcast.message?.length || 0} chars</span>
                </div>
              </div>
            </div>

            {/* Chatbot card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Auto-Reply Bot</h3>
                {broadcast.chatbots?.length > 0 ? (
                <div className="space-y-2">
                  {broadcast.chatbots.map(bot => (
                    <div key={bot.id} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <div className="w-8 h-8 rounded-xl bg-emerald-200 flex items-center justify-center flex-shrink-0">
                        <Bot size={14} className="text-emerald-700" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-emerald-800">{bot.name}</p>
                        <p className="text-xs text-emerald-600 mt-0.5">Handling replies automatically</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-8 h-8 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <Bot size={14} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600">No bot attached</p>
                    <p className="text-xs text-gray-400 mt-0.5">Replies go to Inbox</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick actions */}
            {broadcast.status === "draft" && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Actions</h3>
                <button
                  onClick={() => setEditModal(true)}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <Edit2 size={14} className="text-gray-400" /> Edit message
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-red-200 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-all"
                >
                  <Trash2 size={14} /> Delete broadcast
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Edit2 size={14} className="text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Edit Broadcast</h3>
              </div>
              <button onClick={() => setEditModal(false)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400">
                <XCircle size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Campaign Name</label>
                <input
                  value={editData.name}
                  onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Message</label>
                <textarea
                  value={editData.message}
                  onChange={(e) => setEditData((d) => ({ ...d, message: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none transition-all leading-relaxed"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button onClick={() => setEditModal(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-sm shadow-emerald-200"
              >
                {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle size={14} />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}