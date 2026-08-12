"use client";

import { cn } from "@/lib/utils";
import React, { forwardRef, useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";

type AnimationType = "text" | "word" | "character" | "line";
type AnimationVariant =
  | "fadeIn"
  | "blurInUp"
  | "blurIn"
  | "slideUp"
  | "slideRight"
  | "slideLeft"
  | "scaleUp"
  | "appear";

interface TextAnimateProps {
  children: string;
  className?: string;
  segmentClassName?: string;
  delay?: number;
  duration?: number;
  variants?: Variants;
  as?: React.ElementType;
  by?: AnimationType;
  startOnView?: boolean;
  once?: boolean;
  animation?: AnimationVariant;
}

const defaultVariants: Record<AnimationVariant, Variants> = {
  fadeIn: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  },
  blurInUp: {
    hidden: { opacity: 0, filter: "blur(10px)", y: 20 },
    show: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  },
  blurIn: {
    hidden: { opacity: 0, filter: "blur(10px)" },
    show: {
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.4, ease: "easeOut" },
    },
  },
  slideUp: {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  },
  slideRight: {
    hidden: { opacity: 0, x: -30 },
    show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 30 },
    show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
  },
  appear: {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.3 } },
  },
};

export const TextAnimate = forwardRef<HTMLElement, TextAnimateProps>(
  (
    {
      children,
      className,
      segmentClassName,
      delay = 0,
      duration = 0.3,
      variants,
      as: Component = "p",
      startOnView = true,
      once = true,
      animation = "blurInUp",
      by = "word",
    },
    ref,
  ) => {
    const MotionComponent = motion(Component as React.ElementType);
    const internalRef = useRef<HTMLElement>(null);
    const isInView = useInView(internalRef, { once, margin: "0px 0px -50px 0px" });

    const segments =
      by === "word"
        ? children.split(" ")
        : by === "character"
          ? children.split("")
          : by === "line"
            ? children.split("\n")
            : [children];

    const animationVariants = variants || defaultVariants[animation];

    return (
      <MotionComponent
        ref={internalRef}
        className={cn("", className)}
        initial="hidden"
        animate={startOnView ? (isInView ? "show" : "hidden") : "show"}
      >
        {by === "text" ? (
          <motion.span
            className={cn("inline-block", segmentClassName)}
            variants={animationVariants}
            transition={{ duration, delay }}
          >
            {children}
          </motion.span>
        ) : (
          segments.map((segment, i) => (
            <motion.span
              key={i}
              className={cn("inline-block", by === "word" && "mr-[0.25em]", segmentClassName)}
              variants={animationVariants}
              transition={{ duration, delay: delay + i * 0.05 }}
            >
              {segment === " " ? "\u00A0" : segment}
            </motion.span>
          ))
        )}
      </MotionComponent>
    );
  },
);

TextAnimate.displayName = "TextAnimate";
