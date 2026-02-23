"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return toast.error("Enter your email");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setSent(true);
      else toast.error("Something went wrong");
    } catch {
      toast.error("Something went wrong");
    }
    setLoading(false);
  }

  if (sent) return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl">📬</span>
      </div>
      <h1 className="font-display text-3xl font-black text-ink-900 mb-2">Check your inbox</h1>
      <p className="text-ink-400 text-sm mb-8">
        We sent a password reset link to <strong>{email}</strong>. It expires in 1 hour.
      </p>
      <Link href="/login" className="text-brand-600 font-semibold hover:text-brand-700 flex items-center justify-center gap-2">
        <ArrowLeft size={15} /> Back to login
      </Link>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-ink-900 mb-2">Forgot password?</h1>
        <p className="text-ink-400 text-sm">Enter your email and we'll send you a reset link</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">Email address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="field-input"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Send reset link</span><ArrowRight size={15} /></>}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-400">
        Remember it?{" "}
        <Link href="/login" className="text-brand-600 font-semibold hover:text-brand-700">
          Back to login
        </Link>
      </p>
    </div>
  );
}