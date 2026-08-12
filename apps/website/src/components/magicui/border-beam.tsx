"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export function BorderBeam({
  className,
  size = 200,
  duration = 15,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = "#7fc8ff",
  colorTo = "#beb4fd",
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          "--size": size,
          "--duration": duration,
          "--anchor": anchor,
          "--border-width": borderWidth,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
        "[background:linear-gradient(#13152b,#13152b)_padding-box,linear-gradient(calc(var(--angle)+deg),var(--color-from),var(--color-to),transparent)_border-box]",
        "[background-clip:padding-box,border-box]",
        "![animation:border-beam_calc(var(--duration)*1s)_infinite_linear_var(--delay)]",
        "[offset-anchor:calc(var(--anchor)*1%)_50%]",
        "[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]",
        className,
      )}
    />
  );
}
