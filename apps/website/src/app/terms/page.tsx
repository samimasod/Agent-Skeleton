import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Skeleton",
  description: "Read the Skeleton multi-tenant application skeleton terms.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#030710] text-white py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
        <h1 className="text-3xl font-extrabold font-display">Terms of Service</h1>
        <p className="text-xs text-gray-400 leading-relaxed">
          Skeleton is an open-source & enterprise multi-tenant application skeleton designed for high-performance SaaS and AI product development.
        </p>
      </div>
    </main>
  );
}
