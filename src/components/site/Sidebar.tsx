import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { ArticleLite } from "./ArticleCard";
import { StorageImage } from "./StorageImage";

function useRotation(length: number, size: number, delay = 3500) {
  const [offset, setOffset] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    if (length <= size) return;
    const t = setInterval(() => {
      if (!pausedRef.current) setOffset((o) => (o + 1) % length);
    }, delay);
    return () => clearInterval(t);
  }, [length, size, delay]);

  const window_ = (items: any[]) =>
    Array.from({ length: Math.min(size, items.length) }, (_, i) => items[(offset + i) % items.length]);

  return { window_, setPaused };
}

export function Sidebar({ trending, mostRead }: {
  trending: ArticleLite[];
  mostRead: ArticleLite[];
  magazines?: unknown;
}) {
  const t = useRotation(trending.length, 5);
  const m = useRotation(mostRead.length, 5, 4200);

  return (
    <aside className="space-y-8">
      <div onMouseEnter={() => t.setPaused(true)} onMouseLeave={() => t.setPaused(false)}>
        <div className="divider-thick mb-2" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-navy mb-2">Trending Now</h3>
        <ol className="space-y-3">
          {t.window_(trending).map((a: ArticleLite, i: number) => (
            <li key={`${a.id}-${i}`} className="flex gap-3 pb-3 border-b border-border animate-fade-slide">
              <div className="text-3xl font-black text-brand leading-none">{i + 1}</div>
              <Link to="/article/$slug" params={{ slug: a.slug }} className="text-sm font-semibold leading-snug headline-link hover:text-brand line-clamp-3">
                {a.title}
              </Link>
            </li>
          ))}
        </ol>
      </div>

      <div onMouseEnter={() => m.setPaused(true)} onMouseLeave={() => m.setPaused(false)}>
        <div className="divider-thick mb-2" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-navy mb-2">Most Read</h3>
        <div className="space-y-0">
          {m.window_(mostRead).map((a: ArticleLite, i: number) => (
            <Link key={`${a.id}-${i}`} to="/article/$slug" params={{ slug: a.slug }} className="flex gap-2 py-2 border-b border-border group animate-fade-slide">
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
    </aside>
  );
}
