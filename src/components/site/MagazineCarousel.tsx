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
    <section className="bg-secondary/60 border-y border-border py-10 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="h-[2px] w-10 bg-brand" />
          <h2 className="text-2xl font-bold uppercase tracking-wide text-navy text-center">Digital Magazine Issues</h2>
          <span className="h-[2px] w-10 bg-brand" />
        </div>

        <div className="relative h-[430px] md:h-[520px]">
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
                    alt={m.title}
                    className="w-[240px] md:w-[300px] aspect-[3/4] object-cover border border-border shadow-[0_18px_40px_-18px_rgba(10,42,102,0.6)] bg-card"
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

          <button
            aria-label="Previous issue"
            onClick={() => setIndex((i) => (i - 1 + n) % n)}
            className="absolute left-2 md:left-1/2 md:-translate-x-[290px] top-[45%] z-20 border-2 border-brand bg-background/90 text-brand p-2 hover:bg-brand hover:text-brand-foreground transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            aria-label="Next issue"
            onClick={() => setIndex((i) => (i + 1) % n)}
            className="absolute right-2 md:left-1/2 md:translate-x-[250px] top-[45%] z-20 border-2 border-brand bg-background/90 text-brand p-2 hover:bg-brand hover:text-brand-foreground transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {items.map((m, i) => (
            <button
              key={m.id}
              aria-label={`Show ${m.title}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 transition-all ${i === index ? "w-8 bg-brand" : "w-3 bg-border"}`}
            />
          ))}
        </div>

        <div className="text-center mt-6">
          <Link
            to="/magazines/$id"
            params={{ id: active.id }}
            className="inline-block bg-navy text-navy-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-brand"
          >
            Read this issue
          </Link>
        </div>
      </div>
    </section>
  );
}
