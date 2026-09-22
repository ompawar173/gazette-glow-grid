import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { trackPageView } from "@/lib/analytics";

export function PageViewTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pathname || pathname.startsWith("/admin")) return;

    // Deduplicate immediate rapid duplicate fires for the same route
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    trackPageView(pathname, document.referrer);
  }, [pathname]);

  return null;
}
