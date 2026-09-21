import { createFileRoute } from "@tanstack/react-router";
import { SITE_NAME, SITE_URL, xmlEscape } from "@/lib/seo";

/** Google News sitemap: published articles from the last 48 hours. */
export const Route = createFileRoute("/news-sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { publicDb } = await import("@/lib/public-db.server");
        const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
        const { data } = await publicDb()
          .from("articles")
          .select("slug,title,published_at,category")
          .eq("status", "published")
          .gte("published_at", since)
          .order("published_at", { ascending: false })
          .limit(1000);

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`,
          ...(data ?? []).map((a) =>
            [
              `  <url>`,
              `    <loc>${xmlEscape(`${SITE_URL}/article/${a.slug}`)}</loc>`,
              `    <news:news>`,
              `      <news:publication>`,
              `        <news:name>${xmlEscape(SITE_NAME)}</news:name>`,
              `        <news:language>en</news:language>`,
              `      </news:publication>`,
              `      <news:publication_date>${new Date(a.published_at ?? Date.now()).toISOString()}</news:publication_date>`,
              `      <news:title>${xmlEscape(a.title)}</news:title>`,
              `    </news:news>`,
              `  </url>`,
            ].join("\n"),
          ),
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=600" },
        });
      },
    },
  },
});
