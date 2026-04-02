"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Check, Zap, Star, Menu, X } from "lucide-react";

const FEATURES = [
  { emoji: "📣", title: "Broadcast Campaigns", desc: "Send promotional messages to unlimited contacts with one click. Schedule, segment, and track delivery in real time." },
  { emoji: "⚡", title: "AI Chatbot Builder", desc: "Build no-code conversation flows. Your chatbot qualifies leads, answers FAQs, and books appointments 24/7." },
  { emoji: "💬", title: "Multi-Agent Inbox", desc: "Your whole team in one inbox. Assign conversations, collaborate with notes, and resolve faster together." },
  { emoji: "📦", title: "WhatsApp Catalog", desc: "Showcase products inside WhatsApp. Customers browse, add to cart, and buy with no hassle" },
  { emoji: "🏷️", title: "Contact Segments", desc: "Tag and group contacts by behavior, location, or custom fields. Target the right people every time you broadcast." },
  { emoji: "⚙️", title: "Workspace Management", desc: "Invite agents, create departments, set roles and permissions. Built for teams of any size." },
];
const STATS = [
  { value: "98%", label: "Message open rate" },
  { value: "3x",  label: "Average revenue lift" },
  { value: "2.4B",label: "WhatsApp users" },
  { value: "10m", label: "Setup time" },
];

const PLANS = [
  {name: "Free Trial", price: 0, period: "mo", desc: "Experience all features for free. No credit card required.", features: ["Basic feature access","250 conversations/mo","0 agent seat", "0 Chatbots","0 Channels","Community support"], highlight: false },
  { name: "Starter", price: 99.99, period: "mo", desc: "For solo operators", features: ["1,000 conversations/mo","3 chatbot flows","2 agents","2 channels","Basic analytics","Email support"], highlight: false },
  { name: "Growth",  price: 149.99, period: "mo", desc: "For scaling teams",  features: ["10,000 conversations/mo","Unlimited flows","10 agents","10 Agents", "5 channels","Advanced analytics","CRM integrations","Priority support"], highlight: true },
  { name: "Enterprise", price: "Custom", period: "", desc: "For large organizations", features: ["Unlimited conversations","Unlimited agents","Unlimited channels","Custom integrations","SLA guarantee","Dedicated CSM","On-premise option"], highlight: false },
];

const TESTIMONIALS = [
  { name: "Fareed Sheik",     role: "CEO, Taxqwik",        avatar: "SC", text: "We went from 200 to 800 leads per month in 6 weeks. The AI chatbot handles 80% of inquiries without human intervention." },
  { name: "Barbara Jensen", role: "Head of Growth, Revuola", avatar: "MV", text: "The broadcast feature alone paid for itself in the first campaign. 94% open rate on our Black Friday promotion." },
  { name: "Imran Mohammed",    role: "Support Manager, CloudEats", avatar: "PM", text: "Multi-agent chat transformed our support. Response time dropped from 4 hours to under 3 minutes." },
];

const INTEGRATIONS = ["ChatGPT","Salesforce","Zoho CRM","Shopify","WooCommerce","Zapier","Stripe","Google Sheets","HubSpot","Notion","Slack","Mailchimp","Klaviyo"];
const NAV_LINKS = [{ label: "Features", href: "#features" }, { label: "Integrations", href: "#integrations" }, { label: "Pricing", href: "#pricing" }];

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ fontFamily: "var(--font-sora)", background: "#f8faf8", color: "#0d150d", overflowX: "hidden" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        a { text-decoration: none; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #22c55e; border-radius: 99px; }

        .nav-link { font-size: 0.875rem; font-weight: 500; color: #374737; transition: color 0.2s; }
        .nav-link:hover { color: #16a34a; }

        .btn-outline { font-size: 0.875rem; font-weight: 600; color: #374737; padding: 8px 20px; border-radius: 50px; border: 1.5px solid #e4ebe4; transition: all 0.2s; }
        .btn-outline:hover { border-color: #22c55e; color: #16a34a; }

        .btn-green { font-size: 0.875rem; font-weight: 700; color: white; padding: 9px 24px; border-radius: 50px; background: linear-gradient(135deg, #22c55e, #16a34a); box-shadow: 0 4px 16px rgba(34,197,94,0.3); transition: all 0.2s; }
        .btn-green:hover { box-shadow: 0 8px 24px rgba(34,197,94,0.45); transform: translateY(-1px); }

        .btn-hero { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #22c55e, #15803d); color: white; font-weight: 700; font-size: 1rem; padding: 15px 36px; border-radius: 50px; box-shadow: 0 8px 28px rgba(34,197,94,0.35); transition: all 0.2s; }
        .btn-hero:hover { box-shadow: 0 14px 40px rgba(34,197,94,0.5); transform: translateY(-2px); }

        .btn-ghost-hero { display: inline-flex; align-items: center; gap: 8px; color: #374737; font-weight: 600; font-size: 1rem; padding: 15px 28px; border-radius: 50px; border: 1.5px solid #cddacd; transition: all 0.2s; }
        .btn-ghost-hero:hover { border-color: #22c55e; color: #16a34a; }

        .feature-card { background: white; border: 1px solid #e4ebe4; border-radius: 18px; padding: 28px; transition: all 0.3s; }
        .feature-card:hover { transform: translateY(-5px); box-shadow: 0 18px 56px rgba(0,0,0,0.08); border-color: rgba(34,197,94,0.3); }

        .integ-chip { padding: 9px 18px; background: #f8faf8; border: 1px solid #e4ebe4; border-radius: 50px; font-size: 0.84rem; font-weight: 600; color: #374737; transition: all 0.2s; display: inline-block; }
        .integ-chip:hover { border-color: #22c55e; color: #16a34a; background: rgba(34,197,94,0.04); }

        .testi-card { background: #f8faf8; border: 1px solid #e4ebe4; border-radius: 22px; padding: 32px; transition: all 0.3s; }
        .testi-card:hover { transform: translateY(-4px); box-shadow: 0 14px 44px rgba(0,0,0,0.07); }

        .footer-link { font-size: 0.8rem; color: rgba(255,255,255,0.4); transition: color 0.2s; }
        .footer-link:hover { color: #4ade80; }

        .plan-card { background: white; border: 1.5px solid #e4ebe4; border-radius: 22px; padding: 36px; transition: all 0.3s; }
        .plan-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.08); }

        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .float { animation: float 4s ease-in-out infinite; }
        .float-slow { animation: float 6s ease-in-out infinite reverse; }
        .ticker { animation: ticker 24s linear infinite; white-space: nowrap; display: inline-flex; gap: 60px; }

        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          .hero-grid, .plans-grid, .testi-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr 1fr !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? "rgba(255,255,255,0.92)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid rgba(228,235,228,0.8)" : "none", transition: "all 0.4s ease" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#4ade80,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(34,197,94,0.3)" }}>
              <Zap size={16} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0d150d", letterSpacing: "-0.02em" }}>Connect<span style={{ color: "#16a34a" }}>Beez</span></span>
          </Link>

          <div className="hide-mobile" style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {NAV_LINKS.map(l => <a key={l.label} href={l.href} className="nav-link">{l.label}</a>)}
          </div>

          <div className="hide-mobile" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="/login" className="btn-outline">Sign in</Link>
            <Link href="/contact" className="btn-green">Get Started</Link>
          </div>

          <button onClick={() => setMobileOpen(p => !p)} className="show-mobile" style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileOpen && (
          <div style={{ background: "white", borderTop: "1px solid #e4ebe4", padding: "16px 24px 24px" }}>
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} style={{ display: "block", padding: "12px 0", fontWeight: 500, color: "#374737", borderBottom: "1px solid #f0f4f0" }}>{l.label}</a>
            ))}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              <Link href="/login" style={{ textAlign: "center", padding: "12px", borderRadius: 12, border: "1.5px solid #e4ebe4", fontWeight: 600, color: "#374737" }}>Sign in</Link>
              <Link href="/signup" style={{ textAlign: "center", padding: "12px", borderRadius: 12, background: "linear-gradient(135deg,#22c55e,#16a34a)", fontWeight: 700, color: "white" }}>Get Started Free</Link>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden", paddingTop: 68 }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% -10%,rgba(34,197,94,0.12) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,#bbf7d0 1px,transparent 1px)", backgroundSize: "36px 36px", opacity: 0.35 }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px", width: "100%", position: "relative" }}>
          <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 50, padding: "6px 16px", marginBottom: 28 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 0 3px rgba(34,197,94,0.2)" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#15803d", letterSpacing: "0.06em", textTransform: "uppercase" }}>Official WhatsApp Business API</span>
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.8rem,5vw,4.4rem)", fontWeight: 400, lineHeight: 1.08, color: "#0d150d", marginBottom: 24, letterSpacing: "-0.02em" }}>
                Turn WhatsApp into your{" "}<span style={{ color: "#16a34a", fontStyle: "italic" }}>Revenue Engine</span>
              </h1>
              <p style={{ fontSize: "1.1rem", color: "#4a5f4a", lineHeight: 1.75, maxWidth: 480, marginBottom: 40 }}>
                ConnectBeez gives you everything to automate conversations, close deals, and deliver 5-star support — all inside WhatsApp.
              </p>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 48 }}>
                <Link href="/contact" className="btn-hero">Get Started <ArrowRight size={17} /></Link>
                <a href="#features" className="btn-ghost-hero">See how it works</a>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <div style={{ display: "flex" }}>
                  {["SC","MV","PM","AK","RB"].map((a, i) => (
                    <div key={a} style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,hsl(${140+i*15},60%,45%),hsl(${140+i*15},70%,35%))`, border: "2.5px solid white", marginLeft: i > 0 ? -10 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: "white", fontWeight: 800 }}>{a}</div>
                  ))}
                </div>
                <div>
                  <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>{[...Array(5)].map((_,i) => <Star key={i} size={13} fill="#22c55e" color="#22c55e" />)}</div>
                  <p style={{ fontSize: "0.8rem", color: "#6a826a", fontWeight: 500 }}>500+ businesses growing with ConnectBeez</p>
                </div>
              </div>
            </div>

            {/* Phone mockup */}
            <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
              <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", border: "1px dashed rgba(34,197,94,0.2)" }} />
              <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", border: "1px solid rgba(34,197,94,0.1)" }} />
              <div className="float" style={{ position: "relative", zIndex: 2 }}>
                <div style={{ width: 288, background: "#0d150d", borderRadius: 44, padding: "14px 10px", boxShadow: "0 40px 100px rgba(0,0,0,0.25),0 0 0 1px rgba(255,255,255,0.05)" }}>
                  <div style={{ width: 88, height: 22, background: "#080e08", borderRadius: 99, margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1a3a1a" }} />
                  </div>
                  <div style={{ background: "#f0f2f0", borderRadius: 32, overflow: "hidden" }}>
                    <div style={{ background: "#075e54", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>🏪</div>
                      <div>
                        <div style={{ color: "white", fontWeight: 700, fontSize: "0.82rem" }}>ConnectBeez Business</div>
                        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.65rem" }}>🟢 Online · Official API</div>
                      </div>
                    </div>
                    <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 8, background: "#e5ddd5", minHeight: 320 }}>
                      <div style={{ alignSelf: "flex-start" }}><div style={{ background: "white", borderRadius: "12px 12px 12px 3px", padding: "9px 12px", fontSize: "0.74rem", color: "#1a2e1a", maxWidth: 190, lineHeight: 1.5 }}>👋 Hi! Interested in your summer collection!</div></div>
                      <div style={{ alignSelf: "flex-end" }}><div style={{ background: "#dcfce7", borderRadius: "12px 12px 3px 12px", padding: "9px 12px", fontSize: "0.74rem", color: "#1a2e1a", maxWidth: 190, lineHeight: 1.5 }}>Hello! We have 24 new arrivals 🌿 Browse our catalog?</div></div>
                      <div style={{ alignSelf: "flex-end", background: "white", borderRadius: 10, overflow: "hidden", width: 170, boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
                        <div style={{ height: 68, background: "linear-gradient(135deg,#22c55e,#15803d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>🌿</div>
                        <div style={{ padding: "7px 10px" }}><div style={{ fontSize: "0.7rem", fontWeight: 700 }}>Summer Linen Set</div><div style={{ fontSize: "0.65rem", color: "#16a34a", fontWeight: 600 }}>$89.00 CAD</div></div>
                      </div>
                      <div style={{ alignSelf: "flex-start" }}><div style={{ background: "white", borderRadius: "12px 12px 12px 3px", padding: "9px 12px", fontSize: "0.74rem", color: "#1a2e1a", lineHeight: 1.5 }}>Amazing! I'll take 2! 😍</div></div>
                      <div style={{ alignSelf: "flex-end" }}><div style={{ background: "#dcfce7", borderRadius: "12px 12px 3px 12px", padding: "9px 12px", fontSize: "0.74rem", color: "#1a2e1a", lineHeight: 1.5 }}>✅ Order confirmed! Track below 📦</div></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="float-slow" style={{ position: "absolute", top: "8%", right: "-4%", background: "white", borderRadius: 14, padding: "10px 14px", boxShadow: "0 12px 36px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 7, zIndex: 3 }}>
                <span style={{ fontSize: "1.3rem" }}>⚡</span>
                <div><div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#0d150d" }}>AI Reply</div><div style={{ fontSize: "0.62rem", color: "#6a826a" }}>0.3s response</div></div>
              </div>
              <div className="float" style={{ animationDelay: "-2s", position: "absolute", bottom: "18%", left: "-6%", background: "white", borderRadius: 14, padding: "10px 14px", boxShadow: "0 12px 36px rgba(0,0,0,0.1)", zIndex: 3 }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#0d150d", marginBottom: 3 }}>Today's Revenue</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#16a34a" }}>$12,840</div>
                <div style={{ fontSize: "0.62rem", color: "#22c55e" }}>↑ 34% vs yesterday</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div style={{ background: "#0d150d", padding: "13px 0", overflow: "hidden" }}>
        <div className="ticker">
          {[...Array(4)].map((_,i) => (
            <span key={i} style={{ display: "inline-flex", gap: 52, color: "rgba(255,255,255,0.55)", fontSize: "0.8rem", fontWeight: 500 }}>
              {["✦ 98% Open Rate","✦ Official WhatsApp API","✦ 80+ Integrations","✦ 3x Revenue Growth","✦ AI Chatbots","✦ Multi-Agent Inbox","✦ Setup in 10 Minutes"].map(t => <span key={t}>{t}</span>)}
            </span>
          ))}
        </div>
      </div>

      {/* STATS */}
      <section style={{ padding: "96px 24px", background: "white" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", color: "#16a34a", textTransform: "uppercase", marginBottom: 14 }}>Why It Works</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem,4vw,2.9rem)", color: "#0d150d", lineHeight: 1.1 }}>Numbers that speak for themselves</h2>
          </div>
          <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 22 }}>
            {STATS.map(({ value, label }) => (
              <div key={label} style={{ background: "#f8faf8", border: "1px solid #e4ebe4", borderRadius: 22, padding: "36px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 36, height: 3, background: "#22c55e", borderRadius: 99 }} />
                <p style={{ fontFamily: "var(--font-display)", fontSize: "3rem", color: "#0d150d", lineHeight: 1, marginBottom: 10 }}>{value}</p>
                <p style={{ fontSize: "0.83rem", color: "#6a826a", fontWeight: 500 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: "96px 24px", background: "#f8faf8" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", color: "#16a34a", textTransform: "uppercase", marginBottom: 14 }}>Platform Features</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem,4vw,2.9rem)", color: "#0d150d", lineHeight: 1.1 }}>Everything you need to <em>close more deals</em></h2>
          </div>
          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
            {FEATURES.map(({ title, desc }) => (
              <div key={title} className="feature-card">
                <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0d150d", marginBottom: 9 }}>{title}</h3>
                <p style={{ fontSize: "0.85rem", color: "#6a826a", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section id="integrations" style={{ padding: "96px 24px", background: "white" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", color: "#16a34a", textTransform: "uppercase", marginBottom: 14 }}>80+ Native Integrations</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem,4vw,2.9rem)", color: "#0d150d", lineHeight: 1.1, marginBottom: 16 }}>Connects with your <em>entire stack</em></h2>
          <p style={{ color: "#6a826a", fontSize: "1rem", maxWidth: 480, margin: "0 auto 44px" }}>Plug ConnectBeez into the tools you already use. No dev work — just authorize and go live.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {INTEGRATIONS.map(name => <div key={name} className="integ-chip">{name}</div>)}
            <div style={{ padding: "9px 18px", background: "#f0fdf4", border: "1px dashed #86efac", borderRadius: 50, fontSize: "0.84rem", fontWeight: 600, color: "#16a34a" }}>+64 more</div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: "96px 24px", background: "#f8faf8" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", color: "#16a34a", textTransform: "uppercase", marginBottom: 14 }}>Simple Pricing</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem,4vw,2.9rem)", color: "#0d150d", lineHeight: 1.1 }}>Invest once, <em>grow forever</em></h2>
          </div>
          <div className="plans-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22, alignItems: "center" }}>
            {PLANS.map(({ name, price, period, desc, features, highlight }) => (
              <div key={name} className={highlight ? "" : "plan-card"} style={highlight ? { background: "#0d150d", border: "none", borderRadius: 22, padding: "36px", transform: "scale(1.04)", boxShadow: "0 24px 64px rgba(13,21,13,0.22)" } : {}}>
                {highlight && <div style={{ display: "inline-block", background: "#22c55e", color: "#0d150d", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.08em", padding: "4px 14px", borderRadius: 50, marginBottom: 18, textTransform: "uppercase" }}>Most Popular</div>}
                <p style={{ fontSize: "0.83rem", fontWeight: 600, color: highlight ? "rgba(255,255,255,0.45)" : "#8aa48a", marginBottom: 7 }}>{name}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 7 }}>
                  {typeof price === "number" && <span style={{ color: highlight ? "rgba(255,255,255,0.35)" : "#8aa48a", fontSize: "1.05rem" }}>$</span>}
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "2.8rem", color: highlight ? "white" : "#0d150d" }}>{price}</span>
                  {period && <span style={{ color: highlight ? "rgba(255,255,255,0.35)" : "#8aa48a", fontSize: "0.88rem" }}>/{period}</span>}
                </div>
                <p style={{ fontSize: "0.8rem", color: highlight ? "rgba(255,255,255,0.45)" : "#8aa48a", marginBottom: 24 }}>{desc}</p>
                <div style={{ width: "100%", height: 1, background: highlight ? "rgba(255,255,255,0.07)" : "#f0f4f0", marginBottom: 22 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 28 }}>
                  {features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: "0.86rem", color: highlight ? "rgba(255,255,255,0.78)" : "#374737" }}>
                      <Check size={13} color={highlight ? "#4ade80" : "#22c55e"} strokeWidth={3} style={{ flexShrink: 0 }} />{f}
                    </div>
                  ))}
                </div>
                <Link href="/contact" style={{ display: "block", textAlign: "center", padding: "12px", borderRadius: 50, fontWeight: 700, fontSize: "0.88rem", background: highlight ? "linear-gradient(135deg,#22c55e,#16a34a)" : "transparent", color: highlight ? "white" : "#0d150d", border: highlight ? "none" : "1.5px solid #cddacd", boxShadow: highlight ? "0 8px 24px rgba(34,197,94,0.38)" : "none" }}>
                  {price === "Custom" ? "Contact Sales →" : "Contact Sales →"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: "96px 24px", background: "white" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", color: "#16a34a", textTransform: "uppercase", marginBottom: 14 }}>Social Proof</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem,4vw,2.9rem)", color: "#0d150d", lineHeight: 1.1 }}>Loved by businesses that <em>grow fast</em></h2>
          </div>
          <div className="testi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
            {TESTIMONIALS.map(({ name, role, avatar, text }) => (
              <div key={name} className="testi-card">
                <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>{[...Array(5)].map((_,i) => <Star key={i} size={13} fill="#22c55e" color="#22c55e" />)}</div>
                <p style={{ fontSize: "0.9rem", color: "#263326", lineHeight: 1.75, marginBottom: 22, fontStyle: "italic" }}>"{text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#22c55e,#15803d)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "0.78rem" }}>{avatar}</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.86rem", color: "#0d150d" }}>{name}</p>
                    <p style={{ fontSize: "0.74rem", color: "#8aa48a" }}>{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "112px 24px", background: "#0d150d", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 60% at 50% 50%,rgba(34,197,94,0.1) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", color: "#4ade80", textTransform: "uppercase", marginBottom: 18 }}>Ready to Scale?</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.4rem,5vw,3.7rem)", color: "white", lineHeight: 1.08, marginBottom: 18 }}>
            Start turning conversations into <span style={{ color: "#4ade80" }}>customers</span> today
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem", lineHeight: 1.75, maxWidth: 440, margin: "0 auto 40px" }}>Join 500+ businesses.</p>
          <div style={{ display: "flex", gap: 13, justifyContent: "center", flexWrap: "wrap" }}>
            {/*<Link href="/signup" className="btn-hero">Start Free Trial <ArrowRight size={16} /></Link>*/}
            <Link href="/contact" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.06)", color: "white", fontWeight: 600, fontSize: "1rem", padding: "15px 30px", borderRadius: 50, border: "1px solid rgba(255,255,255,0.1)" }}>Get Started</Link>
          </div>
          {/*<p style={{ color: "rgba(255,255,255,0.28)", fontSize: "0.78rem", marginTop: 18 }}>✓ 14-day free trial &nbsp;·&nbsp; ✓ No credit card &nbsp;·&nbsp; ✓ Cancel anytime</p>*/}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#080e08", padding: "52px 24px 24px", color: "rgba(255,255,255,0.45)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#4ade80,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={13} color="white" strokeWidth={2.5} />
              </div>
              <span style={{ fontWeight: 800, fontSize: "1rem", color: "white" }}>ConnectBeez</span>
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
            { label: "Features",      href: "/#features" },
            { label: "Pricing",       href: "/#pricing"  },
            { label: "Privacy Policy", href: "/privacy"  },
            { label: "Terms of Use",  href: "/terms"     },
            { label: "Contact",       href: "/contact"   },
            ].map(({ label, href }) => (
            <Link key={label} href={href} className="footer-link">{label}</Link>
            ))}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 22, flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: "0.78rem" }}>©2026 ConnectBeez. All rights reserved. Powered by Official WhatsApp Business API.</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: "0.76rem", color: "#22c55e" }}>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
