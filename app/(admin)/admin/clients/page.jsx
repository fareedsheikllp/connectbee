"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePlans } from "@/hooks/usePlans";

const PLAN_BADGE = {
  trial:      "bg-amber-100 text-amber-700",
  starter:    "bg-slate-100 text-slate-600",
  growth:     "bg-emerald-100 text-emerald-700",
  enterprise: "bg-violet-100 text-violet-700",
};

function CreateModal({ onClose, onCreated, planConfig }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", plan: "starter" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const emailRef = useRef();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { emailRef.current?.focus(); }, []);
  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function submit() {
    setError("");
    if (!form.email || !form.password) { setError("Email and password are required."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Something went wrong."); setLoading(false); return; }
    onCreated();
    onClose();
  }

  const planOptions = [
    { key: "trial",      color: "border-amber-300 bg-amber-50"     },
    { key: "starter",    color: "border-slate-300 bg-slate-50"     },
    { key: "growth",     color: "border-emerald-400 bg-emerald-50" },
    { key: "enterprise", color: "border-violet-400 bg-violet-50"   },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[420px] overflow-hidden border border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900">Create client</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">Set up an account on their behalf</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Name</label>
              <input type="text" placeholder="Jane Smith" value={form.name} onChange={(e) => set("name", e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 placeholder:text-gray-300" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Email <span className="text-red-400">*</span></label>
              <input ref={emailRef} type="email" placeholder="jane@co.com" value={form.email} onChange={(e) => set("email", e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 placeholder:text-gray-300" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Password <span className="text-red-400">*</span></label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" value={form.password} onChange={(e) => set("password", e.target.value)}
                className="w-full px-3 py-2 pr-9 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 placeholder:text-gray-300" />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showPassword ? (
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-2">Plan</label>
            <div className="grid grid-cols-4 gap-2">
              {planOptions.map((p) => (
                <button key={p.key} onClick={() => set("plan", p.key)}
                  className={`py-2.5 px-2 rounded-xl border-2 text-center transition-all ${form.plan === p.key ? p.color : "border-gray-100 bg-white hover:border-gray-200"}`}>
                  <p className={`text-[11px] font-semibold capitalize ${form.plan === p.key ? "text-gray-700" : "text-gray-400"}`}>{p.key}</p>
                  <p className={`text-[9px] mt-0.5 ${form.plan === p.key ? "text-gray-500" : "text-gray-300"}`}>{planConfig[p.key]?.priceLabel || "—"}</p>
                </button>
              ))}
            </div>
          </div>
          {error && <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2"><p className="text-[12px] text-red-600">{error}</p></div>}
        </div>
        <div className="px-6 pb-5 flex gap-2">
          <button onClick={submit} disabled={loading}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><div className="w-3.5 h-3.5 border-[1.5px] border-white/40 border-t-white rounded-full animate-spin" />Creating...</> : "Create Client"}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 text-[13px] font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients]       = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [search, setSearch]         = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const { plans: planConfig }       = usePlans();

  const PLAN_LIMITS = Object.fromEntries(
    Object.entries(planConfig).map(([k, v]) => [k, {
      conversations: v.conversations >= 999999 ? "Unlimited" : v.conversations,
      flows:         v.flows >= 999 ? "Unlimited" : v.flows,
      price:         v.priceLabel,
    }])
  );

  async function load() {
    const res = await fetch("/api/admin/clients", { credentials: "include" });
    const data = await res.json();
    setClients(data.clients || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let r = clients;
    if (planFilter !== "all") r = r.filter((c) => c.plan === planFilter);
    if (search) {
      const s = search.toLowerCase();
      r = r.filter((c) => c.email?.toLowerCase().includes(s) || c.name?.toLowerCase().includes(s));
    }
    setFiltered(r);
  }, [search, planFilter, clients]);

  async function toggleStatus(c) {
    setTogglingId(c.id);
    const newStatus = c.status === "active" ? "inactive" : "active";
    const res = await fetch(`/api/admin/clients/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) setClients((prev) => prev.map((x) => x.id === c.id ? { ...x, status: newStatus } : x));
    setTogglingId(null);
  }

  const activeCount = clients.filter(c => c.status === "active").length;

  return (
    <div className="p-8">
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={load} planConfig={planConfig} />}

      {/* Header */}
      <div className="flex items-end justify-between mb-7">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">Clients</h1>
          <p className="text-[13px] text-gray-400 mt-1">
            <span className="text-gray-700 font-medium">{clients.length}</span> total &middot;{" "}
            <span className="text-emerald-600 font-medium">{activeCount}</span> active &middot;{" "}
            <span className="text-gray-400">{clients.length - activeCount}</span> inactive
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-[13px] font-medium transition-all shadow-sm">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
          New Client
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 items-center">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input type="text" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-60 pl-9 pr-4 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white placeholder:text-gray-300 shadow-sm" />
        </div>
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-0.5 shadow-sm">
          {["all", "trial", "starter", "growth", "enterprise"].map((p) => (
            <button key={p} onClick={() => setPlanFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-all ${
                planFilter === p ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-700"
              }`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-5 h-5 border-[1.5px] border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-[13px] text-gray-400">Loading clients...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-[13px] font-medium text-gray-500">No clients found</p>
            <p className="text-[12px] text-gray-400">Try adjusting your filters</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #f3f3f3", background: "#fafafa" }}>
                {["Client", "Plan", "Conversations", "Flows", "Status", "Joined", ""].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const limits = PLAN_LIMITS[c.plan];
                const convLimit = typeof limits?.conversations === "number" ? limits.conversations : null;
                const pct = convLimit ? Math.min(100, Math.round(((c.conversationsUsed || 0) / convLimit) * 100)) : null;
                const isActive = c.status === "active";

                return (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f7f7f7" }}
                    className={`transition-colors ${!isActive ? "opacity-40" : "hover:bg-gray-50/80"}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-500 text-[11px] font-bold uppercase">{(c.name || c.email)[0]}</span>
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-gray-800">{c.name || "Unnamed"}</p>
                          <p className="text-[11px] text-gray-400 mono">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize ${PLAN_BADGE[c.plan] || "bg-gray-100 text-gray-400"}`}>{c.plan || "none"}</span>
                      {limits && <p className="text-[10px] text-gray-400 mt-0.5">{limits.price}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-medium text-gray-700">
                        {c.conversationsUsed ?? 0}<span className="text-gray-300 font-normal"> / {limits?.conversations ?? "—"}</span>
                      </p>
                      {pct !== null && (
                        <div className="w-16 h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                          <div className={`h-full rounded-full ${pct > 85 ? "bg-red-400" : pct > 60 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-500">
                      {c.flowsCount ?? 0}<span className="text-gray-300"> / {limits?.flows ?? "—"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => toggleStatus(c)} disabled={togglingId === c.id}
                        className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-all group ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                        }`}>
                        {togglingId === c.id
                          ? <div className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                          : <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                        }
                        <span className="group-hover:hidden">{isActive ? "Active" : "Inactive"}</span>
                        <span className="hidden group-hover:inline">{isActive ? "Deactivate" : "Activate"}</span>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-[11px] text-gray-400 mono">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-CA") : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/clients/${c.id}`}
                        className="flex items-center gap-1 text-[12px] font-medium text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-all">
                        Manage
                        <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}