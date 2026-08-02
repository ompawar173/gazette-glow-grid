export const SITE_URL = "https://ciotime.lovable.app";
export const SITE_NAME = "CIO Times";
export const SITE_TAGLINE = "Business & Technology Journal for Enterprise Leaders";
export const PUBLISHER_LOGO = `${SITE_URL}/favicon.ico`;

const ALLOWED_BUCKETS = ["article-images", "magazine-covers", "magazine-pdfs"];

/** Parse a `storage://bucket/path` reference or a legacy Supabase storage URL. */
export function parseStorageRef(value: string | null | undefined): { bucket: string; path: string } | null {
  if (!value) return null;
  if (value.startsWith("storage://")) {
    const rest = value.slice("storage://".length);
    const i = rest.indexOf("/");
    if (i < 1) return null;
    return { bucket: rest.slice(0, i), path: rest.slice(i + 1) };
  }
  const m = value.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+?)(?:\?|$)/);
  if (m && m[1] && m[2]) return { bucket: m[1], path: decodeURIComponent(m[2]) };
  return null;
}

export function isAllowedBucket(bucket: string) {
  return ALLOWED_BUCKETS.includes(bucket);
}

/**
 * Stable, crawlable, permanently valid URL for a stored image.
 * Signed URLs expire, so they can never be used in og:image / sitemaps / RSS.
 */
export function imageUrl(value: string | null | undefined): string {
  if (!value) return "";
  const ref = parseStorageRef(value);
  if (!ref) return value; // already an external URL
  return `/api/public/img/${ref.bucket}/${ref.path.split("/").map(encodeURIComponent).join("/")}`;
}

export function absoluteUrl(path: string): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function absoluteImageUrl(value: string | null | undefined): string {
  const u = imageUrl(value);
  return u ? absoluteUrl(u) : "";
}

export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(text: string, max = 158): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

export function metaDescription(excerpt: string | null | undefined, body?: string | null): string {
  const base = (excerpt && excerpt.trim()) || stripHtml(body);
  return truncate(base || `${SITE_NAME} — ${SITE_TAGLINE}.`);
}

export function readingTimeMinutes(body: string | null | undefined): number {
  const words = stripHtml(body).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function keywordsFrom(...parts: (string | null | undefined)[]): string[] {
  return Array.from(
    new Set(
      parts
        .filter(Boolean)
        .flatMap((p) => String(p).split(/[,/&]/))
        .map((s) => s.trim())
        .filter((s) => s.length > 1),
    ),
  );
}

export function slugForCategory(name: string) {
  return name.toLowerCase().replace(/&/g, "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/* ------------------------------- JSON-LD -------------------------------- */

export const organizationSchema = {
  "@type": "NewsMediaOrganization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: PUBLISHER_LOGO },
  description: `${SITE_NAME} is a B2B publication covering AI, cloud, cybersecurity and IT leadership for enterprise executives.`,
  email: "editorial@ciotimes.com",
};

export const websiteSchema = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  description: `${SITE_NAME} — ${SITE_TAGLINE}`,
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en-US",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/articles?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function graph(...nodes: unknown[]) {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes.filter(Boolean) });
}

/* --------------------------- meta tag helpers ---------------------------- */

interface PageMetaInput {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string | null;
  modifiedTime?: string | null;
  section?: string | null;
  tags?: string[];
  noindex?: boolean;
}

export function pageMeta(input: PageMetaInput) {
  const url = absoluteUrl(input.path);
  const image = input.image ? absoluteImageUrl(input.image) : "";
  const meta: Record<string, string>[] = [
    { title: input.title },
    { name: "description", content: input.description },
    { name: "robots", content: input.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "en_US" },
    { property: "og:type", content: input.type ?? "website" },
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:url", content: url },
    { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: input.description },
  ];
  if (image) {
    meta.push({ property: "og:image", content: image });
    meta.push({ property: "og:image:alt", content: input.title });
    meta.push({ name: "twitter:image", content: image });
  }
  if (input.publishedTime) meta.push({ property: "article:published_time", content: input.publishedTime });
  if (input.modifiedTime) meta.push({ property: "article:modified_time", content: input.modifiedTime });
  if (input.section) meta.push({ property: "article:section", content: input.section });
  for (const tag of input.tags ?? []) meta.push({ property: "article:tag", content: tag });

  return { meta, links: [{ rel: "canonical", href: url }] };
}
