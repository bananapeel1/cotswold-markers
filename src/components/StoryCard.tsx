import Link from "next/link";
import { Story } from "@/data/types";

export default function StoryCard({ story }: { story: Story }) {
  return (
    <section className="space-y-4 px-4">
      {/* Image placeholder area */}
      <div className="relative h-56 rounded-md overflow-hidden bg-surface-container-high">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>
      <div>
        <h3 className="font-headline font-bold text-lg mb-3">{story.title}</h3>
        <p className="text-secondary leading-relaxed editorial-dropcap">
          {story.summary} {story.body.slice(0, 200)}...
        </p>
        <Link
          href={`/story/${story.id}`}
          className="inline-flex items-center gap-1 mt-3 text-sm text-primary font-bold group"
        >
          Read full story
          <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </Link>
      </div>
    </section>
  );
}
