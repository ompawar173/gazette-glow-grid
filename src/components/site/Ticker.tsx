import { Link } from "@tanstack/react-router";
import { StorageImage } from "./StorageImage";

interface Item {
  slug: string;
  title: string;
  category: string;
  featured_image_url: string | null;
}

export function Ticker({ items }: { items: Item[] }) {
  if (!items.length) return null;
  const loop = [...items, ...items];

  return (
    <div className="border-y-2 border-navy bg-secondary/50">
      <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-3">
        <div className="bg-brand text-brand-foreground text-[10px] font-bold uppercase tracking-widest px-2 py-1 flex-shrink-0">
          Latest
        </div>
        <div className="ticker-viewport flex-1 overflow-hidden">
          <div className="ticker-track">
            {loop.map((it, i) => (
              <Link
                key={i}
                to="/article/$slug"
                params={{ slug: it.slug }}
                className="flex items-center gap-2 group w-[320px] flex-shrink-0 pr-6"
              >
                {it.featured_image_url && (
                  <StorageImage src={it.featured_image_url} alt={it.title} width={64} height={44} className="w-16 h-11 object-cover flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="tag-chip">{it.category}</div>
                  <div className="text-xs font-semibold leading-snug line-clamp-2 headline-link group-hover:text-brand">
                    {it.title}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
