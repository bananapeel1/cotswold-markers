import TopNav from "@/components/TopNav";
import { getSiteContent } from "@/data/siteContent";

export const metadata = {
  title: "Terms of Use | TrailTap",
  description: "Terms of use for the TrailTap Cotswold Way trail app.",
};

export const revalidate = 300;

export default async function TermsPage() {
  const { lastUpdated, sections } = await getSiteContent("terms");

  return (
    <>
      <TopNav />
      <main className="max-w-2xl mx-auto px-4 pt-20 pb-8 space-y-6 text-sm text-on-surface/80 leading-relaxed">
        <h1 className="font-headline text-2xl font-bold text-primary">
          Terms of Use
        </h1>
        <p className="text-secondary text-xs">Last updated: {lastUpdated}</p>

        {sections.map((section, i) => (
          <section key={i} className="space-y-2">
            <h2 className="font-bold text-on-surface">{section.heading}</h2>
            {section.body.split("\n\n").map((para, j) => (
              <p key={j}>{para}</p>
            ))}
          </section>
        ))}
      </main>
    </>
  );
}
