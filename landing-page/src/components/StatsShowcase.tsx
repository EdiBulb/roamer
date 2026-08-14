"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLocale } from "@/context/LocaleContext";

const values = ["7", "124", "🏅", "83"];
const colors = ["text-violet-600", "text-violet-600", "text-yellow-500", "text-blue-500"];

export function StatsShowcase() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px" });
  const { t } = useLocale();

  return (
    <section ref={ref} className="py-24 px-6 bg-[#FAF8FF]">
      <div className="max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center text-stone-500 text-base mb-12"
        >
          {t.statsShowcase.subtitle}
        </motion.p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {t.statsShowcase.stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white border border-violet-100 rounded-2xl p-6 flex flex-col gap-2"
            >
              <span className={`text-4xl font-black ${colors[i]}`}>{values[i]}</span>
              <span className="text-stone-800 font-semibold text-sm leading-snug">{stat.label}</span>
              <span className="text-stone-400 text-xs">{stat.sub}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
