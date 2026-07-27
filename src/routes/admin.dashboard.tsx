import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/admin/AdminGate";

export const Route = createFileRoute("/admin/dashboard")({
  ssr: false,
  component: Dashboard,
});

function Dashboard() {
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, magazines: 0, subs: 0 });
  const [activity, setActivity] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const [a, ap, ad, m, s] = await Promise.all([
        supabase.from("articles").select("id", { count: "exact", head: true }),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("magazines").select("id", { count: "exact", head: true }),
        supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        total: a.count ?? 0, published: ap.count ?? 0, drafts: ad.count ?? 0,
        magazines: m.count ?? 0, subs: s.count ?? 0,
      });
      const { data } = await supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(15);
      setActivity(data ?? []);
    })();
  }, []);
  const cards = [
    { label: "Total Articles", value: stats.total },
    { label: "Published", value: stats.published },
    { label: "Drafts", value: stats.drafts },
    { label: "Magazine Issues", value: stats.magazines },
    { label: "Newsletter Subs", value: stats.subs },
  ];
  return (
    <AdminGate title="Dashboard">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-background border border-border p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
            <div className="text-3xl font-black text-navy mt-1">{c.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 bg-background border border-border">
        <div className="px-4 py-3 border-b border-border font-bold">Recent Activity</div>
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr><th className="px-4 py-2">Who</th><th className="px-4 py-2">Action</th><th className="px-4 py-2">Target</th><th className="px-4 py-2">When</th></tr>
          </thead>
          <tbody>
            {activity.map((a) => (
              <tr key={a.id} className="border-t border-border">
                <td className="px-4 py-2">{a.admin_email}</td>
                <td className="px-4 py-2 font-semibold">{a.action}</td>
                <td className="px-4 py-2">{a.target_type}</td>
                <td className="px-4 py-2 text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {activity.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No activity yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminGate>
  );
}
