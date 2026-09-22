import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/admin/AdminGate";
import {
  Users,
  Eye,
  Clock,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Compass,
  FileText,
  Activity,
  Layers,
} from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  ssr: false,
  component: Dashboard,
});

const RANGES = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7", label: "Last 7 days" },
  { key: "30", label: "Last 30 days" },
  { key: "all", label: "All time" },
];

const REGION_NAMES: Record<string, string> = {
  US: "United States", IN: "India", GB: "United Kingdom", DE: "Germany", FR: "France",
  CA: "Canada", AU: "Australia", AE: "United Arab Emirates", SG: "Singapore", JP: "Japan",
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function Dashboard() {
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, magazines: 0, subs: 0, backlinks: 0 });
  const [activity, setActivity] = useState<any[]>([]);
  const [views, setViews] = useState<any[]>([]);
  const [range, setRange] = useState("7");
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Fetch overview CMS stats
  useEffect(() => {
    (async () => {
      try {
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
      } catch (e) {
        console.error("Error loading CMS overview stats:", e);
      }
    })();
  }, []);

  // Fetch analytics page views data based on selected range
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    setAnalyticsError(null);
    try {
      let query = supabase.from("page_views").select("*").order("created_at", { ascending: false }).limit(10000);

      const now = new Date();
      if (range === "today") {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        query = query.gte("created_at", start);
      } else if (range === "yesterday") {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        query = query.gte("created_at", start).lt("created_at", end);
      } else if (range === "7") {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte("created_at", since);
      } else if (range === "30") {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte("created_at", since);
      }
      // range === "all" does not add date limit

      const { data, error } = await query;
      if (error) {
        setAnalyticsError(error.message);
        setViews([]);
      } else {
        setViews(data ?? []);
      }
    } catch (err: any) {
      setAnalyticsError(err.message ?? "Could not load website analytics");
      setViews([]);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  // Aggregate metrics from page views
  const analytics = useMemo(() => {
    if (!views || views.length === 0) {
      return {
        totalViews: 0,
        uniqueVisitors: 0,
        totalSessions: 0,
        pagesPerSession: "0.0",
        avgSessionDurationSec: 0,
        bounceRatePct: 0,
        topPages: [],
        devices: [],
        browsers: [],
        referrers: [],
        countries: [],
        trend: [],
        recentViews: [],
      };
    }

    const totalViews = views.length;
    const uniqueVisitorsSet = new Set<string>();
    const sessionsMap = new Map<string, { count: number; minTime: number; maxTime: number }>();
    const byPathMap = new Map<string, { views: number; visitors: Set<string> }>();
    const byDeviceMap = new Map<string, number>();
    const byBrowserMap = new Map<string, number>();
    const byRefMap = new Map<string, number>();
    const byCountryMap = new Map<string, number>();
    const byDayMap = new Map<string, number>();

    for (const v of views) {
      const vid = v.visitor_id || v.session_id || v.id;
      const sid = v.session_id || v.visitor_id || v.id;
      uniqueVisitorsSet.add(vid);

      const ts = new Date(v.created_at).getTime();
      if (!sessionsMap.has(sid)) {
        sessionsMap.set(sid, { count: 1, minTime: ts, maxTime: ts });
      } else {
        const s = sessionsMap.get(sid)!;
        s.count++;
        s.minTime = Math.min(s.minTime, ts);
        s.maxTime = Math.max(s.maxTime, ts);
      }

      // Path breakdown
      if (!byPathMap.has(v.path)) {
        byPathMap.set(v.path, { views: 1, visitors: new Set([vid]) });
      } else {
        const p = byPathMap.get(v.path)!;
        p.views++;
        p.visitors.add(vid);
      }

      // Device
      const device = (v.device || "desktop").toLowerCase();
      byDeviceMap.set(device, (byDeviceMap.get(device) ?? 0) + 1);

      // Browser
      const browser = v.browser || "Other";
      byBrowserMap.set(browser, (byBrowserMap.get(browser) ?? 0) + 1);

      // Referrer categorization
      let refGroup = "Direct / None";
      if (v.referrer) {
        const lower = v.referrer.toLowerCase();
        if (lower.includes("google.")) refGroup = "Google Search";
        else if (lower.includes("bing.")) refGroup = "Bing Search";
        else if (lower.includes("linkedin.") || lower.includes("t.co") || lower.includes("twitter") || lower.includes("facebook") || lower.includes("instagram") || lower.includes("reddit")) refGroup = "Social Media";
        else {
          try {
            refGroup = new URL(v.referrer).hostname || "Other Web";
          } catch {
            refGroup = "Other Web";
          }
        }
      }
      byRefMap.set(refGroup, (byRefMap.get(refGroup) ?? 0) + 1);

      // Country
      const c = v.country || "Unknown";
      byCountryMap.set(c, (byCountryMap.get(c) ?? 0) + 1);

      // Daily trend
      const d = new Date(v.created_at).toISOString().slice(0, 10);
      byDayMap.set(d, (byDayMap.get(d) ?? 0) + 1);
    }

    const totalSessions = sessionsMap.size;
    const pagesPerSession = totalSessions > 0 ? (totalViews / totalSessions).toFixed(1) : "0.0";

    let singlePageSessions = 0;
    let totalDurationSec = 0;
    for (const s of sessionsMap.values()) {
      if (s.count === 1) singlePageSessions++;
      totalDurationSec += Math.round((s.maxTime - s.minTime) / 1000);
    }
    const bounceRatePct = totalSessions > 0 ? Math.round((singlePageSessions / totalSessions) * 100) : 0;
    const avgSessionDurationSec = totalSessions > 0 ? Math.round(totalDurationSec / totalSessions) : 0;

    const sortDesc = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]);

    const topPages = [...byPathMap.entries()]
      .map(([path, data]) => ({ path, views: data.views, uniqueVisitors: data.visitors.size }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    return {
      totalViews,
      uniqueVisitors: uniqueVisitorsSet.size,
      totalSessions,
      pagesPerSession,
      avgSessionDurationSec,
      bounceRatePct,
      topPages,
      devices: sortDesc(byDeviceMap),
      browsers: sortDesc(byBrowserMap),
      referrers: sortDesc(byRefMap),
      countries: sortDesc(byCountryMap).slice(0, 8),
      trend: [...byDayMap.entries()].sort((a, b) => a[0].localeCompare(b[0])),
      recentViews: views.slice(0, 10),
    };
  }, [views]);

  const maxTrend = Math.max(1, ...analytics.trend.map((t) => t[1]));
  const maxCountry = Math.max(1, ...analytics.countries.map((c) => c[1]));

  const cmsCards = [
    { label: "Total Articles", value: stats.total },
    { label: "Published", value: stats.published },
    { label: "Drafts", value: stats.drafts },
    { label: "Magazine Issues", value: stats.magazines },
    { label: "Newsletter Subs", value: stats.subs },
    { label: "Backlinks", value: stats.backlinks },
  ];

  return (
    <AdminGate title="Dashboard & Website Analytics">
      {/* Content Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
        {cmsCards.map((c) => (
          <div key={c.label} className="bg-background border border-border p-3 shadow-sm">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{c.label}</div>
            <div className="text-2xl font-black text-navy mt-0.5">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Main Analytics Container */}
      <div className="bg-background border border-border shadow-sm mb-8">
        {/* Analytics Header & Range Controls */}
        <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="font-bold text-navy text-lg flex items-center gap-2">
              <Activity size={20} className="text-brand" /> Website Analytics & Traffic
            </h2>
            <p className="text-xs text-muted-foreground">Real-time visitor traffic and page-view performance metrics</p>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`text-xs px-3 py-1.5 font-bold transition-colors border ${
                  range === r.key
                    ? "bg-navy text-white border-navy"
                    : "bg-background text-foreground border-border hover:bg-secondary"
                }`}
              >
                {r.label}
              </button>
            ))}
            <button
              onClick={fetchAnalytics}
              disabled={loadingAnalytics}
              className="ml-2 text-xs px-2.5 py-1.5 border border-border bg-background text-muted-foreground hover:text-navy hover:bg-secondary flex items-center gap-1"
              title="Refresh Analytics Data"
            >
              <RefreshCw size={12} className={loadingAnalytics ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {/* Error Alert Box (if query failed) */}
        {analyticsError && (
          <div className="p-4 m-4 bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle size={16} className="text-red-600 shrink-0" />
              <span>Could not load analytics database events: {analyticsError}</span>
            </div>
            <button
              onClick={fetchAnalytics}
              className="text-xs bg-red-800 text-white px-3 py-1 font-bold uppercase tracking-wider hover:bg-red-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* Core Metric Cards */}
        <div className="p-5 grid grid-cols-2 md:grid-cols-6 gap-3 border-b border-border bg-background">
          <StatCard icon={Eye} label="Page Views" value={analytics.totalViews} highlight />
          <StatCard icon={Users} label="Unique Visitors" value={analytics.uniqueVisitors} highlight />
          <StatCard icon={Layers} label="Sessions / Visits" value={analytics.totalSessions} />
          <StatCard icon={Compass} label="Pages / Session" value={analytics.pagesPerSession} />
          <StatCard icon={Clock} label="Avg Session Duration" value={formatDuration(analytics.avgSessionDurationSec)} />
          <StatCard icon={TrendingUp} label="Bounce Rate" value={`${analytics.bounceRatePct}%`} />
        </div>

        {/* Traffic Trend Chart */}
        <div className="p-5 border-b border-border">
          <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
            <span>Daily Page Views Trend</span>
            <span className="text-[11px] font-normal text-muted-foreground">Period Total: {analytics.totalViews} views</span>
          </div>

          {loadingAnalytics ? (
            <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">Loading traffic trend…</div>
          ) : analytics.trend.length === 0 ? (
            <div className="h-28 flex items-center justify-center text-xs text-muted-foreground bg-secondary/50 border border-dashed border-border">
              No visitor page views recorded for this period yet.
            </div>
          ) : (
            <div className="flex items-end gap-1.5 h-36 pt-4 border-b border-border">
              {analytics.trend.map(([day, n]) => (
                <div key={day} className="flex-1 flex flex-col justify-end items-center group relative min-w-[12px]">
                  <div className="absolute -top-7 hidden group-hover:block bg-navy text-white text-[10px] py-0.5 px-2 font-bold whitespace-nowrap shadow-md z-10">
                    {day}: {n} views
                  </div>
                  <div
                    className="w-full bg-brand hover:bg-navy transition-colors"
                    style={{ height: `${Math.max(6, (n / maxTrend) * 100)}%` }}
                  />
                  <div className="text-[9px] font-semibold text-muted-foreground mt-1 tracking-tight">{day.slice(5)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analytics Breakdown Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-b border-border divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Top Pages Table */}
          <div className="p-4 md:col-span-2">
            <div className="text-xs font-bold uppercase tracking-wider text-navy mb-3 flex items-center gap-1.5">
              <FileText size={14} className="text-brand" /> Top Pages Visited
            </div>
            {analytics.topPages.length === 0 ? (
              <EmptyState text="No page views recorded yet." />
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-secondary text-left font-bold text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1.5">Page Path</th>
                    <th className="px-2 py-1.5 text-right">Views</th>
                    <th className="px-2 py-1.5 text-right">Unique Visitors</th>
                    <th className="px-2 py-1.5 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analytics.topPages.map((p) => {
                    const share = analytics.totalViews > 0 ? Math.round((p.views / analytics.totalViews) * 100) : 0;
                    return (
                      <tr key={p.path} className="hover:bg-slate-50">
                        <td className="px-2 py-2 font-semibold text-navy truncate max-w-[300px]" title={p.path}>
                          {p.path}
                        </td>
                        <td className="px-2 py-2 text-right font-bold text-brand">{p.views}</td>
                        <td className="px-2 py-2 text-right text-muted-foreground">{p.uniqueVisitors}</td>
                        <td className="px-2 py-2 text-right text-muted-foreground">{share}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Referrers */}
          <div className="p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-navy mb-3 flex items-center gap-1.5">
              <Globe size={14} className="text-brand" /> Traffic Sources / Referrers
            </div>
            {analytics.referrers.length === 0 ? (
              <EmptyState text="No referrer data yet." />
            ) : (
              <div className="space-y-2">
                {analytics.referrers.map(([r, n]) => {
                  const pct = analytics.totalViews > 0 ? Math.round((n / analytics.totalViews) * 100) : 0;
                  return (
                    <div key={r}>
                      <div className="flex justify-between text-xs font-medium">
                        <span className="truncate mr-2 text-navy">{r}</span>
                        <span className="text-muted-foreground font-semibold">{n} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-secondary mt-1">
                        <div className="h-full bg-navy" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Devices, Browsers & Geographic Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Devices */}
          <div className="p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-navy mb-3 flex items-center gap-1.5">
              <Monitor size={14} className="text-brand" /> Device Breakdown
            </div>
            {analytics.devices.length === 0 ? (
              <EmptyState text="No device data yet." />
            ) : (
              <div className="space-y-2.5">
                {analytics.devices.map(([dev, n]) => {
                  const pct = analytics.totalViews > 0 ? Math.round((n / analytics.totalViews) * 100) : 0;
                  const Icon = dev === "mobile" ? Smartphone : dev === "tablet" ? Tablet : Monitor;
                  return (
                    <div key={dev} className="flex items-center justify-between text-xs">
                      <span className="capitalize font-semibold text-navy flex items-center gap-1.5">
                        <Icon size={13} className="text-muted-foreground" /> {dev}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-secondary">
                          <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-muted-foreground w-12 text-right font-semibold">{n} ({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Browsers */}
          <div className="p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-navy mb-3 flex items-center gap-1.5">
              <Globe size={14} className="text-brand" /> Browser Breakdown
            </div>
            {analytics.browsers.length === 0 ? (
              <EmptyState text="No browser data yet." />
            ) : (
              <div className="space-y-2.5">
                {analytics.browsers.map(([b, n]) => {
                  const pct = analytics.totalViews > 0 ? Math.round((n / analytics.totalViews) * 100) : 0;
                  return (
                    <div key={b} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-navy">{b}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-secondary">
                          <div className="h-full bg-navy" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-muted-foreground w-12 text-right font-semibold">{n} ({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Regions */}
          <div className="p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-navy mb-3 flex items-center gap-1.5">
              <Globe size={14} className="text-brand" /> Visitors by Country / Region
            </div>
            {analytics.countries.length === 0 ? (
              <EmptyState text="No region data yet." />
            ) : (
              <div className="space-y-2">
                {analytics.countries.map(([c, n]) => (
                  <div key={c}>
                    <div className="flex justify-between text-xs font-medium">
                      <span>{REGION_NAMES[c] ?? c}</span>
                      <span className="text-muted-foreground font-semibold">{n}</span>
                    </div>
                    <div className="h-1.5 bg-secondary mt-1">
                      <div className="h-full bg-brand" style={{ width: `${(n / maxCountry) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Recent Visitor Feed */}
        <div className="p-5 border-t border-border bg-slate-50/50">
          <div className="text-xs font-bold uppercase tracking-wider text-navy mb-3 flex items-center gap-1.5">
            <Activity size={14} className="text-brand" /> Real-Time Live Page View Stream
          </div>
          {analytics.recentViews.length === 0 ? (
            <EmptyState text="No live activity recorded yet." />
          ) : (
            <div className="space-y-2">
              {analytics.recentViews.map((v) => (
                <div key={v.id} className="bg-background border border-border px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                    <span className="font-bold text-navy truncate max-w-[280px]">{v.path}</span>
                    {v.device && <span className="text-[10px] px-1.5 py-0.5 bg-secondary text-muted-foreground font-semibold uppercase">{v.device}</span>}
                    {v.browser && <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-brand font-semibold">{v.browser}</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(v.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} — {new Date(v.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Admin Activity Log */}
      <div className="bg-background border border-border shadow-sm">
        <div className="px-5 py-3 border-b border-border font-bold text-navy text-sm">Recent Admin Team Activity Log</div>
        <table className="w-full text-xs">
          <thead className="bg-secondary text-left font-bold text-muted-foreground">
            <tr>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Target</th>
              <th className="px-4 py-2">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {activity.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-navy">{a.admin_email}</td>
                <td className="px-4 py-2 font-bold text-brand">{a.action}</td>
                <td className="px-4 py-2 text-muted-foreground">{a.target_type}</td>
                <td className="px-4 py-2 text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {activity.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  No admin activity recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminGate>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: any;
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className={`p-3 border ${highlight ? "border-brand/40 bg-blue-50/40" : "border-border bg-background"}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
        <Icon size={12} className={highlight ? "text-brand" : "text-muted-foreground"} />
        <span className="truncate">{label}</span>
      </div>
      <div className={`text-2xl font-black ${highlight ? "text-brand" : "text-navy"}`}>{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="text-xs text-muted-foreground py-3 text-center bg-slate-50/50 border border-dashed border-border">{text}</div>;
}
