"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { Star, ShieldCheck, ArrowLeft, ShoppingCart, Zap, CheckCircle2, Package, RefreshCw, Cpu, Layers } from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.id as string;

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"features" | "specs" | "reviews">("features");

  // Simulated product details
  const product = {
    id: productId || "prod-1",
    name: "Enterprise Support AI Agent Engine",
    category: "AI Assistants",
    price: 149,
    rating: 4.9,
    reviewsCount: 128,
    badge: "Bestseller",
    description:
      "A production-grade, stateful WebSocket AI agent template pre-configured for multi-tenant support desk ticketing, real-time streaming, and automatic tool execution.",
    highlights: [
      "Real-time stateful WebSocket streaming protocol (/api/agents/{id}/chat/ws)",
      "Multi-tenant data isolation with index=True organization foreign key",
      "Sandboxed Python tool runtime with automatic Human-in-the-Loop approval gate",
      "TOON Token-Oriented Object Notation serialization saving up to 60% tokens",
    ],
    specs: [
      { label: "Backend Framework", value: "FastAPI + Async SQLAlchemy 2.0" },
      { label: "Frontend Web UI", value: "React 19 + Vite + Tailwind CSS" },
      { label: "Real-Time Protocol", value: "WebSockets + Event Stream Deltas" },
      { label: "Token Optimization", value: "TOON Engine (30%-60% savings)" },
      { label: "Isolation Level", value: "Tenant Scoped organization_id FK" },
    ],
  };

  return (
    <main className="min-h-screen bg-[#030710] text-white">
      <Navbar />

      <section className="pt-36 pb-20 px-6 max-w-7xl mx-auto">
        {/* Back Link */}
        <Link href="/catalog" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-[#7fc8ff] transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Catalog
        </Link>

        {/* Top 2-Column Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Product Visual Showcase */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-video rounded-3xl bg-gradient-to-tr from-[#0d1527] to-[#162238] border border-white/10 p-8 flex flex-col justify-between overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between z-10">
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#006ddd]/20 text-[#7fc8ff] border border-[#006ddd]/30 font-semibold">
                  {product.category}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Instant Access
                </span>
              </div>

              <div className="my-8 z-10">
                <Cpu className="h-16 w-16 text-[#7fc8ff] mb-4 animate-pulse" />
                <h3 className="text-2xl font-extrabold text-white">{product.name}</h3>
                <p className="text-xs text-gray-400 mt-2 font-mono">Module ID: {product.id}</p>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-300 z-10 pt-4 border-t border-white/10">
                <div className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#7fc8ff]" /> Verified Module</div>
                <div className="flex items-center gap-1.5"><Layers className="h-4 w-4 text-[#7fc8ff]" /> 8-Step Pattern</div>
                <div className="flex items-center gap-1.5"><RefreshCw className="h-4 w-4 text-[#7fc8ff]" /> Typegen Sync</div>
              </div>

              {/* Background Glow */}
              <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#006ddd]/20 rounded-full blur-3xl" />
            </div>
          </div>

          {/* Right Column: Buying Options & Specs */}
          <div className="lg:col-span-5 bg-[#0d1527]/70 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {product.rating} <span className="text-gray-400 font-normal">({product.reviewsCount} reviews)</span>
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {product.badge}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-4">{product.name}</h1>
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">{product.description}</p>

            <div className="my-6 p-4 rounded-2xl bg-[#162238]/60 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400 block">Single License Price</span>
                <span className="text-3xl font-black text-white">${product.price * quantity}</span>
              </div>

              <div className="flex items-center gap-2 bg-[#0d1527] px-3 py-1.5 rounded-xl border border-white/10">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-gray-400 hover:text-white font-bold text-sm px-2"
                >
                  -
                </button>
                <span className="text-sm font-bold text-white px-2">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-gray-400 hover:text-white font-bold text-sm px-2"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              <Link href="/checkout">
                <button className="w-full btn-primary-sleek py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-[#006ddd]/25">
                  <Zap className="h-4 w-4" /> Buy Now & Access Module
                </button>
              </Link>
              <button
                onClick={() => alert(`Added ${quantity} x ${product.name} to cart!`)}
                className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <ShoppingCart className="h-4 w-4 text-[#7fc8ff]" /> Add to Shopping Cart
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 space-y-2 text-xs text-gray-400">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Instant repository download after checkout</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Full TypeScript types included (pnpm typegen)</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> 100% offline local test suite verified</div>
            </div>
          </div>
        </div>

        {/* Bottom Tabs: Features & Specifications */}
        <div className="mt-16 bg-[#0d1527]/50 border border-white/10 rounded-3xl p-8">
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <button
              onClick={() => setActiveTab("features")}
              className={`text-sm font-bold pb-2 transition-colors ${
                activeTab === "features" ? "text-[#7fc8ff] border-b-2 border-[#7fc8ff]" : "text-gray-400 hover:text-white"
              }`}
            >
              Key Features
            </button>
            <button
              onClick={() => setActiveTab("specs")}
              className={`text-sm font-bold pb-2 transition-colors ${
                activeTab === "specs" ? "text-[#7fc8ff] border-b-2 border-[#7fc8ff]" : "text-gray-400 hover:text-white"
              }`}
            >
              Technical Specifications
            </button>
          </div>

          <div className="pt-6">
            {activeTab === "features" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.highlights.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-[#162238]/40 p-4 rounded-2xl border border-white/5">
                    <CheckCircle2 className="h-5 w-5 text-[#7fc8ff] shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-300 font-medium leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "specs" && (
              <div className="divide-y divide-white/5">
                {product.specs.map((spec, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium">{spec.label}</span>
                    <span className="text-white font-mono font-semibold">{spec.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
