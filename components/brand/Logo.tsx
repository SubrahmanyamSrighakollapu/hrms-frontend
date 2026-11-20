interface LogoProps {
  size?: number;
  showText?: boolean;
  variant?: "light" | "dark";
}

export function Logo({ size = 36, showText = true, variant = "dark" }: LogoProps) {
  const textColor = variant === "light" ? "#ffffff" : "#0b3a83";
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className="relative flex items-center justify-center rounded-xl shadow-md"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #1b4fbf 0%, #0b3a83 55%, #082550 100%)",
          boxShadow: "0 6px 18px -6px rgba(11,58,131,0.55)",
        }}
      >
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="white" strokeWidth="1.6" strokeLinejoin="round" opacity="0.9" />
          <path d="M12 7v10M7 9.5l10 5M17 9.5l-10 5" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.95" />
        </svg>
      </div>
      {showText && (
        <div className="leading-tight">
          <div style={{ color: textColor }} className="text-[1.05rem] font-bold tracking-tight">
            HRMS<span style={{ color: "#2563eb" }}>.</span>
          </div>
          <div style={{ color: variant === "light" ? "rgba(255,255,255,0.7)" : "#64748b" }} className="text-[0.62rem] font-medium uppercase tracking-[0.18em]">
            Workspace
          </div>
        </div>
      )}
    </div>
  );
}
