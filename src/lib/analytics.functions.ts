import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const schema = z.object({
  path: z.string().max(300),
  referrer: z.string().max(300).optional().default(""),
  session_id: z.string().max(64).optional().default(""),
  visitor_id: z.string().max(64).optional().default(""),
  device: z.string().max(32).optional().default("desktop"),
  browser: z.string().max(32).optional().default("Other"),
});

export const recordPageView = createServerFn({ method: "POST" })
  .validator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const country = getRequestHeader("cf-ipcountry") ?? getRequestHeader("x-vercel-ip-country") ?? null;
    const region = getRequestHeader("cf-region") ?? getRequestHeader("x-vercel-ip-country-region") ?? null;
    const city = getRequestHeader("cf-ipcity") ?? getRequestHeader("x-vercel-ip-city") ?? null;
    const ua = getRequestHeader("user-agent") ?? "";
    const detectedDevice = data.device || (/mobile|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop");

    const payload: any = {
      path: data.path.slice(0, 300),
      referrer: data.referrer ? data.referrer.slice(0, 300) : null,
      country,
      region,
      city,
      device: detectedDevice,
      browser: data.browser || "Other",
      session_id: data.session_id || null,
      visitor_id: data.visitor_id || null,
    };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    try {
      const { error } = await supabaseAdmin.from("page_views").insert(payload);
      if (error && (error.message?.includes("schema cache") || error.message?.includes("column"))) {
        // Fallback without new columns if schema cache not reloaded
        delete payload.browser;
        delete payload.visitor_id;
        await supabaseAdmin.from("page_views").insert(payload);
      }
    } catch (e) {
      delete payload.browser;
      delete payload.visitor_id;
      await supabaseAdmin.from("page_views").insert(payload);
    }

    return { ok: true };
  });
