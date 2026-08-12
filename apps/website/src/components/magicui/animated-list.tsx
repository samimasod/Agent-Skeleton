"use client";

import { cn } from "@/lib/utils";
import { motion, useAnimation, useInView } from "framer-motion";
import React, { useEffect, useRef } from "react";

interface AnimatedListProps {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}

export const AnimatedList = React.memo(
  ({ className, children, delay = 1000 }: AnimatedListProps) => {
    const [index, setIndex] = React.useState(0);
    const childrenArray = React.Children.toArray(children);
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
      if (!isInView) return;
      if (index < childrenArray.length - 1) {
        const timeout = setTimeout(() => {
          setIndex((prevIndex) =>
            prevIndex < childrenArray.length - 1 ? prevIndex + 1 : prevIndex,
          );
        }, delay);
        return () => clearTimeout(timeout);
      }
    }, [index, delay, childrenArray.length, isInView]);

    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center gap-4", className)}
      >
        {childrenArray.slice(0, index + 1).map((item, i) => (
          <AnimatedListItem key={i}>{item}</AnimatedListItem>
        ))}
      </div>
    );
  },
);

AnimatedList.displayName = "AnimatedList";

export function AnimatedListItem({ children }: { children: React.ReactNode }) {
  const animations = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, originY: 0 },
    exit: { scale: 0, opacity: 0 },
    transition: { type: "spring", stiffness: 350, damping: 40 },
  };

  return (
    <motion.div className="w-full" {...animations} layout>
      {children}
    </motion.div>
  );
}
