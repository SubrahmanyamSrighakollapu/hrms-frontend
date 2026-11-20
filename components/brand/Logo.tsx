interface LogoProps {
  size?: number;
  showText?: boolean;
  variant?: "light" | "dark";
}

/**
 * HRMS brand mark — a clean "H" monogram on a rounded tile.
 * Simple, geometric, unmistakably ours.
 */
export function Logo({ size = 36, showText = true, variant = "dark" }: LogoProps) {
  const dark = variant === "dark";
  return (
    <div className="flex items-center gap-2.5 select-none">
      <span
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.3,
          background: dark
            ? "linear-gradient(150deg, #2563eb 0%, #0b3a83 100%)"
            : "linear-gradient(150deg, #ffffff 0%, #dbe8fe 100%)",
        }}
      >
        <span
          className="font-extrabold"
          style={{
            fontSize: size * 0.52,
            lineHeight: 1,
            color: dark ? "#ffffff" : "#0b3a83",
            letterSpacing: "-0.02em",
          }}
        >
          H
        </span>
      </span>

      {showText && (
        <span className="leading-tight">
          <span
            className="block text-[1rem] font-bold tracking-tight"
            style={{ color: dark ? "var(--text)" : "#ffffff" }}
          >
            HRMS
            <span style={{ color: dark ? "var(--brand-600)" : "#93b4fd" }}>.</span>
          </span>
          <span
            className="block text-[0.56rem] font-semibold uppercase tracking-[0.2em]"
            style={{ color: dark ? "var(--text-subtle)" : "rgba(255,255,255,0.55)" }}
          >
            Workspace
          </span>
        </span>
      )}
    </div>
  );
}
