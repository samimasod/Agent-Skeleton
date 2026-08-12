"use client";

import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { BookOpen, Calendar, Clock, User, ArrowRight, Tag } from "lucide-react";

const POSTS = [
  {
    slug: "building-multi-tenant-agent-systems",
    title: "Architecting Multi-Tenant AI Agent Platforms: Isolation & RBAC Best Practices",
    excerpt: "Learn how to enforce organization-level data boundaries and role-based permissions in real-time WebSocket agent streaming architectures.",
    date: "August 10, 2026",
    readTime: "6 min read",
    author: "Sami Masod",
    category: "Architecture",
  },
  {
    slug: "toon-token-optimization-guide",
    title: "How TOON (Token-Oriented Object Notation) Cuts LLM Prompt Costs by 60%",
    excerpt: "A deep dive into converting tabular JSON data into compact header-delimited key-value blocks for agent context window optimization.",
    date: "August 4, 2026",
    readTime: "8 min read",
    author: "Sami Masod",
    category: "LLM Optimization",
  },
  {
    slug: "sandboxed-python-tool-execution",
    title: "Sandboxing Python Tools in AI Agents with Human-in-the-Loop Gates",
    excerpt: "Combining sandboxed Python execution namespaces with role-exempt approval gates for safe database mutations.",
    date: "July 28, 2026",
    readTime: "5 min read",
    author: "Sami Masod",
    category: "Security",
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[#030710] text-white">
      <Navbar />

      <section className="pt-36 pb-16 px-6 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl sm:text-6xl font-normal tracking-tight text-white max-w-3xl mx-auto">
          Insights on <span className="bg-gradient-to-r from-[#7fc8ff] to-[#006ddd] bg-clip-text text-transparent">AI Agents & Multi-Tenancy</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
          Articles, architectural blueprints, and engineering guides on building scalable AI-powered SaaS applications.
        </p>
      </section>

      <section className="px-6 max-w-6xl mx-auto pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {POSTS.map((post) => (
            <article
              key={post.slug}
              className="bg-[#0d1527]/70 backdrop-blur-md border border-white/10 hover:border-[#006ddd]/50 rounded-2xl p-6 flex flex-col justify-between transition-all hover:shadow-2xl hover:shadow-[#006ddd]/10"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#162238] text-[#7fc8ff]">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime}</span>
                </div>

                <h2 className="text-lg font-bold text-white leading-snug hover:text-[#7fc8ff] transition-colors">
                  {post.title}
                </h2>
                <p className="text-xs text-gray-400 mt-2.5 leading-relaxed">{post.excerpt}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-[#7fc8ff]" /> {post.author}</span>
                <span className="text-[11px]">{post.date}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
