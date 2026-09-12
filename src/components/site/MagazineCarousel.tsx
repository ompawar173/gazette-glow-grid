import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StorageImage } from "./StorageImage";

export interface MagazineLite {
  id: string;
  title: string;
  cover_image_url: string | null;
  issue_month: string | null;
  issue_year: number | null;
}

export function MagazineCarousel({ items }: { items: MagazineLite[] }) {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(260);
  const n = items.length;

  useEffect(() => {
    const onResize = () => setStep(window.innerWidth < 768 ? 150 : 260);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n]);

  if (n === 0) return null;

  const offsetOf = (i: number) => {
    let d = i - index;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };

  const active = items[index];

  return (
    <section className="bg-secondary border-y border-border py-10 md:py-14 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-end justify-between gap-6 mb-8 border-b border-border pb-4">
          <div>
            <div className="tag-chip">Current edition</div>
            <h2 className="text-2xl md:text-3xl font-black uppercase text-navy">Digital Magazine Issues</h2>
          </div>
          <Link to="/magazines" className="hidden sm:inline-flex border border-navy px-4 py-2 text-xs font-bold uppercase tracking-wider text-navy hover:bg-navy hover:text-navy-foreground transition-colors">
            Read all magazines
          </Link>
        </div>

        <div className="relative h-[390px] md:h-[500px]">
          {items.map((m, i) => {
            const d = offsetOf(i);
            if (Math.abs(d) > 2) return null;
            const isActive = d === 0;
            const scale = isActive ? 1 : Math.abs(d) === 1 ? 0.72 : 0.55;
            const translate = d * step;
            return (
              <div
                key={m.id}
                className="absolute left-1/2 top-0 transition-all duration-500 ease-out"
                style={{
                  transform: `translateX(calc(-50% + ${translate}px)) scale(${scale})`,
                  zIndex: 10 - Math.abs(d),
                  opacity: isActive ? 1 : 0.55,
                  filter: isActive ? "none" : "grayscale(20%)",
                }}
              >
                <Link to="/magazines/$id" params={{ id: m.id }} className="block group">
                  <StorageImage
                    src={m.cover_image_url}
                    alt={`${m.title} — ${m.issue_month ?? ""} ${m.issue_year ?? ""} issue cover`}
                    width={600}
                    height={800}
                    priority={isActive}
                    className="w-[220px] md:w-[290px] aspect-[3/4] object-cover border border-border shadow-xl bg-card"
                  />
                  {isActive && (
                    <div className="mt-4 text-center max-w-[320px] mx-auto">
                      <div className="tag-chip">{m.issue_month} {m.issue_year}</div>
                      <div className="text-lg font-bold leading-snug text-navy group-hover:text-brand">{m.title}</div>
                    </div>
                  )}
                </Link>
              </div>
            );
          })}

        </div>

        <div className="flex justify-center items-center gap-3 mt-5">
          <button aria-label="Previous issue" onClick={() => setIndex((i) => (i - 1 + n) % n)} className="size-10 shrink-0 inline-flex items-center justify-center rounded-full border border-border bg-background text-navy hover:border-brand hover:text-brand transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="flex justify-center gap-2 px-2">
            {items.map((m, i) => (
              <button key={m.id} aria-label={`Show ${m.title}`} onClick={() => setIndex(i)} className={`size-2 rounded-full transition-colors ${i === index ? "bg-brand" : "bg-border"}`} />
            ))}
          </div>
          <button aria-label="Next issue" onClick={() => setIndex((i) => (i + 1) % n)} className="size-10 shrink-0 inline-flex items-center justify-center rounded-full border border-navy bg-navy text-navy-foreground hover:bg-brand hover:border-brand transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="text-center mt-5">
          <Link
            to="/magazines/$id"
            params={{ id: active.id }}
            className="inline-block bg-navy text-navy-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-brand transition-colors"
          >
            Read this issue
          </Link>
        </div>
      </div>
    </section>
  );
}
