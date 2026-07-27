import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/admin/AdminGate";

export const Route = createFileRoute("/admin/activity")({
  ssr: false,
  component: ActivityLog,
});

function ActivityLog() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(200).then(({ data }) => setRows(data ?? []));
  }, []);
  return (
    <AdminGate title="Activity Log">
      <div className="bg-background border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr><th className="px-3 py-2">Admin</th><th className="px-3 py-2">Action</th><th className="px-3 py-2">Target</th><th className="px-3 py-2">ID</th><th className="px-3 py-2">When</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2">{r.admin_email}</td>
                <td className="px-3 py-2 font-semibold">{r.action}</td>
                <td className="px-3 py-2">{r.target_type}</td>
                <td className="px-3 py-2 text-muted-foreground text-xs">{r.target_id}</td>
                <td className="px-3 py-2 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No activity yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminGate>
  );
}
