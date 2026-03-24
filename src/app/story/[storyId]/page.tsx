import { notFound } from "next/navigation";
import Link from "next/link";
import { getStories, getStoryById } from "@/data/stories";
import { getMarkers } from "@/data/markers";
import { getCategoryEmoji } from "@/data/types";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  history: { bg: "bg-primary-container", text: "text-on-primary-container", icon: "architecture" },
  nature: { bg: "bg-[#e8f5e9]", text: "text-[#1b5e20]", icon: "eco" },
  legend: { bg: "bg-[#fce4ec]", text: "text-[#880e4f]", icon: "auto_awesome" },
  local: { bg: "bg-secondary-container", text: "text-on-secondary-container", icon: "location_city" },
  geology: { bg: "bg-[#efebe9]", text: "text-[#4e342e]", icon: "landscape" },
};

const CATEGORY_HERO_GRADIENTS: Record<string, string> = {
  history: "from-primary/90",
  nature: "from-[#1b5e20]/85",
  legend: "from-[#4a148c]/85",
  local: "from-secondary/85",
  geology: "from-[#3e2723]/85",
};

export async function generateStaticParams() {
  const stories = await getStories();
  return stories.map((s) => ({ storyId: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = await params;
  const story = await getStoryById(storyId);
  if (!story) return { title: "Story Not Found" };
  return {
    title: `${story.title} | Cotswold Way Stories`,
    description: story.summary,
  };
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = await params;
  const story = await getStoryById(storyId);
  if (!story) notFound();

  const allMarkers = await getMarkers();
  const linkedMarkers = allMarkers.filter((m) =>
    story.markerIds.includes(m.id)
  );

  const colors = CATEGORY_COLORS[story.category] || CATEGORY_COLORS.history;
  const gradient = CATEGORY_HERO_GRADIENTS[story.category] || "from-primary/90";

  // Split body into paragraphs
  const paragraphs = story.body.split(/\n\n|\. (?=[A-Z])/).filter(Boolean);
  // Actually just split on sentences for the pull quote
  const sentences = story.body.match(/[^.!?]+[.!?]+/g) || [story.body];
  const pullQuote = sentences.length > 2 ? sentences[Math.floor(sentences.length / 2)].trim() : null;

  return (
    <main className="min-h-screen bg-surface">
      {/* Hero */}
      <header className="relative w-full h-[60vh] min-h-[400px] overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-t ${gradient} via-transparent to-transparent`} />
        <div className={`absolute inset-0 ${colors.bg} opacity-30`} />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />

        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <Link
            href={linkedMarkers[0] ? `/m/${linkedMarkers[0].shortCode}` : "/"}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm hover:bg-white/30 transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back
          </Link>
        </div>

        {/* Category and emoji */}
        <div className="absolute top-4 right-4 z-10">
          <span className="text-4xl">{getCategoryEmoji(story.category)}</span>
        </div>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <span className="font-label text-[10px] font-bold uppercase tracking-[0.3em] text-white/70 mb-3 block">
            {story.category} · Cotswold Way
          </span>
          <h1 className="font-headline text-3xl md:text-5xl text-white font-bold leading-tight italic">
            {story.title}
          </h1>
        </div>
      </header>

      {/* Content */}
      <section className="max-w-2xl mx-auto px-6 pt-10 pb-16">
        {/* Summary lead */}
        <p className="text-xl text-on-surface leading-relaxed mb-8 font-headline italic text-on-surface-variant">
          {story.summary}
        </p>

        {/* Divider */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-px bg-outline-variant" />
        </div>

        {/* Body with editorial drop cap */}
        <article>
          <p className="text-lg text-on-surface leading-relaxed mb-6 first-letter:float-left first-letter:font-headline first-letter:text-[4rem] first-letter:leading-[0.8] first-letter:pr-3 first-letter:font-bold first-letter:text-primary">
            {story.body}
          </p>
        </article>

        {/* Pull quote */}
        {pullQuote && (
          <div className="my-12 flex flex-col items-center">
            <div className="w-16 h-px bg-outline-variant mb-6" />
            <blockquote className="font-headline text-2xl italic text-primary text-center leading-snug px-4">
              &ldquo;{pullQuote}&rdquo;
            </blockquote>
            <div className="w-16 h-px bg-outline-variant mt-6" />
          </div>
        )}

        {/* Attribution */}
        {story.attribution && (
          <p className="text-sm text-on-surface-variant italic mt-8">
            Source: {story.attribution}
          </p>
        )}

        {/* Linked markers */}
        {linkedMarkers.length > 0 && (
          <div className="mt-12 pt-8 border-t border-outline-variant">
            <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wide mb-3">
              Discover at these markers
            </p>
            <div className="space-y-2">
              {linkedMarkers.map((m) => (
                <Link
                  key={m.id}
                  href={`/m/${m.shortCode}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
                >
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold">
                    {m.shortCode.replace("CW", "")}
                  </span>
                  <div>
                    <p className="font-semibold text-sm">{m.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      Mile {m.trailMile} · {m.subtitle}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant ml-auto">
                    chevron_right
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Bottom nav */}
      <footer className="sticky bottom-0 bg-surface/80 backdrop-blur-md border-t border-outline-variant/30 px-6 py-3 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href={linkedMarkers[0] ? `/m/${linkedMarkers[0].shortCode}` : "/"}
            className="text-sm text-primary font-semibold flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to marker
          </Link>
          <Link
            href="/trail"
            className="text-sm text-tertiary font-semibold flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">map</span>
            Trail map
          </Link>
        </div>
      </footer>
    </main>
  );
}
