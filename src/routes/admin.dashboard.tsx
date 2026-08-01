import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/admin/AdminGate";

export const Route = createFileRoute("/admin/dashboard")({
  ssr: false,
  component: Dashboard,
});

const RANGES = [
  { key: "1", label: "Today", days: 1 },
  { key: "7", label: "7 days", days: 7 },
  { key: "30", label: "30 days", days: 30 },
];

const REGION_NAMES: Record<string, string> = {
  US: "United States", IN: "India", GB: "United Kingdom", DE: "Germany", FR: "France",
  CA: "Canada", AU: "Australia", AE: "United Arab Emirates", SG: "Singapore", JP: "Japan",
};

function Dashboard() {
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, magazines: 0, subs: 0, backlinks: 0 });
  const [activity, setActivity] = useState<any[]>([]);
  const [views, setViews] = useState<any[]>([]);
  const [range, setRange] = useState("7");

  useEffect(() => {
    (async () => {
      const [a, ap, ad, m, s, b] = await Promise.all([
        supabase.from("articles").select("id", { count: "exact", head: true }),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("magazines").select("id", { count: "exact", head: true }),
        supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
        supabase.from("backlinks").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        total: a.count ?? 0, published: ap.count ?? 0, drafts: ad.count ?? 0,
        magazines: m.count ?? 0, subs: s.count ?? 0, backlinks: b.count ?? 0,
      });
      const { data } = await supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(15);
      setActivity(data ?? []);
    })();
  }, []);

  useEffect(() => {
    const days = Number(range);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    supabase.from("page_views").select("*").gte("created_at", since)
      .order("created_at", { ascending: false }).limit(5000)
      .then(({ data }) => setViews(data ?? []));
  }, [range]);

  const analytics = useMemo(() => {
    const sessions = new Set(views.map((v) => v.session_id ?? v.id));
    const byPath = new Map<string, number>();
    const byCountry = new Map<string, number>();
    const byRef = new Map<string, number>();
    const byDay = new Map<string, number>();
    const byDevice = new Map<string, number>();
    for (const v of views) {
      byPath.set(v.path, (byPath.get(v.path) ?? 0) + 1);
      const c = v.country ?? "Unknown";
      byCountry.set(c, (byCountry.get(c) ?? 0) + 1);
      const r = v.referrer ? new URL(v.referrer, "https://x").hostname || "Direct" : "Direct";
      byRef.set(r, (byRef.get(r) ?? 0) + 1);
      const d = new Date(v.created_at).toISOString().slice(0, 10);
      byDay.set(d, (byDay.get(d) ?? 0) + 1);
      byDevice.set(v.device ?? "unknown", (byDevice.get(v.device ?? "unknown") ?? 0) + 1);
    }
    const sortDesc = (m: Map<string, number>) => [...m.entries()].sort((x, y) => y[1] - x[1]);
    return {
      pageViews: views.length,
      visitors: sessions.size,
      topPages: sortDesc(byPath).slice(0, 8),
      countries: sortDesc(byCountry).slice(0, 8),
      referrers: sortDesc(byRef).slice(0, 6),
      devices: sortDesc(byDevice),
      trend: [...byDay.entries()].sort((x, y) => x[0].localeCompare(y[0])),
    };
  }, [views]);

  const maxTrend = Math.max(1, ...analytics.trend.map((t) => t[1]));
  const maxCountry = Math.max(1, ...analytics.countries.map((c) => c[1]));

  const cards = [
    { label: "Total Articles", value: stats.total },
    { label: "Published", value: stats.published },
    { label: "Drafts", value: stats.drafts },
    { label: "Magazine Issues", value: stats.magazines },
    { label: "Newsletter Subs", value: stats.subs },
    { label: "Backlinks", value: stats.backlinks },
  ];

  return (
    <AdminGate title="Dashboard">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-background border border-border p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
            <div className="text-3xl font-black text-navy mt-1">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-background border border-border">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="font-bold">Website Analytics</div>
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`text-xs px-3 py-1 border ${range === r.key ? "bg-navy text-navy-foreground border-navy" : "border-border"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Visitors" value={analytics.visitors} />
          <Stat label="Page Views" value={analytics.pageViews} />
          <Stat label="Views / Visitor" value={analytics.visitors ? (analytics.pageViews / analytics.visitors).toFixed(1) : "0"} />
          <Stat label="Mobile Share" value={`${analytics.pageViews ? Math.round(((analytics.devices.find((d) => d[0] === "mobile")?.[1] ?? 0) / analytics.pageViews) * 100) : 0}%`} />
        </div>

        <div className="px-4 pb-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Traffic trend</div>
          {analytics.trend.length === 0 ? (
            <div className="text-sm text-muted-foreground">No visits recorded in this period yet.</div>
          ) : (
            <div className="flex items-end gap-1 h-28 border-b border-border">
              {analytics.trend.map(([day, n]) => (
                <div key={day} className="flex-1 flex flex-col justify-end items-center group">
                  <div className="w-full bg-brand" style={{ height: `${(n / maxTrend) * 100}%` }} title={`${day}: ${n}`} />
                  <div className="text-[9px] text-muted-foreground mt-1">{day.slice(5)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-border">
          <Panel title="Visitors by region">
            {analytics.countries.length === 0 && <Empty />}
            {analytics.countries.map(([c, n]) => (
              <div key={c} className="mb-2">
                <div className="flex justify-between text-xs">
                  <span>{REGION_NAMES[c] ?? c}</span><span className="text-muted-foreground">{n}</span>
                </div>
                <div className="h-1.5 bg-secondary mt-1"><div className="h-full bg-navy" style={{ width: `${(n / maxCountry) * 100}%` }} /></div>
              </div>
            ))}
          </Panel>
          <Panel title="Top pages">
            {analytics.topPages.length === 0 && <Empty />}
            {analytics.topPages.map(([p, n]) => (
              <div key={p} className="flex justify-between text-xs py-1 border-b border-border">
                <span className="truncate mr-2">{p}</span><span className="text-muted-foreground">{n}</span>
              </div>
            ))}
          </Panel>
          <Panel title="Top referrers">
            {analytics.referrers.length === 0 && <Empty />}
            {analytics.referrers.map(([r, n]) => (
              <div key={r} className="flex justify-between text-xs py-1 border-b border-border">
                <span className="truncate mr-2">{r}</span><span className="text-muted-foreground">{n}</span>
              </div>
            ))}
          </Panel>
        </div>
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-black text-navy">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 border-r border-border last:border-r-0">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}

function Empty() {
  return <div className="text-xs text-muted-foreground">No data yet.</div>;
}
