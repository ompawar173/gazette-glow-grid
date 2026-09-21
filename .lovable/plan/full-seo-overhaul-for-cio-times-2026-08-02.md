# Full SEO Overhaul for CIO Times

Goal: make every page crawlable, richly described, and eligible for rich results on Google, Bing, and AI search engines — without changing the visual design.

## The core problem to fix first

Article, industry, magazine and category pages currently fetch their content in the browser after the page loads. That means crawlers and social/AI bots receive an empty shell with generic titles — no headline, no description, no image. Fixing this is the single biggest SEO win.

Each of these pages will be converted to fetch its data on the server (route loader) so the real title, description, image and body are in the HTML that crawlers see. Rendering and design stay exactly the same.

## What gets built

### 1. Server-rendered metadata per page
- Article pages: title, meta description (from excerpt), canonical, Open Graph, Twitter, article publish/modified time, section, tags.
- Magazine issue pages, industry pages, sub-industry pages, category pages: same treatment, derived from real data.
- Static pages (home, about, contact, articles, industry hub, magazines, awards, newsletter) get unique titles/descriptions and canonicals.
- Sitewide defaults in the root: theme color, apple touch icon, favicon set, verification tag placeholders for Google Search Console and Bing, plus preconnect/DNS-prefetch hints.
- Admin pages get `noindex`.

### 2. Structured data (JSON-LD)
- Sitewide: Organization (with publisher logo) and WebSite with SearchAction.
- Article pages: NewsArticle with headline, description, author (Person), publisher, datePublished, dateModified, image, mainEntityOfPage, keywords, articleSection — plus BreadcrumbList.
- Industry/category pages: CollectionPage + BreadcrumbList.
- Magazine pages: CreativeWork + BreadcrumbList.
- Contact/About: WebPage; FAQPage on any page where FAQ content exists.

### 3. Crawl files
- `/sitemap.xml` — generated dynamically from routes plus every published article, magazine and industry, with image entries where a public image URL exists.
- `/news-sitemap.xml` — Google News format, articles from the last 48 hours.
- `/rss.xml` — full news feed, linked from the head.
- `robots.txt` updated: disallow `/admin`, add Sitemap directives.

### 4. Article page enhancements (design-preserving)
- Visible breadcrumb trail (Home › Industry › Article).
- Reading time and "Last updated" line next to the existing byline.
- Author line marked up as a Person entity.
- Tags/category links rendered as internal links.
- Existing related-articles block kept and marked up.
- Heading hierarchy audit: one H1 per page, article body headings normalized to H2/H3.

### 5. Footer and header SEO
- Footer gains Privacy Policy, Terms & Conditions, Editorial Policy, Disclaimer and Sitemap links, styled with the existing footer link pattern.
- Four new static pages created for those policies (Privacy, Terms, Editorial Policy, Disclaimer), each with its own metadata.
- Header logo gets accessible text/ALT, search form gets proper labels and ARIA.

### 6. Images
- All images get width/height attributes and `loading="lazy"` + `decoding="async"`; the homepage hero image gets `fetchpriority="high"` and is preloaded — this fixes layout shift (CLS) and speeds up LCP.
- Descriptive ALT text derived from the article/magazine title everywhere it's currently empty.

### 7. Accessibility and semantics
- Replace generic containers with `header`, `nav`, `main`, `article`, `section`, `aside`, `footer` where they're missing.
- ARIA labels on nav, carousel controls, search, and forms; visible focus states for keyboard navigation.

### 8. Performance
- Route-level code splitting is already on; the Quill editor and admin bundle are kept out of the public bundle.
- Font loading optimized with preconnect and `font-display: swap`.
- Long-lived cache headers on generated XML/RSS responses.
- Build already minifies CSS/JS and tree-shakes; hosting handles Brotli/gzip and HTTPS.

## Known limitations (worth flagging)

- **Uploaded images are in a private bucket** and are served through short-lived signed links. Signed links expire, so they can't be used for `og:image`, sitemap images, or RSS enclosures — social and AI previews for articles would break within hours. Recommended fix: serve article/magazine images through a small public image route so every image has a permanent, crawlable URL. This is included in the plan.
- **AMP** is not supported by this stack and is deprecated by Google; skipping it.
- **hreflang** is skipped — the site is single-language.
- Search Console / GA4 / GTM tags are added as clearly-marked placeholders; you supply the IDs and I'll wire them in.

## Technical notes

- Metadata uses TanStack Router's per-route `head()`; canonical only on leaf routes, `og:image` only on leaf routes.
- Data-dependent metadata comes from route `loader` data via public server functions reading published rows through a read-only client (public routes must not use authenticated server functions).
- `sitemap.xml`, `news-sitemap.xml` and `rss.xml` are TanStack server routes returning XML with cache headers.
- A public image route resolves stored image references to stable URLs for crawler-visible tags.
- Base URL: `https://ciotime.lovable.app`.
