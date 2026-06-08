"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const stats = [
  { value: "7", label: "New Streets Discovered", sub: "from today's run", color: "text-green-400" },
  { value: "124", label: "Streets Explored", sub: "total in your city", color: "text-green-400" },
  { value: "🏅", label: "Explorer Badge Earned", sub: "25+ streets milestone", color: "text-yellow-400" },
  { value: "68%", label: "Urban Nomad Progress", sub: "next badge at 100 streets", color: "text-blue-400" },
];

export function StatsShowcase() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px" });

  return (
    <section ref={ref} className="py-24 px-6 bg-[#0d0d0d]">
      <div className="max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center text-stone-500 text-base mb-12"
        >
          Every run adds to your exploration map
        </motion.p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 flex flex-col gap-2"
            >
              <span className={`text-4xl font-black ${stat.color}`}>{stat.value}</span>
              <span className="text-stone-100 font-semibold text-sm leading-snug">{stat.label}</span>
              <span className="text-stone-600 text-xs">{stat.sub}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
