import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { StorageImage } from "@/components/site/StorageImage";
import { SITE_NAME, pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/magazines/")({
  head: () =>
    pageMeta({
      title: `Digital Magazine Issues | ${SITE_NAME}`,
      description: `Browse all published digital magazine issues from ${SITE_NAME}. Executive interviews, technology leadership analysis, and special reports.`,
      path: "/magazines",
    }),
  component: MagazinesList,
});

function MagazinesList() {
  const [mags, setMags] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("magazines")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMags(data ?? []);
        setLoading(false);
      });
  }, []);

  // Extract all valid cover images from real published magazines
  const realCovers = useMemo(() => {
    return mags
      .map((m) => m.cover_image_url)
      .filter((url): url is string => typeof url === "string" && url.trim().length > 0);
  }, [mags]);

  // Repeat cover list so marquee spans full width seamlessly
  const marqueeCovers = useMemo(() => {
    if (realCovers.length === 0) return [];
    let list: string[] = [];
    while (list.length < 12) {
      list = [...list, ...realCovers];
    }
    return list;
  }, [realCovers]);

  // Extract unique available years for filtering
  const availableYears = useMemo(() => {
    const years = mags
      .map((m) => m.issue_year)
      .filter((y): y is number => typeof y === "number" && !isNaN(y));
    const unique = Array.from(new Set(years)).sort((a, b) => b - a);
    return unique;
  }, [mags]);

  // Filter magazines by selected year
  const filteredMags = useMemo(() => {
    if (selectedYear === "all") return mags;
    return mags.filter((m) => String(m.issue_year) === selectedYear);
  }, [mags, selectedYear]);

  return (
    <SiteLayout>
      {/* Inline styles for smooth cover marquee animation & accessibility */}
      <style>{`
        @keyframes magazineMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .magazine-marquee-track {
          display: flex;
          width: max-content;
          animation: magazineMarquee 45s linear infinite;
        }
        .magazine-marquee-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .magazine-marquee-track {
            animation: none !important;
          }
        }
      `}</style>

      {/* DYNAMIC MAGAZINE HERO SECTION */}
      <section className="bg-[#071A2F] text-white relative overflow-hidden border-b border-navy-light/30">
        {/* Dynamic Cover Collage Background */}
        {marqueeCovers.length > 0 ? (
          <div
            className="absolute inset-0 flex items-center overflow-hidden opacity-35 pointer-events-none select-none"
            aria-hidden="true"
          >
            <div className="magazine-marquee-track flex gap-4 sm:gap-6 md:gap-8 items-center pl-4">
              {marqueeCovers.map((coverUrl, idx) => (
                <div
                  key={`${coverUrl}-${idx}`}
                  className="flex-shrink-0 w-28 sm:w-36 md:w-48 lg:w-56 aspect-[3/4] relative rounded shadow-2xl border border-white/20 transform -rotate-3 hover:rotate-0 transition-transform duration-300"
                >
                  <StorageImage
                    src={coverUrl}
                    alt=""
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Subtle Gradient fallback if no covers exist */
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#071A2F] via-[#0A2342] to-[#071A2F] opacity-90"
            aria-hidden="true"
          />
        )}

        {/* Hero Dark Navy Gradient Overlays for optimal readability */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#071A2F] via-[#071A2F]/85 to-[#071A2F]/60"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#071A2F] via-transparent to-[#071A2F]"
          aria-hidden="true"
        />

        {/* Hero Content Overlay */}
        <div className="relative z-10 max-w-[1200px] mx-auto px-4 py-12 sm:py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/20 border border-brand/40 text-cyan text-xs font-bold uppercase tracking-widest rounded-full mb-4">
              <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
              <span>CIO Media World Digital Editions</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tight uppercase font-heading">
              MAGAZINES
            </h1>

            <p className="mt-4 text-base sm:text-lg md:text-xl text-slate-200 font-normal leading-relaxed">
              Where Technology, Leadership and Innovation Meet.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
              <span className="bg-white/10 px-3 py-1.5 rounded border border-white/15">
                {mags.length} {mags.length === 1 ? "Executive Issue" : "Executive Issues"} Published
              </span>
              <span className="hidden sm:inline">•</span>
              <span>Available On-Demand in Flipbook & PDF</span>
            </div>
          </div>
        </div>
      </section>

      {/* MAGAZINE LISTINGS & FILTERS */}
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-6">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link to="/" className="hover:text-brand">
                Home
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-navy font-semibold">
              Magazine
            </li>
          </ol>
        </nav>

        {/* Year Filter Controls */}
        {availableYears.length > 0 && (
          <div className="flex items-center justify-between border-b border-border pb-4 mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-navy mr-2">Filter by Year:</span>
              <button
                type="button"
                onClick={() => setSelectedYear("all")}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors border ${
                  selectedYear === "all"
                    ? "bg-navy text-white border-navy"
                    : "bg-background text-muted-foreground border-border hover:border-navy"
                }`}
              >
                All Issues ({mags.length})
              </button>
              {availableYears.map((yr) => {
                const count = mags.filter((m) => m.issue_year === yr).length;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedYear(String(yr))}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors border ${
                      selectedYear === String(yr)
                        ? "bg-navy text-white border-navy"
                        : "bg-background text-muted-foreground border-border hover:border-navy"
                    }`}
                  >
                    {yr} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Magazine Grid */}
        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            Loading digital editions...
          </div>
        ) : filteredMags.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMags.map((m) => (
              <Link
                key={m.id}
                to="/magazines/$id"
                params={{ id: m.id }}
                className="block group border border-border bg-background hover:shadow-lg transition-all duration-300"
              >
                <div className="overflow-hidden aspect-[3/4] bg-slate-100 relative">
                  {m.cover_image_url ? (
                    <StorageImage
                      src={m.cover_image_url}
                      alt={`${m.title} — ${m.issue_month ?? ""} ${m.issue_year ?? ""} issue cover`}
                      width={600}
                      height={800}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-navy text-white/60 p-4 text-center text-xs font-semibold">
                      {m.title}
                    </div>
                  )}
                  {m.heyzine_url && (
                    <span className="absolute top-2 right-2 bg-brand text-brand-foreground text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow">
                      Interactive Flipbook
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="tag-chip">
                    {m.issue_month} {m.issue_year}
                  </div>
                  <h2 className="text-base font-bold text-navy group-hover:text-brand line-clamp-2 leading-snug">
                    {m.title}
                  </h2>
                  <div className="text-xs text-brand font-semibold flex items-center gap-1 pt-1">
                    <span>Read Edition</span>
                    <span aria-hidden="true">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center border border-dashed border-border rounded">
            <h3 className="text-lg font-bold text-navy">No magazine issues found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedYear !== "all"
                ? `No published issues match the year ${selectedYear}.`
                : "Check back soon for new digital editions."}
            </p>
            {selectedYear !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedYear("all")}
                className="mt-4 inline-block bg-navy text-white text-xs font-bold uppercase px-4 py-2"
              >
                Show All Issues
              </button>
            )}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

