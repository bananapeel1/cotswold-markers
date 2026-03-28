"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { BlogPost, BlogCategory } from "@/data/types";
import { getBlogCategoryLabel } from "@/data/types";
import LogoutButton from "@/components/LogoutButton";

const CATEGORIES: BlogCategory[] = ["route", "tips", "seasonal", "news", "community"];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+$/, "")
    .replace(/^-+/, "");
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const res = await fetch("/api/blog");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch {
      // Fail silently
    } finally {
      setLoading(false);
    }
  }

  async function savePost() {
    if (!editing?.title) return;
    setSaving(true);
    try {
      const method = isNew ? "POST" : "PUT";
      const res = await fetch("/api/blog", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post: editing }),
      });
      if (res.ok) {
        await loadPosts();
        setEditing(null);
        setIsNew(false);
      }
    } catch {
      // Fail silently
    } finally {
      setSaving(false);
    }
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/blog?id=${id}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // Fail silently
    } finally {
      setDeleting(null);
    }
  }

  async function togglePublish(post: BlogPost) {
    const updated = { ...post, isPublished: !post.isPublished };
    await fetch("/api/blog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post: updated }),
    });
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, isPublished: !p.isPublished } : p)));
  }

  function openNew() {
    setEditing({
      id: "",
      title: "",
      slug: "",
      excerpt: "",
      body: "",
      coverImage: null,
      category: "news",
      author: "TrailTap",
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: true,
    });
    setIsNew(true);
  }

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );
  const published = posts.filter((p) => p.isPublished).length;

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md flex justify-between items-center h-16 px-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-xl font-black text-primary tracking-tighter font-headline">
            TrailTap
          </Link>
          <span className="text-secondary text-sm font-medium">/ Blog</span>
        </div>
        <LogoutButton />
      </nav>

      <main className="pt-20 pb-8 px-4 md:px-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black font-headline">Blog Posts</h1>
          <div className="flex gap-2">
            <Link href="/admin" className="text-xs font-bold text-secondary hover:text-primary transition-colors">
              Dashboard
            </Link>
            <button
              onClick={openNew}
              className="bg-primary text-on-primary rounded-full px-4 py-2 text-xs font-bold active:scale-95 transition-all"
            >
              New Post
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-surface-container rounded-lg p-3 text-center">
            <p className="text-2xl font-black font-headline">{posts.length}</p>
            <p className="text-[10px] text-secondary uppercase tracking-wide">Total</p>
          </div>
          <div className="bg-surface-container rounded-lg p-3 text-center">
            <p className="text-2xl font-black font-headline text-primary">{published}</p>
            <p className="text-[10px] text-secondary uppercase tracking-wide">Published</p>
          </div>
          <div className="bg-surface-container rounded-lg p-3 text-center">
            <p className="text-2xl font-black font-headline">{posts.length - published}</p>
            <p className="text-[10px] text-secondary uppercase tracking-wide">Drafts</p>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search posts..."
          className="w-full bg-surface-container rounded-md px-3 py-2 text-sm mb-4 outline-none focus:ring-2 focus:ring-primary/30"
        />

        {/* Posts list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-surface-variant rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-secondary">
            <span className="material-symbols-outlined text-4xl mb-2 block">article</span>
            <p className="text-sm">No posts yet. Create your first blog post.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((post) => (
              <div key={post.id} className="bg-surface-container rounded-lg p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm truncate">{post.title}</h3>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      post.isPublished ? "bg-primary-fixed text-primary" : "bg-surface-variant text-secondary"
                    }`}>
                      {post.isPublished ? "Live" : "Draft"}
                    </span>
                  </div>
                  <p className="text-[10px] text-secondary">
                    {getBlogCategoryLabel(post.category)} · {post.author} · {new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => togglePublish(post)}
                    className="p-1.5 rounded-full hover:bg-surface-variant text-secondary"
                    title={post.isPublished ? "Unpublish" : "Publish"}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {post.isPublished ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                  <button
                    onClick={() => { setEditing(post); setIsNew(false); }}
                    className="p-1.5 rounded-full hover:bg-surface-variant text-secondary"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button
                    onClick={() => deletePost(post.id)}
                    disabled={deleting === post.id}
                    className="p-1.5 rounded-full hover:bg-error-container text-error disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Editor modal */}
        {editing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-20 overflow-y-auto">
            <div className="bg-surface rounded-xl w-full max-w-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="font-headline font-bold text-lg">{isNew ? "New Post" : "Edit Post"}</h2>
                <button onClick={() => { setEditing(null); setIsNew(false); }} className="text-secondary">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-secondary block mb-1">Title</label>
                  <input
                    type="text"
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: isNew ? slugify(e.target.value) : editing.slug })}
                    className="w-full bg-surface-container rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-secondary block mb-1">Slug</label>
                  <input
                    type="text"
                    value={editing.slug}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    className="w-full bg-surface-container rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-secondary block mb-1">Excerpt</label>
                  <textarea
                    value={editing.excerpt}
                    onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                    rows={2}
                    className="w-full bg-surface-container rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-secondary block mb-1">Body</label>
                  <textarea
                    value={editing.body}
                    onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                    rows={12}
                    className="w-full bg-surface-container rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-y font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wide text-secondary block mb-1">Category</label>
                    <select
                      value={editing.category}
                      onChange={(e) => setEditing({ ...editing, category: e.target.value as BlogCategory })}
                      className="w-full bg-surface-container rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{getBlogCategoryLabel(c)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wide text-secondary block mb-1">Author</label>
                    <input
                      type="text"
                      value={editing.author}
                      onChange={(e) => setEditing({ ...editing, author: e.target.value })}
                      className="w-full bg-surface-container rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-secondary block mb-1">Cover Image URL</label>
                  <input
                    type="text"
                    value={editing.coverImage || ""}
                    onChange={(e) => setEditing({ ...editing, coverImage: e.target.value || null })}
                    placeholder="https://..."
                    className="w-full bg-surface-container rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editing.isPublished}
                    onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })}
                    id="published"
                    className="accent-primary"
                  />
                  <label htmlFor="published" className="text-sm font-medium">Published</label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={savePost}
                  disabled={saving || !editing.title}
                  className="bg-primary text-on-primary rounded-full px-6 py-2 text-sm font-bold disabled:opacity-50 active:scale-95 transition-all"
                >
                  {saving ? "Saving..." : isNew ? "Create Post" : "Save Changes"}
                </button>
                <button
                  onClick={() => { setEditing(null); setIsNew(false); }}
                  className="text-sm text-secondary font-medium px-4"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
