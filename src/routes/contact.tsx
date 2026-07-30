import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — CIO Times" },
      { name: "description", content: "Reach the CIO Times editorial and partnerships team for story pitches, advertising and media enquiries." },
      { property: "og:title", content: "Contact Us — CIO Times" },
      { property: "og:description", content: "Get in touch with the CIO Times editorial and partnerships team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert(form);
    setBusy(false);
    if (error) { toast.error("Could not send your message. Please try again."); return; }
    toast.success("Thanks! Our team will get back to you shortly.");
    setForm({ name: "", email: "", subject: "", message: "" });
  }

  return (
    <SiteLayout>
      <div className="max-w-[1000px] mx-auto px-4 py-10">
        <div className="divider-thick mb-3" />
        <h1 className="text-4xl font-bold text-navy">Contact Us</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Story pitches, partnership proposals, nominations or advertising — tell us what you need and the
          right desk will reply within two business days.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-10 mt-8">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            </div>
            <Field label="Subject" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} required />
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-navy">Message</label>
              <textarea
                required
                rows={7}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full mt-1 px-3 py-2 border-2 border-border focus:border-navy outline-none bg-background"
              />
            </div>
            <button disabled={busy} className="bg-brand text-brand-foreground px-8 py-3 text-sm font-bold uppercase tracking-[0.2em] disabled:opacity-60">
              {busy ? "Sending…" : "Send message"}
            </button>
          </form>

          <aside className="bg-secondary/60 border border-border p-5 h-fit">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand mb-3">Editorial Desk</h2>
            <p className="text-sm text-muted-foreground">editorial@ciotimes.com</p>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand mt-5 mb-3">Advertising</h2>
            <p className="text-sm text-muted-foreground">sales@ciotimes.com</p>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand mt-5 mb-3">Phone</h2>
            <p className="text-sm text-muted-foreground">+1 (555) 014-2200</p>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

function Field({ label, value, onChange, type = "text", required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-widest text-navy">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 border-2 border-border focus:border-navy outline-none bg-background"
      />
    </div>
  );
}
