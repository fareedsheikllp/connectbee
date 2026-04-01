"use client";
import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", subject: "", message: "" });
  const [status, setStatus] = useState(null); // null | "sending" | "sent" | "error"

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    // Replace with your actual form endpoint (Formspree, Resend, etc.)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');
        .serif { font-family: 'DM Serif Display', serif; }
        input:focus, textarea:focus, select:focus { outline: none; }
        .field { width: 100%; padding: 12px 16px; border: 1.5px solid #e5e7eb; border-radius: 12px; font-size: 14px; color: #111827; background: #fff; transition: border-color 0.2s; font-family: inherit; }
        .field:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.08); }
        .field::placeholder { color: #9ca3af; }
      `}</style>

      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-black text-xl tracking-tight">
            <span className="text-gray-900">Connect</span><span className="text-emerald-500">Beez</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Terms</Link>
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Privacy</Link>
            <Link href="/" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">← Home</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-700 mb-8 tracking-wide uppercase">
              Get in touch
            </div>
            <h1 className="serif text-5xl text-gray-900 mb-6 leading-tight">
              We'd love to<br /><em className="text-emerald-500 not-italic">hear from you</em>
            </h1>
            <p className="text-gray-500 text-base leading-relaxed mb-12 max-w-sm">
              Whether you have a question about features, pricing, need a demo, or anything else — our team is ready to answer.
            </p>

            {/* Contact methods */}
            <div className="space-y-4">
              {[
                {
                  label: "General Inquiries",
                  value: "hello@ConnectBeez.io",
                  desc: "For general questions and partnerships",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                  )
                },
                {
                  label: "Support",
                  value: "support@ConnectBeez.io",
                  desc: "Technical help and account issues",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  )
                },
                {
                  label: "Privacy",
                  value: "privacy@ConnectBeez.io",
                  desc: "Data requests and privacy concerns",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  )
                },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-4 p-5 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-gray-50/50 transition-all group">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Response time */}
            <div className="mt-8 flex items-center gap-2 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              We typically respond within 1 business day
            </div>
          </div>

          {/* Right — Form */}
          <div>
            {status === "sent" ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 rounded-3xl bg-gray-50 border border-gray-100">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h2 className="serif text-3xl text-gray-900 mb-3">Message sent!</h2>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                  Thanks for reaching out. We'll get back to you within 1 business day.
                </p>
                <button
                  onClick={() => { setStatus(null); setForm({ name: "", email: "", company: "", subject: "", message: "" }); }}
                  className="mt-8 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-white transition-colors"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Name *</label>
                    <input
                      required
                      className="field"
                      placeholder="Jane Smith"
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email *</label>
                    <input
                      required
                      type="email"
                      className="field"
                      placeholder="jane@company.com"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Company</label>
                  <input
                    className="field"
                    placeholder="Acme Corp (optional)"
                    value={form.company}
                    onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subject *</label>
                  <select
                    required
                    className="field"
                    value={form.subject}
                    onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  >
                    <option value="">Select a topic...</option>
                    <option value="general">General Question</option>
                    <option value="demo">Request a Demo</option>
                    <option value="pricing">Pricing & Plans</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership</option>
                    <option value="privacy">Privacy / Data Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Message *</label>
                  <textarea
                    required
                    className="field resize-none"
                    placeholder="Tell us how we can help..."
                    rows={6}
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 active:scale-[0.99] transition-all shadow-sm shadow-emerald-200 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {status === "sending" ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : "Send message →"}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  By submitting, you agree to our{" "}
                  <Link href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 mt-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">© 2026 ConnectBeez. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}