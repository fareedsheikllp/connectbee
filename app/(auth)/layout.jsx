import { Zap } from "lucide-react";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-50 flex">
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-shrink-0 relative overflow-hidden bg-ink-900 flex-col justify-between p-12">
        <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 20% 80%, rgba(34,197,94,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(34,197,94,0.08) 0%, transparent 50%)` }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
        <a href="/" className="relative flex items-center gap-3 no-underline">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#4ade80,#16a34a)" }}>
            <Zap size={15} color="white" strokeWidth={2.5} />
          </div>
          <span className="font-sans font-extrabold text-xl text-white tracking-tight">Connect<span className="gradient-text">Bee</span></span>
        </a>
        <div className="relative space-y-8">
          <blockquote className="font-display text-4xl font-bold text-white leading-tight">"We grew our WhatsApp leads <span className="gradient-text">3× in 30 days</span>."</blockquote>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm">SC</div>
            <div>
              <p className="text-white font-semibold text-sm">Sarah Chen</p>
              <p className="text-ink-400 text-xs">Founder, MapleTech</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
            {[{ v: "98%", l: "Open rate" }, { v: "3x", l: "Revenue" }, { v: "10m", l: "Setup" }].map((s) => (
              <div key={s.l}>
                <p className="font-display text-2xl font-black text-white">{s.v}</p>
                <p className="text-ink-400 text-xs mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-[440px]">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#4ade80,#16a34a)" }}>
              <Zap size={13} color="white" strokeWidth={2.5} />
            </div>
            <span className="font-sans font-extrabold text-lg text-ink-900 tracking-tight">Connect<span className="gradient-text">Bee</span></span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}