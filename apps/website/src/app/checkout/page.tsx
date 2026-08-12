"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { ArrowLeft, Lock, ShieldCheck, CheckCircle2, CreditCard, ShoppingBag, Sparkles } from "lucide-react";

export default function CheckoutPage() {
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "customer@example.com",
    name: "Alex Mercer",
    company: "Acme SaaS Inc.",
    cardNumber: "4242 •••• •••• 4242",
    expDate: "12/28",
    cvc: "888",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCompleted(true);
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-[#030710] text-white">
      <Navbar />

      <section className="pt-36 pb-24 px-6 max-w-6xl mx-auto">
        <Link href="/catalog" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-[#7fc8ff] transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Return to Catalog
        </Link>

        {completed ? (
          <div className="max-w-xl mx-auto text-center bg-[#0d1527] border border-white/10 p-10 rounded-3xl shadow-2xl space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-white">Order Confirmed!</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Thank you for your order, <span className="text-white font-semibold">{formData.name}</span>. Receipt and access token sent to <span className="text-[#7fc8ff] font-semibold">{formData.email}</span>.
            </p>
            <div className="p-4 rounded-2xl bg-[#162238]/60 border border-white/5 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between text-gray-400"><span>Order ID:</span> <span className="text-white">ORD-2026-8841</span></div>
              <div className="flex justify-between text-gray-400"><span>Total Paid:</span> <span className="text-white font-bold">$149.00 USD</span></div>
              <div className="flex justify-between text-gray-400"><span>Access License:</span> <span className="text-emerald-400">Active</span></div>
            </div>
            <Link href="/catalog">
              <button className="w-full btn-primary-sleek py-3 text-xs font-bold">
                Continue Shopping in Catalog
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Guest Billing Form */}
            <div className="lg:col-span-7 bg-[#0d1527]/70 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#7fc8ff] uppercase tracking-wider mb-6">
                <Lock className="h-4 w-4" /> Guest Checkout & Payment
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#162238] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#006ddd]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#162238] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#006ddd]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1.5">Company (Optional)</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#162238] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#006ddd]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <label className="text-xs font-semibold text-gray-300 block mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#7fc8ff]" /> Card Payment Details
                  </label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      required
                      value={formData.cardNumber}
                      onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#162238] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#006ddd] font-mono"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={formData.expDate}
                        onChange={(e) => setFormData({ ...formData, expDate: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#162238] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#006ddd] font-mono"
                      />
                      <input
                        type="text"
                        required
                        value={formData.cvc}
                        onChange={(e) => setFormData({ ...formData, cvc: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#162238] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#006ddd] font-mono"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary-sleek py-3.5 text-sm font-bold flex items-center justify-center gap-2 mt-6"
                >
                  {loading ? "Processing Payment..." : "Complete Order ($149.00)"}
                </button>
              </form>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5 bg-[#0d1527]/50 border border-white/10 rounded-3xl p-8">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-[#7fc8ff]" /> Order Summary
              </h3>

              <div className="divide-y divide-white/10 text-xs">
                <div className="py-3 flex justify-between">
                  <span className="text-gray-300 font-medium">Enterprise Support AI Agent Engine</span>
                  <span className="text-white font-mono font-semibold">$149.00</span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-gray-400">Instant Access Fee</span>
                  <span className="text-emerald-400 font-mono font-semibold">FREE</span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-gray-400">Estimated Tax</span>
                  <span className="text-white font-mono">$0.00</span>
                </div>
                <div className="py-4 flex justify-between items-center text-sm">
                  <span className="text-white font-bold">Total Due</span>
                  <span className="text-2xl font-black text-[#7fc8ff]">$149.00</span>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-[#162238]/40 border border-white/5 space-y-2 text-[11px] text-gray-400">
                <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-[#7fc8ff]" /> 256-bit Encrypted SSL Payment</div>
                <div className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-[#7fc8ff]" /> Multi-Tenant License Included</div>
              </div>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
