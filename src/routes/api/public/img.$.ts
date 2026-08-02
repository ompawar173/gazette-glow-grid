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
        const decoded = splat.split("/").map((s) => decodeURIComponent(s));
        const bucket = decoded.shift() ?? "";
        const path = decoded.join("/");

        if (!bucket || !path || !isAllowedBucket(bucket) || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
        if (error || !data) return new Response("Not found", { status: 404 });

        return new Response(await data.arrayBuffer(), {
          headers: {
            "Content-Type": data.type || "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
