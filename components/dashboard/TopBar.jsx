"use client";
import { Bell, Search, Plus, MessageSquare, UserCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function TopBar({ user }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [myChannels, setMyChannels] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);
  const role = user?.role ?? "agent";
  const canBroadcast = ["owner", "admin", "supervisor"].includes(role);

  const roleBadge = {
    owner:      { label: "Owner",      color: "bg-brand-100 text-brand-700"   },
    admin:      { label: "Admin",      color: "bg-purple-100 text-purple-700" },
    supervisor: { label: "Supervisor", color: "bg-amber-100 text-amber-700"   },
    agent:      { label: "Agent",      color: "bg-green-100 text-green-700"   },
  }[role] ?? { label: "User", color: "bg-surface-100 text-ink-500" };

  useEffect(() => {
    if (role !== "supervisor" && role !== "agent") return;
    fetch("/api/channels").then(r => r.json()).then(d => {
      const mine = (d.channels || []).filter(ch =>
        ch.members?.some(cm => cm.member?.id === user?.id || cm.memberId === user?.id)
      );
      setMyChannels(mine);
    }).catch(() => {});
  }, [role, user?.id]);

  function fetchNotifications() {
    fetch("/api/notifications").then(r => r.json()).then(d => {
      setNotifications(d.notifications || []);
      setUnreadCount(d.unreadCount || 0);
    }).catch(() => {});
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setUnreadCount(0);
    setNotifications(p => p.map(n => ({ ...n, read: true })));
  }

  function handleSearch(e) {
    if (e.key === "Enter" && search.trim()) {
      router.push(`/contacts?search=${encodeURIComponent(search.trim())}`);
    }
  }

  const notifIcon = {
    new_conversation: <MessageSquare size={13} className="text-brand-500" />,
    assigned:         <UserCheck size={13} className="text-emerald-500" />,
    new_message:      <MessageSquare size={13} className="text-amber-500" />,
  };

  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 lg:px-8 bg-surface-0 border-b border-surface-200">
      {/* Search */}
      <div className="relative w-72">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleSearch}
          placeholder="Search contacts, broadcasts..."
          className="w-full bg-surface-50 border border-surface-200 rounded-xl pl-9 pr-4 py-2 text-sm text-ink-700 placeholder:text-ink-300 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 transition-all"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        {canBroadcast && (
          <button onClick={() => router.push("/broadcasts/new")} className="btn-primary btn-sm gap-1.5">
            <Plus size={14} strokeWidth={2.5} />
            <span>New Broadcast</span>
          </button>
        )}

        {/* Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifs(p => !p); if (!showNotifs) fetchNotifications(); }}
            className="relative btn-ghost btn-icon"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showNotifs && (
            <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-surface-200 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
                <p className="text-sm font-bold text-ink-800">Notifications</p>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[11px] text-brand-500 font-semibold hover:underline">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifs(false)}>
                    <X size={14} className="text-ink-400" />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-surface-50">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell size={20} className="text-ink-200 mx-auto mb-2" />
                    <p className="text-xs text-ink-400">No notifications yet</p>
                  </div>
                ) : notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (n.conversationId) router.push("/inbox");
                      setShowNotifs(false);
                    }}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-surface-50 transition-colors ${!n.read ? "bg-brand-50/40" : ""}`}
                  >
                    <div className="w-7 h-7 rounded-full bg-surface-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {notifIcon[n.type] || <Bell size={13} className="text-ink-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-ink-800">{n.title}</p>
                      <p className="text-[11px] text-ink-400 truncate">{n.body}</p>
                      <p className="text-[10px] text-ink-300 mt-0.5">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar + badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${roleBadge.color}`}>
              {roleBadge.label}
            </span>
            {myChannels.map(ch => (
              <span key={ch.id} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface-50 border border-surface-200 text-ink-600">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: ch.color }} />
                {ch.name}
              </span>
            ))}
          </div>
          <div
            onClick={() => router.push("/settings")}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold cursor-pointer"
          >
            {(user?.name?.[0] || "U").toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}