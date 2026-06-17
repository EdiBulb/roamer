"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLocale } from "@/context/LocaleContext";

export function FounderStory() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px" });
  const { t } = useLocale();
  const p = t.founderStory.paragraphs;

  return (
    <section ref={ref} className="py-32 px-6 bg-[#0d0d0d]">
      <div className="max-w-3xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-green-400 text-sm font-semibold tracking-widest uppercase mb-6"
        >
          {t.founderStory.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-black tracking-tight text-stone-50 mb-12 leading-tight"
        >
          {t.founderStory.heading}
        </motion.h2>

        <div className="flex flex-col sm:flex-row gap-10 items-start">
          {/* Founder photo placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="shrink-0"
          >
            <div className="w-24 h-24 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-4xl">
              🏃
            </div>
          </motion.div>

          <div className="space-y-5">
            {[p[0], p[1], null, p[4]].map((text, i) => {
              if (i === 2) {
                return (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                    className="text-lg text-stone-400 leading-relaxed"
                  >
                    {p[2]}{" "}
                    <span className="text-stone-100 italic">{p[3]}</span>
                  </motion.p>
                );
              }
              return (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                  className="text-lg text-stone-400 leading-relaxed"
                >
                  {text}
                </motion.p>
              );
            })}

            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-stone-600 text-sm pt-2"
            >
              {t.founderStory.credit}
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
