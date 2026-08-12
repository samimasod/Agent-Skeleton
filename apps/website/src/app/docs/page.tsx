"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { Book, Code, Terminal, Check, Copy, ArrowRight, Layers, FileText } from "lucide-react";

export default function DocsPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickstartCmd = `./start.sh`;

  return (
    <main className="min-h-screen bg-[#030710] text-white">
      <Navbar />

      <section className="pt-36 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar */}
          <aside className="lg:col-span-3 bg-[#0d1527]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 pt-2">Documentation</div>
            <nav className="space-y-1 text-xs font-medium">
              <a href="#quickstart" className="block px-3 py-2 rounded-xl bg-[#006ddd]/20 text-[#7fc8ff] font-semibold border border-[#006ddd]/30">
                🚀 Quickstart Guide
              </a>
              <a href="#architecture" className="block px-3 py-2 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                🏗️ 8-Step CRUD Architecture
              </a>
              <a href="#websocket" className="block px-3 py-2 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                🤖 WebSocket Agent Protocol
              </a>
              <a href="#typegen" className="block px-3 py-2 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                ⚡ TypeScript Type Generation
              </a>
              <a href="#deployment" className="block px-3 py-2 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                ☁️ GCP & AWS Deployment
              </a>
            </nav>
          </aside>

          {/* Right Main Content */}
          <div className="lg:col-span-9 bg-[#0d1527]/50 border border-white/10 rounded-3xl p-8 space-y-8">
            <div>
              <h1 className="text-3xl font-normal text-white">Developer Documentation & API Guides</h1>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Everything you need to clone, customize, and deploy multi-tenant AI SaaS platforms.
              </p>
            </div>

            {/* Quickstart Section */}
            <div id="quickstart" className="space-y-4 pt-4 border-t border-white/10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="h-5 w-5 text-[#7fc8ff]" /> 5-Minute Quickstart
              </h2>

              <div className="relative bg-[#070d19] border border-white/10 rounded-2xl p-4 font-mono text-xs text-gray-200">
                <button
                  onClick={() => handleCopy("git clone https://github.com/samimasod/Agent-Skeleton.git\ncd Agent-Skeleton\n./start.sh")}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
                <pre className="overflow-x-auto">{`git clone https://github.com/samimasod/Agent-Skeleton.git
cd Agent-Skeleton
pnpm install
./start.sh`}</pre>
              </div>
            </div>

            {/* Architecture Section */}
            <div id="architecture" className="space-y-4 pt-6 border-t border-white/10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#7fc8ff]" /> Standard 8-Step Module Pattern
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Every domain module in <code className="text-[#7fc8ff]">apps/api/modules/</code> follows a strict 8-step structure:
              </p>
              <div className="bg-[#162238]/40 border border-white/5 rounded-2xl p-4 text-xs font-mono space-y-1 text-gray-300">
                <div>Step 1: models.py (SQLAlchemy 2.0 ORM model with organization_id FK)</div>
                <div>Step 2: schemas.py (Pydantic V2 schemas)</div>
                <div>Step 3: repository.py (AsyncSession SQL queries with pagination)</div>
                <div>Step 4: service.py (Business logic, permissions, NotFound errors)</div>
                <div>Step 5: router.py (FastAPI router with PaginationParams)</div>
                <div>Step 6: Register router in apps/api/main.py</div>
                <div>Step 7: Register model in apps/api/migrations/env.py & apply migration</div>
                <div>Step 8: Synchronize TypeScript types via pnpm typegen</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
