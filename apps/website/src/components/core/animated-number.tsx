"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export function AnimatedNumber({
  value,
  className,
  springOptions,
}: {
  value: number;
  className?: string;
  springOptions?: {
    bounce?: number;
    duration?: number;
    damping?: number;
    stiffness?: number;
  };
}) {
  const spring = useSpring(0, {
    duration: springOptions?.duration ?? 2000,
    bounce: springOptions?.bounce ?? 0,
    damping: springOptions?.damping ?? 30,
    stiffness: springOptions?.stiffness ?? 100,
  });

  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
}
