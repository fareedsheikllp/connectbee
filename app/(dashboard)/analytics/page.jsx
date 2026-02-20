"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, Users, MessageSquare, Megaphone,
  ArrowUpRight, ArrowDownRight, BarChart2, Activity,
  Calendar, RefreshCw
} from "lucide-react";

// ── Tiny sparkline SVG ──────────────────────────────────────────────────────
function Sparkline({ data = [], color = "#22c55e", height = 40 }) {
  if (!data.length) return null;
  const vals = data.map((d) => d.value);
  const max = Math.max(...vals, 1);
  const w = 120;
  const h = height;
  const pts = vals
    .map((v, i) => `${(i / (vals.length - 1)) * w},${h - (v / max) * h}`)
    .join(" ");
  const area = `M0,${h} L${pts
    .split(" ")
    .map((p) => `L${p}`)
    .join(" ")} L${w},${h} Z`;
  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Bar chart ───────────────────────────────────────────────────────────────
function BarChart({ data = [], color = "#22c55e" }) {
  const vals = data.map((d) => d.value);
  const max = Math.max(...vals, 1);
  return (
    <div className="flex items-end gap-[2px] h-24 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80"
            style={{
              height: `${Math.max((d.value / max) * 96, d.value ? 3 : 0)}px`,
              backgroundColor: color,
              opacity: 0.7 + (i / data.length) * 0.3,
            }}
          />
          {d.value > 0 && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-ink-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {d.value}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Line chart ──────────────────────────────────────────────────────────────
function LineChart({ data = [], color = "#22c55e" }) {
  if (!data.length) return null;
  const vals = data.map((d) => d.value);
  const max = Math.max(...vals, 1);
  const W = 100; // percent-based viewBox
  const H = 60;
  const pad = 2;
  const pts = vals
    .map((v, i) => {
      const x = pad + (i / (vals.length - 1)) * (W - pad * 2);
      const y = pad + (1 - v / max) * (H - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");
  const area = `M${pad},${H - pad} ${pts
    .split(" ")
    .map((p) => `L${p}`)
    .join(" ")} L${W - pad},${H - pad} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lineGrad)" />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {vals.map((v, i) => {
        const x = pad + (i / (vals.length - 1)) * (W - pad * 2);
        const y = pad + (1 - v / max) * (H - pad * 2);
        return v > 0 ? (
          <circle key={i} cx={x} cy={y} r="1.5" fill={color} vectorEffect="non-scaling-stroke" />
        ) : null;
      })}
    </svg>
  );
}

// ── Donut chart ─────────────────────────────────────────────────────────────
function DonutChart({ segments = [] }) {
  const total = segments.reduce((a, b) => a + b.count, 0) || 1;
  const colors = { SENT: "#22c55e", DRAFT: "#94a894", SCHEDULED: "#4ade80", FAILED: "#ef4444" };
  let offset = 0;
  const r = 30;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-6">
      <svg width="80" height="80" viewBox="0 0 80 80">
        {segments.map((s, i) => {
          const pct = s.count / total;
          const dash = pct * circ;
          const gap = circ - dash;
          const rotation = offset * 360 - 90;
          offset += pct;
          return (
            <circle
              key={i}
              cx="40" cy="40" r={r}
              fill="none"
              stroke={colors[s.status] || "#e4ebe4"}
              strokeWidth="10"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={0}
              transform={`rotate(${rotation} 40 40)`}
              style={{ transition: "all 0.6s ease" }}
            />
          );
        })}
        <text x="40" y="44" textAnchor="middle" fontSize="12" fontWeight="600" fill="#263326">
          {total}
        </text>
      </svg>
      <div className="space-y-1.5">
        {segments.map((s) => (
          <div key={s.status} className="flex items-center gap-2 text-xs">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: colors[s.status] || "#e4ebe4" }}
            />
            <span className="text-ink-500 capitalize">{s.status.toLowerCase()}</span>
            <span className="font-semibold text-ink-700 ml-auto">{s.count}</span>
          </div>
        ))}
        {segments.length === 0 && (
          <p className="text-xs text-ink-400">No data yet</p>
        )}
      </div>
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, color, sparkData, change }) {
  const isPositive = change >= 0;
  return (
    <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-soft hover:shadow-medium transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-ink-400 uppercase tracking-wider mb-1">{title}</p>
          <p className="text-3xl font-bold text-ink-900">{value.toLocaleString()}</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs">
          {isPositive ? (
            <ArrowUpRight size={13} className="text-brand-500" />
          ) : (
            <ArrowDownRight size={13} className="text-red-500" />
          )}
          <span className={isPositive ? "text-brand-600 font-medium" : "text-red-500 font-medium"}>
            {Math.abs(change)}% vs last period
          </span>
        </div>
        <Sparkline data={sparkData} color={color} />
      </div>
    </div>
  );
}

// ── Date range picker ────────────────────────────────────────────────────────
const RANGES = [
  { label: "7 days", value: "7" },
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
];

// ── Main Analytics Page ──────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [range, setRange] = useState("30");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${range}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [range]);

  const totals = data?.totals || { contacts: 0, broadcasts: 0, conversations: 0, messagesSent: 0 };
  const charts = data?.charts || { contactGrowth: [], broadcastActivity: [] };
  const broadcastStatus = data?.broadcastStatus || [];
  const recentBroadcasts = data?.recentBroadcasts || [];

  const statusColors = {
    SENT: "bg-brand-100 text-brand-700",
    DRAFT: "bg-surface-100 text-ink-500",
    SCHEDULED: "bg-blue-50 text-blue-600",
    FAILED: "bg-red-50 text-red-600",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 font-display">Analytics</h1>
          <p className="text-sm text-ink-400 mt-0.5">Track your WhatsApp engagement performance</p>
        </div>
        <div className="flex items-center gap-2">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                range === r.value
                  ? "bg-brand-500 text-white shadow-brand-sm"
                  : "bg-white border border-surface-200 text-ink-500 hover:border-brand-300"
              }`}
            >
              {r.label}
            </button>
          ))}
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-white border border-surface-200 text-ink-400 hover:text-brand-500 transition-colors"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Contacts"
          value={totals.contacts}
          icon={Users}
          color="#22c55e"
          change={12}
          sparkData={charts.contactGrowth}
        />
        <StatCard
          title="Messages Sent"
          value={totals.messagesSent}
          icon={MessageSquare}
          color="#4ade80"
          change={8}
          sparkData={charts.broadcastActivity}
        />
        <StatCard
          title="Broadcasts"
          value={totals.broadcasts}
          icon={Megaphone}
          color="#16a34a"
          change={5}
          sparkData={charts.broadcastActivity}
        />
        <StatCard
          title="Conversations"
          value={totals.conversations}
          icon={Activity}
          color="#166534"
          change={-2}
          sparkData={charts.contactGrowth}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Contact Growth */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-200 p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-ink-800">Contact Growth</h2>
              <p className="text-xs text-ink-400 mt-0.5">New contacts added over time</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">
              <TrendingUp size={12} />
              <span>Growing</span>
            </div>
          </div>
          {charts.contactGrowth.length > 0 ? (
            <>
              <LineChart data={charts.contactGrowth} color="#22c55e" />
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-ink-300">
                  {charts.contactGrowth[0]?.date}
                </span>
                <span className="text-[10px] text-ink-300">
                  {charts.contactGrowth[charts.contactGrowth.length - 1]?.date}
                </span>
              </div>
            </>
          ) : (
            <div className="h-24 flex items-center justify-center text-sm text-ink-300">
              No contact data yet
            </div>
          )}
        </div>

        {/* Broadcast Status Donut */}
        <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-soft">
          <div className="mb-4">
            <h2 className="font-semibold text-ink-800">Broadcast Status</h2>
            <p className="text-xs text-ink-400 mt-0.5">Breakdown by status</p>
          </div>
          <DonutChart segments={broadcastStatus} />
        </div>
      </div>

      {/* Broadcast Activity Bar Chart */}
      <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-ink-800">Broadcast Activity</h2>
            <p className="text-xs text-ink-400 mt-0.5">Messages sent per day</p>
          </div>
          <BarChart2 size={16} className="text-ink-300" />
        </div>
        {charts.broadcastActivity.some((d) => d.value > 0) ? (
          <BarChart data={charts.broadcastActivity} color="#22c55e" />
        ) : (
          <div className="h-24 flex items-center justify-center text-sm text-ink-300">
            No broadcast data yet — send your first campaign!
          </div>
        )}
      </div>

      {/* Recent Broadcasts Table */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
          <h2 className="font-semibold text-ink-800">Recent Broadcasts</h2>
          <a href="/broadcasts" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
            View all <ArrowUpRight size={12} />
          </a>
        </div>
        {recentBroadcasts.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-ink-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-ink-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-ink-400 uppercase tracking-wider">Recipients</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-ink-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {recentBroadcasts.map((b) => (
                <tr key={b.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-ink-800">{b.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] || "bg-surface-100 text-ink-500"}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-ink-600">{b.recipientCount || 0}</td>
                  <td className="px-5 py-3.5 text-ink-400">
                    {new Date(b.createdAt).toLocaleDateString("en-CA", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center text-ink-300 text-sm">
            No broadcasts yet — create your first campaign to see data here.
          </div>
        )}
      </div>
    </div>
  );
}
