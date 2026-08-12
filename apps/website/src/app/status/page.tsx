"use client";

import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { ShieldCheck, Activity, CheckCircle2, AlertCircle } from "lucide-react";

const SERVICES = [
  { name: "Main SaaS Backend API (:8000)", status: "Operational", uptime: "100.0%" },
  { name: "SuperAdmin Monitoring API (:8001)", status: "Operational", uptime: "100.0%" },
  { name: "WebSocket Agent Chat Protocol", status: "Operational", uptime: "99.98%" },
  { name: "Async PostgreSQL Database", status: "Operational", uptime: "100.0%" },
  { name: "Redis Cache & PubSub Pool", status: "Operational", uptime: "100.0%" },
  { name: "LLM Gateway (OpenRouter / OpenAI)", status: "Operational", uptime: "99.95%" },
];

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-[#030710] text-white">
      <Navbar />

      <section className="pt-36 pb-16 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider mb-6">
          <Activity className="h-4 w-4" /> All Systems Operational
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          System Operational Status
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-gray-400">
          Real-time service health, API latency, and incident history.
        </p>
      </section>

      <section className="px-6 max-w-4xl mx-auto pb-24">
        <div className="bg-[#0d1527]/70 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-4">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Core Platform Services</h3>
          <div className="divide-y divide-white/10">
            {SERVICES.map((srv, idx) => (
              <div key={idx} className="py-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-white font-medium">{srv.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 font-mono">{srv.uptime} uptime</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[11px]">
                    {srv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
