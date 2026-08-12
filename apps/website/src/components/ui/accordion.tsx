"use client";

import React, { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextType {
  expandedValue: string | null;
  toggleValue: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextType>({
  expandedValue: null,
  toggleValue: () => {},
});

export interface AccordionProps {
  children: React.ReactNode;
  defaultValue?: string;
  className?: string;
}

export function Accordion({ children, defaultValue, className }: AccordionProps) {
  const [expandedValue, setExpandedValue] = useState<string | null>(defaultValue ?? null);

  const toggleValue = (value: string) => {
    setExpandedValue((prev) => (prev === value ? null : value));
  };

  return (
    <AccordionContext.Provider value={{ expandedValue, toggleValue }}>
      <div className={cn("divide-y divide-white/10", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export function AccordionItem({ children, value, className }: AccordionItemProps) {
  return (
    <div className={cn("py-2 transition-colors duration-200", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { value });
        }
        return child;
      })}
    </div>
  );
}

export interface AccordionTriggerProps {
  children: React.ReactNode;
  value?: string;
  className?: string;
}

export function AccordionTrigger({ children, value, className }: AccordionTriggerProps) {
  const { expandedValue, toggleValue } = useContext(AccordionContext);
  const isOpen = expandedValue === value;

  return (
    <button
      type="button"
      onClick={() => value && toggleValue(value)}
      className={cn(
        "flex w-full items-center justify-between py-5 px-1 text-left font-display text-lg sm:text-xl font-semibold text-white transition-all hover:text-[#7fc8ff]",
        className
      )}
    >
      {children}
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="ml-4 shrink-0 text-[#7fc8ff]"
      >
        <ChevronDown className="h-5 w-5" />
      </motion.div>
    </button>
  );
}

export interface AccordionContentProps {
  children: React.ReactNode;
  value?: string;
  className?: string;
}

export function AccordionContent({ children, value, className }: AccordionContentProps) {
  const { expandedValue } = useContext(AccordionContext);
  const isOpen = expandedValue === value;

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className={cn("pb-6 px-1 text-sm sm:text-base leading-relaxed text-gray-300", className)}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
