import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { EDITORIAL_EMAIL, SALES_EMAIL, SITE_NAME, pageMeta } from "@/lib/seo";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () =>
    pageMeta({
      title: `Contact Us | ${SITE_NAME}`,
      description: `Reach the ${SITE_NAME} editorial, partnerships, and media inquiry desks for story pitches, press releases, and advertising.`,
      path: "/contact",
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
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-3">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link to="/" className="hover:text-brand">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-navy">Contact Us</li>
          </ol>
        </nav>

        <div className="divider-thick mb-3" />
        <h1 className="text-4xl font-bold text-navy">Contact Us</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Story pitches, editorial inquiries, corporate partnership proposals, or advertising requests — connect with our newsroom desks below.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-10 mt-8">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="contact-name" label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Field id="contact-email" label="Email address" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            </div>
            <Field id="contact-subject" label="Subject" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} required />
            <div>
              <label htmlFor="contact-message" className="text-xs font-bold uppercase tracking-widest text-navy">Message</label>
              <textarea
                id="contact-message"
                required
                rows={7}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full mt-1 px-3 py-2 border-2 border-border focus:border-navy outline-none bg-background text-sm"
              />
            </div>
            <button disabled={busy} className="bg-brand text-brand-foreground px-8 py-3 text-sm font-bold uppercase tracking-[0.2em] hover:bg-primary transition-colors disabled:opacity-60">
              {busy ? "Sending…" : "Send message"}
            </button>
          </form>

          <aside className="bg-secondary/60 border border-border p-6 h-fit space-y-6">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand mb-2">Editorial Desk</h2>
              <p className="text-sm font-medium text-navy">{EDITORIAL_EMAIL}</p>
              <p className="text-xs text-muted-foreground mt-1">Press releases, executive interviews, editorial tips</p>
            </div>
            <div className="border-t border-border/80 pt-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand mb-2">Advertising &amp; Partnerships</h2>
              <p className="text-sm font-medium text-navy">{SALES_EMAIL}</p>
              <p className="text-xs text-muted-foreground mt-1">Sponsorships, digital editions, executive briefs</p>
            </div>
            <div className="border-t border-border/80 pt-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand mb-2">Response Window</h2>
              <p className="text-xs text-muted-foreground">Our desk reviews inquiries Monday through Friday and responds within two business days.</p>
            </div>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

function Field({ id, label, value, onChange, type = "text", required }: {
  id: string; label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-widest text-navy">{label}</label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 border-2 border-border focus:border-navy outline-none bg-background text-sm"
      />
    </div>
  );
}
