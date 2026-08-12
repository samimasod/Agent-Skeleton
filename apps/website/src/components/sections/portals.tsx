"use client";

import { Database, Cloud, Shield, Cpu, Terminal, Zap } from "lucide-react";

export function PortalsSection() {
  const cloudStack = [
    { name: "Google Cloud Platform", desc: "Cloud SQL & GCS Bucket", tag: "GCP" },
    { name: "Amazon Web Services", desc: "Aurora/RDS PostgreSQL & S3", tag: "AWS" },
    { name: "Supabase & Neon DB", desc: "Serverless PostgreSQL", tag: "Database" },
    { name: "OpenRouter & OpenAI", desc: "Gemini, Claude, GPT-4o LLMs", tag: "AI Engine" },
    { name: "Firebase Auth", desc: "ID Tokens & RBAC Security", tag: "Auth" },
    { name: "Redis Cache", desc: "Multi-backend Cache & Pub/Sub", tag: "Cache" },
  ];

  return (
    <section id="architecture" className="py-24 bg-[#030710] relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-mono font-bold text-[#006ddd] uppercase tracking-widest mb-3">
            Multi-Cloud Ecosystem
          </h2>
          <h3 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Integrated Across Premier Cloud Infrastructure
          </h3>
          <p className="mt-4 text-base text-gray-400">
            Skeleton connects seamlessly to production cloud providers without vendor lock-in.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cloudStack.map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-white/10 bg-[#0d1322] p-6 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#006ddd]/20 text-[#7fc8ff] border border-[#006ddd]/30">
                  {item.tag}
                </span>
                <Cloud className="h-4 w-4 text-gray-400" />
              </div>
              <h4 className="text-lg font-bold text-white">{item.name}</h4>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
