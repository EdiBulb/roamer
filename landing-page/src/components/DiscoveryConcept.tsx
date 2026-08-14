"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLocale } from "@/context/LocaleContext";

export function DiscoveryConcept() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px" });
  const { t } = useLocale();

  return (
    <section ref={ref} className="py-32 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-violet-600 text-sm font-semibold tracking-widest uppercase mb-6"
        >
          {t.discoveryConcept.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-black tracking-tight text-stone-900 mb-8 leading-tight"
        >
          {t.discoveryConcept.heading}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-stone-500 mb-16 max-w-2xl leading-relaxed"
        >
          {t.discoveryConcept.subtitle}
        </motion.p>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-[#FAF8FF] border border-violet-100 rounded-2xl p-8"
          >
            <p className="text-stone-400 text-sm font-semibold tracking-widest uppercase mb-4">
              {t.discoveryConcept.otherLabel}
            </p>
            <p className="text-3xl font-black text-stone-300 line-through decoration-stone-300">
              {t.discoveryConcept.otherQuestion}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-violet-50 border border-violet-200 rounded-2xl p-8"
          >
            <p className="text-violet-600 text-sm font-semibold tracking-widest uppercase mb-4">
              {t.discoveryConcept.roamerLabel}
            </p>
            <p className="text-3xl font-black text-stone-900">
              {t.discoveryConcept.roamerQuestion}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
