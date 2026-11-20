"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth-context";
import { DEMO_ACCOUNTS } from "@/lib/rbac";

const FEATURES = [
  { icon: "CalendarDays", t: "Time off", s: "Leaves, permissions & approvals" },
  { icon: "Wallet", t: "Payroll", s: "Payslips, anytime" },
  { icon: "MessageSquare", t: "Team chat", s: "Stay connected" },
  { icon: "BarChart3", t: "Insights", s: "Real-time dashboards" },
];

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("admin@hrms.local");
  const [password, setPassword] = useState("Admin@123");
  const [showPwd, setShowPwd] = useState(false);
  const [accountEmail, setAccountEmail] = useState(DEMO_ACCOUNTS[0].email as string);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(2026);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 text-white p-12"
        style={{ background: "linear-gradient(160deg, #123f8f 0%, #0b3a83 55%, #082a5e 100%)" }}
      >
        <Logo variant="light" size={38} />

        <div className="max-w-md">
          <h1 className="text-[2.3rem] font-semibold leading-[1.15] tracking-tight">
            Your people,<br />perfectly in sync.
          </h1>
          <p className="mt-4 text-white/65 text-[0.95rem] leading-relaxed">
            One workspace for attendance, time off, payroll and team communication.
          </p>

          <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5">
            {FEATURES.map((f) => (
              <div key={f.t} className="flex items-start gap-3">
                <span className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/10">
                  <Icon name={f.icon} size={16} className="text-white/90" />
                </span>
                <div>
                  <div className="text-[0.85rem] font-medium">{f.t}</div>
                  <div className="text-[0.74rem] text-white/50 leading-snug">{f.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-8">
          {[
            { v: "248", l: "Employees" },
            { v: "99.9%", l: "Uptime" },
            { v: "12", l: "Modules" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-lg font-semibold">{s.v}</div>
              <div className="text-[0.66rem] uppercase tracking-[0.14em] text-white/40">{s.l}</div>
            </div>
          ))}
          <div className="ml-auto text-xs text-white/35">© {year} HRMS</div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[var(--bg)]">
        <div className="w-full max-w-[26rem]">
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size={40} />
          </div>

          <div className="card p-8 fade-in">
            <div className="mb-6">
              <h2 className="text-[1.35rem] font-semibold text-[var(--text)] tracking-tight">Sign in</h2>
              <p className="text-[0.85rem] text-[var(--text-muted)] mt-1">Welcome back to your workspace.</p>
            </div>

            {/* Assign-role shortcuts (demo) */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">Sign in as (demo)</label>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-[var(--slate-100)]">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    onClick={() => {
                      setAccountEmail(a.email);
                      setEmail(a.email);
                      setPassword(a.password);
                      setError(null);
                    }}
                    className={`rounded-md px-2 py-1.5 text-xs transition-colors ${
                      accountEmail === a.email
                        ? "bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-xs)] font-semibold"
                        : "text-[var(--text-muted)] hover:text-[var(--text)] font-medium"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              <p className="text-[0.7rem] text-[var(--text-subtle)] mt-2">
                Access is granted by the role assigned to this employee.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[0.8rem] font-medium text-[var(--text)] mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base"
                  placeholder="you@company.com"
                  required
                />
              </div>
              <div>
                <label className="block text-[0.8rem] font-medium text-[var(--text)] mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-base pr-11"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--text-muted)]"
                    tabIndex={-1}
                  >
                    <Icon name={showPwd ? "EyeOff" : "Eye"} size={17} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[0.8rem]">
                <label className="flex items-center gap-2 text-[var(--text-muted)]">
                  <input type="checkbox" defaultChecked className="accent-[var(--brand-600)]" />
                  Remember me
                </label>
                <a href="#" className="text-[var(--brand-600)] font-medium hover:text-[var(--brand-700)]">Forgot password?</a>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-bg)] px-3 py-2 text-[0.78rem] text-[var(--danger)]">
                  <Icon name="AlertCircle" size={15} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-10 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign in <Icon name="ArrowRight" size={16} /></>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div>
              <div className="relative flex justify-center">
                <span className="bg-[var(--surface)] px-3 text-xs text-[var(--text-subtle)]">or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="btn-ghost h-10 flex items-center justify-center gap-2 text-[0.8rem]">
                <svg width="15" height="15" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google
              </button>
              <button className="btn-ghost h-10 flex items-center justify-center gap-2 text-[0.8rem]">
                <svg width="15" height="15" viewBox="0 0 23 23"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="12" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="12" width="10" height="10" fill="#00A4EF"/><rect x="12" y="12" width="10" height="10" fill="#FFB900"/></svg>
                Microsoft
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-[var(--text-subtle)] mt-6">
            Need help? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
