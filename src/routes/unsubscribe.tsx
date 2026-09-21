import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { CheckCircle2, AlertCircle, Mail, Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/unsubscribe")({
  ssr: false,
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const search: { email?: string } = useSearch({ strict: false });
  const [emailInput, setEmailInput] = useState(search.email || "");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (search.email && status === "idle" && !loading) {
      handleUnsubscribe(search.email);
    }
  }, [search.email]);

  const handleUnsubscribe = async (emailToUnsub: string) => {
    const trimmed = emailToUnsub.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setStatus("idle");

    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .delete()
        .eq("email", trimmed);

      if (error) throw error;

      setStatus("success");
      setMessage(`You have been successfully unsubscribed (${trimmed}). You will no longer receive Executive Brief updates.`);
    } catch (err: any) {
      console.error("Unsubscribe error:", err);
      setStatus("error");
      setMessage("An error occurred while processing your request. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    handleUnsubscribe(emailInput);
  };

  return (
    <SiteLayout>
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#071A2F] p-8 text-white text-center relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#16A9E8]/10 rounded-full blur-xl pointer-events-none" />
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 text-[#16A9E8] mb-4">
              <Mail className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold font-serif tracking-tight">Executive Brief</h1>
            <p className="text-xs text-slate-300 uppercase tracking-widest mt-1">Newsletter Preference Center</p>
          </div>

          {/* Form / Status Content */}
          <div className="p-6 md:p-8">
            {status === "success" ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Unsubscribed</h2>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  {message}
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#071A2F] hover:bg-[#1267C7] text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Return to CIO Media World
                </Link>
              </div>
            ) : (
              <form onSubmit={onSubmitForm} className="space-y-4">
                {status === "error" && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
                    <span>{message}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="unsub-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="unsub-email"
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1267C7] focus:border-transparent transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#071A2F] hover:bg-[#1267C7] text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#16A9E8]" /> Processing…
                    </>
                  ) : (
                    "Unsubscribe from Executive Brief"
                  )}
                </button>

                <div className="text-center pt-2">
                  <Link to="/" className="text-xs font-medium text-slate-500 hover:text-[#1267C7] transition-colors">
                    Cancel and return home
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
