"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function DiscoveryConcept() {
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
          The Concept
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-black tracking-tight text-stone-50 mb-8 leading-tight"
        >
          Every run uncovers something new.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-stone-400 mb-16 max-w-2xl leading-relaxed"
        >
          Roamer generates unique routes and tracks the streets you&apos;ve
          never explored before.
        </motion.p>

        {/* The reframe */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8"
          >
            <p className="text-stone-500 text-sm font-semibold tracking-widest uppercase mb-4">Other apps ask</p>
            <p className="text-3xl font-black text-stone-400 line-through decoration-stone-600">
              How fast did you run?
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-green-400/5 border border-green-400/20 rounded-2xl p-8"
          >
            <p className="text-green-400 text-sm font-semibold tracking-widest uppercase mb-4">Roamer asks</p>
            <p className="text-3xl font-black text-stone-50">
              How many new streets did you discover today?
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
