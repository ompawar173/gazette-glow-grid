import { createFileRoute } from "@tanstack/react-router";
import { SITE_NAME, SITE_TAGLINE, SITE_URL, absoluteImageUrl, metaDescription, xmlEscape } from "@/lib/seo";

export const Route = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { publicDb } = await import("@/lib/public-db.server");
        const { data } = await publicDb()
          .from("articles")
          .select("slug,title,excerpt,body,category,author_name,published_at,featured_image_url")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(50);

        const items = (data ?? []).map((a) => {
          const url = `${SITE_URL}/article/${a.slug}`;
          const img = absoluteImageUrl(a.featured_image_url);
          return [
            `    <item>`,
            `      <title>${xmlEscape(a.title)}</title>`,
            `      <link>${xmlEscape(url)}</link>`,
            `      <guid isPermaLink="true">${xmlEscape(url)}</guid>`,
            `      <description>${xmlEscape(metaDescription(a.excerpt, a.body))}</description>`,
            `      <category>${xmlEscape(a.category)}</category>`,
            `      <dc:creator>${xmlEscape(a.author_name)}</dc:creator>`,
            a.published_at ? `      <pubDate>${new Date(a.published_at).toUTCString()}</pubDate>` : null,
            img ? `      <enclosure url="${xmlEscape(img)}" type="image/jpeg" />` : null,
            `    </item>`,
          ]
            .filter(Boolean)
            .join("\n");
        });

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">`,
          `  <channel>`,
          `    <title>${xmlEscape(SITE_NAME)}</title>`,
          `    <link>${SITE_URL}</link>`,
          `    <description>${xmlEscape(SITE_TAGLINE)}</description>`,
          `    <language>en-us</language>`,
          `    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />`,
          ...items,
          `  </channel>`,
          `</rss>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=1800" },
        });
      },
    },
  },
});
