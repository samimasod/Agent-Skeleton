"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface AnimatedGradientTextProps {
  className?: string;
  children: React.ReactNode;
}

export function AnimatedGradientText({
  children,
  className,
}: AnimatedGradientTextProps) {
  return (
    <div
      className={cn(
        "group relative mx-auto flex max-w-fit flex-row items-center justify-center rounded-2xl px-4 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#7fc8ff1f] backdrop-blur-sm transition-shadow duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#7fc8ff3f]",
        "border border-white/10 bg-white/5",
        className,
      )}
    >
      <div
        className="absolute inset-0 block h-full w-full animate-animated-gradient rounded-[inherit] bg-gradient-to-r from-[#7fc8ff]/20 via-[#beb4fd]/20 to-[#7fc8ff]/20 bg-[length:var(--bg-size,300%)_100%] p-[1px]"
      />
      <span
        className={cn(
          "inline-flex items-center gap-1",
          "animate-animated-gradient bg-gradient-to-r from-[#7fc8ff] via-[#beb4fd] to-[#7fc8ff] bg-[length:var(--bg-size,300%)_100%] bg-clip-text text-transparent",
        )}
      >
        {children}
      </span>
    </div>
  );
}
