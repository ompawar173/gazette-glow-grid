import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { StorageImage } from "@/components/site/StorageImage";
import { resolveStorageUrl } from "@/lib/storage";
import { BacklinkList } from "@/components/site/BacklinkList";

export const Route = createFileRoute("/magazines/$id")({
  head: () => ({
    meta: [
      { title: "Digital Issue — CIO Times Magazine" },
      { name: "description", content: "Read this digital issue of the CIO Times magazine online." },
      { property: "og:title", content: "Digital Issue — CIO Times Magazine" },
      { property: "og:description", content: "Read this digital issue of the CIO Times magazine online." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MagazineDetail,
});

function MagazineDetail() {
  const { id } = Route.useParams();
  const [m, setM] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdf, setPdf] = useState("");

  useEffect(() => {
    setLoading(true);
    supabase.from("magazines").select("*").eq("id", id).eq("status", "published").maybeSingle()
      .then(async ({ data }) => {
        setM(data);
        setLoading(false);
        setPdf(await resolveStorageUrl(data?.pdf_file_url));
      });
  }, [id]);

  if (loading) return <SiteLayout><div className="max-w-[900px] mx-auto px-4 py-16">Loading…</div></SiteLayout>;
  if (!m) {
    return (
      <SiteLayout>
        <div className="max-w-[900px] mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-navy">Issue not available</h1>
          <p className="text-muted-foreground mt-2">This issue may be unpublished or no longer exists.</p>
          <Link to="/magazines" className="inline-block mt-6 bg-brand text-brand-foreground px-6 py-3 text-sm font-bold uppercase tracking-widest">
            Browse all issues
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="max-w-[1000px] mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        <StorageImage src={m.cover_image_url} alt={m.title} className="w-full aspect-[3/4] object-cover border border-border" />
        <div>
          <div className="tag-chip">{m.issue_month} {m.issue_year} Issue</div>
          <h1 className="text-4xl font-bold mt-1 text-navy">{m.title}</h1>
          <p className="text-muted-foreground mt-4">
            Read the full digital edition of this issue. Perfect for offline reading.
          </p>
          <div className="mt-6 flex gap-3 flex-wrap">
            {pdf ? (
              <a href={pdf} target="_blank" rel="noopener noreferrer" className="bg-brand text-brand-foreground px-6 py-3 font-bold uppercase tracking-wide text-sm">
                Read Digital Version
              </a>
            ) : (
              <span className="text-muted-foreground text-sm">PDF coming soon.</span>
            )}
            <Link to="/magazines" className="border-2 border-navy text-navy px-6 py-3 font-bold uppercase tracking-wide text-sm">All Issues</Link>
          </div>
          {pdf && (
            <div className="mt-8 border border-border">
              <iframe src={pdf} className="w-full h-[800px]" title={m.title} />
            </div>
          )}
          <BacklinkList targetType="magazine" targetId={m.id} title="Related Links & Sources" />
        </div>
      </div>
    </SiteLayout>
  );
}
