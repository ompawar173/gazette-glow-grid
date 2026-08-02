import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ARTICLE_LIST_COLS =
  "id,slug,title,category,subcategory,excerpt,featured_image_url,author_name,published_at";

export const getArticlePage = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { publicDb } = await import("./public-db.server");
    const db = publicDb();
    const { data: article } = await db
      .from("articles")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (!article) return { article: null, related: [], subs: [] as { name: string; slug: string }[] };

    const [{ data: related }, { data: cats }] = await Promise.all([
      db
        .from("articles")
        .select(ARTICLE_LIST_COLS)
        .eq("status", "published")
        .eq("category", article.category)
        .neq("id", article.id)
        .order("published_at", { ascending: false })
        .limit(4),
      db.from("categories").select("name,slug,parent_category"),
    ]);

    const catRow = (cats ?? []).find((c) => c.name === article.category && !c.parent_category)
      ?? (cats ?? []).find((c) => c.name === article.category);
    const subRow = article.subcategory
      ? (cats ?? []).find((c) => c.name === article.subcategory)
      : undefined;

    return {
      article,
      related: related ?? [],
      categorySlug: catRow?.slug ?? null,
      subSlug: subRow?.slug ?? null,
    };
  });

export const getMagazinePage = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().max(64) }).parse(d))
  .handler(async ({ data }) => {
    const { publicDb } = await import("./public-db.server");
    const db = publicDb();
    const { data: magazine } = await db
      .from("magazines")
      .select("*")
      .eq("id", data.id)
      .eq("status", "published")
      .maybeSingle();
    return { magazine };
  });

export const getIndustryPage = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().max(120), sub: z.string().max(120).optional() }).parse(d))
  .handler(async ({ data }) => {
    const { publicDb } = await import("./public-db.server");
    const db = publicDb();
    const { data: cats } = await db.from("categories").select("name,slug,parent_category").order("name");
    const list = cats ?? [];
    const parent = list.find((c) => c.slug === data.slug) ?? null;
    const child = data.sub ? (list.find((c) => c.slug === data.sub) ?? null) : null;
    const subs = list.filter((c) => c.parent_category === data.slug);

    type Row = { id: string; slug: string; title: string; category: string; subcategory: string | null; excerpt: string | null; featured_image_url: string | null; author_name: string; published_at: string | null };
    let articles: Row[] = [];
    if (parent) {
      const q = db
        .from("articles")
        .select(ARTICLE_LIST_COLS)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(30);
      const { data: rows } = child
        ? await q.eq("subcategory", child.name)
        : await q.eq("category", parent.name);
      articles = (rows ?? []) as Row[];
    }
    return { parent, child, subs, articles };
  });
