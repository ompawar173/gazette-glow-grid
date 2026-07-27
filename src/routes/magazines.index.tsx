import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/magazines/")({
  head: () => ({
    meta: [
      { title: "Digital Magazine Issues — CIO Times" },
      { name: "description", content: "Browse all published digital magazine issues from CIO Times." },
      { property: "og:title", content: "Digital Magazine Issues — CIO Times" },
      { property: "og:description", content: "Browse the CIO Times digital magazine archive." },
    ],
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
        <div className="divider-thick mb-3" />
        <h1 className="text-4xl font-bold">Digital Magazine</h1>
        <p className="text-muted-foreground mt-1 mb-8">Every issue of CIO Times, available on-demand.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {mags.map((m) => (
            <Link key={m.id} to="/magazines/$id" params={{ id: m.id }} className="block group">
              {m.cover_image_url && (
                <img src={m.cover_image_url} alt={m.title} className="w-full aspect-[3/4] object-cover border border-border group-hover:opacity-90" />
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
