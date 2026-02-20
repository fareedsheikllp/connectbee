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

const NAV = [
  { label: "Dashboard",    href: "/dashboard",    icon: LayoutDashboard },
  { label: "Inbox",        href: "/inbox",        icon: MessageSquare },
  { label: "Contacts",     href: "/contacts",     icon: Users },
  { label: "Broadcasts",   href: "/broadcasts",   icon: Megaphone },
  { label: "templates",    href: "/templates",    icon: FileText },
  { label: "Chatbot",      href: "/chatbot",      icon: Bot },
  { label: "Catalog",      href: "/catalog",      icon: Package },
  { label: "Analytics",    href: "/analytics",    icon: BarChart3 },
  { label: "Integrations", href: "/integrations", icon: Puzzle },
];

export default function Sidebar({ user }) {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col bg-surface-0 border-r border-surface-200 h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-surface-200 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-brand-sm">
          <Zap size={15} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="font-sans font-extrabold text-base text-ink-900 tracking-tight">
          Connect<span className="gradient-text">Bee</span>
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
        <Link
          href="/settings"
          className={cn("nav-item", pathname.startsWith("/settings") && "nav-item-active")}
        >
          <Settings size={17} strokeWidth={2} className="flex-shrink-0" />
          <span className="text-[13px]">Settings</span>
        </Link>
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
            <p className="text-[10px] text-ink-400 truncate">{user?.workspace?.plan || "Trial"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
