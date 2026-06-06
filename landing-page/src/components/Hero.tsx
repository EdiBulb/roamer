"use client";

import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden map-grid">
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-green-500/5 blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-6 z-10">
        <span className="text-lg font-bold tracking-tight text-stone-100">Roamer</span>
        <a
          href="#waitlist"
          className="text-sm font-medium text-green-400 border border-green-400/30 px-4 py-2 rounded-full hover:bg-green-400/10 transition-colors"
        >
          Join Beta
        </a>
      </nav>

      {/* Content */}
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-green-400 text-sm font-semibold tracking-widest uppercase mb-6 border border-green-400/20 px-4 py-1.5 rounded-full bg-green-400/5">
            Now in Closed Beta
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] text-stone-50 mb-6"
        >
          How many streets have you{" "}
          <span className="text-green-400">discovered?</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg sm:text-xl text-stone-400 max-w-xl mx-auto mb-10 leading-relaxed"
        >
          Stop running the same routes. Explore new streets, discover hidden
          corners of your city, and turn every run into an adventure.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
        >
          <a
            href="#waitlist"
            className="w-full sm:w-auto px-8 py-4 bg-green-400 text-black font-bold rounded-full text-base hover:bg-green-300 transition-colors shadow-lg shadow-green-400/20"
          >
            Join the Beta
          </a>
          <a
            href="#YOUTUBE_DEMO_URL"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 border border-stone-700 text-stone-300 font-medium rounded-full text-base hover:border-stone-500 hover:text-stone-100 transition-colors"
          >
            ▶ Watch Demo
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-sm text-stone-600"
        >
          No account required · Runs stay on your device
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-stone-600 tracking-widest uppercase">Explore</span>
        <div className="w-px h-8 bg-gradient-to-b from-stone-600 to-transparent" />
      </motion.div>
    </section>
  );
}
