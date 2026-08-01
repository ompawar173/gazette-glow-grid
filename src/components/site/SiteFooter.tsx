import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function SiteFooter() {
  const [industries, setIndustries] = useState<{ name: string; slug: string }[]>([]);
  useEffect(() => {
    supabase.from("categories").select("name,slug").is("parent_category", null).order("name")
      .then(({ data }) => setIndustries(data ?? []));
  }, []);

  return (
    <footer className="mt-16">
      <div className="h-1 bg-brand" />
      <div className="bg-navy text-navy-foreground">
        <div className="max-w-[1200px] mx-auto px-4 pt-10">
          <div className="border border-white/15 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <div className="text-brand text-[11px] font-bold uppercase tracking-[0.3em]">Newsletter</div>
              <h3 className="text-2xl font-bold mt-1" style={{ fontFamily: "Georgia, serif" }}>The Executive Brief</h3>
              <p className="opacity-80 text-sm mt-2">
                Weekly intelligence for CIOs and technology leaders. Delivered every Tuesday.
              </p>
            </div>
            <NewsletterSignup compact />
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-10 text-sm">

          <div>
            <div className="text-3xl font-black" style={{ fontFamily: "Georgia, serif" }}>
              CIO<span className="text-brand">TIMES</span>
            </div>
            <p className="mt-3 opacity-75 leading-relaxed">
              Empowering entrepreneurial excellence. Business and technology journalism for the leaders
              shaping tomorrow's enterprise.
            </p>
          </div>
          <div>
            <div className="font-bold uppercase text-xs tracking-[0.2em] mb-3 text-brand border-b border-white/15 pb-2">Industries</div>
            <ul className="space-y-2 opacity-85">
              {industries.map((i) => (
                <li key={i.slug}>
                  <Link to="/industry/$slug" params={{ slug: i.slug }} className="hover:text-brand">{i.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-bold uppercase text-xs tracking-[0.2em] mb-3 text-brand border-b border-white/15 pb-2">Explore</div>
            <ul className="space-y-2 opacity-85">
              <li><Link to="/" className="hover:text-brand">Home</Link></li>
              <li><Link to="/articles" className="hover:text-brand">Articles</Link></li>
              <li><Link to="/industry" className="hover:text-brand">Industry</Link></li>
              <li><Link to="/magazines" className="hover:text-brand">Digital Magazine</Link></li>
              <li><Link to="/about" className="hover:text-brand">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-brand">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold uppercase text-xs tracking-[0.2em] mb-3 text-brand border-b border-white/15 pb-2">Contact</div>
            <p className="opacity-85">editorial@ciotimes.com</p>
            <p className="opacity-85 mt-1">+1 (555) 014-2200</p>
            <Link to="/newsletter" className="inline-block mt-4 bg-brand text-brand-foreground px-4 py-2 text-xs font-bold uppercase tracking-widest">
              Subscribe
            </Link>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-[1200px] mx-auto px-4 py-4 text-xs opacity-70 flex flex-col sm:flex-row justify-between gap-2">
            <span>© {new Date().getFullYear()} CIO Times. All rights reserved.</span>
            <span>Business &amp; Technology Journal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
