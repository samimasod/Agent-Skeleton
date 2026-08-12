"use client";

import { useState } from "react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { Mail, Send, CheckCircle2, MessageSquare, Building2, Users } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    teamSize: "1-10",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-[#030710] text-white">
      <Navbar />

      <section className="pt-36 pb-16 px-6 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-white">
          Get in Touch with Our Team
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-gray-400">
          Have questions about multi-tenant architecture, enterprise licensing, or custom agent development?
        </p>
      </section>

      <section className="px-6 max-w-2xl mx-auto pb-24">
        {submitted ? (
          <div className="text-center bg-[#0d1527] border border-white/10 p-10 rounded-3xl shadow-2xl space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
            <h3 className="text-2xl font-extrabold text-white">Inquiry Received!</h3>
            <p className="text-xs text-gray-400">
              Thank you, <span className="text-white font-semibold">{formData.name}</span>. Our team will reach out to <span className="text-[#7fc8ff]">{formData.email}</span> within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#0d1527]/70 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-5">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1.5">Full Name</label>
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#162238] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#006ddd]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1.5">Work Email</label>
              <input
                type="email"
                required
                placeholder="jane@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#162238] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#006ddd]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1.5">Message / Inquiry</label>
              <textarea
                required
                rows={4}
                placeholder="Tell us about your project requirements..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#162238] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#006ddd]"
              />
            </div>

            <button type="submit" className="w-full btn-primary-sleek py-3.5 text-xs font-bold flex items-center justify-center gap-2">
              <Send className="h-4 w-4" /> Send Inquiry
            </button>
          </form>
        )}
      </section>

      <Footer />
    </main>
  );
}
