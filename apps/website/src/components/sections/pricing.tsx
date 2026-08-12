"use client";

import { Check, ShieldCheck } from "lucide-react";

export function PricingSection() {
  const plans = [
    {
      name: "Open Source Starter",
      price: "$0",
      period: "forever free",
      desc: "Ideal for individual developers building initial SaaS MVPs & prototypes.",
      features: [
        "Full FastAPI & React 19 codebase",
        "Organization multi-tenant isolation",
        "SQLite & PostgreSQL support",
        "Standard Alembic DDL migrations",
        "Shared TypeScript type generation",
      ],
      cta: "Clone Repository",
      popular: false,
    },
    {
      name: "Production SaaS Boilerplate",
      price: "$299",
      period: "one-time payment",
      desc: "Complete production-ready multi-tenant SaaS architecture for startups.",
      features: [
        "Everything in Open Source Starter",
        "GCP Cloud SQL & AWS Aurora RDS",
        "Multi-backend GCS / AWS S3 storage",
        "Real-time WebSocket AI Agent runtime",
        "TOON token optimization engine",
        "Standalone SuperAdmin Platform UI & API",
      ],
      cta: "Get Lifetime License",
      popular: true,
    },
    {
      name: "Enterprise Cloud License",
      price: "Custom",
      period: "per project",
      desc: "Custom multi-cloud infrastructure setup, security audits, and priority support.",
      features: [
        "Everything in Production SaaS",
        "Custom IaC Terraform / Pulumi modules",
        "Dedicated SAML / SSO integration",
        "Custom Python Tool Sandbox sandboxing",
        "24/7 Priority SLA & Architectural Review",
      ],
      cta: "Contact Enterprise Team",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-[#080d1a] relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-mono font-bold text-[#7fc8ff] uppercase tracking-widest mb-3">
            Licensing & Pricing
          </h2>
          <h3 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Flexible Developer Plans
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border ${
                plan.popular ? "border-[#006ddd] bg-[#0d1322] shadow-2xl relative" : "border-white/10 bg-[#030710]"
              } p-8 flex flex-col justify-between`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#006ddd] text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                  MOST POPULAR
                </span>
              )}
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-white">{plan.name}</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-xs text-gray-400">/{plan.period}</span>
                </div>
                <p className="text-xs text-gray-400">{plan.desc}</p>
                <div className="border-t border-white/10 pt-4 space-y-2.5 text-xs text-gray-300">
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#7fc8ff]" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className={`mt-8 w-full py-3 rounded-xl font-bold text-xs ${plan.popular ? "bg-[#006ddd] text-white hover:bg-[#006ddd]/90" : "bg-white/10 text-white hover:bg-white/20"} transition-all`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
