
import Image from "next/image";
import Link from "next/link";
import { getFragramPosts } from "@/lib/actions/fragram";
import { FragramLikeButton } from "@/components/fragram/FragramLikeButton";

export const revalidate = 60;

export default async function FragramPage() {
  const posts = await getFragramPosts();

  return (
    <div className="w-full max-w-[1600px] mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-2">Fragram</h1>
          <p className="text-gray-500">The aesthetic side of fragrance. Share your Scent of the Day.</p>
        </div>
        <Link
          href="/fragram/create"
          className="bg-brand-500 hover:bg-brand-400 text-white dark:text-black font-semibold px-6 py-3 rounded-xl shadow-lg shadow-brand-500/20 transition-all active:scale-95"
        >
          + Post Photo
        </Link>
      </div>

      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 contain-paint">
        {posts.map(post => (
          <div key={post.id} className="break-inside-avoid relative group rounded-[2rem] overflow-hidden bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 gpu-accelerate">
            <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
              <Image src={post.imageUrl} alt="Fragram Post" fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 640px) 100vw, 33vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            {/* Overlay Content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden relative border border-white/20">
                    <Image src={post.user.image || "/default-avatar.png"} alt="" fill className="object-cover" />
                  </div>
                  <span className="text-white text-sm font-medium">{post.user.name}</span>
                </div>
                <FragramLikeButton postId={post.id} initialLikes={post.likes} />
              </div>

              {post.caption && <p className="text-white/80 text-xs mb-2 line-clamp-2">{post.caption}</p>}

              {post.perfume && (
                <Link href={`/perfume/${post.perfume.slug}`} className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-brand-500/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] text-white font-bold tracking-wider uppercase transition-colors">
                  {post.perfume.name}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

