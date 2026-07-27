import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, FileText, BookOpen, Tag, Mail, Activity, LogOut, ExternalLink } from "lucide-react";

interface Props { children: ReactNode; title: string; }

export function AdminGate({ children, title }: Props) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
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
      setEmail(data.user.email ?? "");
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/admin/login" });
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [navigate]);

  if (!ready) return <div className="p-8">Loading admin…</div>;

  const nav = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/articles", label: "Articles", icon: FileText },
    { to: "/admin/magazines", label: "Magazines", icon: BookOpen },
    { to: "/admin/categories", label: "Categories", icon: Tag },
    { to: "/admin/subscribers", label: "Subscribers", icon: Mail },
    { to: "/admin/activity", label: "Activity Log", icon: Activity },
  ];

  return (
    <div className="min-h-screen flex bg-secondary/30">
      <aside className="w-56 bg-navy text-navy-foreground flex flex-col">
        <Link to="/" className="p-4 border-b border-white/10">
          <div className="text-lg font-black" style={{ fontFamily: "Georgia,serif" }}>CIO TIMES</div>
          <div className="text-[10px] uppercase tracking-widest text-brand">Admin</div>
        </Link>
        <nav className="flex-1 py-2">
          {nav.map((n) => {
            const active = pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link key={n.to} to={n.to} className={`flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/10 ${active ? "bg-white/10 border-l-2 border-brand" : ""}`}>
                <Icon size={16} /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10 text-xs">
          <div className="opacity-70 truncate">{email}</div>
          <div className="flex gap-2 mt-2">
            <Link to="/" className="flex items-center gap-1 hover:text-brand"><ExternalLink size={12} /> Site</Link>
            <button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); }} className="flex items-center gap-1 hover:text-brand ml-auto">
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="bg-background border-b border-border px-6 py-3">
          <h1 className="text-lg font-bold">{title}</h1>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
