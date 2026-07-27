import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Category { name: string; slug: string; }

export function SiteHeader() {
  const [cats, setCats] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("name,slug").order("name").then(({ data }) => {
      if (data) setCats(data);
    });
  }, []);

  return (
    <header className="border-b border-border">
      {/* Top strip */}
      <div className="bg-navy text-navy-foreground text-xs">
        <div className="max-w-[1200px] mx-auto px-4 py-1.5 flex justify-between items-center">
          <span className="opacity-80">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          <div className="hidden sm:flex gap-4 opacity-80">
            <Link to="/about" className="hover:text-brand">About</Link>
            <Link to="/awards" className="hover:text-brand">Awards</Link>
            <Link to="/newsletter" className="hover:text-brand">Newsletter</Link>
            <Link to="/admin/login" className="hover:text-brand">Admin</Link>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="max-w-[1200px] mx-auto px-4 py-5 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="text-3xl md:text-4xl font-black tracking-tight text-navy" style={{ fontFamily: "Georgia, serif" }}>
            CIO TIMES
          </span>
          <span className="hidden md:inline text-[10px] uppercase tracking-widest text-muted-foreground">
            Business & Technology Journal
          </span>
        </Link>
        <form
          onSubmit={(e) => { e.preventDefault(); if (q) window.location.href = `/?q=${encodeURIComponent(q)}`; }}
          className="hidden md:flex items-center border border-border rounded overflow-hidden"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search articles..."
            className="px-3 py-1.5 text-sm outline-none w-64"
          />
          <button type="submit" className="bg-navy text-navy-foreground px-3 py-1.5">
            <Search size={16} />
          </button>
        </form>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {/* Nav */}
      <nav className="bg-navy text-navy-foreground">
        <div className={`max-w-[1200px] mx-auto px-4 ${open ? "block" : "hidden md:block"}`}>
          <ul className="flex flex-col md:flex-row md:items-center gap-0 md:gap-6 text-sm font-semibold uppercase tracking-wide">
            <li><Link to="/" className="block py-3 hover:text-brand">Home</Link></li>
            {cats.map((c) => (
              <li key={c.slug}>
                <Link to="/category/$slug" params={{ slug: c.slug }} className="block py-3 hover:text-brand">
                  {c.name}
                </Link>
              </li>
            ))}
            <li><Link to="/magazines" className="block py-3 hover:text-brand">Magazine</Link></li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
