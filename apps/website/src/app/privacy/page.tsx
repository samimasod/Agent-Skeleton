import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Skeleton",
  description: "Learn how Skeleton protects multi-tenant organization data and security.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#030710] text-white py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
        <h1 className="text-3xl font-extrabold font-display">Privacy Policy & Tenant Data Boundary</h1>
        <p className="text-xs text-gray-400 leading-relaxed">
          Skeleton enforces strict multi-tenant isolation via organization_id foreign keys and role-based authorization rules. Organization data is never shared across tenant boundaries.
        </p>
      </div>
    </main>
  );
}
