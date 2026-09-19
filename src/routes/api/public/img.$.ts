import { createFileRoute } from "@tanstack/react-router";
import { isAllowedBucket } from "@/lib/seo";

/**
 * Public, permanently-valid image endpoint.
 * Media lives in private buckets; signed URLs expire, which breaks og:image,
 * sitemaps and RSS. This route streams the object under a stable URL.
 * Read-only, whitelisted buckets, no user data.
 */
export const Route = createFileRoute("/api/public/img/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const splat = (params as { _splat?: string })._splat ?? "";
        const parts = splat.split("/").filter(Boolean).map((s) => decodeURIComponent(s));
        const bucket = parts.shift() ?? "";
        const path = parts.join("/");

        if (!bucket || !path || !isAllowedBucket(bucket) || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }

        let blob: Blob | null = null;
        let contentType: string | null = null;

        // Try admin client first if SUPABASE_SERVICE_ROLE_KEY is set
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
            if (!error && data) {
              blob = data;
              contentType = data.type;
            }
          } catch (e) {
            // ignore and fallback
          }
        }

        // Fallback to publicDb (works with public buckets using publishable key)
        if (!blob) {
          try {
            const { publicDb } = await import("@/lib/public-db.server");
            const { data, error } = await publicDb().storage.from(bucket).download(path);
            if (!error && data) {
              blob = data;
              contentType = data.type;
            }
          } catch (e) {
            // ignore and fallback
          }
        }

        // Fallback to direct public storage HTTP fetch if available
        if (!blob) {
          const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://zffpikiuavrwaszpxufl.supabase.co";
          if (supabaseUrl) {
            try {
              const directUrl = `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`;
              const res = await fetch(directUrl);
              if (res.ok) {
                blob = await res.blob();
                contentType = res.headers.get("content-type");
              }
            } catch (e) {
              // ignore
            }
          }
        }


        if (!blob) return new Response("Not found", { status: 404 });

        return new Response(await blob.arrayBuffer(), {
          headers: {
            "Content-Type": contentType || "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
