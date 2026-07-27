import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/magazines/$id")({
  component: MagazineDetail,
});

function MagazineDetail() {
  const { id } = Route.useParams();
  const [m, setM] = useState<any>(null);
  useEffect(() => {
    supabase.from("magazines").select("*").eq("id", id).eq("status", "published").maybeSingle().then(({ data }) => setM(data));
  }, [id]);
  if (!m) return <SiteLayout><div className="max-w-[900px] mx-auto px-4 py-16">Loading…</div></SiteLayout>;
  return (
    <SiteLayout>
      <div className="max-w-[1000px] mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        {m.cover_image_url && (
          <img src={m.cover_image_url} alt={m.title} className="w-full aspect-[3/4] object-cover border border-border" />
        )}
        <div>
          <div className="tag-chip">{m.issue_month} {m.issue_year} Issue</div>
          <h1 className="text-4xl font-bold mt-1">{m.title}</h1>
          <p className="text-muted-foreground mt-4">
            Read the full digital edition of this issue. Perfect for offline reading.
          </p>
          <div className="mt-6 flex gap-3">
            {m.pdf_file_url ? (
              <a href={m.pdf_file_url} target="_blank" rel="noopener noreferrer" className="bg-brand text-brand-foreground px-6 py-3 font-bold uppercase tracking-wide text-sm">
                Read Digital Version
              </a>
            ) : (
              <span className="text-muted-foreground text-sm">PDF coming soon.</span>
            )}
            <Link to="/magazines" className="border border-border px-6 py-3 font-bold uppercase tracking-wide text-sm">All Issues</Link>
          </div>
          {m.pdf_file_url && (
            <div className="mt-8 border border-border">
              <iframe src={m.pdf_file_url} className="w-full h-[800px]" title={m.title} />
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
