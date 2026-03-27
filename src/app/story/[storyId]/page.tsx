import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getStories, getStoryById } from "@/data/stories";
import { getMarkers } from "@/data/markers";
import AudioPlayer from "@/components/AudioPlayer";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; accent: string; icon: string }> = {
  history: { bg: "bg-primary", text: "text-on-primary", accent: "text-primary", icon: "architecture" },
  nature: { bg: "bg-[#1b5e20]", text: "text-white", accent: "text-[#1b5e20]", icon: "eco" },
  legend: { bg: "bg-[#4a148c]", text: "text-white", accent: "text-[#4a148c]", icon: "auto_awesome" },
  local: { bg: "bg-secondary", text: "text-on-secondary", accent: "text-secondary", icon: "location_city" },
  geology: { bg: "bg-[#3e2723]", text: "text-white", accent: "text-[#3e2723]", icon: "landscape" },
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

  // Split body into paragraphs for better formatting
  const bodyParagraphs = story.body.split(/\n\n/).filter(Boolean);

  // Extract a pull quote from the middle of the story
  const sentences = story.body.match(/[^.!?]+[.!?]+/g) || [story.body];
  const pullQuote = sentences.length > 4 ? sentences[Math.floor(sentences.length / 2)].trim() : null;

  // Reading time estimate
  const wordCount = story.body.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <main className="min-h-screen bg-background">
      {/* Sticky back bar */}
      <nav className={`sticky top-0 z-50 ${colors.bg} ${colors.text} backdrop-blur-md`}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href={linkedMarkers[0] ? `/m/${linkedMarkers[0].shortCode}` : "/"}
            className="flex items-center gap-1.5 text-sm font-bold opacity-90 hover:opacity-100 transition-opacity active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            {linkedMarkers[0] ? linkedMarkers[0].name : "Home"}
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs opacity-60">{readingTime} min read</span>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="max-w-2xl mx-auto px-6 pt-8 pb-5">
        {/* Category pill */}
        <div className="mb-4">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full ${colors.bg} ${colors.text}`}>
            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>{colors.icon}</span>
            {story.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-headline text-3xl md:text-4xl font-extrabold leading-tight mb-3">
          {story.title}
        </h1>

        {/* Summary */}
        <p className="text-base text-secondary leading-relaxed">
          {story.summary}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-outline-variant/20">
          <div className="flex items-center gap-1.5 text-xs text-secondary">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {readingTime} min read
          </div>
          {story.attribution && (
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <span className="material-symbols-outlined text-sm">source</span>
              {story.attribution}
            </div>
          )}
        </div>

        {/* Audio player */}
        {story.audioUrl && (
          <div className="mt-4">
            <AudioPlayer storyTitle={story.title} audioUrl={story.audioUrl} />
          </div>
        )}
      </header>

      {/* Story image */}
      {story.imageUrl && (
        <div className="max-w-2xl mx-auto px-6 pb-6">
          <div className="relative w-full aspect-[16/9] rounded-md overflow-hidden">
            <Image
              src={story.imageUrl}
              alt={story.title}
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* Article body */}
      <article className="max-w-2xl mx-auto px-6 pb-8">
        {bodyParagraphs.map((para, i) => {
          // Insert pull quote after roughly the middle paragraph
          const showPullQuote = pullQuote && i === Math.floor(bodyParagraphs.length / 2);

          return (
            <div key={i}>
              <p className={`text-[17px] text-on-surface leading-[1.8] mb-6 ${
                i === 0 ? "first-letter:float-left first-letter:font-headline first-letter:text-[3.5rem] first-letter:leading-[0.8] first-letter:pr-2.5 first-letter:font-extrabold first-letter:text-primary" : ""
              }`}>
                {para}
              </p>

              {showPullQuote && (
                <blockquote className="my-8 mx-2 relative">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${colors.bg}`} />
                  <p className={`font-headline text-lg italic leading-relaxed pl-5 ${colors.accent}`}>
                    &ldquo;{pullQuote}&rdquo;
                  </p>
                </blockquote>
              )}
            </div>
          );
        })}

        {/* Trail secret callout */}
        {story.trailSecret && (
          <div className="my-8 bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-amber-700 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                tips_and_updates
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-800">Trail Secret</span>
            </div>
            <p className="text-sm text-amber-900 leading-relaxed">{story.trailSecret}</p>
          </div>
        )}
      </article>

      {/* Linked markers section */}
      {linkedMarkers.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 pb-12">
          <div className="border-t border-outline-variant/20 pt-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                explore
              </span>
              <h2 className="font-headline font-bold text-base">Discover at these markers</h2>
            </div>
            <div className="space-y-2">
              {linkedMarkers.map((m) => (
                <Link
                  key={m.id}
                  href={`/m/${m.shortCode}`}
                  className="flex items-center gap-3 p-3 rounded-md bg-surface-container-lowest border border-outline-variant/10 hover:border-primary/20 transition-all active:scale-[0.98] group"
                >
                  <span className="flex-shrink-0 w-10 h-10 rounded-md bg-primary text-on-primary flex items-center justify-center text-sm font-bold">
                    {m.shortCode.replace("CW", "")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{m.name}</p>
                    <p className="text-[11px] text-secondary">
                      Mile {m.trailMile} · {m.subtitle}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-secondary group-hover:text-primary group-hover:translate-x-0.5 transition-all text-lg">
                    chevron_right
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA bar */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-outline-variant/15 px-6 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href={linkedMarkers[0] ? `/m/${linkedMarkers[0].shortCode}` : "/trail"}
            className="flex-1 bg-primary text-on-primary py-3 rounded-md font-bold text-sm text-center active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            {linkedMarkers[0] ? `Back to ${linkedMarkers[0].shortCode}` : "Explore Trail"}
          </Link>
          <Link
            href="/trail"
            className="bg-surface-container text-on-surface py-3 px-4 rounded-md font-bold text-sm active:scale-[0.98] transition-transform flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">map</span>
            Map
          </Link>
        </div>
      </div>
    </main>
  );
}
