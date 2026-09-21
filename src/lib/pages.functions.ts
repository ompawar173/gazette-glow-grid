import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface SitePage {
  slug: string;
  title: string;
  content: string;
  hero_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

/** Known page slugs that map to a built-in route (fallback copy is used when unset). */
export const MANAGED_PAGES = [
  { slug: "about", label: "About Us", path: "/about" },
  { slug: "awards", label: "Awards", path: "/awards" },
  { slug: "newsletter", label: "Newsletter", path: "/newsletter" },
  { slug: "industry", label: "Industry hub intro", path: "/industry" },
  { slug: "contact", label: "Contact intro", path: "/contact" },
] as const;

export const getSitePage = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { publicDb } = await import("./public-db.server");
    const { data: page } = await publicDb()
      .from("pages")
      .select("slug,title,content,hero_image_url,seo_title,seo_description")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    return { page: (page ?? null) as SitePage | null };
  });
