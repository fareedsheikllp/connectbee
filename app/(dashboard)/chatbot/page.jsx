"use client";
import { useState, useEffect } from "react";
import { Bot, Plus, Play, Pause, Trash2, Loader2, ArrowRight, MessageSquare, Zap, GitBranch, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ChatbotPage() {
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchChatbots(); }, []);

  async function fetchChatbots() {
    setLoading(true);
    try {
      const res = await fetch("/api/chatbot");
      const data = await res.json();
      setChatbots(data.chatbots || []);
    } catch { toast.error("Failed to load chatbots"); }
    finally { setLoading(false); }
  }

  async function createChatbot(e) {
    e.preventDefault();
    if (!newName.trim()) return toast.error("Name is required");
    setCreating(true);
    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed"); return; }
      toast.success("Chatbot created!");
      setShowNew(false);
      setNewName("");
      setChatbots(p => [data.chatbot, ...p]);
    } catch { toast.error("Something went wrong"); }
    finally { setCreating(false); }
  }

  async function toggleActive(id, current) {
    setToggling(id);
    try {
      const res = await fetch(`/api/chatbot/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !current }),
      });
      if (!res.ok) { toast.error("Failed to update"); return; }
      toast.success(!current ? "Chatbot activated!" : "Chatbot paused");
      setChatbots(p => p.map(c => c.id === id ? { ...c, active: !current } : c));
    } catch { toast.error("Something went wrong"); }
    finally { setToggling(null); }
  }

  async function deleteChatbot(id) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/chatbot/${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to delete"); return; }
      toast.success("Deleted");
      setChatbots(p => p.filter(c => c.id !== id));
    } catch { toast.error("Something went wrong"); }
    finally { setDeleting(null); }
  }
async function setDefault(id, current) {
  try {
    const res = await fetch(`/api/chatbot/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: !current }),
    });
    if (!res.ok) { toast.error("Failed to update"); return; }
    toast.success(!current ? "Set as default!" : "Default removed");
    setChatbots(p => p.map(c => c.id === id ? { ...c, isDefault: !current } : c));
  } catch { toast.error("Something went wrong"); }
}
  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black text-ink-900">Chatbot Builder</h1>
          <p className="text-ink-400 text-sm mt-1">Automate conversations with no-code flow builder</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary gap-2">
          <Plus size={15} /> New Chatbot
        </button>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: MessageSquare, label: "Customer sends message",  color: "brand" },
          { icon: Bot,           label: "Bot matches keyword",     color: "blue"  },
          { icon: GitBranch,     label: "Flow executes response",  color: "amber" },
          { icon: CheckCircle,   label: "Customer gets reply",     color: "brand" },
        ].map(({ icon: Icon, label, color }, i) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color === "brand" ? "bg-brand-50" : color === "blue" ? "bg-blue-50" : "bg-amber-50"}`}>
              <Icon size={16} className={color === "brand" ? "text-brand-600" : color === "blue" ? "text-blue-600" : "text-amber-600"} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink-700 leading-tight">{label}</p>
            </div>
            {i < 3 && <ArrowRight size={14} className="text-ink-300 flex-shrink-0" />}
          </div>
        ))}
      </div>

      {/* Chatbot list */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-brand-500" />
          </div>
        ) : chatbots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
              <Bot size={28} className="text-ink-300" />
            </div>
            <p className="font-semibold text-ink-700 mb-1">No chatbots yet</p>
            <p className="text-sm text-ink-400 max-w-xs mb-6">Create your first chatbot to automate customer conversations 24/7</p>
            <button onClick={() => setShowNew(true)} className="btn-primary btn-sm gap-1.5">
              <Plus size={14} /> Create chatbot
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                <th className="th">Name</th>
                <th className="th">Status</th>
                <th className="th">Nodes</th>
                <th className="th">Created</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {chatbots.map(bot => (
                <tr key={bot.id} className="hover:bg-surface-50 transition-colors group">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bot.active ? "bg-brand-50" : "bg-surface-100"}`}>
                        <Bot size={16} className={bot.active ? "text-brand-600" : "text-ink-400"} />
                      </div>
                      <div>
                        <p className="font-semibold text-ink-800">{bot.name}</p>
                        <p className="text-xs text-ink-400">{bot.description || "No description"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <span className={bot.active ? "badge-green" : "badge-gray"}>
                      <span className={`w-1.5 h-1.5 rounded-full ${bot.active ? "bg-brand-500 animate-pulse-soft" : "bg-ink-400"}`} />
                      {bot.active ? "Active" : "Paused"}
                    </span>
                  </td>
                  <td className="td text-ink-500 text-sm">
                    {Object.keys(bot.flow || {}).length > 0 ? `${Object.keys(bot.flow).length} nodes` : "Empty flow"}
                  </td>
                  <td className="td text-ink-400 text-xs">{new Date(bot.createdAt).toLocaleDateString()}</td>
                  <td className="td">
                  <div className="flex items-center gap-2">
                    <Link href={`/chatbot/${bot.id}`} className="btn-secondary btn-sm gap-1.5">
                      <Zap size={13} /> Edit Flow
                    </Link>
                    <button
                        onClick={() => setDefault(bot.id, bot.isDefault)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          bot.isDefault
                            ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                            : "border-surface-200 text-ink-400 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50"
                        }`}
                      >
                        {bot.isDefault ? "✓ Default" : "Set Default"}
                      </button>
                      <button
                        onClick={() => toggleActive(bot.id, bot.active)}
                        disabled={toggling === bot.id}
                        className="btn-ghost btn-icon"
                        title={bot.active ? "Pause" : "Activate"}
                      >
                        {toggling === bot.id ? <Loader2 size={15} className="animate-spin" /> : bot.active ? <Pause size={15} className="text-amber-500" /> : <Play size={15} className="text-brand-500" />}
                      </button>
                      <button
                        onClick={() => deleteChatbot(bot.id)}
                        disabled={deleting === bot.id}
                        className="btn-ghost btn-icon text-ink-300 hover:text-red-500"
                      >
                        {deleting === bot.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New chatbot modal */}
      {showNew && (
        <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-0 rounded-2xl shadow-large w-full max-w-md animate-fade-up">
            <div className="p-6 border-b border-surface-200">
              <h2 className="font-display text-lg font-black text-ink-900">New Chatbot</h2>
              <p className="text-sm text-ink-400 mt-1">Give your chatbot a name to get started</p>
            </div>
            <form onSubmit={createChatbot} className="p-6 space-y-4">
              <div>
                <label className="field-label">Chatbot Name <span className="text-red-400">*</span></label>
                <input
                  placeholder="e.g. Sales Assistant, Support Bot"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="field-input"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1">
                  {creating ? <Loader2 size={15} className="animate-spin" /> : "Create & Build Flow"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
