"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Megaphone, MessageSquare,
  Bot, Package, BarChart3, Settings, Puzzle,
  LogOut, ChevronRight, Zap, FileText,
} from "lucide-react";
import { cn } from "../../lib/utils.js";

const ALL_NAV = [
  { label: "Dashboard",    href: "/dashboard",    icon: LayoutDashboard, roles: ["owner", "admin", "supervisor", "agent"], page: null },
  { label: "Inbox",        href: "/inbox",        icon: MessageSquare,   roles: ["owner", "admin", "supervisor", "agent"], page: "inbox" },
  { label: "Contacts",     href: "/contacts",     icon: Users,           roles: ["owner", "admin", "supervisor", "agent"], page: "contacts" },
  { label: "Campaigns",   href: "/broadcasts",   icon: Megaphone,       roles: ["owner", "admin", "supervisor", "agent"], page: "broadcasts" },
  { label: "Templates",    href: "/templates",    icon: FileText,        roles: ["owner", "admin", "supervisor", "agent"], page: "templates" },
  { label: "Chatbot",      href: "/chatbot",      icon: Bot,             roles: ["owner", "admin", "supervisor", "agent"], page: "chatbot" },
  { label: "Automations",  href: "/automations",  icon: Zap,             roles: ["owner", "admin", "supervisor", "agent"], page: "automations" },
  { label: "Catalog",      href: "/catalog",      icon: Package,         roles: ["owner", "admin", "supervisor", "agent"], page: "catalog" },
  { label: "Analytics",    href: "/analytics",    icon: BarChart3,       roles: ["owner", "admin", "supervisor", "agent"], page: "analytics" },
  { label: "Integrations", href: "/integrations", icon: Puzzle,          roles: ["owner", "admin", "supervisor", "agent"], page: "integrations" },
];


export default function Sidebar({ user }) {
  const pathname = usePathname();
  const role = user?.role ?? "agent";
const PERM_DEFAULTS = {
  supervisor: { inbox: true, contacts: true, broadcasts: true, templates: true, chatbot: true, analytics: false, integrations: false },
  agent:      { inbox: true, contacts: false, broadcasts: false, templates: false, chatbot: false, analytics: false, integrations: false },
};

const [permissions, setPermissions] = useState(null);
const [hydrated, setHydrated] = useState(false);

useEffect(() => {
  if (role === "owner" || role === "admin") {
    setHydrated(true);
    return;
  }

  function loadPermissions() {
    fetch("/api/settings/permissions", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        if (d.permissions) {
          setPermissions(d.permissions);
          localStorage.setItem("cb_permissions", JSON.stringify(d.permissions));
        }
      })
      .catch(() => {});
  }

  // Load from cache instantly to avoid flash
  try {
    const cached = localStorage.getItem("cb_permissions");
    if (cached) setPermissions(JSON.parse(cached));
  } catch {}
  setHydrated(true);

  // Fetch fresh from server
  loadPermissions();

  // Poll every 30 seconds to pick up owner changes
  const interval = setInterval(loadPermissions, 30000);

  // Also listen for same-tab updates
  window.addEventListener("permissions-updated", loadPermissions);

  return () => {
    clearInterval(interval);
    window.removeEventListener("permissions-updated", loadPermissions);
  };
}, [role, pathname]);


  const NAV = ALL_NAV.filter(item => {
    if (!item.roles.includes(role)) return false;
    if (role === "owner" || role === "admin") return true;
    if (!hydrated) return false;
    if (!item.page) return true;
    const perms = permissions || PERM_DEFAULTS;
    return perms[role]?.[item.page] !== false;
  });



  const roleBadge = {
    owner:      { label: "Owner",      color: "bg-brand-100 text-brand-700" },
    admin:      { label: "Admin",      color: "bg-purple-100 text-purple-700" },
    supervisor: { label: "Supervisor", color: "bg-amber-100 text-amber-700" },
    agent:      { label: "Agent",      color: "bg-green-100 text-green-700" },
  }[role] ?? { label: "User", color: "bg-surface-100 text-ink-500" };

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col bg-surface-0 border-r border-surface-200 h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-surface-200 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-brand-sm">
          <Zap size={15} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="font-sans font-extrabold text-base text-ink-900 tracking-tight">
          Connect<span className="gradient-text">Beez</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn("nav-item group", active && "nav-item-active")}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 2} className="flex-shrink-0" />
              <span className="flex-1 text-[13px]">{label}</span>
              {active && <ChevronRight size={13} className="opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Settings + User */}
      <div className="border-t border-surface-200 p-3 space-y-0.5">
        {/* Only owner/admin sees Settings */}
        {["owner", "admin", "supervisor", "agent"].includes(role) && (
          <Link
            href="/settings"
            className={cn("nav-item", pathname.startsWith("/settings") && "nav-item-active")}
          >
            <Settings size={17} strokeWidth={2} className="flex-shrink-0" />
            <span className="text-[13px]">Settings</span>
          </Link>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="nav-item w-full text-left text-red-400 hover:!bg-red-50 hover:!text-red-600"
        >
          <LogOut size={17} strokeWidth={2} className="flex-shrink-0" />
          <span className="text-[13px]">Sign out</span>
        </button>

        {/* User pill */}
        <div className="flex items-center gap-2.5 px-3 py-2 mt-2 rounded-xl bg-surface-50 border border-surface-100">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
          </div>
          <div className="min-w-0">
          <p className="text-xs font-semibold text-ink-800 truncate">{user?.name || "User"}</p>
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", roleBadge.color)}>
            {roleBadge.label}
          </span>
          </div>
        </div>
      </div>
    </aside>
  );
}