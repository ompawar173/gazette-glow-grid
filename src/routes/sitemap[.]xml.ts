import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL, xmlEscape } from "@/lib/seo";

interface Entry {
  path: string;
  lastmod?: string | null;
  changefreq?: string;
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { publicDb } = await import("@/lib/public-db.server");
        const db = publicDb();

        const [{ data: articles }, { data: magazines }, { data: cats }] = await Promise.all([
          db.from("articles").select("slug,published_at,updated_at").eq("status", "published"),
          db.from("magazines").select("id,created_at").eq("status", "published"),
          db.from("categories").select("slug,parent_category"),
        ]);

        const entries: Entry[] = [
          { path: "/", changefreq: "hourly", priority: "1.0" },
          { path: "/articles", changefreq: "hourly", priority: "0.9" },
          { path: "/industry", changefreq: "weekly", priority: "0.8" },
          { path: "/magazines", changefreq: "weekly", priority: "0.8" },
          { path: "/about", changefreq: "yearly", priority: "0.5" },
          { path: "/contact", changefreq: "yearly", priority: "0.5" },
          { path: "/awards", changefreq: "monthly", priority: "0.5" },
          { path: "/newsletter", changefreq: "yearly", priority: "0.4" },
        ];

        const list = cats ?? [];
        for (const c of list.filter((c) => !c.parent_category)) {
          entries.push({ path: `/industry/${c.slug}`, changefreq: "daily", priority: "0.7" });
          for (const s of list.filter((x) => x.parent_category === c.slug)) {
            entries.push({ path: `/industry/${c.slug}/${s.slug}`, changefreq: "daily", priority: "0.6" });
          }
        }
        for (const a of articles ?? []) {
          entries.push({
            path: `/article/${a.slug}`,
            lastmod: a.updated_at ?? a.published_at,
            changefreq: "weekly",
            priority: "0.8",
          });
        }
        for (const m of magazines ?? []) {
          entries.push({
            path: `/magazines/${m.id}`,
            lastmod: m.created_at,
            changefreq: "monthly",
            priority: "0.6",
          });
        }

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...entries.map((e) =>
            [
              `  <url>`,
              `    <loc>${xmlEscape(`${SITE_URL}${e.path}`)}</loc>`,
              e.lastmod ? `    <lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : null,
              e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
              e.priority ? `    <priority>${e.priority}</priority>` : null,
              `  </url>`,
            ]
              .filter(Boolean)
              .join("\n"),
          ),
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
