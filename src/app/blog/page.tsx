import TopNav from "@/components/TopNav";
import { getBlogPosts } from "@/data/blog";
import BlogFilter from "@/components/BlogFilter";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "TrailTap | Blog",
  description: "Stories, tips, and updates from the Cotswold Way trail.",
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <>
      <TopNav />
      <main className="min-h-screen bg-background pt-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary">article</span>
            <h1 className="font-headline text-2xl md:text-3xl font-black">From the Trail</h1>
          </div>
          <p className="text-sm text-secondary">Stories, tips, and updates from the Cotswold Way.</p>
        </div>

        <BlogFilter posts={posts} />
      </main>
    </>
  );
}
