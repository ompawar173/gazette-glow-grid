import { supabase } from "@/integrations/supabase/client";
import { recordPageView } from "./analytics.functions";

/**
 * Privacy-conscious Visitor & Session Identification
 */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let vid = localStorage.getItem("cmw_vid");
    if (!vid) {
      vid = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("cmw_vid", vid);
    }
    return vid;
  } catch {
    return "v_anon";
  }
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let sid = sessionStorage.getItem("cmw_sid");
    if (!sid) {
      sid = "s_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("cmw_sid", sid);
    }
    return sid;
  } catch {
    return "s_anon";
  }
}

export function detectDevice(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|windows phone/i.test(ua)) return "mobile";
  return "desktop";
}

export function detectBrowser(): string {
  if (typeof window === "undefined") return "Other";
  const ua = navigator.userAgent;
  if (/edg/i.test(ua)) return "Edge";
  if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) return "Safari";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/opera|opr/i.test(ua)) return "Opera";
  return "Other";
}

/**
 * Record a page view event across both direct Supabase client (anon RLS) and Server Function fallback.
 */
export async function trackPageView(path: string, referrer = "") {
  if (typeof window === "undefined") return;
  if (!path || path.startsWith("/admin")) return;

  const payload = {
    path: path.slice(0, 300),
    referrer: (referrer || document.referrer || "").slice(0, 300) || null,
    device: detectDevice(),
    browser: detectBrowser(),
    session_id: getSessionId(),
    visitor_id: getVisitorId(),
  };

  // Primary: Direct Supabase client insert (using publishable key & anon RLS policy pv_public_insert)
  try {
    const { error } = await supabase.from("page_views").insert(payload as any);
    if (!error) return;
    console.warn("[Analytics] Direct client insert warning:", error.message);
  } catch (err) {
    console.warn("[Analytics] Direct client insert error:", err);
  }

  // Fallback: TanStack Start Server Function
  try {
    await recordPageView({
      data: {
        path: payload.path,
        referrer: payload.referrer || "",
        session_id: payload.session_id,
        visitor_id: payload.visitor_id,
        device: payload.device,
        browser: payload.browser,
      },
    });
  } catch (err) {
    console.warn("[Analytics] Server function fallback notice:", err);
  }
}
