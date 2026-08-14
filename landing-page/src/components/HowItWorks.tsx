"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLocale } from "@/context/LocaleContext";

export function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px" });
  const { t } = useLocale();

  return (
    <section ref={ref} id="how-it-works" className="py-32 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-violet-600 text-sm font-semibold tracking-widest uppercase mb-6"
        >
          {t.howItWorks.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-black tracking-tight text-stone-900 mb-16 leading-tight"
        >
          {t.howItWorks.heading}
        </motion.h2>

        <div className="space-y-6 mb-16">
          {t.howItWorks.steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.12 }}
              className="flex gap-6 items-start bg-white border border-violet-100 rounded-2xl p-8 shadow-sm"
            >
              <span className="text-5xl font-black text-violet-200 leading-none shrink-0 w-12">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">{step.title}</h3>
                <p className="text-stone-500 leading-relaxed">{step.description}</p>
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
            className="inline-block px-10 py-4 bg-violet-500 text-white font-bold rounded-full text-base hover:bg-violet-600 transition-colors shadow-lg shadow-violet-500/25"
          >
            {t.howItWorks.cta}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
