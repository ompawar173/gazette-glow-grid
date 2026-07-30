import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/industry/")({
  head: () => ({
    meta: [
      { title: "Industry Coverage — CIO Times" },
      { name: "description", content: "Explore CIO Times industry coverage and sub-branches across leadership, AI, cloud, infrastructure and cybersecurity." },
      { property: "og:title", content: "Industry Coverage — CIO Times" },
      { property: "og:description", content: "Browse every industry and sub-branch covered by CIO Times." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IndustryIndex,
});

interface Cat { name: string; slug: string; parent_category: string | null; }

function IndustryIndex() {
  const [cats, setCats] = useState<Cat[]>([]);
  useEffect(() => {
    supabase.from("categories").select("name,slug,parent_category").order("name")
      .then(({ data }) => setCats((data ?? []) as Cat[]));
  }, []);

  const parents = cats.filter((c) => !c.parent_category);

  return (
    <SiteLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-10">
        <div className="divider-thick mb-3" />
        <h1 className="text-4xl font-bold text-navy">Industry</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Our newsroom organises coverage into industries, each with focused sub-branches.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {parents.map((p) => (
            <div key={p.slug} className="border border-border bg-card">
              <div className="bg-navy text-navy-foreground px-4 py-3 flex items-center justify-between">
                <Link to="/industry/$slug" params={{ slug: p.slug }} className="font-bold uppercase tracking-wide text-sm hover:text-brand">
                  {p.name}
                </Link>
                <span className="h-[2px] w-8 bg-brand" />
              </div>
              <ul className="p-4 space-y-2">
                {cats.filter((c) => c.parent_category === p.slug).map((s) => (
                  <li key={s.slug}>
                    <Link to="/industry/$slug/$sub" params={{ slug: p.slug, sub: s.slug }} className="text-sm text-navy hover:text-brand">
                      → {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
