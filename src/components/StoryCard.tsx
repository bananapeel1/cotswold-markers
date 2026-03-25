import Link from "next/link";
import { Story } from "@/data/types";

export default function StoryCard({ story }: { story: Story }) {
  return (
    <section className="space-y-3 px-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">
          menu_book
        </span>
        <h3 className="font-headline font-bold text-lg">{story.title}</h3>
      </div>
      <p className="text-secondary leading-relaxed text-sm editorial-dropcap">
        {story.summary} {story.body.slice(0, 180)}...
      </p>
      <Link
        href={`/story/${story.id}`}
        className="inline-flex items-center gap-1 text-sm text-primary font-bold group"
      >
        Read full story
        <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
          arrow_forward
        </span>
      </Link>
    </section>
  );
}
