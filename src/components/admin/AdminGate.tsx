import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, FileText, BookOpen, Tag, Mail, Activity, LogOut, ExternalLink, Link2 as LinkIcon, Users, Files } from "lucide-react";

interface Props { children: ReactNode; title: string; }

export function AdminGate({ children, title }: Props) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>({});
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
      if (!admin) {
        const { data: tm } = await supabase.from("team_members").select("permissions").eq("user_id", data.user.id).maybeSingle();
        setPerms((tm?.permissions as any) ?? {});
      }
      setEmail(data.user.email ?? "");
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/admin/login" });
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [navigate]);

  if (!ready) return <div className="p-8">Loading admin…</div>;

  const can = (area: string) => isAdmin || Boolean(perms[area]?.["view"]);

  const nav = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
    { to: "/admin/articles", label: "Articles", icon: FileText, show: can("articles") },
    { to: "/admin/magazines", label: "Magazines", icon: BookOpen, show: can("magazines") },
    { to: "/admin/pages", label: "Pages", icon: Files, show: can("pages") },
    { to: "/admin/categories", label: "Categories", icon: Tag, show: can("industries") },
    { to: "/admin/backlinks", label: "Backlinks", icon: LinkIcon, show: can("backlinks") },
    { to: "/admin/subscribers", label: "Subscribers", icon: Mail, show: can("subscribers") },
    { to: "/admin/users", label: "Users", icon: Users, show: isAdmin },
    { to: "/admin/activity", label: "Activity Log", icon: Activity, show: isAdmin },
  ].filter((n) => n.show);


  return (
    <div className="min-h-screen flex admin-shell">
      <aside className="w-60 admin-sidebar flex flex-col">
        <Link to="/" className="p-4 border-b border-border">
          <div className="text-lg font-black text-navy" style={{ fontFamily: "Georgia,serif" }}>CIO TIMES</div>
          <div className="text-[10px] uppercase tracking-widest text-brand">Admin</div>
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
        <div className="p-3 border-t border-border text-xs text-muted-foreground">
          <div className="truncate">{email}</div>
          <div className="flex gap-2 mt-2">
            <Link to="/" className="flex items-center gap-1 hover:text-brand"><ExternalLink size={12} /> Site</Link>
            <button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); }} className="flex items-center gap-1 hover:text-brand ml-auto">
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="bg-background border-b border-border px-6 py-4">
          <h1 className="text-xl font-bold text-navy">{title}</h1>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
