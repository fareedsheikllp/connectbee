"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Menu, X } from "lucide-react";

const LINKS = [
  { label: "Features",     href: "#features"     },
  { label: "Integrations", href: "#integrations" },
  { label: "Pricing",      href: "#pricing"      },
  { label: "About",        href: "#about"        },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(228,235,228,0.8)" : "none",
      transition: "all 0.4s ease",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #4ade80, #16a34a)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(34,197,94,0.3)" }}>
            <Zap size={16} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: "var(--font-sora)", fontWeight: 800, fontSize: "1.1rem", color: "#0d150d", letterSpacing: "-0.02em" }}>
            Connect<span style={{ color: "#16a34a" }}>Flow</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div style={{ display: "flex", gap: 32, alignItems: "center" }} className="hide-mobile">
          {LINKS.map(l => (
            <a key={l.label} href={l.href} style={{ fontFamily: "var(--font-sora)", fontSize: "0.875rem", fontWeight: 500, color: "#374737", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "#16a34a"}
              onMouseLeave={e => e.target.style.color = "#374737"}
            >{l.label}</a>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }} className="hide-mobile">
          <Link href="/login" style={{ fontFamily: "var(--font-sora)", fontSize: "0.875rem", fontWeight: 600, color: "#374737", textDecoration: "none", padding: "8px 20px", borderRadius: 50, border: "1.5px solid #e4ebe4", transition: "all 0.2s" }}
            onMouseEnter={e => { e.target.style.borderColor = "#22c55e"; e.target.style.color = "#16a34a"; }}
            onMouseLeave={e => { e.target.style.borderColor = "#e4ebe4"; e.target.style.color = "#374737"; }}
          >Sign in</Link>
          <Link href="/signup" style={{ fontFamily: "var(--font-sora)", fontSize: "0.875rem", fontWeight: 700, color: "white", textDecoration: "none", padding: "9px 24px", borderRadius: 50, background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 4px 16px rgba(34,197,94,0.3)", transition: "all 0.2s" }}>
            Get Started Free
          </Link>
        </div>

        {/* Mobile menu */}
        <button onClick={() => setOpen(p => !p)} style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 4 }} className="show-mobile">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div style={{ background: "white", borderTop: "1px solid #e4ebe4", padding: "16px 24px 24px" }} className="show-mobile">
          {LINKS.map(l => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)} style={{ display: "block", padding: "12px 0", fontFamily: "var(--font-sora)", fontWeight: 500, color: "#374737", textDecoration: "none", borderBottom: "1px solid #f0f4f0" }}>{l.label}</a>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
            <Link href="/login" style={{ textAlign: "center", padding: "12px", borderRadius: 12, border: "1.5px solid #e4ebe4", fontFamily: "var(--font-sora)", fontWeight: 600, color: "#374737", textDecoration: "none" }}>Sign in</Link>
            <Link href="/signup" style={{ textAlign: "center", padding: "12px", borderRadius: 12, background: "linear-gradient(135deg, #22c55e, #16a34a)", fontFamily: "var(--font-sora)", fontWeight: 700, color: "white", textDecoration: "none" }}>Get Started Free</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
