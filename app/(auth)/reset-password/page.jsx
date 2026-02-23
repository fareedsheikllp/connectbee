"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Password updated! Please log in.");
        router.push("/login");
      } else {
        toast.error(data.error || "Failed to reset password");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-ink-900 mb-2">Reset password</h1>
        <p className="text-ink-400 text-sm">Enter your new password below</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">New Password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="field-input pr-11"
            />
            <button type="button" onClick={() => setShowPw(p => !p)} tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-600">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div>
          <label className="field-label">Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="field-input"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Update password</span><ArrowRight size={15} /></>}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-400">
        <Link href="/login" className="text-brand-600 font-semibold hover:text-brand-700">
          Back to login
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}