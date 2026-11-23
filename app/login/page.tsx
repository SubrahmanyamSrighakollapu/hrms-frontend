"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth-context";

const FEATURES = [
  { icon: "CalendarDays", t: "Time off", s: "Leaves, permissions & approvals" },
  { icon: "Wallet", t: "Payroll", s: "Payslips, anytime" },
  { icon: "MessageSquare", t: "Team chat", s: "Stay connected" },
  { icon: "Building2", t: "Organization", s: "Departments & reporting lines" },
];

/**
 * Dev-only quick-login presets. Clicking a role fills the email + password
 * fields; the user still clicks "Sign in" to submit. This makes local testing
 * fast without auto-submitting (which would hide validation/feedback).
 */
const QUICK_LOGINS = [
  { label: "Admin", email: "admin@hrms.local", password: "Admin@123" },
  { label: "HR", email: "hr@hrms.local", password: "Hr@12345" },
  { label: "Employee", email: "employee@hrms.local", password: "Employee@123" },
];

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeQuick, setActiveQuick] = useState<string | null>(null);

  const fillQuick = (preset: (typeof QUICK_LOGINS)[number]) => {
    setEmail(preset.email);
    setPassword(preset.password);
    setActiveQuick(preset.label);
    setError(null);
  };

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
            One workspace for employee records, time off, payroll and team communication.
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
          <div className="ml-auto text-xs text-white/35">HRMS</div>
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

            {/* Quick-login role tabs (dev convenience) */}
            <div className="mb-5">
              <div className="text-[0.72rem] font-medium uppercase tracking-wide text-[var(--text-subtle)] mb-2">
                Quick login
              </div>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_LOGINS.map((p) => {
                  const active = activeQuick === p.label;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => fillQuick(p)}
                      className={
                        "h-9 rounded-lg text-[0.8rem] font-medium border transition-colors " +
                        (active
                          ? "bg-[var(--brand-600)] text-white border-[var(--brand-600)]"
                          : "bg-[var(--surface-2)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface)]")
                      }
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
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
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--text-muted)]"
                  >
                    <Icon name={showPwd ? "EyeOff" : "Eye"} size={17} />
                  </button>
                </div>
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

          </div>

          <p className="text-center text-xs text-[var(--text-subtle)] mt-6">
            Need help? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
