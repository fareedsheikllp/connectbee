"use client";
import { useState, useEffect, useRef } from "react";
import {
  MessageSquare, Search, Send, Phone, MoreVertical,
  CheckCheck, Clock, Bot, UserCheck, Circle, Loader2,
  Filter, RefreshCw, ArrowDown
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  OPEN:     { dot: "bg-brand-500", badge: "badge-green",  label: "Open"     },
  RESOLVED: { dot: "bg-ink-300",   badge: "badge-gray",   label: "Resolved" },
  BOT:      { dot: "bg-blue-500",  badge: "badge-blue",   label: "Bot"      },
};

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function InboxPage() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

const [lastSeenAt, setLastSeenAt] = useState({});
  const selectedRef = useRef(null);
useEffect(() => {
    fetchConversations();
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/inbox");
        const data = await res.json();
        setConversations(data.conversations || []);
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, []);

useEffect(() => {
    selectedRef.current = selected;
    if (selected) {
      fetchMessages(selected.id);
      setLastSeenAt(prev => ({ ...prev, [selected.id]: new Date().toISOString() }));
      const interval = setInterval(async () => {
        try {
        const res = await fetch(`/api/inbox/${selected.id}/messages`);
          const data = await res.json();
          const incoming = data.messages || [];
          setMessages(prev => {
            const ids = new Set(prev.map(m => m.id));
            const merged = [...prev];
            incoming.forEach(m => { if (!ids.has(m.id)) merged.push(m); });
            return merged.length !== prev.length ? merged : prev;
          });
          setLastSeenAt(prev => ({ ...prev, [selected.id]: new Date().toISOString() }));
        } catch {}
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

 async function fetchConversations(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/inbox");
      const data = await res.json();
      setConversations(data.conversations || []);
      if (data.conversations?.length > 0 && !selected) {
        setSelected(data.conversations[0]);
      }
    } catch { if (!silent) toast.error("Failed to load conversations"); }
    finally { if (!silent) setLoading(false); }
  }

  async function fetchMessages(convId, silent = false) {
    if (!silent) setMsgLoading(true);
    try {
      const res = await fetch(`/api/inbox/${convId}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch { if (!silent) toast.error("Failed to load messages"); }
    finally { if (!silent) setMsgLoading(false); }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const res = await fetch(`/api/inbox/${selected.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to send"); return; }
      setMessages(m => {
        const exists = m.find(x => x.id === data.message.id);
        return exists ? m : [...m, data.message];
      });
      setReply("");
      const now = new Date().toISOString();
      setConversations(c => c.map(x => x.id === selected.id
        ? { ...x, lastMessage: reply, updatedAt: now }
        : x
      ));
      setLastSeenAt(prev => ({ ...prev, [selected.id]: now }));
    } catch { toast.error("Something went wrong"); }
    finally { setSending(false); }
  }

  async function updateStatus(status) {
    try {
      const res = await fetch(`/api/inbox/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { toast.error("Failed to update"); return; }
      toast.success(`Marked as ${status.toLowerCase()}`);
      setSelected(s => ({ ...s, status }));
      setConversations(c => c.map(x => x.id === selected.id ? { ...x, status } : x));
    } catch { toast.error("Something went wrong"); }
  }

  const filtered = conversations.filter(c => {
    const matchSearch = c.contact?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.contact?.phone?.includes(search);
    const matchFilter = filter === "ALL" || c.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="flex h-[calc(100vh-128px)] -m-6 lg:-m-8 animate-fade-in">

      {/* Left: Conversation List */}
      <div className="w-[320px] flex-shrink-0 flex flex-col border-r border-surface-200 bg-surface-0">

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-surface-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-black text-ink-900">Inbox</h2>
            <button onClick={() => fetchConversations(true)} className="btn-ghost btn-icon">
              <RefreshCw size={15} />
            </button>
          </div>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-surface-50 border border-surface-200 rounded-xl pl-8 pr-3 py-2 text-xs text-ink-700 placeholder:text-ink-300 outline-none focus:border-brand-400 transition-all"
            />
          </div>
          <div className="flex gap-1">
            {["ALL", "OPEN", "BOT", "RESOLVED"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${filter === f ? "bg-brand-500 text-white" : "text-ink-400 hover:bg-surface-100"}`}
              >
                {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-brand-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <MessageSquare size={32} className="text-ink-200 mb-3" />
              <p className="text-sm font-semibold text-ink-400">No conversations</p>
              <p className="text-xs text-ink-300 mt-1">
                {search ? "Try a different search" : "Connect WhatsApp to start receiving messages"}
              </p>
            </div>
          ) : (
            filtered.map(conv => {
              const s = STATUS_COLORS[conv.status] || STATUS_COLORS.OPEN;
              const isActive = selected?.id === conv.id;
              return (
                <button
                  key={conv.id}
                    onClick={() => {
                    setSelected(conv);
                    setLastSeenAt(prev => ({ ...prev, [conv.id]: new Date().toISOString() }));
                    }}
                  className={`w-full text-left px-4 py-3.5 border-b border-surface-100 transition-all ${isActive ? "bg-brand-50 border-l-2 border-l-brand-500" : "hover:bg-surface-50"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold">
                        {(conv.contact?.name?.[0] || conv.contact?.phone?.[0] || "?").toUpperCase()}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface-0 ${s.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-semibold text-ink-800 truncate">
                          {conv.contact?.name || conv.contact?.phone || "Unknown"}
                        </span>
                        <span className="text-[10px] text-ink-400 flex-shrink-0 ml-2">
                          {conv.updatedAt ? timeAgo(conv.updatedAt) : ""}
                        </span>
                      </div>
                        <div className="flex items-center justify-between">
                        <p className="text-xs text-ink-400 truncate">{conv.lastMessage || "No messages yet"}</p>
                        {(() => {
                          const seen = lastSeenAt[conv.id];
                          return seen && new Date(conv.updatedAt) > new Date(seen);
                        })() && (
                          <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-brand-500 ml-2" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Chat Window */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface-50">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-3xl bg-surface-200 flex items-center justify-center mb-4">
              <MessageSquare size={36} className="text-ink-300" />
            </div>
            <p className="font-semibold text-ink-600 mb-1">Select a conversation</p>
            <p className="text-sm text-ink-400">Choose a conversation from the left to start chatting</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-surface-0 border-b border-surface-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold">
                  {(selected.contact?.name?.[0] || selected.contact?.phone?.[0] || "?").toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-ink-800 text-sm">{selected.contact?.name || selected.contact?.phone}</p>
                  <div className="flex items-center gap-1.5">
                    <Phone size={11} className="text-ink-400" />
                    <span className="text-xs text-ink-400">{selected.contact?.phone}</span>
                    <span className={`${STATUS_COLORS[selected.status]?.badge || "badge-gray"} ml-1`}>
                      {STATUS_COLORS[selected.status]?.label || selected.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selected.status === "OPEN" && (
                  <button onClick={() => updateStatus("RESOLVED")} className="btn-secondary btn-sm gap-1.5">
                    <CheckCheck size={13} /> Resolve
                  </button>
                )}
                {selected.status === "RESOLVED" && (
                  <button onClick={() => updateStatus("OPEN")} className="btn-secondary btn-sm gap-1.5">
                    <Circle size={13} /> Reopen
                  </button>
                )}
                <button onClick={() => updateStatus("BOT")} className={`btn-secondary btn-sm gap-1.5 ${selected.status === "BOT" ? "!border-blue-300 !text-blue-600" : ""}`}>
                  <Bot size={13} /> {selected.status === "BOT" ? "Bot Active" : "Enable Bot"}
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%2394a894' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
              {msgLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-brand-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-ink-400">No messages yet in this conversation</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isOut = msg.direction === "OUTBOUND";
                  return (
                    <div key={msg.id} className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-soft ${isOut ? "bg-brand-100 rounded-br-sm" : "bg-surface-0 rounded-bl-sm"}`}>
                        <p className="text-sm text-ink-800 whitespace-pre-wrap">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isOut ? "justify-end" : "justify-start"}`}>
                          <span className="text-[10px] text-ink-400">
                            {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {isOut && (
                            <CheckCheck size={12} className={msg.status === "READ" ? "text-brand-500" : "text-ink-300"} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply Box */}
            <div className="px-4 py-3 bg-surface-0 border-t border-surface-200">
              {!selected.contact && (
                <div className="mb-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                  ⚠️ Connect WhatsApp in Settings to send real messages
                </div>
              )}
              <form onSubmit={sendMessage} className="flex items-end gap-3">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
                  placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                  rows={2}
                  className="flex-1 bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm text-ink-800 placeholder:text-ink-300 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 resize-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!reply.trim() || sending}
                  className="btn-primary btn-icon w-11 h-11 flex-shrink-0"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
