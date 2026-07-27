import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";

export const Route = createFileRoute("/newsletter")({
  head: () => ({
    meta: [
      { title: "Newsletter — CIO Times" },
      { name: "description", content: "The Executive Brief — weekly intelligence for CIOs and technology leaders." },
      { property: "og:title", content: "The Executive Brief — CIO Times Newsletter" },
      { property: "og:description", content: "Weekly intelligence for CIOs and technology leaders." },
    ],
  }),
  component: NewsletterPage,
});

function NewsletterPage() {
  return (
    <SiteLayout>
      <div className="max-w-[720px] mx-auto px-4 py-10">
        <div className="divider-thick mb-3" />
        <h1 className="text-4xl font-bold">The Executive Brief</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Every Tuesday, our editors distill the week's most important developments in enterprise technology into a 5-minute read. Read by 120,000+ CIOs and senior technology leaders.
        </p>
        <div className="mt-8">
          <NewsletterSignup />
        </div>
      </div>
    </SiteLayout>
  );
}
