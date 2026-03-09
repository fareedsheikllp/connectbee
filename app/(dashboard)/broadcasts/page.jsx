"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Send, Clock, FileEdit, XCircle,
  CheckCircle, Users, BarChart2, ChevronRight,
  Trash2, Filter, Radio
} from "lucide-react";

const STATUS = {
  sent:      { label: "Sent",      icon: CheckCircle, cls: "bg-emerald-50 text-emerald-700 border-emerald-200",  dot: "bg-emerald-500" },
  draft:     { label: "Draft",     icon: FileEdit,    cls: "bg-amber-50 text-amber-700 border-amber-200",        dot: "bg-amber-400"   },
  scheduled: { label: "Scheduled", icon: Clock,       cls: "bg-sky-50 text-sky-700 border-sky-200",              dot: "bg-sky-500"     },
  failed:    { label: "Failed",    icon: XCircle,     cls: "bg-red-50 text-red-600 border-red-200",              dot: "bg-red-500"     },
};

const FILTERS = ["All", "Draft", "Scheduled", "Sent", "Failed"];

export default function BroadcastsPage() {
  const router = useRouter();
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetch("/api/broadcasts")
      .then((r) => r.json())
      .then((d) => { setBroadcasts(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(e, id) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this broadcast permanently?")) return;
    setDeleting(id);
    await fetch(`/api/broadcasts/${id}`, { method: "DELETE" });
    setBroadcasts((prev) => prev.filter((b) => b.id !== id));
    setDeleting(null);
  }

  const filtered = broadcasts.filter((b) => {
    const matchFilter = filter === "All" || b.status?.toLowerCase() === filter.toLowerCase();
    const matchSearch = !search ||
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.message?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = {
    total: broadcasts.length,
    sent: broadcasts.filter((b) => b.status?.toLowerCase() === "sent").length,
    scheduled: broadcasts.filter((b) => b.status?.toLowerCase() === "scheduled").length,
    draft: broadcasts.filter((b) => b.status?.toLowerCase() === "draft").length,
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-200">
              <Radio size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-tight">Broadcasts</h1>
              <p className="text-xs text-gray-400">{broadcasts.length} campaign{broadcasts.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search campaigns..."
                className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white w-52 transition-all"
              />
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <Link
              href="/broadcasts/new"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200 whitespace-nowrap"
            >
              <Plus size={15} />
              New Broadcast
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total,     color: "text-gray-700",    bg: "bg-white"         },
            { label: "Sent",  value: stats.sent,      color: "text-emerald-700", bg: "bg-emerald-50"    },
            { label: "Scheduled", value: stats.scheduled, color: "text-sky-700", bg: "bg-sky-50"        },
            { label: "Draft", value: stats.draft,     color: "text-amber-700",   bg: "bg-amber-50"      },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl border border-gray-100 p-5`}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                filter === f
                  ? "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200"
                  : "bg-white text-gray-500 border-gray-200 hover:border-emerald-200 hover:text-emerald-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-20 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Send size={22} className="text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">No broadcasts yet</h3>
            <p className="text-xs text-gray-400 mb-5">Send messages to your contacts at scale</p>
            <Link
              href="/broadcasts/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200"
            >
              <Plus size={14} /> Create your first broadcast
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Campaign</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4 hidden sm:table-cell">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4 hidden md:table-cell">Recipients</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4 hidden md:table-cell">Sent Recipients</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4 hidden md:table-cell">Failed Recipients</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4 hidden md:table-cell">Bot</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4 hidden lg:table-cell">Date</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((b) => {
                  const s = STATUS[b.status?.toLowerCase()] || STATUS.draft;
                  const SIcon = s.icon;
                  return (
                    <tr
                      key={b.id}
                      onClick={() => router.push(`/broadcasts/${b.id}`)}
                      className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-emerald-700 transition-colors">
                              {b.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{b.message}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.cls}`}>
                          <SIcon size={11} />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Users size={13} className="text-gray-400" />
                          {b._count?.recipients ?? 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm font-semibold text-emerald-600">
                          {b._count?.sentRecipients ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className={`text-sm font-semibold ${(b._count?.failedRecipients ?? 0) > 0 ? "text-red-500" : "text-gray-300"}`}>
                          {b._count?.failedRecipients ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                      {b.chatbots?.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {b.chatbots.map(bot => (
                              <span key={bot.id} className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                                {bot.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-sm text-gray-400">
                        {b.scheduledAt
                          ? new Date(b.scheduledAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                          : new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => handleDelete(e, b.id)}
                            disabled={deleting === b.id}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                          <ChevronRight size={15} className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                        </div>
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
  );
}