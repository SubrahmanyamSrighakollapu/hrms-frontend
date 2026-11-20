"use client";

import { useEffect, useState } from "react";
import { loadAuthedBlobUrl } from "@/lib/chat";

/**
 * Renders an image that lives behind the authenticated chat API.
 *
 * A plain `<img src>` cannot reach these files (no Bearer token), so the blob
 * is fetched once and cached as an object URL.
 */
export function AuthedImage({
  path,
  alt,
  className,
  onClick,
}: {
  path: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}) {
  // Keyed by path so switching to a new image never shows the previous one.
  const [loaded, setLoaded] = useState<{ path: string; url: string } | null>(null);

  useEffect(() => {
    let active = true;
    loadAuthedBlobUrl(path)
      .then((url) => {
        if (active) setLoaded({ path, url });
      })
      .catch(() => {
        if (active) setLoaded(null);
      });
    return () => {
      active = false;
    };
  }, [path]);

  const src = loaded?.path === path ? loaded.url : null;

  if (!src) {
    return <span className={className} aria-hidden style={{ background: "var(--surface-2)" }} />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onClick={onClick} />;
}
