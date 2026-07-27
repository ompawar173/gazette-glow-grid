import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/admin/AdminGate";
import { Download } from "lucide-react";

export const Route = createFileRoute("/admin/subscribers")({
  ssr: false,
  component: Subs,
});

function Subs() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("newsletter_subscribers").select("*").order("subscribed_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  }, []);
  const exportCSV = () => {
    const csv = "email,subscribed_at\n" + rows.map((r) => `${r.email},${r.subscribed_at}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "subscribers.csv"; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <AdminGate title="Newsletter Subscribers">
      <div className="mb-4 flex items-center gap-3">
        <div className="text-sm text-muted-foreground">{rows.length} subscribers</div>
        <button onClick={exportCSV} className="ml-auto bg-brand text-brand-foreground px-4 py-2 text-sm font-bold uppercase inline-flex items-center gap-1">
          <Download size={14} /> Export CSV
        </button>
      </div>
      <div className="bg-background border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left"><tr><th className="px-3 py-2">Email</th><th className="px-3 py-2">Subscribed</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2 text-muted-foreground">{new Date(r.subscribed_at).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">No subscribers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminGate>
  );
}
