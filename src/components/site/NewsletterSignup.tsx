import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return toast.error("Enter a valid email");
    setLoading(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email });
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.info("You're already subscribed.");
      else toast.error(error.message);
    } else {
      toast.success("Subscribed! Welcome aboard.");
      setEmail("");
    }
  };

  return (
    <div className={compact ? "" : "bg-navy text-navy-foreground p-6 my-8"}>
      {!compact && (
        <>
          <div className="tag-chip !text-brand">Newsletter</div>
          <h3 className="text-2xl font-bold mt-1">The Executive Brief</h3>
          <p className="opacity-80 text-sm mt-2">
            Weekly intelligence for CIOs and technology leaders. Delivered every Tuesday.
          </p>
        </>
      )}

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="flex-1 px-3 py-2 text-sm text-foreground outline-none border border-border"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-brand text-brand-foreground px-4 py-2 text-sm font-bold uppercase tracking-wide hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "..." : "Subscribe"}
        </button>
      </form>
    </div>
  );
}
