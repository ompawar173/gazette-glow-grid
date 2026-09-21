import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const schema = z.object({
  path: z.string().max(300),
  referrer: z.string().max(300).optional().default(""),
  session_id: z.string().max(64).optional().default(""),
});

export const recordPageView = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const country = getRequestHeader("cf-ipcountry") ?? getRequestHeader("x-vercel-ip-country") ?? null;
    const region = getRequestHeader("cf-region") ?? getRequestHeader("x-vercel-ip-country-region") ?? null;
    const city = getRequestHeader("cf-ipcity") ?? getRequestHeader("x-vercel-ip-city") ?? null;
    const ua = getRequestHeader("user-agent") ?? "";
    const device = /mobile|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("page_views").insert({
      path: data.path.slice(0, 300),
      referrer: data.referrer ? data.referrer.slice(0, 300) : null,
      country,
      region,
      city,
      device,
      session_id: data.session_id || null,
    });
    return { ok: true };
  });
