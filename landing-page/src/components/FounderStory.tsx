"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function FounderStory() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-32 px-6 bg-[#0d0d0d]">
      <div className="max-w-3xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-green-400 text-sm font-semibold tracking-widest uppercase mb-6"
        >
          The Story
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-black tracking-tight text-stone-50 mb-12 leading-tight"
        >
          Built by a runner who got tired of running the same streets.
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
            {[
              "I was training and realized I was running the same routes every week.",
              "I wanted a way to make running feel fresh again — to actually see my city instead of just getting steps in.",
              "Roamer started with a simple question: how many streets have I never explored?",
              "Today, it's becoming a tool to help runners rediscover their cities, one street at a time.",
            ].map((text, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                className="text-lg text-stone-400 leading-relaxed"
              >
                {i === 2 ? (
                  <>
                    Roamer started with a simple question:{" "}
                    <span className="text-stone-100 italic">
                      how many streets have I never explored?
                    </span>
                  </>
                ) : (
                  text
                )}
              </motion.p>
            ))}

            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-stone-600 text-sm pt-2"
            >
              — Harry, founder of Roamer
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
