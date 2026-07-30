import { Link } from "@tanstack/react-router";
import type { ArticleLite } from "./ArticleCard";
import { StorageImage } from "./StorageImage";

interface Magazine { id: string; title: string; cover_image_url: string | null; issue_month: string | null; issue_year: number | null; }

export function Sidebar({ trending, mostRead, magazines }: {
  trending: ArticleLite[];
  mostRead: ArticleLite[];
  magazines: Magazine[];
}) {
  return (
    <aside className="space-y-8">
      <div>
        <div className="divider-thick mb-2" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-navy mb-2">Trending Now</h3>
        <ol className="space-y-3">
          {trending.map((a, i) => (
            <li key={a.id} className="flex gap-3 pb-3 border-b border-border">
              <div className="text-3xl font-black text-brand leading-none">{i + 1}</div>
              <Link to="/article/$slug" params={{ slug: a.slug }} className="text-sm font-semibold leading-snug headline-link hover:text-brand line-clamp-3">
                {a.title}
              </Link>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <div className="divider-thick mb-2" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-navy mb-2">Most Read</h3>
        <div className="space-y-0">
          {mostRead.map((a) => (
            <Link key={a.id} to="/article/$slug" params={{ slug: a.slug }} className="flex gap-2 py-2 border-b border-border group">
              {a.featured_image_url && (
                <StorageImage src={a.featured_image_url} className="w-[70px] h-[50px] object-cover flex-shrink-0" />
              )}
              <div className="text-xs font-semibold leading-snug headline-link group-hover:text-brand line-clamp-3">
                {a.title}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {magazines.length > 0 && (
        <div>
          <div className="divider-thick mb-2" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-navy mb-2">Current Issues</h3>
          <div className="grid grid-cols-2 gap-2">
            {magazines.slice(0, 4).map((m) => (
              <Link key={m.id} to="/magazines/$id" params={{ id: m.id }} className="block group">
                {m.cover_image_url && (
                  <StorageImage src={m.cover_image_url} className="w-full aspect-[3/4] object-cover border border-border" />
                )}
                <div className="text-[10px] mt-1 font-semibold text-muted-foreground group-hover:text-brand">
                  {m.issue_month} {m.issue_year}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
