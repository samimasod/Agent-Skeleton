"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does Skeleton enforce tenant data isolation?",
      a: "Every domain model includes an organization_id foreign key referencing organizations.id with index=True and ondelete='CASCADE'. Backend endpoints enforce permissions using check_permission(role, Permission...).",
    },
    {
      q: "Which cloud providers are supported out of the box?",
      a: "Skeleton seamlessly runs across Google Cloud Platform (GCP Cloud SQL & GCS Buckets), Amazon Web Services (AWS Aurora RDS & S3), Supabase, Neon, and local self-hosted environments.",
    },
    {
      q: "How does the AI Agent subsystem & TOON optimization work?",
      a: "Skeleton provides stateful WebSocket real-time chat streaming (/api/agents/{id}/chat/ws). It uses TOON (Token-Oriented Object Notation) to serialize tabular JSON outputs, saving 30%–60% of LLM context tokens.",
    },
    {
      q: "What is the standalone SuperAdmin Platform architecture?",
      a: "The SuperAdmin platform consists of a standalone FastAPI microservice (apps/api_admin on Port 8001) and a Vite React UI (apps/admin on Port 3002) for live cloud monitoring, agent evaluations, and tenant governance.",
    },
    {
      q: "How do I sync client TypeScript types when backend schemas change?",
      a: "Run `pnpm typegen` from the workspace root. It automatically generates TypeScript interfaces in `packages/shared-types` from FastAPI OpenAPI specifications.",
    },
  ];

  return (
    <section id="faq" className="py-24 bg-[#030710] relative">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-xs font-mono font-bold text-[#beb4fd] uppercase tracking-widest mb-3">
            Developer Knowledge Base
          </h2>
          <h3 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="rounded-2xl border border-white/10 bg-[#0d1322] overflow-hidden">
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full p-6 text-left flex items-center justify-between font-bold text-white text-base hover:text-[#7fc8ff] transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${openIdx === idx ? "rotate-180 text-[#7fc8ff]" : ""}`} />
              </button>
              {openIdx === idx && (
                <div className="px-6 pb-6 text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
