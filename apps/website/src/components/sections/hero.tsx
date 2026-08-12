"use client";

import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Zap, Server, Cpu, Database } from "lucide-react";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { TextAnimate } from "@/components/ui/text-animate";
import { BorderBeam } from "@/components/ui/border-beam";
import SideRays from "@/components/SideRays";

export function HeroSection() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173";
  const adminUrl = "http://localhost:3002";

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28 bg-[#030710]">
      {/* Background SideRays */}
      <SideRays
        rayColor1="#7fc8ff"
        rayColor2="#006ddd"
        speed={2.0}
        spread={2.5}
        intensity={1.8}
        origin="top-right"
        className="absolute inset-0 pointer-events-none opacity-80"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Title */}
        <h1 className="mx-auto max-w-4xl font-display text-4xl font-normal tracking-tight text-white sm:text-6xl md:text-7xl leading-[1.1]">
          Build Multi-Tenant SaaS & AI Products <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#7fc8ff] via-[#beb4fd] to-[#006ddd] bg-clip-text text-transparent">
            In Hours, Not Months
          </span>
        </h1>

        {/* Subtitle */}
        <div className="mt-6 mx-auto max-w-2xl text-lg text-gray-300 sm:text-xl font-normal leading-relaxed">
          <TextAnimate animation="blurInUp" by="word" delay={0.2}>
            Production-grade multi-tenant architecture with organization RBAC, multi-cloud PostgreSQL (GCP, AWS, Local), object storage (GCS/S3), real-time WebSocket AI Agent orchestration, and automated end-to-end type safety.
          </TextAnimate>
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href={appUrl}>
            <button className="btn-primary-sleek group w-full sm:w-auto text-base px-8 py-4 flex items-center justify-center gap-2">
              Launch SaaS App (Port 5173) <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </a>
          <a href={adminUrl} target="_blank" rel="noreferrer">
            <button className="btn-secondary-sleek w-full sm:w-auto text-base px-8 py-4 flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#beb4fd]" /> Open SuperAdmin Platform (Port 3002)
            </button>
          </a>
        </div>

        {/* Valueprops pill */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-gray-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#7fc8ff]" /> Strict Tenant Data Boundaries
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#beb4fd]" /> GCP / AWS / Local Multi-Cloud
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#7fc8ff]" /> 30%-60% TOON Context Savings
          </span>
        </div>

        {/* Hero Product Architecture Mockup */}
        <div className="relative mt-14 mx-auto max-w-5xl rounded-2xl border border-white/10 bg-[#161f34]/80 p-2 sm:p-4 shadow-2xl backdrop-blur-xl">
          <BorderBeam size={250} duration={12} delay={9} colorFrom="#7fc8ff" colorTo="#beb4fd" />
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#030710]">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#161f34]/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <span className="font-mono text-xs text-gray-400">localhost:3002 — SuperAdmin Platform Architecture</span>
              <div className="h-4 w-4" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 p-6 text-left gap-6">
              {/* Card 1: Multi-Tenant Core API */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#7fc8ff] uppercase tracking-wider flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5 text-[#7fc8ff]" /> 1. SaaS API (Port 8000)
                  </span>
                  <span className="rounded bg-[#006ddd]/20 px-2 py-0.5 font-mono text-[10px] text-[#7fc8ff]">FastAPI</span>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#161f34] p-3 space-y-2">
                  <p className="font-display text-sm font-semibold text-white">Multi-Tenant Isolation</p>
                  <p className="text-xs text-gray-400">organization_id FK + Alembic DDL Migrations</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {["PostgreSQL", "SQLAlchemy 2.0", "asyncpg", "Redis"].map((tag) => (
                      <span key={tag} className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2: Real-time AI Agent Subsystem */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#beb4fd] uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-[#beb4fd]" /> 2. AI Agent Engine
                  </span>
                  <span className="rounded bg-[#beb4fd]/20 px-2 py-0.5 font-mono text-[10px] text-[#beb4fd]">WebSocket</span>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#161f34] p-3 space-y-2">
                  <p className="font-display text-sm font-semibold text-white">Streaming & Python Tools</p>
                  <p className="text-xs text-gray-400">OpenRouter + OpenAI with Sandboxed Tools</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {["TOON Serialization", "3-Level Fallback", "inline/collapsible"].map((tag) => (
                      <span key={tag} className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 3: SuperAdmin Microservice & UI */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-emerald-400" /> 3. SuperAdmin Platform
                  </span>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] text-emerald-400">Port 3002 & 8001</span>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#161f34] p-3 space-y-2">
                  <p className="font-display text-sm font-semibold text-white">Cloud Monitor & Evals</p>
                  <p className="text-xs text-gray-400">Standalone operations microservice & platform UI</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {["Cloud Telemetry", "Agent Evals", "Configurable Auth"].map((tag) => (
                      <span key={tag} className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
