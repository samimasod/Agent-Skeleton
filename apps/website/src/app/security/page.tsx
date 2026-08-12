import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Overview — Skeleton",
  description: "Learn about Skeleton multi-tenant security architecture.",
};

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-[#030710] text-white py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
        <h1 className="text-3xl font-extrabold font-display">Security Architecture & RBAC</h1>
        <p className="text-xs text-gray-400 leading-relaxed">
          Skeleton incorporates Firebase ID token verification, role permissions (Owner, Admin, Member, Viewer, Super Admin), and configurable SuperAdmin API Key authentication middleware.
        </p>
      </div>
    </main>
  );
}
