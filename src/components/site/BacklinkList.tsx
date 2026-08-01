import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";

export function BacklinkList({ targetType, targetId, title = "Related Links" }: {
  targetType: "article" | "magazine";
  targetId: string;
  title?: string;
}) {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!targetId) return;
    supabase.from("backlinks")
      .select("id,label,url,note,target_type,target_id")
      .or(`and(target_type.eq.${targetType},target_id.eq.${targetId}),target_type.eq.site`)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows(data ?? []));
  }, [targetType, targetId]);

  if (rows.length === 0) return null;

  const click = (id: string) => { supabase.rpc("increment_backlink_click", { _id: id }); };

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
              rel="noopener noreferrer"
              onClick={() => click(r.id)}
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
