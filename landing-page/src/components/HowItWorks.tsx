"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    number: "01",
    title: "Generate",
    description: "Choose a distance and generate a unique random route — a new path every time.",
  },
  {
    number: "02",
    title: "Explore",
    description: "Follow voice-guided navigation through unfamiliar streets you've never run before.",
  },
  {
    number: "03",
    title: "Discover",
    description: "Unlock new streets, earn badges, and build your personal exploration map of the city.",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px" });

  return (
    <section ref={ref} id="how-it-works" className="py-32 px-6 bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-green-400 text-sm font-semibold tracking-widest uppercase mb-6"
        >
          How It Works
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-black tracking-tight text-stone-50 mb-16 leading-tight"
        >
          Three steps to your next adventure.
        </motion.h2>

        <div className="space-y-6 mb-16">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.12 }}
              className="flex gap-6 items-start bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8"
            >
              <span className="text-5xl font-black text-green-400/30 leading-none shrink-0 w-12">
                {step.number}
              </span>
              <div>
                <h3 className="text-xl font-bold text-stone-100 mb-2">{step.title}</h3>
                <p className="text-stone-400 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <a
            href="#waitlist"
            className="inline-block px-10 py-4 bg-green-400 text-black font-bold rounded-full text-base hover:bg-green-300 transition-colors shadow-lg shadow-green-400/20"
          >
            Get Early Access
          </a>
        </motion.div>
      </div>
    </section>
  );
}
