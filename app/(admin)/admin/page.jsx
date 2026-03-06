"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePlans } from "@/hooks/usePlans";

const PLAN_BADGE = {
  trial:      "bg-amber-100 text-amber-700",
  starter:    "bg-slate-100 text-slate-600",
  growth:     "bg-emerald-100 text-emerald-700",
  enterprise: "bg-violet-100 text-violet-700",
};

const PLAN_BAR = {
  trial:      "bg-amber-400",
  starter:    "bg-slate-400",
  growth:     "bg-emerald-500",
  enterprise: "bg-violet-500",
};

export default function AdminOverviewPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const { plans } = usePlans();

  useEffect(() => {
    fetch("/api/admin/clients", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setClients(d.clients || []); setLoading(false); });
  }, []);

  const total      = clients.length;
  const active     = clients.filter((c) => c.status === "active").length;
  const starter    = clients.filter((c) => c.plan === "starter").length;
  const growth     = clients.filter((c) => c.plan === "growth").length;
  const enterprise = clients.filter((c) => c.plan === "enterprise").length;
  const trial      = clients.filter((c) => c.plan === "trial").length;
  const mrr        = (starter * (plans.starter?.price ?? 99.99) + growth * (plans.growth?.price ?? 149.99)).toFixed(2);
  const recent     = [...clients].slice(0, 6);

  const planBreakdown = [
    { key: "trial",      label: "Trial",      count: trial,      price: plans.trial?.priceLabel      || "Free"       },
    { key: "starter",    label: "Starter",    count: starter,    price: plans.starter?.priceLabel    || "$99.99/mo"  },
    { key: "growth",     label: "Growth",     count: growth,     price: plans.growth?.priceLabel     || "$149.99/mo" },
    { key: "enterprise", label: "Enterprise", count: enterprise, price: plans.enterprise?.priceLabel || "Custom"     },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const stats = [
    { label: "Total Clients",    value: total,                              sub: "all time"              },
    { label: "Active",           value: active,                             sub: `${total - active} inactive`, pct: total > 0 ? Math.round((active / total) * 100) : 0 },
    { label: "Monthly Revenue",  value: `$${Number(mrr).toLocaleString()}`, sub: "excl. enterprise"      },
    { label: "Enterprise",       value: enterprise,                         sub: "custom pricing"        },
  ];

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
          {new Date().toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight">{greeting}</h1>
        <p className="text-[14px] text-gray-400 mt-1">Here is what is happening with your platform today.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-[13px] text-gray-400">
          <div className="w-4 h-4 border-[1.5px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-200/60 shadow-sm">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">{s.label}</p>
                <p className="text-[28px] font-bold text-gray-900 leading-none">{s.value}</p>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-[12px] text-gray-400">{s.sub}</p>
                  {s.pct !== undefined && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                      {s.pct}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Lower grid */}
          <div className="grid grid-cols-5 gap-4">
            {/* Plan breakdown */}
            <div className="col-span-2 bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
              <h2 className="text-[13px] font-semibold text-gray-800 mb-5">Plan Breakdown</h2>
              <div className="space-y-4">
                {planBreakdown.map((p) => {
                  const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
                  return (
                    <div key={p.key}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${PLAN_BADGE[p.key]}`}>{p.label}</span>
                          <span className="text-[11px] text-gray-400">{p.price}</span>
                        </div>
                        <span className="text-[13px] font-semibold text-gray-700">{p.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#f1f1f1" }}>
                        <div className={`h-full rounded-full transition-all duration-700 ${PLAN_BAR[p.key]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent clients */}
            <div className="col-span-3 bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[13px] font-semibold text-gray-800">Recent Clients</h2>
                <Link href="/admin/clients" className="text-[12px] text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1 transition-colors">
                  View all
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
              </div>
              <div className="space-y-0.5">
                {recent.length === 0 ? (
                  <p className="text-[13px] text-gray-300 text-center py-10">No clients yet</p>
                ) : recent.map((c) => (
                  <Link key={c.id} href={`/admin/clients/${c.id}`}
                    className="flex items-center justify-between py-2.5 px-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-500 text-[11px] font-bold uppercase">{(c.name || c.email)[0]}</span>
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-gray-800 group-hover:text-emerald-600 transition-colors">{c.name || "Unnamed"}</p>
                        <p className="text-[11px] text-gray-400 mono">{c.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize ${PLAN_BADGE[c.plan] || "bg-gray-100 text-gray-400"}`}>{c.plan}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.status === "active" ? "bg-emerald-400" : "bg-gray-300"}`} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}