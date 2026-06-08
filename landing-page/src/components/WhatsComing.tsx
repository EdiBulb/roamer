"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const features = [
  { icon: "🗺️", title: "Discovery Heatmap", desc: "Visualize every street you've ever explored across your entire city." },
  { icon: "🏆", title: "Monthly Discovery Challenges", desc: "Compete with yourself. Explore a new neighborhood each month." },
  { icon: "🎖️", title: "More Exploration Rewards", desc: "New badges, milestones, and achievements for dedicated explorers." },
  { icon: "💬", title: "Shaped by Beta Users", desc: "Your feedback directly influences what gets built next." },
];

export function WhatsComing() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px" });

  return (
    <section ref={ref} className="py-32 px-6 bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-green-400 text-sm font-semibold tracking-widest uppercase mb-6"
        >
          What&apos;s Coming
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-black tracking-tight text-stone-50 mb-4 leading-tight"
        >
          The exploration is just beginning.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-stone-400 text-lg mb-16"
        >
          Beta users help shape the future of Roamer.
        </motion.p>

        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
              className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 flex gap-4 items-start"
            >
              <span className="text-2xl shrink-0">{f.icon}</span>
              <div>
                <h3 className="text-stone-100 font-semibold mb-1">{f.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
