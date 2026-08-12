"use client";

import { InfiniteMovingCards } from "@/components/aceternity/infinite-moving-cards";

const testimonials = [
  {
    quote: "OpenSwitch generated a custom resume for a Senior Architect role at Atlassian that scored 99% on ATS. I landed an interview within 48 hours and got the offer!",
    name: "Sarah Jenkins",
    title: "Senior Software Architect",
    company: "Atlassian",
  },
  {
    quote: "Applying to 50 jobs used to take me all weekend. With OpenSwitch's human-in-the-loop auto-apply, I approved 40 tailored applications in 15 minutes.",
    name: "Marcus Vance",
    title: "Product Manager",
    company: "Datadog",
  },
  {
    quote: "The master resume feature is revolutionary. It keeps all my projects, metrics, and achievements organized, then pulls only the most relevant bullets for each job.",
    name: "Priya Sharma",
    title: "Lead Data Engineer",
    company: "Canva",
  },
  {
    quote: "I was skeptical about automated applying, but OpenSwitch's human approval step gave me total peace of mind. Every cover letter sounded exactly like me.",
    name: "David Kim",
    title: "DevOps Engineer",
    company: "Stripe",
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative py-24 bg-[#030710] overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center mb-12">
        <p className="eyebrow mb-2">Success Stories</p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
          Loved by Job Switchers Worldwide
        </h2>
      </div>

      <div className="flex justify-center">
        <InfiniteMovingCards items={testimonials} direction="left" speed="normal" />
      </div>
    </section>
  );
}
