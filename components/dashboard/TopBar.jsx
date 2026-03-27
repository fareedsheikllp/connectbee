"use client";
import { Bell, Search, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function TopBar({ user }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [myChannels, setMyChannels] = useState([]);
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

  function handleSearch(e) {
    if (e.key === "Enter" && search.trim()) {
      router.push(`/contacts?search=${encodeURIComponent(search.trim())}`);
    }
  }

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

      { /* Actions */}
      <div className="flex items-center gap-2.5">

        {canBroadcast && (
          <button
            onClick={() => router.push("/broadcasts/new")}
            className="btn-primary btn-sm gap-1.5"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>New Broadcast</span>
          </button>
        )}
        <button onClick={() => router.push("/inbox")} className="relative btn-ghost btn-icon">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border-2 border-surface-0" />
        </button>
        <div className="flex items-center gap-2">
          {/* Role + channel badges */}
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