"use client";

import { cn } from "@/lib/utils";
import React from "react";

export const BackgroundBeams = ({ className }: { className?: string }) => {
  const beams = [
    { initialX: 12, width: 2, duration: 6, delay: 0, opacity: 0.6 },
    { initialX: 28, width: 1, duration: 8, delay: 1, opacity: 0.4 },
    { initialX: 50, width: 2.5, duration: 5, delay: 0.5, opacity: 0.7 },
    { initialX: 72, width: 1.5, duration: 7, delay: 1.5, opacity: 0.5 },
    { initialX: 88, width: 2, duration: 9, delay: 2, opacity: 0.6 },
  ];

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      {/* Top Ambient Glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-b from-[#006ddd]/25 via-[#7fc8ff]/10 to-transparent blur-3xl opacity-80" />

      {/* SVG Grid Lines */}
      <svg
        className="absolute inset-0 h-full w-full stroke-white/10 opacity-70"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="hero-grid"
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            <path d="M.5 36V.5H36" fill="none" strokeWidth="1" strokeDasharray="3 3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth="0" fill="url(#hero-grid)" />
      </svg>

      {/* Animated Vertical Light Beams */}
      {beams.map((b, idx) => (
        <div
          key={idx}
          style={{
            left: `${b.initialX}%`,
            width: `${b.width}px`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            opacity: b.opacity,
          }}
          className="absolute top-0 h-full bg-gradient-to-b from-[#7fc8ff] via-[#006ddd]/50 to-transparent animate-pulse shadow-[0_0_12px_#7fc8ff]"
        />
      ))}
    </div>
  );
};
