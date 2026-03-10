"use client";
import { Suspense } from "react";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const reason = searchParams.get("reason");
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email) errs.email = "Email is required";
    if (!form.password) errs.password = "Password is required";
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    if (res?.error) {
      toast.error("Invalid email or password.");
      setErrors({ password: "Invalid email or password" });
      } else {
        toast.success("Welcome back!");
        const destination = form.email.toLowerCase() === ADMIN_EMAIL?.toLowerCase()
          ? "/admin"
          : callbackUrl;
        router.push(destination);
        router.refresh();
      }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-ink-900 mb-2">Welcome back</h1>
        <p className="text-ink-400 text-sm">Sign in to your ConnectBeez workspace</p>
      </div>

      {reason === "idle" && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-3 rounded-lg mb-4">
          You were logged out due to 30 minutes of inactivity.
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">Email address</label>
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={handleChange}
            className={`field-input ${errors.email ? "!border-red-400 !ring-red-100" : ""}`}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.email}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="field-label !mb-0">Password</label>
            <Link href="/forgot-password" className="text-xs text-brand-600 font-semibold hover:text-brand-700 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              name="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className={`field-input pr-11 ${errors.password ? "!border-red-400 !ring-red-100" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-600 transition-colors"
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 mt-2 gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Sign in</span><ArrowRight size={15} /></>}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}