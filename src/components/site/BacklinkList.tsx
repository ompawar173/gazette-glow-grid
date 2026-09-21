import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";

interface Row {
  id: string;
  label: string;
  url: string;
  note: string | null;
  target_type: string;
  target_id: string | null;
  rel_nofollow?: boolean | null;
  rel_sponsored?: boolean | null;
}

/**
 * Records a backlink click. Uses keepalive so the request still completes when
 * the browser immediately navigates away to the external destination.
 */
export function recordBacklinkClick(id: string) {
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) {
    void supabase.rpc("increment_backlink_click", { _id: id }).then(
      () => {},
      () => {},
    );
    return;
  }
  void fetch(`${url}/rest/v1/rpc/increment_backlink_click`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key },
    body: JSON.stringify({ _id: id }),
    keepalive: true,
  }).catch(() => {});
}

export function BacklinkList({ targetType, targetId, title = "Related Links" }: {
  targetType: "article" | "magazine";
  targetId: string;
  title?: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!targetId) return;
    supabase.from("backlinks")
      .select("id,label,url,note,target_type,target_id,rel_nofollow,rel_sponsored")
      .or(`and(target_type.eq.${targetType},target_id.eq.${targetId}),target_type.eq.site`)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as Row[]));
  }, [targetType, targetId]);

  if (rows.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="divider-thick mb-3" />
      <h3 className="text-xs font-bold uppercase tracking-widest text-navy mb-3">{title}</h3>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="text-sm">
            <a
              href={r.url}
              target="_blank"
              rel={["noopener", "noreferrer", r.rel_nofollow === false ? "" : "nofollow", r.rel_sponsored ? "sponsored" : ""]
                .filter(Boolean)
                .join(" ")}
              onClick={() => recordBacklinkClick(r.id)}
              onAuxClick={() => recordBacklinkClick(r.id)}
              className="text-brand font-semibold inline-flex items-center gap-1 hover:underline"
            >
              {r.label} <ExternalLink size={12} />
            </a>
            {r.note && <span className="text-muted-foreground"> — {r.note}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
