"use client";

import { Terminal, Database, Code, Cpu, Rocket } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      icon: Terminal,
      title: "Clone Skeleton & Set Env Variables",
      description: "Copy environment variables (DATABASE_ENV, STORAGE_PROVIDER, LLM_PROVIDER) and run pnpm install + uv pip install.",
    },
    {
      num: "02",
      icon: Database,
      title: "Define Models & Apply Alembic Migrations",
      description: "Create domain ORM models with organization_id FK and generate DDL revisions via alembic revision --autogenerate.",
    },
    {
      num: "03",
      icon: Code,
      title: "Synchronize Shared TypeScript Interfaces",
      description: "Run pnpm typegen to auto-generate client TypeScript interfaces in packages/shared-types from FastAPI OpenAPI specs.",
    },
    {
      num: "04",
      icon: Cpu,
      title: "Attach AI Agents & Python Tools",
      description: "Configure custom system prompts, LLM providers (OpenRouter/OpenAI), and sandboxed Python tool execution scripts.",
    },
    {
      num: "05",
      icon: Rocket,
      title: "Deploy Across GCP, AWS, or Local Infrastructure",
      description: "Deploy decoupled apps (Main API Port 8000, SuperAdmin API Port 8001, Web Port 5173, Admin Port 3002) seamless across multi-cloud.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[#080d1a] relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-mono font-bold text-[#beb4fd] uppercase tracking-widest mb-3">
            Developer Workflow Blueprint
          </h2>
          <h3 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight">
            How Skeleton Accelerates SaaS Development
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((step) => (
            <div key={step.num} className="rounded-2xl border border-white/10 bg-[#0d1322] p-5 space-y-3 relative">
              <span className="font-mono text-2xl font-extrabold text-[#006ddd]">{step.num}</span>
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <step.icon className="h-4 w-4 text-[#7fc8ff]" />
                {step.title}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
