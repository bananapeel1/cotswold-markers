import type { Metadata, Viewport } from "next";
import TopNav from "@/components/TopNav";
import LaunchListForm from "@/components/LaunchListForm";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.trailtap.uk";

const title = "The first 20 markers on the Cotswold Way | TrailTap";
const description =
  "Twenty TrailTap markers on the north end of the Cotswold Way, open to everyone from Monday 15 March 2027. Get the opening news and the free printable map by email.";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title,
  description,
  alternates: { canonical: "/launch" },
  openGraph: {
    title: "The first 20 markers, on the north end of the Cotswold Way",
    description: "Open to everyone from Monday 15 March 2027.",
    url: "/launch",
    siteName: "TrailTap",
    locale: "en_GB",
    type: "website",
  },
};

// The root layout caps zoom for the map; this is a reading page, so allow it
export const viewport: Viewport = {
  maximumScale: 5,
};

const NEXT_STEPS = [
  {
    when: "From December",
    what: "A short note from the north end about once a month: a marker story, the season on the trail, and how the markers are coming along.",
  },
  {
    when: "In the new year",
    what: "The free printable map of all 20 markers, for planning a spring walk or a walking group day out.",
  },
  {
    when: "Monday 15 March 2027",
    what: "The markers open. Set off from Chipping Campden, and scan or tap each one as you pass.",
  },
];

export default function LaunchPage() {
  return (
    <>
      <TopNav />
      <main className="flex-1 px-4 pt-24 pb-20 sm:px-6 md:pt-32">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1.15fr_1fr] md:items-start md:gap-14">
          <section aria-labelledby="launch-heading">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
              Cotswold Way · Spring 2027
            </p>
            <h1
              id="launch-heading"
              className="mt-4 font-headline text-4xl font-extrabold leading-[1.1] tracking-tight text-primary sm:text-5xl"
            >
              The first 20 markers, on the north end of the Cotswold Way.
            </h1>
            <p className="mt-5 font-headline text-xl font-bold leading-snug text-on-surface sm:text-2xl">
              Open to everyone from Monday 15&nbsp;March&nbsp;2027.
            </p>
            <p className="mt-5 max-w-prose text-base leading-relaxed text-on-surface-variant sm:text-lg">
              Each marker goes on a post that&rsquo;s already on the trail,
              starting at Chipping Campden. Scan the code with your phone
              camera, or tap your phone on the marker, for the story of where
              you&rsquo;re standing and the nearest water, food and place to
              rest.
            </p>

            {/* Twenty numbered plates, one per marker */}
            <div aria-hidden="true" className="mt-8 grid max-w-sm grid-cols-10 gap-1.5">
              {Array.from({ length: 20 }, (_, i) => (
                <span
                  key={i}
                  className="flex aspect-square items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary sm:text-xs"
                >
                  {i + 1}
                </span>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="list-heading"
            className="rounded-lg bg-surface-container-lowest p-6 shadow-ambient sm:p-8"
          >
            <h2
              id="list-heading"
              className="font-headline text-2xl font-extrabold text-primary"
            >
              Get the opening news
            </h2>
            <p className="mt-2 mb-6 text-base leading-relaxed text-on-surface-variant">
              Join the launch list for the free printable map of the 20
              markers, and an email when they open.
            </p>
            <LaunchListForm />
          </section>
        </div>

        <section aria-labelledby="next-heading" className="mx-auto mt-16 max-w-5xl md:mt-24">
          <h2
            id="next-heading"
            className="font-headline text-2xl font-extrabold text-primary"
          >
            What you&rsquo;ll hear from us
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {NEXT_STEPS.map((step) => (
              <li key={step.when} className="rounded-lg bg-surface-container-low p-6">
                <p className="font-headline text-lg font-extrabold text-on-surface">
                  {step.when}
                </p>
                <p className="mt-2 text-base leading-relaxed text-on-surface-variant">
                  {step.what}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-8 max-w-prose text-sm leading-relaxed text-on-surface-variant">
            On the trail, follow the Countryside Code: respect, protect, enjoy.
            Close gates, keep dogs under control and take your litter home.
          </p>
        </section>
      </main>
    </>
  );
}
