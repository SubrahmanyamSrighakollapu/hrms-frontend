"use client";

import { AuthedImage } from "./AuthedImage";
import { initials } from "@/lib/chat";

/** Gradient-tinted initials avatar with an optional presence dot. */
export function Avatar({
  name,
  avatarUrl,
  size = 40,
  online,
  showPresence = false,
  group = false,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  online?: boolean;
  showPresence?: boolean;
  group?: boolean;
}) {
  const fontSize = Math.max(10, Math.round(size * 0.34));

  return (
    <span className="relative inline-flex flex-shrink-0" style={{ width: size, height: size }}>
      {avatarUrl ? (
        <AuthedImage
          path={avatarUrl}
          alt={name}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center rounded-full font-bold text-white"
          style={{
            fontSize,
            background: group
              ? "linear-gradient(135deg, var(--slate-500), var(--slate-700))"
              : "linear-gradient(135deg, var(--brand-500), var(--brand-700))",
          }}
        >
          {group ? "G" : initials(name)}
        </span>
      )}

      {showPresence && (
        <span
          className="absolute bottom-0 right-0 rounded-full ring-2 ring-[var(--surface)]"
          style={{
            width: Math.max(8, Math.round(size * 0.28)),
            height: Math.max(8, Math.round(size * 0.28)),
            background: online ? "var(--success)" : "var(--slate-300)",
          }}
          title={online ? "Online" : "Offline"}
        />
      )}
    </span>
  );
}
