import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { recordPageView } from "@/lib/analytics.functions";

function sessionId() {
  try {
    let id = sessionStorage.getItem("ct_sid");
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("ct_sid", id);
    }
    return id;
  } catch {
    return "";
  }
}

export function PageViewTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname.startsWith("/admin")) return;
    recordPageView({
      data: { path: pathname, referrer: document.referrer ?? "", session_id: sessionId() },
    }).catch(() => {});
  }, [pathname]);

  return null;
}
