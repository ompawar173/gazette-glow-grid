import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";
import { SITE_NAME, pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/industry/")({
  head: () =>
    pageMeta({
      title: `Industry Coverage & Topic Hubs | ${SITE_NAME}`,
      description:
        `Explore ${SITE_NAME} industry coverage across AI & Analytics, CEO Insights, CIO Insights, Cloud & Infrastructure, and Cybersecurity.`,
      path: "/industry",
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
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-3">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link to="/" className="hover:text-brand">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-navy">Industry</li>
          </ol>
        </nav>

        <div className="divider-thick mb-3" />
        <h1 className="text-4xl font-bold text-navy">Industry Coverage</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          CIO Media World organizes enterprise technology reporting into five primary operational pillars and key strategic sub-topics.
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

        <div className="mt-16">
          <NewsletterSignup />
        </div>
      </div>
    </SiteLayout>
  );
}
