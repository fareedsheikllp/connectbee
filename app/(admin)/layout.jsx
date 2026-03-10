"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import IdleTimeout from "@/components/IdleTimeout";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

const nav = [
  {
    href: "/admin",
    exact: true,
    label: "Overview",
    icon: (
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/admin/clients",
    exact: false,
    label: "Clients",
    icon: (
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/admin/settings",
    exact: false,
    label: "Settings",
    icon: (
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.email !== ADMIN_EMAIL) router.replace("/login");
  }, [session, status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-[#0e0e10] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">CB</span>
          </div>
          <div className="w-4 h-4 border-[1.5px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const adminName = session.user.name || session.user.email.split("@")[0];
  const adminInitial = adminName[0].toUpperCase();

  async function handleSignOut() {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#f6f6f6" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *, body { font-family: 'Inter', sans-serif; }
        .mono { font-family: 'SF Mono', 'Fira Code', monospace; letter-spacing: -0.01em; }
      `}</style>

      {/* Dark sidebar */}
      <aside
        className="w-[220px] min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-30"
        style={{ background: "#111113", borderRight: "1px solid #1e1e21" }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-900/40">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white leading-none tracking-tight">ConnectBeez</p>
              <p className="text-[10px] text-emerald-400/70 font-medium mt-0.5 uppercase tracking-widest">Admin</p>
            </div>
          </div>
        </div>

        <div className="mx-5 h-px" style={{ background: "#1e1e21" }} />

        {/* Nav */}
        <nav className="flex-1 px-3 pt-5 space-y-0.5">
          <p className="px-2.5 text-[9px] font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: "#3a3a3f" }}>
            Menu
          </p>
          {nav.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all"
                style={{
                  color: active ? "#fff" : "#6b6b72",
                  background: active ? "#1e1e21" : "transparent",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#a0a0a8"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#6b6b72"; }}
              >
                <span style={{ color: active ? "#34d399" : "#3a3a3f" }}>{item.icon}</span>
                {item.label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </Link>
            );
          })}
        </nav>

        {/* User area */}
        <div className="p-3 space-y-1" style={{ borderTop: "1px solid #1e1e21" }}>
          <div className="px-2.5 py-2.5 rounded-lg flex items-center gap-2.5" style={{ background: "#161618" }}>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-400 text-[11px] font-bold">{adminInitial}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-white/80 truncate capitalize">{adminName}</p>
              <p className="text-[10px]" style={{ color: "#4a4a52" }}>Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-all"
            style={{ color: "#4a4a52" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#ff6b6b"; e.currentTarget.style.background = "#1a1515"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#4a4a52"; e.currentTarget.style.background = "transparent"; }}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Content */}
      <IdleTimeout minutes={1} />
      <main className="flex-1 ml-[220px] min-h-screen">
        {children}
      </main>
    </div>
  );
}