import { useEffect, useState } from "react";
import { User, Mail, X, CheckCircle2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/cio-media-world-logo.png.asset.json";

export function ExecutiveBriefModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Check if user has closed or subscribed previously
    const hasSubscribed = localStorage.getItem("cio_eb_subscribed");
    const hasDismissed = sessionStorage.getItem("cio_eb_dismissed");

    if (hasSubscribed || hasDismissed) return;

    // Show popup after 3.5 seconds
    const timer = setTimeout(() => {
      setOpen(true);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem("cio_eb_dismissed", "true");
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      // Save subscriber to database
      const { error } = await supabase.from("newsletter_subscribers").insert({
        email: cleanEmail,
        name: cleanName || null,
        status: "subscribed",
        subscribed_at: new Date().toISOString(),
      } as any);

      setLoading(false);

      if (error) {
        if (error.code === "23505") {
          // Unique violation — user is already subscribed
          setSubmitted(true);
          localStorage.setItem("cio_eb_subscribed", "true");
          return;
        }
        setErrorMsg("Could not process subscription. Please try again.");
        return;
      }

      setSubmitted(true);
      localStorage.setItem("cio_eb_subscribed", "true");
    } catch {
      setLoading(false);
      setErrorMsg("An unexpected error occurred. Please try again.");
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
    >
      {/* Container */}
      <div className="relative w-full max-w-4xl bg-white shadow-2xl rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-border">
        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Close newsletter subscription popup"
          className="absolute top-3 right-3 z-10 p-2 text-muted-foreground hover:text-foreground bg-white/80 md:bg-transparent rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {/* LEFT COLUMN: Dark Navy / Cyan Graphic Hero */}
        <div className="relative bg-[#071A2F] text-white p-8 md:p-10 flex flex-col justify-between overflow-hidden">
          {/* Subtle background glow graphics */}
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-[#16A9E8]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#1267C7]/20 rounded-full blur-2xl pointer-events-none" />

          {/* Logo & Headline */}
          <div className="relative z-10">
            <div className="bg-white/90 p-2.5 rounded inline-block mb-6 shadow-sm">
              <img
                src={logoAsset.url}
                alt="CIO Media World"
                className="h-10 w-auto object-contain"
              />
            </div>
            <h2 id="modal-headline" className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
              Stay Ahead with <br />
              <span className="text-[#16A9E8]">CIO Media World</span>
            </h2>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed max-w-sm">
              Get the latest enterprise technology insights, leadership perspectives, AI, cybersecurity, cloud and digital transformation news delivered directly to your inbox.
            </p>
          </div>

          {/* Footer branding tag */}
          <div className="relative z-10 mt-8 pt-6 border-t border-white/10 text-xs text-slate-400">
            Enterprise Technology Journal for Executive Decision-Makers.
          </div>
        </div>

        {/* RIGHT COLUMN: Subscription Form */}
        <div className="p-8 md:p-10 flex flex-col justify-center bg-white">
          {!submitted ? (
            <>
              <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#1267C7] mb-1">
                Subscribe to our
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-[#0A2342] mb-2">
                Executive Brief
              </h3>
              <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                Join our newsletter and get curated insights straight to your inbox every Tuesday.
              </p>

              <form onSubmit={handleSubscribe} className="space-y-4">
                {/* Name Input */}
                <div>
                  <label htmlFor="eb-name" className="sr-only">Your Name</label>
                  <div className="relative flex items-center">
                    <User size={18} className="absolute left-3.5 text-slate-400" />
                    <input
                      id="eb-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name *"
                      required
                      className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-md bg-[#F4F7FA] text-foreground focus:outline-none focus:border-[#1267C7] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label htmlFor="eb-email" className="sr-only">Email Address</label>
                  <div className="relative flex items-center">
                    <Mail size={18} className="absolute left-3.5 text-slate-400" />
                    <input
                      id="eb-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address *"
                      required
                      className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-md bg-[#F4F7FA] text-foreground focus:outline-none focus:border-[#1267C7] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div role="alert" className="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-200">
                    {errorMsg}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1267C7] hover:bg-[#0E52A0] text-white py-3.5 px-6 font-bold text-sm uppercase tracking-wide rounded-md shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    "Subscribing…"
                  ) : (
                    <>
                      <span>Subscribe</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Privacy Notice */}
              <p className="mt-5 text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#16A9E8]" />
                We respect your privacy. You can unsubscribe at any time.
              </p>
            </>
          ) : (
            /* SUCCESS STATE */
            <div aria-live="polite" className="text-center py-6 animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 bg-[#EAF6FF] text-[#1267C7] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#16A9E8]/30">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-2xl font-bold text-[#0A2342]">You're Subscribed!</h3>
              <p className="text-sm text-slate-600 mt-2 max-w-xs mx-auto leading-relaxed">
                Thank you for subscribing to <strong>The Executive Brief</strong>. Welcome to CIO Media World intelligence.
              </p>
              <button
                onClick={handleClose}
                className="mt-6 bg-[#0A2342] text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded hover:bg-[#071A2F] transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
