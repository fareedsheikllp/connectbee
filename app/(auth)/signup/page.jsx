"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";

const PW_RULES = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One number", test: (p) => /\d/.test(p) },
];

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", company: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [pwFocus, setPwFocus] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name) errs.name = "Name is required";
    if (!form.email) errs.email = "Email is required";
    if (!form.company) errs.company = "Company name is required";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "Password too short";
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Signup failed"); setLoading(false); return; }
      toast.success("Account created! Signing you in...");
      await signIn("credentials", { email: form.email, password: form.password, callbackUrl: "/dashboard", redirect: true });
    } catch { toast.error("Something went wrong."); setLoading(false); }
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-ink-900 mb-2">Create your account</h1>
        <p className="text-ink-400 text-sm">Start your 14-day free trial. No credit card needed.</p>
      </div>
      <button type="button" onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="w-full flex items-center justify-center gap-3 bg-surface-0 border border-surface-200 rounded-xl px-4 py-3 text-sm font-semibold text-ink-700 shadow-soft hover:border-surface-300 hover:shadow-medium transition-all mb-6">
        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continue with Google
      </button>
      <div className="relative mb-6"><div className="divider" /><span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-50 px-3 text-xs text-ink-400 font-medium">or fill in your details</span></div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Full name</label>
            <input name="name" placeholder="Alex Johnson" value={form.name} onChange={handleChange} className={`field-input ${errors.name ? "!border-red-400" : ""}`} />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>
          <div>
            <label className="field-label">Company</label>
            <input name="company" placeholder="Acme Inc." value={form.company} onChange={handleChange} className={`field-input ${errors.company ? "!border-red-400" : ""}`} />
            {errors.company && <p className="field-error">{errors.company}</p>}
          </div>
        </div>
        <div>
          <label className="field-label">Work email</label>
          <input name="email" type="email" autoComplete="email" placeholder="you@company.com" value={form.email} onChange={handleChange} className={`field-input ${errors.email ? "!border-red-400" : ""}`} />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>
        <div>
          <label className="field-label">Password</label>
          <div className="relative">
            <input name="password" type={showPw ? "text" : "password"} placeholder="Create a strong password" value={form.password} onChange={handleChange} onFocus={() => setPwFocus(true)} onBlur={() => setPwFocus(false)} className={`field-input pr-11 ${errors.password ? "!border-red-400" : ""}`} />
            <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {(pwFocus || form.password) && (
            <div className="mt-2 space-y-1.5">
              {PW_RULES.map((r) => {
                const ok = r.test(form.password);
                return (
                  <div key={r.label} className={`flex items-center gap-2 text-xs transition-colors ${ok ? "text-brand-600" : "text-ink-400"}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${ok ? "bg-brand-500" : "bg-surface-200"}`}>
                      {ok && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    {r.label}
                  </div>
                );
              })}
            </div>
          )}
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full mt-2 py-3">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Create account</span><ArrowRight size={16} /></>}
        </button>
      </form>
      <p className="mt-4 text-xs text-ink-400 text-center">By signing up you agree to our <Link href="/terms" className="text-brand-600 hover:underline">Terms</Link> and <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>.</p>
      <p className="mt-4 text-center text-sm text-ink-400">Already have an account?{" "}<Link href="/login" className="text-brand-600 font-semibold hover:text-brand-700">Sign in</Link></p>
    </div>
  );
}
