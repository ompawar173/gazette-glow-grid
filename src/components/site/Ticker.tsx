import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StorageImage } from "./StorageImage";

interface Item {
  slug: string;
  title: string;
  category: string;
  featured_image_url: string | null;
}

export function Ticker({ items }: { items: Item[] }) {
  const [idx, setIdx] = useState(0);
  const visible = 3;
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % Math.max(1, items.length)), 4500);
    return () => clearInterval(t);
  }, [items.length]);

  if (!items.length) return null;
  const slice = Array.from({ length: visible }).map((_, i) => items[(idx + i) % items.length]);

  return (
    <div className="border-y-2 border-navy bg-secondary/50">
      <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-3">
        <div className="bg-brand text-brand-foreground text-[10px] font-bold uppercase tracking-widest px-2 py-1">
          Latest
        </div>
        <button onClick={() => setIdx((i) => (i - 1 + items.length) % items.length)} className="text-muted-foreground hover:text-navy">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
          {slice.map((it, i) => (
            <Link
              key={i}
              to="/article/$slug"
              params={{ slug: it.slug }}
              className="flex items-center gap-2 group"
            >
              {it.featured_image_url && (
                <StorageImage src={it.featured_image_url} className="w-16 h-11 object-cover flex-shrink-0" />
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
        <button onClick={() => setIdx((i) => (i + 1) % items.length)} className="text-muted-foreground hover:text-navy">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
