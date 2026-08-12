"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useMotionValueEvent, useScroll } from "framer-motion";

export const centralColumnStyle = "w-[90%] max-w-[1340px] mx-auto";
export const pageYPadding = "py-10 md:py-12 lg:py-20 xl:py-30 2xl:py-40";
const defaultTitleClass = "text-xl md:text-2xl font-bold mb-2 text-white font-display";
const defaultDescriptionClass = "text-sm md:text-base font-normal mb-2 text-gray-300 max-w-[440px] leading-relaxed";
const imageClass =
  "absolute top-0 right-0 ml-auto w-full h-full object-cover rounded-2xl border border-white/10 shadow-2xl transition-opacity duration-500 ease-in-out";

export interface ItemContent {
  title: string;
  description: string;
  image: {
    url: string;
    width: number;
    height: number;
    alt: string;
  };
}

interface Props extends React.ComponentProps<"div"> {
  contentA: ItemContent;
  contentB: ItemContent;
  contentC: ItemContent;
  contentD?: ItemContent;
  titleClass?: string;
  descriptionClass?: string;
}

const ScrollRevealContentA = ({
  contentA,
  contentB,
  contentC,
  contentD,
  titleClass = defaultTitleClass,
  descriptionClass = defaultDescriptionClass,
  className,
  ...props
}: Props) => {
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const ref0 = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref0,
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setScrollProgress(latest);
  });

  const items = [
    { content: contentA, number: "01", start: 0, end: contentD ? 0.25 : 0.33 },
    { content: contentB, number: "02", start: contentD ? 0.25 : 0.33, end: contentD ? 0.5 : 0.66 },
    { content: contentC, number: "03", start: contentD ? 0.5 : 0.66, end: contentD ? 0.75 : 1.0 },
    ...(contentD ? [{ content: contentD, number: "04", start: 0.75, end: 1.0 }] : []),
  ];

  return (
    <div className={cn("bg-[#030710]", className)} ref={ref0} {...props}>
      <div className="max-w-[92vw] mx-auto">
        <div className="flex w-full mx-auto relative z-20">
          <div
            className={cn(
              centralColumnStyle,
              "sticky top-0 flex flex-col w-full items-start justify-center h-[100vh]"
            )}
          >
            <div className="flex flex-row gap-12 md:gap-20 lg:gap-28 xl:gap-36 w-full h-full items-center">
              {/* Text Steps Column */}
              <div className="lg:w-[50%] w-full h-auto flex flex-col justify-center gap-6 md:gap-8">
                {items.map((item, idx) => (
                  <PointItem
                    key={idx}
                    active={true}
                    number={item.number}
                    title={item.content.title}
                    description={item.content.description}
                    thresholdStart={item.start}
                    thresholdEnd={item.end}
                    scrollProgress={scrollProgress}
                  />
                ))}
              </div>

              {/* Sticky Image Feature Preview Column */}
              <div className="hidden lg:flex flex-col justify-center items-center lg:w-[50%] relative h-[450px] md:h-[520px]">
                {items.map((item, idx) => {
                  const isVisible =
                    idx === 0
                      ? true
                      : scrollProgress >= item.start - 0.05;

                  return (
                    <Image
                      key={idx}
                      width={item.content.image.width}
                      height={item.content.image.height}
                      src={item.content.image.url}
                      alt={item.content.image.alt}
                      unoptimized
                      className={cn(
                        imageClass,
                        isVisible ? "opacity-100 scale-100 z-10" : "opacity-0 scale-95 z-0"
                      )}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Extended scroll track for smooth sticky reveal */}
          <div className="h-[350vh]" />
        </div>
      </div>
    </div>
  );
};

export default ScrollRevealContentA;

const getBarPercentageHeight = (
  scrollProgress: number,
  thresholdStart: number,
  thresholdEnd: number
) => {
  if (scrollProgress < thresholdStart) {
    return 0;
  }
  if (scrollProgress > thresholdEnd) {
    return 100;
  }
  return (
    ((scrollProgress - thresholdStart) / (thresholdEnd - thresholdStart)) * 100
  );
};

const PointItem = ({
  active,
  number,
  title,
  description,
  thresholdStart,
  thresholdEnd,
  scrollProgress,
}: {
  active: boolean;
  number: string;
  title: string;
  description: string;
  thresholdStart: number;
  thresholdEnd: number;
  scrollProgress: number;
}) => {
  const barHeightPercentage = getBarPercentageHeight(
    scrollProgress,
    thresholdStart,
    thresholdEnd
  );
  const isActive = barHeightPercentage > 0;

  return (
    <div
      className={cn(
        "flex flex-col interactive w-full transition-opacity duration-300",
        active ? "opacity-100" : "opacity-40"
      )}
    >
      <div className="w-full flex relative left-[16px]">
        <div className="w-[50px] flex items-start justify-center relative">
          <div className="h-full w-[2px] bg-white/10 absolute top-0 left-[50%] -translate-x-1/2" />
          <div
            className="h-full w-[2px] bg-[#7fc8ff] absolute top-0 left-[50%] -translate-x-1/2 transition-all duration-100"
            style={{ height: `${barHeightPercentage}%` }}
          />
        </div>
        <div className="w-[calc(100%-40px)] pl-4">
          <div className="flex flex-col gap-1">
            <span
              className={cn(
                "font-mono text-2xl md:text-3xl font-extrabold transition-opacity duration-300 mb-1",
                isActive ? "text-[#7fc8ff] opacity-100" : "text-gray-600 opacity-40"
              )}
            >
              {number}
            </span>
            <h3
              className={cn(
                defaultTitleClass,
                "transition-opacity duration-300",
                isActive ? "opacity-100 text-white" : "opacity-50 text-gray-400"
              )}
            >
              {title}
            </h3>
            <p
              className={cn(
                defaultDescriptionClass,
                "transition-opacity duration-300",
                isActive ? "opacity-100 text-gray-300" : "opacity-40 text-gray-500"
              )}
            >
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
