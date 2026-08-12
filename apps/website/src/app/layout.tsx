import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skeleton — Production-Grade Multi-Tenant SaaS & AI Application Platform",
  description:
    "Accelerate SaaS and AI product development with built-in tenant isolation, multi-cloud database & storage connectivity (GCP, AWS, Local), real-time WebSocket AI Agent orchestration, and automated end-to-end type safety.",
  keywords: [
    "Multi-tenant application skeleton",
    "SaaS boilerplate",
    "FastAPI multi-tenant",
    "React 19 Vite skeleton",
    "AI Agent framework",
    "OpenRouter OpenAI integration",
    "Alembic database migrations",
    "Multi-cloud SaaS",
  ],
  authors: [{ name: "Skeleton Platform Team" }],
  openGraph: {
    title: "Skeleton — Production-Grade Multi-Tenant SaaS & AI Platform Skeleton",
    description:
      "Accelerate SaaS & AI product development with built-in organization tenant isolation, multi-cloud database & storage connectivity (GCP, AWS, Local), real-time WebSocket AI Agent orchestration, and automated type safety.",
    siteName: "Skeleton",
    type: "website",
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-[#030710] text-white selection:bg-blue-500 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
