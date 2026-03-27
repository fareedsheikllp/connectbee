"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Users, Megaphone, MessageSquare,
  Bot, Package, BarChart3, Settings, Puzzle,
  LogOut, ChevronRight, Zap, FileText,
} from "lucide-react";
import { cn } from "../../lib/utils.js";

const ALL_NAV = [
  { label: "Dashboard",    href: "/dashboard",    icon: LayoutDashboard, roles: ["owner", "admin", "supervisor", "agent"] },
  { label: "Inbox",        href: "/inbox",        icon: MessageSquare,   roles: ["owner", "admin", "supervisor", "agent"] },
  { label: "Contacts",     href: "/contacts",     icon: Users,           roles: ["owner", "admin", "supervisor"] },
  { label: "Broadcasts",   href: "/broadcasts",   icon: Megaphone,       roles: ["owner", "admin", "supervisor"] },
  { label: "Templates",    href: "/templates",    icon: FileText,        roles: ["owner", "admin", "supervisor"] },
  { label: "Chatbot",      href: "/chatbot",      icon: Bot,             roles: ["owner", "admin"] },
  { label: "Catalog",      href: "/catalog",      icon: Package,         roles: ["owner", "admin"] },
  { label: "Analytics",    href: "/analytics",    icon: BarChart3,       roles: ["owner", "admin", "supervisor"] },
  { label: "Integrations", href: "/integrations", icon: Puzzle,          roles: ["owner", "admin"] },
];


export default function Sidebar({ user }) {
  const pathname = usePathname();
  const role = user?.role ?? "agent";

  const NAV = ALL_NAV.filter(item => item.roles.includes(role));

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
        {["owner", "admin", "supervisor"].includes(role) && (
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