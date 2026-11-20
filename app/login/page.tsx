"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth-context";
import { DEMO_USER, ROLES, type Role } from "@/lib/nav-config";

const ROLE_LABEL: Record<Role, string> = { ADMIN: "Administrator", HR: "HR Manager", EMPLOYEE: "Employee" };

export default function LoginPage() {
  const router = useRouter();
  const { setRole } = useAuth();
  const [email, setEmail] = useState("admin@hrms.local");
  const [password, setPassword] = useState("Admin@123");
  const [showPwd, setShowPwd] = useState(false);
  const [role, setRoleSel] = useState<Role>("ADMIN");
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(2026);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setRole(role);
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 brand-gradient text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }} />
        <div className="relative">
          <Logo variant="light" size={42} />
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Your people, <br /> perfectly in sync.
          </h1>
          <p className="mt-4 text-white/75 text-[0.95rem] leading-relaxed">
            A modern workspace for attendance, time off, payroll, and team communication — all in one place.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { icon: "CalendarDays", t: "Smart Time Off", s: "Leaves, permissions & approvals" },
              { icon: "Wallet", t: "Easy Payroll", s: "Payslips, anytime" },
              { icon: "MessageSquare", t: "Team Chat", s: "Stay connected, anywhere" },
              { icon: "BarChart3", t: "Insights", s: "Real-time dashboards" },
            ].map((f) => (
              <div key={f.t} className="flex items-start gap-3 rounded-xl bg-white/10 backdrop-blur p-3 border border-white/10">
                <Icon name={f.icon} size={18} className="mt-0.5 text-white/90" />
                <div>
                  <div className="text-sm font-semibold">{f.t}</div>
                  <div className="text-xs text-white/65">{f.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-white/50">© {year} HRMS Workspace. All rights reserved.</div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[var(--bg)]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size={44} />
          </div>
          <div className="card p-8 fade-in" style={{ boxShadow: "0 20px 60px -20px rgba(11,58,131,0.25)" }}>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[var(--text)]">Welcome back</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">Sign in to your workspace</p>
            </div>

            {/* Role selector (demo) */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">Sign in as (demo)</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRoleSel(r);
                      setEmail(DEMO_USER[r].email);
                      setPassword(r === "ADMIN" ? "Admin@123" : r === "HR" ? "Hr@12345" : "Employee@123");
                    }}
                    className="rounded-lg border px-2 py-2.5 text-xs font-semibold transition-all"
                    style={{
                      borderColor: role === r ? "var(--brand-700)" : "var(--border)",
                      background: role === r ? "var(--brand-50)" : "var(--surface)",
                      color: role === r ? "var(--brand-700)" : "var(--text-muted)",
                    }}
                  >
                    {ROLE_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Email</label>
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
                <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Password</label>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--text)]"
                    tabIndex={-1}
                  >
                    <Icon name={showPwd ? "EyeOff" : "Eye"} size={18} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-[var(--text-muted)]">
                  <input type="checkbox" defaultChecked className="accent-[var(--brand-700)]" />
                  Remember me
                </label>
                <a href="#" className="text-[var(--brand-600)] font-medium hover:underline">Forgot password?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign in <Icon name="ArrowUpRight" size={16} /></>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div>
              <div className="relative flex justify-center"><span className="bg-[var(--surface)] px-3 text-xs text-[var(--text-subtle)]">or continue with</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="btn-ghost flex items-center justify-center gap-2 py-2.5 border border-[var(--border)]">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google
              </button>
              <button className="btn-ghost flex items-center justify-center gap-2 py-2.5 border border-[var(--border)]">
                <svg width="16" height="16" viewBox="0 0 23 23"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="12" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="12" width="10" height="10" fill="#00A4EF"/><rect x="12" y="12" width="10" height="10" fill="#FFB900"/></svg>
                Microsoft
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-[var(--text-subtle)] mt-6">
            Protected by enterprise-grade security. Need help? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
