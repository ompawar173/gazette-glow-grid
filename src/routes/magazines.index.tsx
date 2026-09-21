import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  useEffect(() => {
    supabase.from("magazines").select("*").eq("status", "published").order("created_at", { ascending: false }).then(({ data }) => setMags(data ?? []));
  }, []);
  return (
    <SiteLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-3">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link to="/" className="hover:text-brand">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-navy">Magazine</li>
          </ol>
        </nav>

        <div className="divider-thick mb-3" />
        <h1 className="text-4xl font-bold text-navy">Digital Magazine</h1>
        <p className="text-muted-foreground mt-1 mb-8">Every issue of CIO Media World, available on-demand.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {mags.map((m) => (
            <Link key={m.id} to="/magazines/$id" params={{ id: m.id }} className="block group">
              {m.cover_image_url && (
                <StorageImage src={m.cover_image_url} alt={`${m.title} — ${m.issue_month ?? ""} ${m.issue_year ?? ""} issue cover`} width={600} height={800} className="w-full aspect-[3/4] object-cover border border-border group-hover:opacity-90" />
              )}
              <div className="tag-chip mt-2">{m.issue_month} {m.issue_year}</div>
              <div className="text-base font-bold headline-link group-hover:text-brand">{m.title}</div>
            </Link>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
