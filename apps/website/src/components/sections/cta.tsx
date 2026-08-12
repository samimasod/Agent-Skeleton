"use client";

import { ArrowRight, Code } from "lucide-react";

export function CTASection() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173";

  return (
    <section className="py-24 bg-[#080d1a] relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="rounded-3xl border border-white/10 bg-[#0d1322] p-12 space-y-6 shadow-2xl">
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to Build Your Next SaaS with Skeleton?
          </h2>
          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
            Get instant access to production multi-tenant isolation, multi-cloud PostgreSQL, real-time AI agents, and cross-platform clients.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a href={appUrl}>
              <button className="btn-primary-sleek px-8 py-4 text-base flex items-center gap-2">
                Launch SaaS Application (Port 5173) <ArrowRight className="h-5 w-5" />
              </button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
