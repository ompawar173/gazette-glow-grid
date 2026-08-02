import { Link } from "@tanstack/react-router";
import { StorageImage } from "./StorageImage";

export interface ArticleLite {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string | null;
  featured_image_url: string | null;
  author_name: string;
  published_at: string | null;
}

export function ArticleCard({ a, size = "md" }: { a: ArticleLite; size?: "sm" | "md" | "lg" }) {
  if (size === "sm") {
    return (
      <Link to="/article/$slug" params={{ slug: a.slug }} className="flex gap-3 py-3 border-b border-border group">
        {a.featured_image_url && (
          <StorageImage src={a.featured_image_url} alt={a.title} width={100} height={70} className="w-[100px] h-[70px] object-cover flex-shrink-0" />
        )}
        <div className="min-w-0">
          <div className="tag-chip">{a.category}</div>
          <div className="text-sm font-bold leading-snug headline-link group-hover:text-brand line-clamp-3">
            {a.title}
          </div>
        </div>
      </Link>
    );
  }
  if (size === "lg") {
    return (
      <Link to="/article/$slug" params={{ slug: a.slug }} className="block group">
        {a.featured_image_url && (
          <StorageImage src={a.featured_image_url} alt={a.title} width={1200} height={675} className="w-full aspect-[16/9] object-cover mb-3" />
        )}
        <div className="tag-chip">{a.category}</div>
        <h2 className="text-2xl md:text-3xl font-bold leading-tight headline-link group-hover:text-brand">
          {a.title}
        </h2>
        {a.excerpt && <p className="text-muted-foreground mt-2 line-clamp-3">{a.excerpt}</p>}
        <div className="text-xs text-muted-foreground mt-2">
          By {a.author_name} {a.published_at && `· ${new Date(a.published_at).toLocaleDateString()}`}
        </div>
      </Link>
    );
  }
  return (
    <Link to="/article/$slug" params={{ slug: a.slug }} className="block group">
      {a.featured_image_url && (
        <StorageImage src={a.featured_image_url} alt={a.title} width={800} height={475} className="w-full h-[190px] object-cover mb-2" />
      )}
      <div className="tag-chip">{a.category}</div>
      <h3 className="text-base font-bold leading-snug headline-link group-hover:text-brand line-clamp-3">
        {a.title}
      </h3>
      {a.excerpt && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.excerpt}</p>}
    </Link>
  );
}
