"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePlans } from "@/hooks/usePlans";

const PLAN_STYLES = {
  trial:      { badge: "bg-amber-100 text-amber-700",   border: "border-amber-300",   bg: "bg-amber-50"      },
  starter:    { badge: "bg-slate-100 text-slate-600",   border: "border-slate-300",   bg: "bg-slate-50"      },
  growth:     { badge: "bg-emerald-100 text-emerald-700", border: "border-emerald-400", bg: "bg-emerald-50"   },
  enterprise: { badge: "bg-violet-100 text-violet-700", border: "border-violet-400",  bg: "bg-violet-50"     },
};

function StatPill({ label, value, limit, color }) {
  const pct = limit && typeof limit === "number" ? Math.min(100, Math.round((value / limit) * 100)) : null;
  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-[28px] font-bold text-gray-900 leading-none">
        {value}
        {limit && <span className="text-[16px] font-normal text-gray-300 ml-1">/ {limit}</span>}
      </p>
      {pct !== null && (
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "#f1f1f1" }}>
          <div className={`h-full rounded-full transition-all duration-700 ${pct > 85 ? "bg-red-400" : pct > 60 ? "bg-amber-400" : color}`}
            style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { plans: planConfig } = usePlans();
  const [client, setClient]             = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [toggling, setToggling]         = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [showDelete, setShowDelete]     = useState(false);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    fetch(`/api/admin/clients/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setClient(d.client); setSelectedPlan(d.client?.plan || "starter"); setLoading(false); });
  }, [id]);

  async function savePlan() {
    if (!selectedPlan || selectedPlan === client.plan) return;
    setSaving(true);
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ plan: selectedPlan }),
    });
    if (res.ok) { setClient((p) => ({ ...p, plan: selectedPlan })); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  async function toggleStatus() {
    setToggling(true);
    const newStatus = client.status === "active" ? "inactive" : "active";
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) setClient((p) => ({ ...p, status: newStatus }));
    setToggling(false);
  }

  async function deleteClient() {
    setDeleting(true);
    const res = await fetch(`/api/admin/clients/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) router.push("/admin/clients");
    else setDeleting(false);
  }

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-[13px] text-gray-400">
      <div className="w-4 h-4 border-[1.5px] border-emerald-400 border-t-transparent rounded-full animate-spin" />
      Loading client...
    </div>
  );

  if (!client) return (
    <div className="p-8 text-center">
      <p className="text-gray-500 text-sm mb-3">Client not found.</p>
      <Link href="/admin/clients" className="text-sm text-emerald-600 font-medium hover:underline">Back to clients</Link>
    </div>
  );

  const planKeys = ["trial", "starter", "growth", "enterprise"];
  const currentStyle = PLAN_STYLES[client.plan] || PLAN_STYLES.starter;
  const isActive = client.status === "active";
  const pc = planConfig[client.plan] || {};
  const planLimits = {
    conversations: pc.conversations >= 999999 ? null : pc.conversations,
    flows:         pc.flows >= 999 ? null : pc.flows,
  };

  return (
    <div className="p-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-6">
        <Link href="/admin" className="hover:text-gray-600 transition-colors">Overview</Link>
        <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
        <Link href="/admin/clients" className="hover:text-gray-600 transition-colors">Clients</Link>
        <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
        <span className="text-gray-700 font-medium">{client.name || client.email}</span>
      </div>

      {/* Client header */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <span className="text-gray-600 text-xl font-bold uppercase">{(client.name || client.email)[0]}</span>
            </div>
            <div>
              <h1 className="text-[18px] font-semibold text-gray-900">{client.name || "Unnamed Client"}</h1>
              <p className="text-[13px] text-gray-400 mono mt-0.5">{client.email}</p>
              <div className="flex items-center gap-2 mt-2.5">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize ${currentStyle.badge}`}>{client.plan}</span>
                <span className={`flex items-center gap-1 text-[11px] font-medium ${isActive ? "text-emerald-600" : "text-gray-400"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-gray-300"}`} />
                  {isActive ? "Active" : "Inactive"}
                </span>
                {client.waVerified && (
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">WhatsApp verified</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleStatus} disabled={toggling}
              className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium border transition-all flex items-center gap-1.5 ${
                isActive ? "text-red-500 border-red-200 hover:bg-red-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              } bg-white`}>
              {toggling && <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />}
              {isActive ? "Deactivate" : "Activate"}
            </button>
            <button onClick={() => setShowDelete(true)}
              className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium bg-white text-gray-400 border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">
              Delete
            </button>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6 text-[11px] text-gray-400">
          <span>Member since <span className="text-gray-600 font-medium">{new Date(client.createdAt).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}</span></span>
          {client.workspaceId && <span>Workspace <span className="text-gray-500 mono">{client.workspaceId.slice(0, 8)}...</span></span>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <StatPill label="Conversations" value={client.conversationsUsed ?? 0} limit={planLimits.conversations} color="bg-emerald-400" />
        <StatPill label="Chatbot Flows"  value={client.flowsCount ?? 0}        limit={planLimits.flows}         color="bg-emerald-400" />
        <StatPill label="Contacts"       value={client.contactsCount ?? 0}                                      color="bg-slate-400" />
        <StatPill label="Broadcasts"     value={client.broadcastsCount ?? 0}                                    color="bg-slate-400" />
      </div>

      {/* Plan management */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between" style={{ background: "#fafafa" }}>
          <div>
            <h2 className="text-[14px] font-semibold text-gray-800">Plan Management</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">Select a plan and save to update this client</p>
          </div>
          {saved && <span className="text-[12px] font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">Saved</span>}
        </div>
        <div className="p-5">
          <div className="grid grid-cols-4 gap-3 mb-5">
            {planKeys.map((key) => {
              const kpc = planConfig[key] || {};
              const style = PLAN_STYLES[key];
              const isSelected = selectedPlan === key;
              const isCurrent = client.plan === key;
              return (
                <button key={key} onClick={() => setSelectedPlan(key)}
                  className={`relative text-left p-4 rounded-xl border-2 transition-all ${isSelected ? `${style.border} ${style.bg}` : "border-gray-100 bg-white hover:border-gray-200"}`}>
                  {isCurrent && <span className="absolute -top-2 left-3 text-[9px] font-bold bg-gray-900 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Current</span>}
                  {key === "growth" && !isCurrent && <span className="absolute -top-2 left-3 text-[9px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Popular</span>}
                  <div className="flex items-start justify-between mb-1.5">
                    <p className="text-[13px] font-semibold text-gray-800 capitalize">{key}</p>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                    )}
                  </div>
                  <p className="text-[12px] font-semibold text-emerald-600 mb-3">{kpc.priceLabel || "—"}</p>
                  <ul className="space-y-1">
                    <li className="text-[11px] text-gray-400">{kpc.conversations >= 999999 ? "Unlimited" : (kpc.conversations || 0).toLocaleString()} conversations</li>
                    <li className="text-[11px] text-gray-400">{kpc.flows >= 999 ? "Unlimited" : kpc.flows || 0} flows</li>
                    <li className="text-[11px] text-gray-400">{kpc.agents >= 999 ? "Unlimited" : kpc.agents || 0} agents</li>
                  </ul>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <button onClick={savePlan} disabled={saving || selectedPlan === client.plan}
              className={`px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all flex items-center gap-2 ${
                selectedPlan === client.plan ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-900 text-white hover:bg-gray-800"
              }`}>
              {saving
                ? <><div className="w-3.5 h-3.5 border-[1.5px] border-white/40 border-t-white rounded-full animate-spin" />Saving...</>
                : selectedPlan === client.plan ? "No changes" : `Assign ${selectedPlan} plan`
              }
            </button>
            {selectedPlan !== client.plan && <p className="text-[12px] text-gray-400">{client.plan} &rarr; {selectedPlan}</p>}
          </div>
        </div>
      </div>
{/* Twilio Credentials */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden mt-4">
        <div className="px-6 py-4 border-b border-gray-100" style={{ background: "#fafafa" }}>
          <h2 className="text-[14px] font-semibold text-gray-800">Twilio Credentials</h2>
          <p className="text-[12px] text-gray-400 mt-0.5">Per-client WhatsApp sender credentials. Leave blank to use platform defaults.</p>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Account SID</label>
            <input
              type="text"
              value={client.twilioAccountSid || ""}
              onChange={(e) => setClient(p => ({ ...p, twilioAccountSid: e.target.value }))}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 placeholder:text-gray-300 font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Auth Token</label>
            <input
              type="password"
              value={client.twilioAuthToken || ""}
              onChange={(e) => setClient(p => ({ ...p, twilioAuthToken: e.target.value }))}
              placeholder="••••••••••••••••••••••••••••••••"
              className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 placeholder:text-gray-300"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">WhatsApp Number</label>
            <input
              type="text"
              value={client.twilioPhoneNumber || ""}
              onChange={(e) => setClient(p => ({ ...p, twilioPhoneNumber: e.target.value }))}
              placeholder="+16472787987"
              className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 placeholder:text-gray-300 font-mono"
            />
          </div>
          <div className="pt-2">
            <button
              onClick={async () => {
                setSaving(true);
                const res = await fetch(`/api/admin/clients/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    twilioAccountSid: client.twilioAccountSid || null,
                    twilioAuthToken: client.twilioAuthToken || null,
                    twilioPhoneNumber: client.twilioPhoneNumber || null,
                  }),
                });
                if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
                setSaving(false);
              }}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-[13px] font-medium bg-gray-900 text-white hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving
                ? <><div className="w-3.5 h-3.5 border-[1.5px] border-white/40 border-t-white rounded-full animate-spin" />Saving...</>
                : "Save Credentials"
              }
            </button>
          </div>
        </div>
      </div>
      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDelete(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200">
            <h3 className="text-[15px] font-semibold text-gray-900 mb-1">Delete this client?</h3>
            <p className="text-[13px] text-gray-500 mb-5">
              This will permanently delete <span className="font-medium text-gray-800">{client.name || client.email}</span> and all their data. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={deleteClient} disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-[13px] font-medium transition-all flex items-center justify-center gap-2">
                {deleting ? <><div className="w-3.5 h-3.5 border-[1.5px] border-white/40 border-t-white rounded-full animate-spin" />Deleting...</> : "Delete permanently"}
              </button>
              <button onClick={() => setShowDelete(false)}
                className="px-4 py-2.5 text-[13px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}