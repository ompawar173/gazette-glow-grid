import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Menu, X, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Category { name: string; slug: string; parent_category: string | null; }

export function SiteHeader() {
  const [cats, setCats] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    supabase.from("categories").select("name,slug,parent_category").order("name").then(({ data }) => {
      if (data) setCats(data as Category[]);
    });
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const industries = cats.filter((c) => !c.parent_category);
  const subsOf = (slug: string) => cats.filter((c) => c.parent_category === slug);

  return (
    <header className="border-b-4 border-brand">
      {/* Top strip: date & time only */}
      <div className="bg-navy text-navy-foreground text-xs">
        <div className="max-w-[1200px] mx-auto px-4 py-1.5 flex justify-center sm:justify-between items-center">
          <span className="opacity-85">
            {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
          <span className="hidden sm:inline opacity-85 tabular-nums">
            {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Masthead */}
      <div className="max-w-[1200px] mx-auto px-4 py-6 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="text-3xl md:text-5xl font-black tracking-tight text-navy" style={{ fontFamily: "Georgia, serif" }}>
            CIO<span className="text-brand">TIMES</span>
          </span>
          <span className="hidden md:inline text-[10px] uppercase tracking-[0.25em] text-muted-foreground border-l border-border pl-2">
            Empowering Entrepreneurial Excellence
          </span>
        </Link>
        <form
          onSubmit={(e) => { e.preventDefault(); if (q) window.location.href = `/articles?q=${encodeURIComponent(q)}`; }}
          className="hidden md:flex items-center border-2 border-navy overflow-hidden"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search articles..."
            className="px-3 py-1.5 text-sm outline-none w-56 bg-transparent"
          />
          <button type="submit" className="bg-brand text-brand-foreground px-3 py-2">
            <Search size={16} />
          </button>
        </form>
        <button className="md:hidden text-navy" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {/* Nav */}
      <nav className="bg-navy text-navy-foreground">
        <div className={`max-w-[1200px] mx-auto px-4 ${open ? "block" : "hidden md:block"}`}>
          <ul className="flex flex-col md:flex-row md:items-center gap-0 md:gap-7 text-sm font-bold uppercase tracking-wide">
            <li><Link to="/" className="block py-3 hover:text-brand">Home</Link></li>
            <li className="relative group">
              <Link to="/industry" className="py-3 hover:text-brand flex items-center gap-1">
                Industry <ChevronDown size={14} />
              </Link>
              <div className="md:absolute md:z-40 md:hidden md:group-hover:block left-0 top-full bg-navy border-t-2 border-brand min-w-[620px] p-4 md:shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {industries.map((i) => (
                    <div key={i.slug}>
                      <Link to="/industry/$slug" params={{ slug: i.slug }} className="text-brand text-xs tracking-wider">{i.name}</Link>
                      <ul className="mt-1 space-y-1 normal-case font-normal tracking-normal opacity-85">
                        {subsOf(i.slug).map((s) => (
                          <li key={s.slug}>
                            <Link to="/industry/$slug/$sub" params={{ slug: i.slug, sub: s.slug }} className="text-xs hover:text-brand">
                              {s.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </li>
            <li><Link to="/articles" className="block py-3 hover:text-brand">Articles</Link></li>
            <li><Link to="/magazines" className="block py-3 hover:text-brand">Magazine</Link></li>
            <li><Link to="/about" className="block py-3 hover:text-brand">About Us</Link></li>
            <li><Link to="/contact" className="block py-3 hover:text-brand">Contact Us</Link></li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
