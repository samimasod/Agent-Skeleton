"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { Search, Filter, Star, ShoppingBag, ArrowRight, CheckCircle2, Sparkles, Tag } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  reviewsCount: number;
  description: string;
  tags: string[];
  badge?: string;
  featured?: boolean;
}

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Enterprise Support AI Agent",
    category: "AI Assistants",
    price: 149,
    rating: 4.9,
    reviewsCount: 128,
    description: "Stateful WebSocket AI agent pretrained for multi-tenant support desk ticketing and customer inquiry resolution.",
    tags: ["FastAPI", "WebSocket", "OpenRouter"],
    badge: "Bestseller",
    featured: true,
  },
  {
    id: "prod-2",
    name: "Multi-Tenant E-Commerce Storefront Engine",
    category: "E-Commerce",
    price: 299,
    rating: 4.8,
    reviewsCount: 94,
    description: "Complete unauthenticated public product catalog with cart, guest checkout, and organization product isolation.",
    tags: ["Next.js 15", "PostgreSQL", "Stripe"],
    badge: "New Release",
    featured: true,
  },
  {
    id: "prod-3",
    name: "TOON Token Optimization Tool Suite",
    category: "Developer APIs",
    price: 79,
    rating: 5.0,
    reviewsCount: 42,
    description: "Token-Oriented Object Notation serializer reducing LLM prompt context tokens by 30% to 60%.",
    tags: ["Python", "Token Optimization", "LLM"],
    badge: "Popular",
  },
  {
    id: "prod-4",
    name: "SuperAdmin Monitoring & Telemetry Microservice",
    category: "SaaS Tools",
    price: 199,
    rating: 4.7,
    reviewsCount: 61,
    description: "Decoupled operations microservice on port 8001 providing real-time cloud instance pool health & token usage metering.",
    tags: ["FastAPI", "Async SQLAlchemy", "React 19"],
  },
  {
    id: "prod-5",
    name: "Sandboxed Python Tool Execution Engine",
    category: "AI Assistants",
    price: 129,
    rating: 4.9,
    reviewsCount: 83,
    description: "Sandboxed Python code execution runtime with inline and collapsible visual UI renderers for LLM agent chains.",
    tags: ["Sandboxed Tools", "Generative UI", "Python"],
  },
  {
    id: "prod-6",
    name: "Expo React Native Cross-Platform Shell",
    category: "Mobile Apps",
    price: 189,
    rating: 4.6,
    reviewsCount: 39,
    description: "Mobile client application shell with dark theme tokens, infinite scroll FlatList hooks, and stateful agent chat.",
    tags: ["Expo", "React Native", "TypeScript"],
  },
];

const CATEGORIES = ["All", "AI Assistants", "E-Commerce", "SaaS Tools", "Developer APIs", "Mobile Apps"];

export default function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"popular" | "price-low" | "price-high">("popular");

  const filteredProducts = SAMPLE_PRODUCTS.filter((product) => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    return b.rating - a.rating;
  });

  return (
    <main className="min-h-screen bg-[#030710] text-white">
      <Navbar />

      {/* Hero Header */}
      <section className="relative pt-36 pb-16 px-6 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl sm:text-6xl font-normal tracking-tight text-white max-w-3xl mx-auto">
          Explore Production-Ready <span className="bg-gradient-to-r from-[#7fc8ff] to-[#006ddd] bg-clip-text text-transparent">AI & SaaS Modules</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
          Browse our public storefront of prebuilt multi-tenant agent templates, e-commerce engines, and high-performance developer components.
        </p>

        {/* Search & Filter Bar */}
        <div className="mt-10 max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-3 bg-[#0d1527]/80 backdrop-blur-xl p-2.5 rounded-2xl border border-white/10 shadow-2xl">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products, tools, or tech stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 bg-[#162238] border border-white/10 rounded-xl text-xs font-medium text-gray-200 focus:outline-none"
            >
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="px-6 max-w-7xl mx-auto mb-10">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-[#006ddd] text-white shadow-lg shadow-[#006ddd]/30"
                  : "bg-[#0d1527] text-gray-400 hover:text-white border border-white/5 hover:border-white/15"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Product Grid */}
      <section className="px-6 max-w-7xl mx-auto pb-24">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-[#0d1527]/40 rounded-3xl border border-white/5">
            <Filter className="h-10 w-10 text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No products found</h3>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search criteria or category selection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group relative flex flex-col justify-between bg-[#0d1527]/70 backdrop-blur-md border border-white/10 hover:border-[#006ddd]/50 rounded-2xl p-6 transition-all hover:shadow-2xl hover:shadow-[#006ddd]/10"
              >
                <div>
                  {/* Badge & Category */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-[#162238] text-[#7fc8ff] border border-[#006ddd]/20">
                      {product.category}
                    </span>
                    {product.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm">
                        {product.badge}
                      </span>
                    )}
                  </div>

                  {/* Product Title */}
                  <h3 className="text-lg font-bold text-white group-hover:text-[#7fc8ff] transition-colors leading-snug">
                    {product.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-gray-400 mt-2.5 leading-relaxed line-clamp-3">
                    {product.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {product.tags.map((tag) => (
                      <span key={tag} className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer / Price & Actions */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold mb-0.5">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {product.rating} <span className="text-gray-500 font-normal">({product.reviewsCount})</span>
                    </div>
                    <span className="text-xl font-extrabold text-white">${product.price}</span>
                  </div>

                  <Link href={`/catalog/${product.id}`}>
                    <button className="btn-primary-sleek !py-2 !px-4 text-xs font-semibold flex items-center gap-1.5 group-hover:bg-[#006ddd] transition-all">
                      View Item <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
