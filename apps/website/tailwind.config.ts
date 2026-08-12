import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-inter)", "Inter", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
      colors: {
        // LangChain exact design tokens — dark blues
        "lc-dark-900": "#030710",
        "lc-dark-800": "#0d1322",
        "lc-dark-700": "#161f34",
        "lc-dark-600": "#2f4b68",
        "lc-dark-500": "#40668d",
        "lc-dark-400": "#006ddd",
        // LangChain exact design tokens — light blues
        "lc-blue-900": "#7fc8ff",
        "lc-blue-800": "#99d3ff",
        "lc-blue-700": "#add9ff",
        "lc-blue-600": "#b2deff",
        "lc-blue-500": "#cce9ff",
        "lc-blue-400": "#e5f4ff",
        "lc-blue-300": "#f2faff",
        // Violet
        "lc-violet-400": "#beb4fd",
        "lc-violet-300": "#cfc8fe",
        "lc-violet-200": "#edeafd",
        "lc-violet-100": "#f8f7ff",
        // Green (body text)
        "lc-green-500": "#132d2d",
        "lc-green-400": "#1d3d3c",
        "lc-green-300": "#8b9c9c",
        // Strokes & muted
        "lc-stroke": "#dae1e6",
        "lc-white-60": "rgba(255,255,255,0.6)",
        "lc-white-16": "rgba(255,255,255,0.16)",
        "lc-black-60": "rgba(3,7,16,0.6)",
      },
      backgroundImage: {
        "grid-pattern": "radial-gradient(circle, #ffffff15 1px, transparent 1px)",
        "hero-glow": "radial-gradient(ellipse 80% 50% at 50% -20%, #006ddd33, transparent)",
        "cta-glow": "radial-gradient(ellipse 70% 60% at 50% 100%, #beb4fd22, transparent)",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        marquee: "marquee var(--duration) linear infinite",
        "marquee-reverse": "marquee-reverse var(--duration) linear infinite",
        "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
        shimmer: "shimmer 8s infinite",
        "animated-gradient": "animated-gradient 6s ease infinite",
        "blur-fade-in": "blur-fade-in 0.5s ease forwards",
        ripple: "ripple var(--duration,2s) ease calc(var(--i, 0)*.2s) infinite",
        "background-position-spin": "background-position-spin 3000ms infinite alternate",
        first: "moveVertical 30s ease infinite",
        second: "moveInCircle 20s reverse infinite",
        third: "moveInCircle 40s linear infinite",
        fourth: "moveHorizontal 40s ease infinite",
        fifth: "moveInCircle 20s ease infinite",
        meteor: "meteor 5s linear infinite",
        orbit: "orbit calc(var(--duration)*1s) linear infinite",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        "marquee-reverse": {
          from: { transform: "translateX(calc(-100% - var(--gap)))" },
          to: { transform: "translateX(0)" },
        },
        "border-beam": {
          "100%": { "offset-distance": "100%" },
        },
        shimmer: {
          "0%, 90%, 100%": { "background-position": "calc(-100% - var(--shimmer-width)) 0" },
          "30%, 60%": { "background-position": "calc(100% + var(--shimmer-width)) 0" },
        },
        "animated-gradient": {
          "0%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
          "100%": { "background-position": "0% 50%" },
        },
        "blur-fade-in": {
          from: { opacity: "0", filter: "blur(8px)", transform: "translateY(8px)" },
          to: { opacity: "1", filter: "blur(0)", transform: "translateY(0)" },
        },
        ripple: {
          "0%, 100%": { transform: "translate(-50%, -50%) scale(1)" },
          "50%": { transform: "translate(-50%, -50%) scale(0.9)" },
        },
        "background-position-spin": {
          "0%": { backgroundPosition: "top center" },
          "100%": { backgroundPosition: "bottom center" },
        },
        moveHorizontal: {
          "0%": { transform: "translateX(-50%) translateY(-10%)" },
          "50%": { transform: "translateX(50%) translateY(10%)" },
          "100%": { transform: "translateX(-50%) translateY(-10%)" },
        },
        moveInCircle: {
          "0%": { transform: "rotate(0deg)" },
          "50%": { transform: "rotate(180deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        moveVertical: {
          "0%": { transform: "translateY(-50%)" },
          "50%": { transform: "translateY(50%)" },
          "100%": { transform: "translateY(-50%)" },
        },
        meteor: {
          "0%": { transform: "rotate(215deg) translateX(0)", opacity: "1" },
          "70%": { opacity: "1" },
          "100%": { transform: "rotate(215deg) translateX(-500px)", opacity: "0" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg) translateY(calc(var(--radius) * 1px)) rotate(0deg)" },
          "100%": { transform: "rotate(360deg) translateY(calc(var(--radius) * 1px)) rotate(-360deg)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
