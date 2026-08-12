"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ShimmerButton = React.forwardRef<
  HTMLButtonElement,
  ShimmerButtonProps
>(
  (
    {
      shimmerColor = "#7fc8ff",
      shimmerSize = "0.05em",
      shimmerDuration = "3s",
      borderRadius = "0.5rem",
      background = "rgba(0, 109, 221, 0.9)",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        style={
          {
            "--spread": "90deg",
            "--shimmer-color": shimmerColor,
            "--radius": borderRadius,
            "--speed": shimmerDuration,
            "--cut": shimmerSize,
            "--bg": background,
          } as React.CSSProperties
        }
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3 text-white [background:var(--bg)] [border-radius:var(--radius)] dark:text-white",
          "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
          "hover:shadow-[0_0_24px_rgba(0,109,221,0.5)]",
          className,
        )}
        ref={ref}
        {...props}
      >
        {/* Shimmer */}
        <div
          className={cn(
            "absolute inset-0 overflow-visible [container-type:size]",
          )}
        >
          <div className="absolute inset-0 h-[100cqh] animate-shimmer [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_-100%]" />
        </div>
        {/* Backdrop */}
        <div className="absolute [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]" />
        {/* Content */}
        <span className="relative z-10 flex items-center gap-2 font-medium">{children}</span>
      </button>
    );
  },
);

ShimmerButton.displayName = "ShimmerButton";
