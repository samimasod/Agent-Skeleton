"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#030710] py-12 text-xs text-gray-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006ddd] text-white font-bold font-mono">
            S
          </div>
          <span className="font-bold text-white text-sm">Skeleton Multi-Tenant SaaS Platform</span>
        </div>
        <div>© {new Date().getFullYear()} Skeleton. Open Source & Enterprise Multi-Tenant Boilerplate.</div>
        <div className="flex gap-4 font-mono text-[11px]">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link href="/security" className="hover:text-white transition-colors">Security</Link>
        </div>
      </div>
    </footer>
  );
}
