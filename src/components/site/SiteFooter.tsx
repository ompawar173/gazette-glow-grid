import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="bg-navy text-navy-foreground mt-16">
      <div className="max-w-[1200px] mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="text-2xl font-black" style={{ fontFamily: "Georgia, serif" }}>CIO TIMES</div>
          <p className="mt-3 opacity-70">The B2B technology publication for enterprise leaders. In-depth reporting on the strategies shaping the future of business.</p>
        </div>
        <div>
          <div className="font-bold uppercase text-xs tracking-wider mb-3 text-brand">Sections</div>
          <ul className="space-y-2 opacity-80">
            <li><Link to="/category/$slug" params={{ slug: "ceo-insights" }}>CEO Insights</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "cio-insights" }}>CIO Insights</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "ai-analytics" }}>AI &amp; Analytics</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "cybersecurity" }}>Cybersecurity</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-bold uppercase text-xs tracking-wider mb-3 text-brand">Company</div>
          <ul className="space-y-2 opacity-80">
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/awards">Awards</Link></li>
            <li><Link to="/newsletter">Newsletter</Link></li>
            <li><Link to="/magazines">Digital Magazine</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-bold uppercase text-xs tracking-wider mb-3 text-brand">Contact</div>
          <p className="opacity-80">editorial@ciotimes.com</p>
          <p className="opacity-80 mt-1">© {new Date().getFullYear()} CIO Times. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
