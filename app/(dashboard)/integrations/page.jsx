"use client";

import { useState, useEffect } from "react";
import {
  Search, CheckCircle, Lock, Zap, ArrowUpRight, X,
  Key, Link, Eye, EyeOff, Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

// ── Integration definitions ────────────────────────────────────────────────
const INTEGRATIONS = [
  // AI — available now
  {
    id: "openai", name: "OpenAI", category: "AI",
    description: "Power your chatbot with GPT-4 for smart, context-aware conversations.",
    color: "#10a37f", available: true,
    fields: [{ key: "apiKey", label: "API Key", placeholder: "sk-...", secret: true }],
    docsUrl: "https://platform.openai.com/api-keys",
  },
  //{
    //id: "anthropic", name: "Claude / Anthropic", category: "AI",
    //description: "Use Claude AI for nuanced, thoughtful customer interactions.",
    //color: "#d97706", available: true,
    //fields: [{ key: "apiKey", label: "API Key", placeholder: "sk-ant-...", secret: true }],
    //docsUrl: "https://console.anthropic.com/settings/keys",
  //},
  //{
    //id: "zapier", name: "Zapier", category: "Automation",
    //description: "Connect 5,000+ apps to trigger WhatsApp messages from any workflow.",
    //color: "#ff4a00", available: true,
    //fields: [{ key: "webhookUrl", label: "Webhook URL", placeholder: "https://hooks.zapier.com/...", secret: false }],
    //docsUrl: "https://zapier.com/apps/webhooks",
  //},

  // Coming soon
  //{ id: "hubspot", name: "HubSpot", category: "CRM", description: "Sync contacts and deals from HubSpot automatically.", color: "#ff7a59", available: false },
  //{ id: "salesforce", name: "Salesforce", category: "CRM", description: "Connect Salesforce to sync leads and customer data.", color: "#00a1e0", available: false },
  //{ id: "zoho", name: "Zoho CRM", category: "CRM", description: "Two-way sync contacts and leads with Zoho CRM.", color: "#e42527", available: false },
  //{ id: "pipedrive", name: "Pipedrive", category: "CRM", description: "Manage deals and contacts from WhatsApp conversations.", color: "#017737", available: false },
  //{ id: "shopify", name: "Shopify", category: "Ecommerce", description: "Send order confirmations and shipping updates via WhatsApp.", color: "#96bf48", available: false },
  //{ id: "woocommerce", name: "WooCommerce", category: "Ecommerce", description: "Automate order notifications for WooCommerce stores.", color: "#7f54b3", available: false },
  //{ id: "make", name: "Make", category: "Automation", description: "Build automation scenarios with Make (formerly Integromat).", color: "#6d00cc", available: false },
  //{ id: "pabbly", name: "Pabbly", category: "Automation", description: "Automate tasks and connect apps with Pabbly Connect.", color: "#ef5a2a", available: false },
  //{ id: "googlesheets", name: "Google Sheets", category: "Productivity", description: "Log contacts and broadcast results to Google Sheets.", color: "#34a853", available: false },
  //{ id: "notion", name: "Notion", category: "Productivity", description: "Create Notion pages from WhatsApp messages.", color: "#000000", available: false },
  //{ id: "slack", name: "Slack", category: "Productivity", description: "Get notified in Slack when new WhatsApp messages arrive.", color: "#4a154b", available: false },
  //{ id: "teams", name: "Microsoft Teams", category: "Productivity", description: "Forward WhatsApp alerts to Teams channels.", color: "#6264a7", available: false },
  //{ id: "zendesk", name: "Zendesk", category: "Support", description: "Create support tickets from incoming WhatsApp messages.", color: "#03363d", available: false },
  //{ id: "freshdesk", name: "Freshdesk", category: "Support", description: "Turn WhatsApp conversations into Freshdesk tickets.", color: "#25c16f", available: false },
  //{ id: "calendly", name: "Calendly", category: "Scheduling", description: "Let customers book appointments through WhatsApp.", color: "#006bff", available: false },
  //{ id: "stripe", name: "Stripe", category: "Payments", description: "Send payment links and confirmations through WhatsApp.", color: "#635bff", available: false },
];

const CATEGORIES = ["All", "AI"];

const CATEGORY_COLORS = {
  AI: "bg-emerald-50 text-emerald-700",
  CRM: "bg-blue-50 text-blue-700",
  Ecommerce: "bg-purple-50 text-purple-700",
  Automation: "bg-orange-50 text-orange-700",
  Productivity: "bg-cyan-50 text-cyan-700",
  Support: "bg-teal-50 text-teal-700",
  Scheduling: "bg-indigo-50 text-indigo-700",
  Payments: "bg-violet-50 text-violet-700",
};

// ── Connect Modal ──────────────────────────────────────────────────────────
function ConnectModal({ integration, existing, onClose, onSave }) {
  const [fields, setFields] = useState(
    Object.fromEntries((integration.fields || []).map((f) => [f.key, existing?.config?.[f.key] || ""]))
  );
  const [show, setShow] = useState({});
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }));
  const toggleShow = (k) => setShow((s) => ({ ...s, [k]: !s[k] }));

  const handleSave = async () => {
    const empty = (integration.fields || []).find((f) => !fields[f.key]?.trim());
    if (empty) return toast.error(`${empty.label} is required`);

    setSaving(true);
    try {
      // Test connection first
      setTesting(true);
      const testRes = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: integration.id, config: fields }),
      });
      const testData = await testRes.json();
      setTesting(false);
      if (!testRes.ok) throw new Error(testData.error);
      toast.success(testData.message);

      // Save to DB
      const saveRes = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: integration.id, enabled: true, config: fields }),
      });
      if (!saveRes.ok) throw new Error("Failed to save");
      onSave();
      onClose();
    } catch (e) {
      toast.error(e.message || "Connection failed");
    } finally {
      setSaving(false);
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: integration.id, enabled: false, config: {} }),
      });
      toast.success(`${integration.name} disconnected`);
      onSave();
      onClose();
    } catch (e) {
      toast.error("Failed to disconnect");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-large w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: integration.color }}>
              {integration.name[0]}
            </div>
            <div>
              <p className="font-semibold text-ink-800">{integration.name}</p>
              <p className="text-xs text-ink-400">{integration.category}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-surface-100 transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-ink-500">{integration.description}</p>

          {/* Fields */}
          {(integration.fields || []).map((f) => (
            <div key={f.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-ink-600">{f.label}</label>
                {integration.docsUrl && (
                  <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-brand-500 hover:text-brand-600 flex items-center gap-1">
                    Get key <ArrowUpRight size={10} />
                  </a>
                )}
              </div>
              <div className="relative">
                {f.secret ? <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
                  : <Link size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />}
                <input
                  type={f.secret && !show[f.key] ? "password" : "text"}
                  value={fields[f.key] || ""}
                  onChange={set(f.key)}
                  placeholder={f.placeholder}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-surface-200 text-sm text-ink-800 placeholder-ink-300 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all font-mono"
                />
                {f.secret && (
                  <button type="button" onClick={() => toggleShow(f.key)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-600 transition-colors">
                    {show[f.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            {existing?.enabled && (
              <button onClick={handleDisconnect}
                className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">
                Disconnect
              </button>
            )}
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-brand-sm">
              {testing ? <><Loader2 size={14} className="animate-spin" /> Testing...</> :
               saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> :
               existing?.enabled ? "Update" : "Connect"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Integration Card ───────────────────────────────────────────────────────
function IntegrationCard({ integration, savedIntegration, onConnect }) {
  const connected = savedIntegration?.enabled;
  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden group ${
      connected ? "border-brand-300 shadow-brand-sm" : "border-surface-200 shadow-soft hover:shadow-medium hover:border-surface-300"
    }`}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: integration.color }}>
              {integration.name[0]}
            </div>
            <div>
              <p className="font-semibold text-ink-800 text-sm">{integration.name}</p>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[integration.category] || "bg-surface-100 text-ink-500"}`}>
                {integration.category}
              </span>
            </div>
          </div>
          {connected && <CheckCircle size={16} className="text-brand-500 flex-shrink-0 mt-0.5" />}
        </div>

        <p className="text-xs text-ink-400 leading-relaxed mb-4">{integration.description}</p>

        {integration.available ? (
          <button onClick={() => onConnect(integration)}
            className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
              connected
                ? "bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200"
                : "bg-brand-500 text-white hover:bg-brand-600 shadow-brand-sm"
            }`}>
            {connected ? "Configure" : "Connect"}
          </button>
        ) : (
          <button disabled className="w-full py-2 rounded-xl text-xs font-semibold bg-surface-100 text-ink-300 flex items-center justify-center gap-1.5 cursor-not-allowed">
            <Lock size={11} /> Coming Soon
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function IntegrationsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [saved, setSaved] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    try {
      const res = await fetch("/api/integrations");
      const data = await res.json();
      setSaved(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSaved(); }, []);

  const getSaved = (id) => saved.find((s) => s.provider === id);
  const connectedList = INTEGRATIONS.filter((i) => getSaved(i.id)?.enabled);

  const filtered = INTEGRATIONS.filter((i) => {
    const matchSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || i.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 font-display">Integrations</h1>
          <p className="text-sm text-ink-400 mt-0.5">Connect your tools to supercharge WhatsApp engagement</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-white border border-surface-200 px-3 py-2 rounded-xl shadow-soft">
          <Zap size={13} className="text-brand-500" />
          <span className="text-ink-500">{connectedList.length} connected</span>
        </div>
      </div>

      {/* Active integrations banner */}
      {connectedList.length > 0 && (
        <div className="bg-brand-50 border border-brand-200 rounded-2xl px-5 py-4">
          <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider mb-2">Active Integrations</p>
          <div className="flex flex-wrap gap-2">
            {connectedList.map((i) => (
              <button key={i.id} onClick={() => setModal(i)}
                className="flex items-center gap-1.5 bg-white border border-brand-200 px-2.5 py-1 rounded-full text-xs font-medium text-brand-700 hover:border-brand-400 transition-colors">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: i.color }} />
                {i.name}
                <CheckCircle size={10} className="text-brand-500" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search integrations..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 bg-white text-sm text-ink-800 placeholder-ink-300 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                category === c ? "bg-brand-500 text-white shadow-brand-sm" : "bg-white border border-surface-200 text-ink-500 hover:border-brand-300"
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-white border border-surface-200 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 py-16 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center">
            <Search size={24} className="text-surface-300" />
          </div>
          <p className="font-medium text-ink-500">No integrations found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              savedIntegration={getSaved(integration.id)}
              onConnect={setModal}
            />
          ))}
        </div>
      )}

      {/* Request CTA */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-soft px-6 py-5 flex items-center justify-between">
        <div>
          <p className="font-semibold text-ink-800">Don't see what you need?</p>
          <p className="text-sm text-ink-400 mt-0.5">Request an integration and we'll prioritize it</p>
        </div>
        <a href="mailto:support@connectflow.ca"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors shadow-brand-sm">
          Request Integration <ArrowUpRight size={14} />
        </a>
      </div>

      {/* Connect Modal */}
      {modal && (
        <ConnectModal
          integration={modal}
          existing={getSaved(modal.id)}
          onClose={() => setModal(null)}
          onSave={fetchSaved}
        />
      )}
    </div>
  );
}