import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, FileText, BookOpen, Tag, Mail, Activity, LogOut, ExternalLink, Link2 as LinkIcon, Users, Files, MessageSquare, History, User } from "lucide-react";

interface Props { children: ReactNode; title: string; }

interface UserProfile {
  full_name?: string;
  company_name?: string;
  designation?: string;
  role?: string;
}

export function AdminGate({ children, title }: Props) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>({});
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return;
      if (!data.user) { navigate({ to: "/admin/login" }); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      if (!roles?.length) {
        await supabase.auth.signOut();
        navigate({ to: "/admin/login" });
        return;
      }
      const admin = roles.some((r: any) => r.role === "admin");
      setIsAdmin(admin);

      const { data: tm } = await supabase.from("team_members").select("*").eq("user_id", data.user.id).maybeSingle();
      if (tm) {
        setPerms((tm.permissions as any) ?? {});
        setProfile({
          full_name: tm.full_name || (data.user.user_metadata?.full_name as string),
          company_name: tm.company_name || (data.user.user_metadata?.company_name as string) || "CIO Media World",
          designation: tm.designation || (data.user.user_metadata?.designation as string),
          role: tm.role || (data.user.user_metadata?.role as string) || (admin ? "Admin" : "Editor"),
        });
      } else {
        setProfile({
          full_name: (data.user.user_metadata?.full_name as string) || "Admin User",
          company_name: (data.user.user_metadata?.company_name as string) || "CIO Media World",
          designation: (data.user.user_metadata?.designation as string) || "System Administrator",
          role: (data.user.user_metadata?.role as string) || (admin ? "Admin" : "Editor"),
        });
      }

      setEmail(data.user.email ?? "");
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/admin/login" });
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [navigate]);

  if (!ready) return <div className="p-8 font-medium text-navy">Loading admin…</div>;

  const can = (area: string) => isAdmin || Boolean(perms[area]?.["view"]);

  const nav = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
    { to: "/admin/articles", label: "Articles", icon: FileText, show: can("articles") },
    { to: "/admin/magazines", label: "Magazines", icon: BookOpen, show: can("magazines") },
    { to: "/admin/pages", label: "Pages", icon: Files, show: can("pages") },
    { to: "/admin/categories", label: "Categories", icon: Tag, show: can("industries") },
    { to: "/admin/backlinks", label: "Backlinks", icon: LinkIcon, show: can("backlinks") },
    { to: "/admin/inquiries", label: "Contact Inquiries", icon: MessageSquare, show: can("subscribers") || isAdmin },
    { to: "/admin/subscribers", label: "Subscribers", icon: Mail, show: can("subscribers") || isAdmin },
    { to: "/admin/delivery-history", label: "Delivery History", icon: History, show: can("subscribers") || isAdmin },
    { to: "/admin/users", label: "Users", icon: Users, show: isAdmin },
    { to: "/admin/activity", label: "Activity Log", icon: Activity, show: isAdmin },
  ].filter((n) => n.show);

  return (
    <div className="min-h-screen flex admin-shell">
      <aside className="w-64 admin-sidebar flex flex-col border-r border-border bg-background">
        <Link to="/" className="p-4 border-b border-border block">
          <div className="text-lg font-black text-navy" style={{ fontFamily: "Georgia,serif" }}>CIO MEDIA WORLD</div>
          <div className="text-[10px] uppercase tracking-widest text-brand font-bold">Admin Portal</div>
        </Link>
        <nav className="flex-1 py-3">
          {nav.map((n) => {
            const active = pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link key={n.to} to={n.to} className={`admin-navlink ${active ? "is-active" : ""}`}>
                <Icon size={16} /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border text-xs text-muted-foreground bg-slate-50/50">
          {profile && (
            <div className="mb-2 pb-2 border-b border-border/60">
              <div className="font-semibold text-navy flex items-center gap-1 truncate">
                <User size={13} className="text-brand shrink-0" />
                <span className="truncate">{profile.full_name || email}</span>
              </div>
              {profile.designation && (
                <div className="text-[11px] text-muted-foreground truncate">{profile.designation}</div>
              )}
              <div className="flex flex-wrap items-center gap-1 mt-1">
                {profile.company_name && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 text-brand border border-brand/20 font-medium">
                    {profile.company_name}
                  </span>
                )}
                {profile.role && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-navy text-white font-bold">
                    {profile.role}
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="truncate text-[11px]">{email}</div>
          <div className="flex gap-2 mt-2">
            <Link to="/" className="flex items-center gap-1 hover:text-brand font-medium"><ExternalLink size={12} /> Site</Link>
            <button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); }} className="flex items-center gap-1 hover:text-brand font-medium ml-auto">
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-navy">{title}</h1>
          {profile && (
            <div className="hidden sm:flex items-center gap-3 text-xs border-l border-border pl-4">
              <div>
                <div className="font-bold text-navy">{profile.full_name || email}</div>
                <div className="text-muted-foreground text-[11px]">{profile.designation || profile.role} — {profile.company_name}</div>
              </div>
              <span className="px-2 py-0.5 bg-brand/10 text-brand font-bold uppercase tracking-wider text-[10px] border border-brand/20">
                {profile.role || "Admin"}
              </span>
            </div>
          )}
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
