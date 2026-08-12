"use client";

import { ShieldCheck, Database, Cpu, Layers, Code, Zap, Server, Lock } from "lucide-react";
import GlassSurface from "@/components/GlassSurface";

export function FeaturesSection() {
  const features = [
    {
      icon: ShieldCheck,
      title: "Tenant Data Isolation & RBAC",
      description:
        "Every domain model enforces isolation via an organization_id foreign key with ondelete='CASCADE'. Complete role-based access control (Owner, Admin, Member, Viewer, Super Admin).",
      color: "#006ddd",
    },
    {
      icon: Database,
      title: "Multi-Cloud Database & Storage",
      description:
        "Async PostgreSQL (asyncpg + SQLAlchemy 2.0 + Alembic DDL migrations) supporting GCP Cloud SQL, AWS RDS/Aurora, Supabase, Neon, or Local DBs. Object storage abstraction for GCS, S3, or Local disk.",
      color: "#7fc8ff",
    },
    {
      icon: Cpu,
      title: "Real-Time AI Agent Engine",
      description:
        "Stateful WebSocket streaming protocol (/api/agents/{id}/chat/ws). Multi-provider LLM support via OpenRouter (Gemini, Claude, Llama) or OpenAI (GPT-4o) with sandboxed Python tools.",
      color: "#beb4fd",
    },
    {
      icon: Zap,
      title: "TOON Token Optimization",
      description:
        "Serialized tabular datasets using TOON (Token-Oriented Object Notation) reduce context window prompt sizes by 30%–60%, optimizing latency and LLM API costs.",
      color: "#10b981",
    },
    {
      icon: Layers,
      title: "8-Step Standardized CRUD Architecture",
      description:
        "Scalable modular code layout (models, schemas, repository, service, router, main.py, env.py, pnpm typegen) for building robust domain micro-services fast.",
      color: "#f59e0b",
    },
    {
      icon: Server,
      title: "Standalone SuperAdmin Platform",
      description:
        "Independently deployable operations microservice (apps/api_admin on Port 8001) and platform UI (apps/admin on Port 3002) for cloud monitoring, agent evaluations, and tenant governance.",
      color: "#ef4444",
    },
  ];

  return (
    <section id="features" className="py-24 bg-[#030710] relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-mono font-bold text-[#7fc8ff] uppercase tracking-widest mb-3">
            Core Architecture Highlights
          </h2>
          <h3 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Engineered for High-Performance SaaS & AI Products
          </h3>
          <p className="mt-4 text-base text-gray-400">
            Skeleton eliminates boilerplate friction, allowing software architects and developers to launch production-grade multi-tenant SaaS products in record time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-white/10 bg-[#0d1322]/80 p-6 shadow-xl space-y-4 hover:border-[#7fc8ff]/40 transition-all">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10" style={{ color: item.color }}>
                <item.icon className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white">{item.title}</h4>
              <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
