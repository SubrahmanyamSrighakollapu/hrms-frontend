import type { ReactNode } from "react";

export type BadgeTone = "brand" | "success" | "warning" | "danger" | "info" | "muted";

export function Badge({
  tone = "muted",
  children,
  title,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  title?: string;
}) {
  return (
    <span className={`badge badge-${tone}`} title={title}>
      {children}
    </span>
  );
}
