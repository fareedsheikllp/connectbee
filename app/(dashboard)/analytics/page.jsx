"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, Users, MessageSquare, Megaphone, RefreshCw,
  ArrowUpRight, BarChart2, Activity, Bot, Target,
  CheckCircle, XCircle, Clock, AlertCircle, FileText,
  ChevronRight, Send, Inbox
} from "lucide-react";
// ─── 3D Stat Card ─────────────────────────────────────────────────
function Card3D({ children, className = "" }) {
  return (
    <div className={`relative bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_1px_4px_-1px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.06)] transition-shadow duration-300 ${className}`}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
      {children}
    </div>
  );
}

// ─── Agent card ───────────────────────────────────────────────────
function AgentCard({ agent }) {
  return (
    <Card3D className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
          {agent.name[0].toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{agent.name}</p>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            agent.role === "SUPERVISOR" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
          }`}>{agent.role}</span>
        </div>
        <div className="ml-auto text-right">
          <p className="text-2xl font-black text-gray-900">{agent.total}</p>
          <p className="text-[10px] text-gray-400">total</p>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { label: "Open", value: agent.open, color: "#38bdf8" },
        ].map(s => (
          <div key={s.label}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-gray-500">{s.label}</span>
              <span className="font-bold text-gray-700">{s.value}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${agent.total ? (s.value / agent.total) * 100 : 0}%`, backgroundColor: s.color }} />
            </div>
          </div>
        ))}
      </div>
    </Card3D>
  );
}

// ─── Channel card ─────────────────────────────────────────────────
function ChannelCard({ channel }) {
  return (
    <Card3D className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: channel.color + "22", border: `2px solid ${channel.color}44` }}>
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{channel.name}</p>
          <p className="text-[11px] text-gray-400">Channel</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-2xl font-black text-gray-900">{channel.total}</p>
          <p className="text-[10px] text-gray-400">convos</p>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { label: "Open",     value: channel.open,     color: "#38bdf8" },
          { label: "Bot",      value: channel.bot,      color: "#8b5cf6" },
        ].map(s => (
          <div key={s.label}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-gray-500">{s.label}</span>
              <span className="font-bold text-gray-700">{s.value}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${channel.total ? (s.value / channel.total) * 100 : 0}%`, backgroundColor: s.color }} />
            </div>
          </div>
        ))}
      </div>
    </Card3D>
  );
}
// ─── Color palette ────────────────────────────────────────────────
const C = {
  emerald:  "#22c55e",
  red:      "#ef4444",
  amber:    "#f59e0b",
  sky:      "#38bdf8",
  violet:   "#8b5cf6",
  slate:    "#94a3b8",
  orange:   "#f97316",
  pink:     "#ec4899",
};

const STATUS_COLORS = {
  SENT:      C.emerald, APPROVED:  C.emerald,
  FAILED:    C.red,     REJECTED:  C.red,
  DRAFT:     C.slate,   NONE:      C.slate,
  SENDING:   C.sky,     PENDING:   C.amber,
  OPEN:      C.sky,     BOT:       C.violet,
  CLOSED:    C.slate,   SCHEDULED: C.amber,
};

// ─── Primitives ───────────────────────────────────────────────────

function Empty({ label = "No data yet" }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <BarChart2 size={24} className="text-gray-200" />
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      {Icon && (
        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <Icon size={14} className="text-emerald-600" />
        </div>
      )}
      <div>
        <h2 className="text-sm font-bold text-gray-800">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Donut ────────────────────────────────────────────────────────
function Donut({ segments = [], size = 120, stroke = 18, centerLabel }) {
  if (!segments.length || segments.every(s => !s.count)) return <Empty />;
  const total = segments.reduce((a, s) => a + s.count, 0) || 1;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;
  let offset = 0;
  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
          {segments.map((s, i) => {
            const pct = s.count / total;
            const dash = pct * circ;
            const gap = circ - dash;
            const el = (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                stroke={STATUS_COLORS[s.status] || STATUS_COLORS[s.label] || Object.values(C)[i % 8]}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset * circ}
                strokeLinecap="butt"
              />
            );
            offset += pct;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold text-gray-800">{total}</span>
          {centerLabel && <span className="text-[10px] text-gray-400 uppercase tracking-wide">{centerLabel}</span>}
        </div>
      </div>
      <div className="space-y-2.5 flex-1 min-w-0">
        {segments.map((s, i) => {
          const color = STATUS_COLORS[s.status] || STATUS_COLORS[s.label] || Object.values(C)[i % 8];
          const pct = Math.round((s.count / total) * 100);
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }}/>
                  {s.status || s.label || "Unknown"}
                </span>
                <span className="text-xs font-bold text-gray-700">{s.count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Horizontal bar chart ─────────────────────────────────────────
function HBarChart({ data = [], color = C.emerald, valueLabel = "" }) {
  if (!data.length) return <Empty />;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const pct = Math.round((d.value / max) * 100);
        const clr = d.color || (Array.isArray(color) ? color[i % color.length] : color);
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-600 font-medium truncate max-w-[65%]" title={d.label}>{d.label}</span>
              <span className="text-xs font-bold text-gray-700 tabular-nums">{d.value}{valueLabel}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: clr }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Vertical bar chart ───────────────────────────────────────────
function VBarChart({ data = [], color = C.emerald }) {
  if (!data.length || data.every(d => !d.value)) return <Empty label="No activity in this period" />;
  const max = Math.max(...data.map(d => d.value), 1);
  // Show max 30 bars, skip labels if crowded
  const show = data.slice(-30);
  const showLabels = show.length <= 14;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-px h-28 w-full">
        {show.map((d, i) => {
          const h = Math.max((d.value / max) * 112, d.value ? 3 : 0);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded
                opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {d.value}
              </div>
              <div className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-75"
                style={{ height: `${h}px`, backgroundColor: color }} />
            </div>
          );
        })}
      </div>
      {showLabels && (
        <div className="flex gap-px">
          {show.map((d, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="text-[9px] text-gray-400 writing-mode-vertical block truncate">
                {d.date?.split(" ")[1] || ""}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

// ─── Line chart ───────────────────────────────────────────────────
function LineChart({ data = [], color = C.emerald, showDots = false }) {
  if (!data.length || data.every(d => !d.value)) return <Empty label="No data in this period" />;
  const vals = data.map(d => d.value);
  const max = Math.max(...vals, 1);
  const W = 100, H = 60, pad = 2;
  const points = vals.map((v, i) => {
    const x = pad + (i / Math.max(vals.length - 1, 1)) * (W - pad * 2);
    const y = pad + (1 - v / max) * (H - pad * 2);
    return { x, y, v };
  });
  const pts = points.map(p => `${p.x},${p.y}`).join(" ");
  const area = `M${pad},${H - pad} ${points.map(p => `L${p.x},${p.y}`).join(" ")} L${W - pad},${H - pad} Z`;
  return (
    <div className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`lg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#lg-${color.replace("#","")})`}/>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
        {showDots && points.map((p, i) => (
          p.v > 0 && <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={color} vectorEffect="non-scaling-stroke"/>
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

// ─── Multi-line chart (delivery rate trend) ───────────────────────
function DeliveryTrendChart({ data = [] }) {
  if (!data.length) return <Empty label="Send more broadcasts to see delivery trends" />;
  const vals = data.map(d => d.value);
  const W = 100, H = 60, pad = 3;
  const pts = vals.map((v, i) => {
    const x = pad + (i / Math.max(vals.length - 1, 1)) * (W - pad * 2);
    const y = pad + (1 - v / 100) * (H - pad * 2);
    return { x, y, v, label: data[i].name, date: data[i].date };
  });
  const ptStr = pts.map(p => `${p.x},${p.y}`).join(" ");
  const area = `M${pad},${H - pad} ${pts.map(p => `L${p.x},${p.y}`).join(" ")} L${W - pad},${H - pad} Z`;
  return (
    <div className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28" preserveAspectRatio="none">
        <defs>
          <linearGradient id="dtGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.emerald} stopOpacity="0.15"/>
            <stop offset="100%" stopColor={C.emerald} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* 50% and 80% reference lines */}
        {[50, 80].map(pct => {
          const y = pad + (1 - pct / 100) * (H - pad * 2);
          return (
            <g key={pct}>
              <line x1={pad} y1={y} x2={W - pad} y2={y} stroke="#e5e7eb" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="2,2"/>
              <text x={pad + 0.5} y={y - 1} fontSize="3" fill="#9ca3af">{pct}%</text>
            </g>
          );
        })}
        <path d={area} fill="url(#dtGrad)"/>
        <polyline points={ptStr} fill="none" stroke={C.emerald} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={p.v >= 80 ? C.emerald : p.v >= 50 ? C.amber : C.red} vectorEffect="non-scaling-stroke"/>
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
      <div className="flex items-center gap-4 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"/>≥80% Good</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"/>50–79% OK</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"/>&lt;50% Poor</span>
      </div>
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────
function KPICard({ title, value, sub, icon: Icon, accent = "text-gray-700", ring = "ring-gray-200", bg = "bg-white", onClick }) {
  return (
    <div onClick={onClick} className={`${bg} rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-4 shadow-sm ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}>
      <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 ring-1 ${ring} shadow-sm`}>
        <Icon size={15} className={accent}/>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide leading-none mb-1">{title}</p>
        <p className={`text-2xl font-extrabold leading-none ${accent}`}>{value}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-1 leading-none truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Broadcast table ──────────────────────────────────────────────
function BroadcastTable({ rows = [], showRetarget = false }) {
  if (!rows.length) return <Empty label="No broadcasts found" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-50 bg-gray-50/60">
            {["Name", showRetarget && "Type", "Status", "Recipients", "Delivered", "Failed", "Rate", "Date"]
              .filter(Boolean).map(h => (
              <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map(b => (
            <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
              <td className="px-4 py-3 font-semibold text-gray-800 max-w-[180px] truncate" title={b.name}>{b.name}</td>
              {showRetarget && (
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    b.isRetarget ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-gray-50 text-gray-500 border-gray-200"
                  }`}>
                    {b.isRetarget ? <><Target size={8}/> Retarget</> : "Original"}
                  </span>
                </td>
              )}
              <td className="px-4 py-3">
                <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: (STATUS_COLORS[b.status] || "#94a3b8") + "18", color: STATUS_COLORS[b.status] || "#94a3b8" }}>
                  {b.status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600 tabular-nums">{b.total}</td>
              <td className="px-4 py-3 text-emerald-600 font-semibold tabular-nums">{b.sent}</td>
              <td className="px-4 py-3 text-red-500 tabular-nums">{b.failed}</td>
              <td className="px-4 py-3">
                {b.deliveryRate !== null ? (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${b.deliveryRate}%`,
                        backgroundColor: b.deliveryRate >= 80 ? C.emerald : b.deliveryRate >= 50 ? C.amber : C.red
                      }}/>
                    </div>
                    <span className="font-bold tabular-nums text-gray-700">{b.deliveryRate}%</span>
                  </div>
                ) : <span className="text-gray-300">—</span>}
              </td>
              <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                {new Date(b.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
const RANGES = [{ label: "7d", value: "7" }, { label: "30d", value: "30" }, { label: "90d", value: "90" }];

export default function AnalyticsPage() {
  const [range, setRange]     = useState("30");
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("overview"); // overview | broadcasts | messages | templates

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${range}`);
      setData(await res.json());
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [range]);

  const T  = data?.totals       || {};
  const CH = data?.charts       || {};
  const BR = data?.breakdowns   || {};
  const TB = data?.tables       || {};

  const navItems = [
    { key: "overview",   label: "Overview",    icon: BarChart2     },
    { key: "broadcasts", label: "Broadcasts",  icon: Megaphone     },
    { key: "messages",   label: "Messages",    icon: MessageSquare },
    { key: "templates",  label: "Templates",   icon: FileText      },
    { key: "team",       label: "Team",        icon: Users         },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9f7]">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Analytics</h1>
            <p className="text-xs text-gray-400">Full data overview across all features</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              {RANGES.map(r => (
                <button key={r.value} onClick={() => setRange(r.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    range === r.value ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
            <button onClick={load} className="p-2 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-emerald-500 transition-colors">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""}/>
            </button>
          </div>
        </div>

        {/* Section nav */}
        <div className="max-w-7xl mx-auto px-8 flex gap-1">
          {navItems.map(n => (
            <button key={n.key} onClick={() => setSection(n.key)}
              className={`relative flex items-center gap-2 px-4 py-3 text-xs font-bold transition-colors ${
                section === n.key ? "text-emerald-700" : "text-gray-400 hover:text-gray-600"
              }`}>
              <n.icon size={13}/>
              {n.label}
              {section === n.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full"/>}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-7 space-y-6">

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-24 animate-pulse">
                <div className="h-3 bg-gray-100 rounded-full w-1/2 mb-3"/>
                <div className="h-7 bg-gray-100 rounded-full w-1/3"/>
              </div>
            ))}
          </div>
        )}

        {!loading && data && (
          <>
            {/* ══ OVERVIEW ══════════════════════════════════════════ */}
            {section === "overview" && (
              <div className="space-y-6">

                {/* KPI grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <KPICard title="Contacts"     value={T.contacts?.toLocaleString() || 0} icon={Users}       accent="text-gray-700"    ring="ring-gray-200"    />
                  <KPICard title="Broadcasts"   value={T.broadcasts || 0}                 icon={Megaphone}   accent="text-emerald-600" ring="ring-emerald-200" bg="bg-emerald-50/60" />
                  <KPICard title="Conversations"value={T.conversations || 0}              icon={Activity}    accent="text-sky-600"     ring="ring-sky-200"     bg="bg-sky-50/60" />
                  <KPICard title="Messages"     value={T.messages?.toLocaleString() || 0} icon={MessageSquare}accent="text-violet-600" ring="ring-violet-200"  bg="bg-violet-50/60" />
                  <KPICard title="Templates"    value={T.templates || 0}                  icon={FileText}    accent="text-amber-600"   ring="ring-amber-200"   bg="bg-amber-50/60" />
                  <KPICard title="Retargeted"   value={T.retargetedBroadcasts || 0}       icon={Target}      accent="text-orange-600"  ring="ring-orange-200"  bg="bg-orange-50/60" />
                </div>

                {/* Delivery health */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KPICard title="Delivered"    value={T.messagesSent || 0}   sub="Total messages delivered" icon={CheckCircle} accent="text-emerald-600" ring="ring-emerald-200" bg="bg-emerald-50/60" />
                  <KPICard title="Failed"        value={T.messagesFailed || 0} sub="Total failed deliveries"  icon={XCircle}     accent="text-red-500"     ring="ring-red-200"     bg="bg-red-50/50" />
                  <KPICard title="Delivery Rate" value={`${T.deliveryRate || 0}%`} sub="Across all broadcasts"  icon={TrendingUp}  accent={T.deliveryRate >= 80 ? "text-emerald-600" : T.deliveryRate >= 50 ? "text-amber-600" : "text-red-500"} ring="ring-gray-200" />
                  <KPICard title="Bot Convos"   value={T.botConversations || 0} sub="Handled by chatbot"      icon={Bot}         accent="text-violet-600"  ring="ring-violet-200"  bg="bg-violet-50/60" />
                </div>

                {/* Charts row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                  {/* Contact growth line */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <SectionHeader title="Contact Growth" subtitle={`New contacts over last ${range} days`} icon={Users}/>
                    <LineChart data={CH.contactGrowth} color={C.emerald} showDots />
                  </div>

                  {/* Conversation status donut */}
                  <Card3D className="p-6">
                    <SectionHeader title="Conversations" subtitle="By status" icon={Activity}/>
                    <Donut
                      segments={(BR.conversationStatus || []).map(s => ({ ...s, label: s.status }))}
                      size={100} stroke={14} centerLabel="convos"
                    />
                  </Card3D>
                </div>

                {/* Charts row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Message activity bar */}
                  <Card3D className="p-6">
                    <SectionHeader title="Message Activity" subtitle={`Messages per day · last ${range} days`} icon={MessageSquare}/>
                    <VBarChart data={CH.messageActivity} color={C.violet}/>
                  </Card3D>

                  {/* Broadcast activity bar */}
                  <Card3D className="p-6">
                    <SectionHeader title="Broadcast Activity" subtitle={`Broadcasts sent per day · last ${range} days`} icon={Megaphone}/>
                    <VBarChart data={CH.broadcastActivity} color={C.emerald}/>
                  </Card3D>
                </div>
{/* Channel + Agent summary */}
                {(BR.channelBreakdown || []).length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* Channel summary */}
                    <Card3D className="p-6">
                      <SectionHeader title="Channels" subtitle="Conversation load per department" icon={Users} />
                      <div className="space-y-3">
                        {(BR.channelBreakdown || []).map(ch => (
                          <div key={ch.id} className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ch.color }} />
                            <span className="text-xs font-semibold text-gray-700 w-24 truncate">{ch.name}</span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${Math.max(...(BR.channelBreakdown || []).map(c => c.total), 1) > 0
                                    ? (ch.total / Math.max(...(BR.channelBreakdown || []).map(c => c.total), 1)) * 100
                                    : 0}%`,
                                  backgroundColor: ch.color
                                }} />
                            </div>
                            <div className="text-right flex-shrink-0 w-20">
                              <span className="text-xs font-bold text-gray-700">{ch.total} total</span>
                              <div className="flex gap-2 justify-end mt-0.5">
                                <span className="text-[10px] text-sky-500">{ch.open} open</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card3D>

                    {/* Agent summary */}
                    <Card3D className="p-6">
                      <SectionHeader title="Agent Load" subtitle="Open conversations per agent" icon={Users} />
                      <div className="space-y-3">
                        {[...(BR.agentBreakdown || [])]
                          .sort((a, b) => b.open - a.open)
                          .map((agent, i) => {
                            const maxOpen = Math.max(...(BR.agentBreakdown || []).map(a => a.open), 1);
                            return (
                              <div key={agent.id} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                  {agent.name[0].toUpperCase()}
                                </div>
                                <span className="text-xs font-semibold text-gray-700 w-20 truncate">{agent.name}</span>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-700"
                                    style={{
                                      width: `${maxOpen > 0 ? (agent.open / maxOpen) * 100 : 0}%`,
                                      backgroundColor: agent.open > 5 ? "#ef4444" : agent.open > 2 ? "#f59e0b" : "#22c55e"
                                    }} />
                                </div>
                                <div className="text-right flex-shrink-0 w-24">
                                  <span className="text-xs font-bold text-gray-700">{agent.open} open</span>
                                </div>
                              </div>
                            );
                          })}
                        {!(BR.agentBreakdown || []).length && (
                          <p className="text-xs text-gray-300 text-center py-4">No agents assigned yet</p>
                        )}
                      </div>
                    </Card3D>

                  </div>
                )}
              </div>
            )}

            {/* ══ BROADCASTS ════════════════════════════════════════ */}
            {section === "broadcasts" && (
              <div className="space-y-6">

                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KPICard title="Total Broadcasts"   value={T.broadcasts || 0}              icon={Megaphone}   accent="text-gray-700"    ring="ring-gray-200"    />
                  <KPICard title="Retarget Campaigns" value={T.retargetedBroadcasts || 0}    icon={Target}      accent="text-orange-600"  ring="ring-orange-200"  bg="bg-orange-50/60" />
                  <KPICard title="Overall Delivery"   value={`${T.deliveryRate || 0}%`}      icon={TrendingUp}  accent="text-emerald-600" ring="ring-emerald-200" bg="bg-emerald-50/60" />
                  <KPICard title="Total Failed"       value={T.messagesFailed || 0}          icon={XCircle}     accent="text-red-500"     ring="ring-red-200"     bg="bg-red-50/50" />
                </div>

                {/* Broadcast status donut + delivery trend */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <SectionHeader title="Broadcast Status" subtitle="By lifecycle stage" icon={Megaphone}/>
                    <Donut
                      segments={(BR.broadcastStatus || []).map(s => ({ ...s, label: s.status }))}
                      size={110} stroke={16} centerLabel="total"
                    />
                  </div>
                  <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <SectionHeader title="Delivery Rate Trend" subtitle="Per broadcast, chronological — dots colored by performance" icon={TrendingUp}/>
                    <DeliveryTrendChart data={CH.deliveryTrend}/>
                  </div>
                </div>

                {/* Failure reasons */}
                {(BR.failureReasons || []).length > 0 && (
                  <Card3D className="p-6">
                    <SectionHeader title="Failure Reasons" subtitle="Why messages didn't deliver" icon={AlertCircle}/>
                    <HBarChart
                      data={(BR.failureReasons || []).map(f => ({ label: f.reason, value: f.count, color: C.red }))}
                      color={C.red}
                    />
                  </Card3D>
                )}

                {/* All broadcasts table */}
                <Card3D className="overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-50">
                    <SectionHeader title="All Broadcasts" subtitle="Complete list with delivery breakdown" icon={BarChart2}/>
                  </div>
                  <BroadcastTable rows={TB.recentBroadcasts || []} showRetarget />
                </Card3D>

                {/* Retarget breakdown */}
                {(TB.retargetedBroadcasts || []).length > 0 && (
                  <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-orange-50 bg-orange-50/30">
                      <SectionHeader title="Retarget Campaigns" subtitle="Broadcasts created from failed recipients" icon={Target}/>
                    </div>
                    <BroadcastTable rows={TB.retargetedBroadcasts} />
                  </div>
                )}

              </div>
            )}

            {/* ══ MESSAGES ══════════════════════════════════════════ */}
            {section === "messages" && (
              <div className="space-y-6">

                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KPICard title="Total Messages"  value={T.messages?.toLocaleString() || 0} icon={MessageSquare} accent="text-gray-700"    ring="ring-gray-200"   />
                  <KPICard title="Outbound"        value={T.outboundMessages || 0}            icon={Send}          accent="text-emerald-600" ring="ring-emerald-200" bg="bg-emerald-50/60" />
                  <KPICard title="Inbound"         value={T.inboundMessages || 0}             icon={Inbox}         accent="text-sky-600"     ring="ring-sky-200"     bg="bg-sky-50/60" />
                  <KPICard title="Open Convos"     value={T.openConversations || 0}           icon={Activity}      accent="text-violet-600"  ring="ring-violet-200"  bg="bg-violet-50/60" />
                </div>

                {/* In/out donut + message activity */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <SectionHeader title="Message Direction" subtitle="Inbound vs outbound split" icon={MessageSquare}/>
                    <Donut
                      segments={[
                        { status: "OUTBOUND", label: "Outbound", count: T.outboundMessages || 0 },
                        { status: "INBOUND",  label: "Inbound",  count: T.inboundMessages  || 0 },
                      ].filter(s => s.count > 0).map(s => ({
                        ...s,
                        status: s.status === "OUTBOUND" ? "SENT" : "OPEN"
                      }))}
                      size={100} stroke={14} centerLabel="msgs"
                    />
                    {/* Manual legend since status keys differ */}
                    <div className="mt-4 space-y-2">
                      {[
                        { label: "Outbound (sent by you)", value: T.outboundMessages || 0, color: C.emerald },
                        { label: "Inbound (received)",     value: T.inboundMessages  || 0, color: C.sky     },
                      ].map(r => (
                        <div key={r.label} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }}/>
                            {r.label}
                          </span>
                          <span className="font-bold text-gray-700">{r.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <SectionHeader title="Message Volume" subtitle={`Daily messages · last ${range} days`} icon={TrendingUp}/>
                    <LineChart data={CH.messageActivity} color={C.violet} showDots/>
                  </div>
                </div>

                {/* Conversation breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <Card3D className="p-6">
                    <SectionHeader title="Conversation Status" subtitle="Open · Bot-handled · Closed" icon={Activity}/>
                    <Donut
                      segments={(BR.conversationStatus || []).map(s => ({ ...s, label: s.status }))}
                      size={100} stroke={14} centerLabel="convos"
                    />
                  </Card3D>

                  <Card3D className="p-6">
                    <SectionHeader title="Bot vs Human" subtitle="Bot-handled vs open conversations" icon={Bot}/>
                    <Donut
                      segments={[
                        { status: "BOT",  label: "Bot-handled", count: T.botConversations  || 0 },
                        { status: "OPEN", label: "Needs human",  count: T.openConversations || 0 },
                      ].filter(s => s.count > 0)}
                      size={100} stroke={14} centerLabel="convos"
                    />
                  </Card3D>
                </div>

                {/* Top failed contacts */}
                {(TB.topFailedContacts || []).length > 0 && (
                  <Card3D className="overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50">
                      <SectionHeader title="Contacts with Most Failures" subtitle="Clean these up to improve delivery" icon={XCircle}/>
                    </div>
                    <div className="p-6">
                      <HBarChart
                        data={(TB.topFailedContacts || []).map(c => ({
                          label: `${c.name || "Unknown"} · ${c.phone}`,
                          value: c.count,
                          color: C.red,
                        }))}
                        color={C.red}
                        valueLabel=" failures"
                      />
                    </div>
                  </Card3D>
                )}

              </div>
            )}
{/* ══ TEAM ══════════════════════════════════════════════ */}
            {section === "team" && (
              <div className="space-y-6">

                {/* Channel overview */}
                {(BR.channelBreakdown || []).length > 0 ? (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Users size={14} className="text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-gray-800">Channel Performance</h2>
                        <p className="text-xs text-gray-400">Conversation breakdown per department</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(BR.channelBreakdown || []).map(ch => (
                        <ChannelCard key={ch.id} channel={ch} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <Card3D className="p-10 text-center">
                    <Users size={28} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 font-medium">No channels yet</p>
                    <p className="text-xs text-gray-300 mt-1">Create channels in Settings → Team</p>
                  </Card3D>
                )}

                {/* Agent overview */}
                {(BR.agentBreakdown || []).length > 0 ? (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
                        <Users size={14} className="text-violet-600" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-gray-800">Agent Performance</h2>
                        <p className="text-xs text-gray-400">Conversations handled per team member</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(BR.agentBreakdown || [])
                        .sort((a, b) => b.total - a.total)
                        .map(agent => (
                          <AgentCard key={agent.id} agent={agent} />
                        ))}
                    </div>
                  </div>
                ) : (
                  <Card3D className="p-10 text-center">
                    <Users size={28} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 font-medium">No team members yet</p>
                    <p className="text-xs text-gray-300 mt-1">Add agents in Settings → Team</p>
                  </Card3D>
                )}

                {/* Leaderboard */}
                {(BR.agentBreakdown || []).length > 0 && (
                  <Card3D className="overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white">
                      <h2 className="text-sm font-bold text-gray-800">Agent Leaderboard</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Ranked by total conversations</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {[...(BR.agentBreakdown || [])]
                        .sort((a, b) => b.total - a.total)
                        .map((agent, i) => {
                          const medals = ["🥇", "🥈", "🥉"];
                          return (
                            <div key={agent.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors">
                              <span className="text-xl w-8 text-center flex-shrink-0">
                                {medals[i] || <span className="text-sm font-bold text-gray-400">#{i + 1}</span>}
                              </span>
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm shadow flex-shrink-0">
                                {agent.name[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800">{agent.name}</p>
                                <p className="text-xs text-gray-400">{agent.total} total · {agent.open} open</p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </Card3D>
                )}

              </div>
            )}
            {/* ══ TEMPLATES ══════════════════════════════════════════ */}
            {section === "templates" && (
              <div className="space-y-6">

                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KPICard title="Total Templates" value={T.templates || 0}                                                     icon={FileText}    accent="text-gray-700"    ring="ring-gray-200"    />
                  <KPICard title="Approved"        value={(BR.templateStatus || []).find(s => s.status === "APPROVED")?.count || 0} icon={CheckCircle} accent="text-emerald-600" ring="ring-emerald-200" bg="bg-emerald-50/60" />
                  <KPICard title="Pending"         value={(BR.templateStatus || []).find(s => s.status === "PENDING")?.count  || 0} icon={Clock}       accent="text-amber-600"   ring="ring-amber-200"   bg="bg-amber-50/60" />
                  <KPICard title="Not Submitted"   value={(BR.templateStatus || []).find(s => s.status === "NONE")?.count    || 0} icon={AlertCircle} accent="text-gray-500"    ring="ring-gray-200"    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Meta approval status donut */}
                  <Card3D className="p-6">
                    <SectionHeader title="Meta Approval Status" subtitle="Breakdown of template submission status" icon={CheckCircle}/>
                    <Donut
                      segments={(BR.templateStatus || []).map(s => ({ ...s, label: s.status }))}
                      size={110} stroke={16} centerLabel="templates"
                    />
                  </Card3D>

                  {/* Category breakdown */}
                  <Card3D className="p-6">
                    <SectionHeader title="Templates by Category" subtitle="Distribution across message types" icon={BarChart2}/>
                    {(BR.templateCategory || []).length ? (
                      <HBarChart
                        data={(BR.templateCategory || []).map((c, i) => ({
                          label: c.category,
                          value: c.count,
                          color: Object.values(C)[i % 8],
                        }))}
                      />
                    ) : <Empty label="No templates yet"/>}
                  </Card3D>
                </div>

                {/* Tip banner */}
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0"/>
                  <div>
                    <p className="text-sm font-bold text-amber-800">Meta Verification Pending</p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                      Once your Meta Business is verified, submit templates for approval. Only <strong>approved</strong> templates can be used in production broadcasts outside the 24-hour messaging window.
                    </p>
                  </div>
                </div>

              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}