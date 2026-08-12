"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import GlassSurface from "@/components/GlassSurface";

export function Navbar() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173";
  const adminUrl = "http://localhost:3002";

  return (
    <header className="fixed top-5 inset-x-0 z-50 mx-auto w-[calc(100%-2rem)] max-w-6xl">
      <GlassSurface
        width="100%"
        height={64}
        borderRadius={9999}
        borderWidth={0.08}
        brightness={60}
        opacity={0.85}
        blur={14}
        displace={3}
        backgroundOpacity={0.15}
        distortionScale={-140}
        className="shadow-2xl !bg-[#161f34]/40 border border-white/10"
      >
        <div className="flex w-full h-full items-center justify-between px-6 sm:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/logo.svg"
              alt="Agent-Skeleton Logo"
              className="h-9 w-9 rounded-xl shadow-lg shadow-[#006ddd]/40 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-sans text-xl font-extrabold tracking-tight text-white group-hover:text-[#7fc8ff] transition-colors flex items-center gap-2">
                Skeleton
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#006ddd]/20 text-[#7fc8ff] border border-[#006ddd]/30">
                  v0.1.0
                </span>
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <Link href="/catalog" className="hover:text-[#7fc8ff] transition-colors">
              Catalog
            </Link>
            <Link href="/blog" className="hover:text-[#7fc8ff] transition-colors">
              Blog
            </Link>
            <Link href="/docs" className="hover:text-[#7fc8ff] transition-colors">
              Docs
            </Link>
            <Link href="/status" className="hover:text-[#7fc8ff] transition-colors">
              Status
            </Link>
            <Link href="/contact" className="hover:text-[#7fc8ff] transition-colors">
              Contact
            </Link>
            <a href={adminUrl} target="_blank" rel="noreferrer" className="text-[#beb4fd] hover:text-white transition-colors flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#beb4fd]" /> Admin
            </a>
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-4">
            <a
              href={`${appUrl}`}
              className="hidden sm:inline-flex text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Open SaaS Dashboard
            </a>
            <a href={`${appUrl}`}>
              <button className="btn-primary-sleek !py-2 !px-5 text-xs sm:text-sm group flex items-center gap-2">
                Get Started <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </a>
          </div>
        </div>
      </GlassSurface>
    </header>
  );
}
