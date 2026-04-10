"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Rss, ExternalLink } from "lucide-react";

interface BlogPost {
  title: string;
  brief: string;
  slug: string;
  coverImage?: { url: string };
  url: string;
}

export const BlogSection = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const query = `
          query Publication {
            publication(host: "bansiya-blog.hashnode.dev") {
              posts(first: 3) {
                edges {
                  node {
                    title
                    brief
                    slug
                    coverImage {
                      url
                    }
                  }
                }
              }
            }
          }
        `;

        // Hashnode's deprecated V1 API is easiest without tokens, but let's use the standard fetch 
        // fallback in case of no posts yet.
        const response = await fetch("https://gql.hashnode.com", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        const result = await response.json();
        const edges = result.data?.publication?.posts?.edges || [];
        const fetchedPosts = edges.map((edge: any) => edge.node);
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Failed to fetch Hashnode posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <section id="blog" className="scroll-mt-24 relative mt-16">
      <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-transparent via-[#00f3ff]/50 to-transparent hidden md:block"></div>
      
      <div className="flex items-center gap-4 mb-8">
        <Rss className="text-[#00f3ff] animate-pulse" size={28} />
        <h2 className="text-3xl md:text-5xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-600 uppercase tracking-tighter">
          Transmission Logs
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Skeleton loaders
          [1, 2, 3].map((i) => (
            <div key={i} className="glass-panel p-6 h-64 animate-pulse rounded-lg border-t-2 border-[#00f3ff]/30">
              <div className="w-full h-8 bg-white/10 rounded mb-4"></div>
              <div className="w-3/4 h-4 bg-white/5 rounded mb-2"></div>
              <div className="w-1/2 h-4 bg-white/5 rounded"></div>
            </div>
          ))
        ) : posts.length > 0 ? (
          posts.map((post, index) => (
            <motion.a
               key={post.slug}
              href={`https://bansiya-blog.hashnode.dev/${post.slug}`}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel p-6 rounded-lg group hover:shadow-[0_0_15px_rgba(0,243,255,0.2)] hover:border-[#00f3ff]/50 transition-all flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-bold font-inter text-white mb-3 group-hover:text-[#00f3ff] transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-400 text-sm font-inter line-clamp-3">
                  {post.brief}
                </p>
              </div>
              <div className="mt-6 flex justify-between items-center text-[#00f3ff] font-orbitron text-xs tracking-widest border-t border-white/10 pt-4">
                <span>READ_DATA</span>
                <ExternalLink size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </motion.a>
          ))
        ) : (
          <div className="col-span-full glass-panel p-12 text-center rounded-lg border border-dashed border-[#00f3ff]/30">
            <p className="font-orbitron tracking-[0.2em] text-[#00f3ff]/60 uppercase">
              Awaiting first neural transmission to Hashnode network...
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
