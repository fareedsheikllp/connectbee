"use client";
import { useEffect, useState } from "react";

const PLAN_COLORS = {
  trial:      "border-amber-300 bg-amber-50",
  starter:    "border-slate-300 bg-slate-50",
  growth:     "border-emerald-400 bg-emerald-50",
  enterprise: "border-violet-400 bg-violet-50",
};

const PLAN_BADGE = {
  trial:      "bg-amber-100 text-amber-700",
  starter:    "bg-slate-100 text-slate-600",
  growth:     "bg-emerald-100 text-emerald-700",
  enterprise: "bg-violet-100 text-violet-700",
};

export default function SettingsPage() {
  const [plans, setPlans]       = useState([]);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings", { credentials: "include" })
      .then(r => r.json())
      .then(d => { setPlans(d.plans || []); setLoading(false); });
  }, []);

  function startEdit(plan) {
    setEditing(plan.planKey);
    setForm({
      price:         plan.price,
      priceLabel:    plan.priceLabel,
      conversations: plan.conversations,
      flows:         plan.flows,
      agents:        plan.agents,
      channels:      plan.channels ?? 999,
    });
  }

  async function savePlan(planKey) {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ planKey, ...form }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlans(prev => prev.map(p => p.planKey === planKey ? data.plan : p));
      setSaved(planKey);
      setTimeout(() => setSaved(null), 3000);
      setEditing(null);
    }
    setSaving(false);
  }

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-sm text-gray-400">
        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        Loading settings...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Plan Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Edit pricing, conversation limits, and feature caps for each plan</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {plans.map((plan) => {
          const isEditing = editing === plan.planKey;
          const wasSaved  = saved === plan.planKey;

          return (
            <div
              key={plan.planKey}
              className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${
                isEditing ? PLAN_COLORS[plan.planKey] : "border-gray-100"
              }`}
            >
              {/* Card header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${PLAN_BADGE[plan.planKey]}`}>
                    {plan.label}
                  </span>
                  {wasSaved && (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      Saved
                    </span>
                  )}
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => startEdit(plan)}
                    className="text-xs font-semibold text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => savePlan(plan.planKey)}
                      disabled={saving}
                      className="text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition-all"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Card body */}
              <div className="px-5 py-4 space-y-3">

                {/* Price */}
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Price / month</p>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input
                          type="number"
                          value={form.price}
                          onChange={e => {
                            set("price", e.target.value);
                            set("priceLabel", e.target.value == 0 ? "Free" : `$${parseFloat(e.target.value).toFixed(2)}/mo`);
                          }}
                          className="w-24 pl-6 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-gray-900">{plan.priceLabel}</p>
                  )}
                </div>

                {/* Conversations */}
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Conversations / mo</p>
                  {isEditing ? (
                    <input
                      type="number"
                      value={form.conversations}
                      onChange={e => set("conversations", e.target.value)}
                      className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 text-right"
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-900">
                      {plan.conversations >= 999999 ? "Unlimited" : plan.conversations.toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Flows */}
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Chatbot Flows</p>
                  {isEditing ? (
                    <input
                      type="number"
                      value={form.flows}
                      onChange={e => set("flows", e.target.value)}
                      className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 text-right"
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-900">
                      {plan.flows >= 999 ? "Unlimited" : plan.flows}
                    </p>
                  )}
                </div>

                {/* Agents */}
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Agents</p>
                  {isEditing ? (
                    <input
                      type="number"
                      value={form.agents}
                      onChange={e => set("agents", e.target.value)}
                      className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 text-right"
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-900">
                      {plan.agents >= 999 ? "Unlimited" : plan.agents}
                    </p>
                  )}
                </div>

                {/* Channels */}
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Channels</p>
                  {isEditing ? (
                    <input
                      type="number"
                      value={form.channels}
                      onChange={e => set("channels", e.target.value)}
                      className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 text-right"
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-900">
                      {(plan.channels ?? 999) >= 999 ? "Unlimited" : plan.channels}
                    </p>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}