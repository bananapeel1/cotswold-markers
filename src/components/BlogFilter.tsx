"use client";

import { useState } from "react";
import Link from "next/link";
import type { BlogPost, BlogCategory } from "@/data/types";

interface BlogFilterProps {
  posts: BlogPost[];
  categories: BlogCategory[];
  getCategoryIcon: (c: BlogCategory) => string;
  getCategoryLabel: (c: BlogCategory) => string;
}

export default function BlogFilter({ posts, categories, getCategoryIcon, getCategoryLabel }: BlogFilterProps) {
  const [filter, setFilter] = useState<BlogCategory | "all">("all");

  const filtered = filter === "all" ? posts : posts.filter((p) => p.category === filter);

  function formatDate(ts: string): string {
    return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function readingTime(body: string): number {
    return Math.max(1, Math.ceil(body.split(/\s+/).length / 200));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6">
      {/* Category filter chips */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-4">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1 text-[11px] font-bold whitespace-nowrap transition-colors ${
            filter === "all"
              ? "bg-primary text-on-primary"
              : "bg-surface-container text-secondary"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold whitespace-nowrap transition-colors ${
              filter === c
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-secondary"
            }`}
          >
            <span className="material-symbols-outlined text-xs">{getCategoryIcon(c)}</span>
            {getCategoryLabel(c)}
          </button>
        ))}
      </div>

      {/* Posts grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-4xl text-secondary/30 mb-2 block">article</span>
          <p className="text-sm text-secondary">No posts yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
          {filtered.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="bg-surface-container-lowest rounded-md overflow-hidden shadow-ambient hover:shadow-lg transition-shadow active:scale-[0.99]"
            >
              {post.coverImage && (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                    <span className="material-symbols-outlined text-[10px]">{getCategoryIcon(post.category)}</span>
                    {getCategoryLabel(post.category)}
                  </span>
                  <span className="text-[10px] text-secondary">
                    {formatDate(post.publishedAt)}
                  </span>
                </div>
                <h2 className="font-headline font-bold text-base leading-snug">{post.title}</h2>
                <p className="text-xs text-secondary leading-relaxed line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[10px] text-secondary">{post.author}</span>
                  <span className="text-[10px] text-secondary">{readingTime(post.body)} min read</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
