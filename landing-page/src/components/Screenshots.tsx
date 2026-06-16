"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const screens = [
  { label: "Route Generation", video: "/videos/route-generation.mp4" },
  { label: "Navigation", video: "/videos/navigation.mp4" },
  { label: "Street Discovery", video: "/videos/street-discovery.mp4" },
  { label: "Trail", video: "/videos/trail.mp4" },
];

export function Screenshots() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px" });

  return (
    <section ref={ref} className="py-32 px-6 bg-[#0d0d0d] overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-green-400 text-sm font-semibold tracking-widest uppercase mb-6"
        >
          The App
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-black tracking-tight text-stone-50 mb-16 leading-tight"
        >
          Built for the streets.
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {screens.map((screen, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.1 }}
              className="flex flex-col gap-3"
            >
              {/* Phone frame */}
              <div className="relative mx-auto w-full max-w-[160px]">
                <div className="bg-[#1a1a1a] border border-[#333] rounded-[32px] p-2 shadow-2xl">
                  <video
                    src={screen.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="rounded-[24px] aspect-[9/19] w-full object-cover"
                  />
                </div>
                {/* Notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-[#0a0a0a] rounded-full" />
              </div>
              <p className="text-center text-stone-500 text-xs font-medium">{screen.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
