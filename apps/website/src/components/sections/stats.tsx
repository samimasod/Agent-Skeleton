"use client";

import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/components/core/animated-number";
import { BlurFade } from "@/components/ui/blur-fade";

export function StatsSection() {
  const [statsValues, setStatsValues] = useState({
    isolation: 100,
    savings: 42,
    latency: 24,
    coverage: 100,
  });

  useEffect(() => {
    setStatsValues({
      isolation: 100,
      savings: 42,
      latency: 24,
      coverage: 100,
    });
  }, []);

  const stats = [
    {
      value: statsValues.isolation,
      suffix: "%",
      label: "Tenant Data Isolation Boundary",
      delay: 0.1,
    },
    {
      value: statsValues.savings,
      suffix: "%",
      label: "TOON LLM Context Savings",
      delay: 0.2,
    },
    {
      value: statsValues.latency,
      suffix: "ms",
      label: "Average API Response Time",
      delay: 0.3,
    },
    {
      value: statsValues.coverage,
      suffix: "%",
      label: "TypeScript Type Safety",
      delay: 0.4,
    },
  ];

  return (
    <section className="relative bg-[#030710] py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, idx) => (
            <BlurFade key={idx} delay={stat.delay} inView>
              <div className="flex flex-col items-center justify-center">
                <div className="font-mono text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#7fc8ff] inline-flex items-center gap-0.5">
                  <AnimatedNumber
                    className="font-mono text-3xl sm:text-4xl md:text-5xl font-bold text-[#7fc8ff]"
                    springOptions={{
                      bounce: 0,
                      duration: 2000,
                    }}
                    value={stat.value}
                  />
                  <span>{stat.suffix}</span>
                </div>
                <p className="mt-2 text-xs sm:text-sm font-medium text-gray-400 max-w-[200px]">
                  {stat.label}
                </p>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
