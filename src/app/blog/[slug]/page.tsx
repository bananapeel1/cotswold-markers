export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getBlogPosts, getBlogPostBySlug } from "@/data/blog";
import { getBlogCategoryIcon, getBlogCategoryLabel } from "@/data/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: `TrailTap | ${post.title}`,
    description: post.excerpt,
    openGraph: post.coverImage ? { images: [post.coverImage] } : undefined,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const wordCount = post.body.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const paragraphs = post.body.split(/\n\n+/).filter(Boolean);
  const sentences = post.body.match(/[^.!?]+[.!?]+/g) || [];
  const pullQuote = sentences.length > 6 ? sentences[Math.floor(sentences.length / 2)].trim() : null;
  const pullIndex = Math.floor(paragraphs.length / 2);

  const categoryIcon = getBlogCategoryIcon(post.category);

  // Get related posts (same category, different post)
  const allPosts = await getBlogPosts();
  const related = allPosts
    .filter((p) => p.category === post.category && p.id !== post.id)
    .slice(0, 2);

  return (
    <main className="min-h-screen bg-background">
      {/* Sticky back bar */}
      <nav className="sticky top-0 z-50 bg-primary text-on-primary backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/blog"
            className="flex items-center gap-1.5 text-sm font-bold opacity-90 hover:opacity-100 transition-opacity active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Blog
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs opacity-60">{readingTime} min read</span>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="max-w-2xl mx-auto px-6 pt-8 pb-5">
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-primary text-on-primary">
            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>{categoryIcon}</span>
            {getBlogCategoryLabel(post.category)}
          </span>
        </div>

        <h1 className="font-headline text-3xl md:text-4xl font-extrabold leading-tight mb-3">
          {post.title}
        </h1>

        <p className="text-base text-secondary leading-relaxed">
          {post.excerpt}
        </p>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-outline-variant/20">
          <div className="flex items-center gap-1.5 text-xs text-secondary">
            <span className="material-symbols-outlined text-sm">person</span>
            {post.author}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-secondary">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            {new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-secondary">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {readingTime} min
          </div>
        </div>
      </header>

      {/* Cover image */}
      {post.coverImage && (
        <div className="max-w-2xl mx-auto px-6 pb-6">
          <div className="relative w-full aspect-[16/9] rounded-md overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* Body */}
      <article className="max-w-2xl mx-auto px-6 pb-12">
        {paragraphs.map((p, i) => (
          <div key={i}>
            {i === pullIndex && pullQuote && (
              <blockquote className="border-l-4 border-primary pl-4 py-2 my-6">
                <p className="text-lg font-headline font-bold text-primary/80 italic leading-relaxed">
                  {pullQuote}
                </p>
              </blockquote>
            )}
            <p className={`text-base text-on-surface leading-relaxed mb-4 ${
              i === 0 ? "first-letter:text-5xl first-letter:font-black first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:text-primary first-letter:font-headline" : ""
            }`}>
              {p}
            </p>
          </div>
        ))}
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 pb-12">
          <h2 className="font-headline font-bold text-lg mb-4">More from the trail</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/blog/${r.slug}`}
                className="bg-surface-container-lowest rounded-md p-4 hover:shadow-ambient transition-shadow active:scale-[0.99]"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {getBlogCategoryLabel(r.category)}
                </span>
                <h3 className="font-headline font-bold text-sm mt-1 leading-snug">{r.title}</h3>
                <p className="text-[11px] text-secondary mt-1 line-clamp-2">{r.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Bottom bar */}
      <div className="sticky bottom-0 bg-surface/90 backdrop-blur-md border-t border-outline-variant/10 py-3 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/blog"
            className="flex items-center gap-1.5 text-sm font-bold text-primary active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            All posts
          </Link>
          <Link
            href="/trail"
            className="flex items-center gap-1.5 text-sm text-secondary font-bold"
          >
            <span className="material-symbols-outlined text-lg">map</span>
            Trail Map
          </Link>
        </div>
      </div>
    </main>
  );
}
