"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const traditional = ["Distance & Pace", "Performance Metrics", "Speed Records", "Competition"];
const roamer = ["Streets Discovered", "City Exploration", "New Adventures", "Personal Discovery"];

export function WhyDifferent() {
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
          Why Roamer
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-black tracking-tight text-stone-50 mb-16 leading-tight"
        >
          A different kind of running app.
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Traditional */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8"
          >
            <h3 className="text-stone-500 font-semibold text-sm tracking-widest uppercase mb-6">
              Traditional Running Apps
            </h3>
            <ul className="space-y-3">
              {traditional.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-stone-500">
                  <span className="text-stone-700">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Roamer */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-green-400/5 border border-green-400/20 rounded-2xl p-8"
          >
            <h3 className="text-green-400 font-semibold text-sm tracking-widest uppercase mb-6">
              Roamer
            </h3>
            <ul className="space-y-3">
              {roamer.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-stone-100">
                  <span className="text-green-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Privacy callout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center shrink-0 text-lg">
            🔒
          </div>
          <div>
            <p className="text-stone-100 font-semibold mb-1">Privacy-first by design</p>
            <p className="text-stone-500 text-sm">
              No social tracking. No unnecessary accounts. Your exploration stays on your device.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
