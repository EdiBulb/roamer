"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/context/LocaleContext";

export function Hero() {
  const { t, toggleLocale } = useLocale();

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden map-grid"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-violet-400/15 blur-3xl" />
      </div>

      {/* Nav */}
      <nav
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 z-10"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)', paddingBottom: '24px' }}
      >
        <span className="text-lg font-bold tracking-tight text-stone-900">{t.nav.brand}</span>
        <div className="flex items-center gap-3">
          <a
            href="#waitlist"
            className="text-sm font-medium text-violet-600 border border-violet-300 px-4 py-2 rounded-full hover:bg-violet-50 transition-colors"
          >
            {t.nav.joinBeta}
          </a>
          <button
            onClick={toggleLocale}
            className="text-sm font-medium text-stone-600 border border-stone-300 px-3 py-2 rounded-full hover:border-stone-400 hover:text-stone-800 transition-colors"
          >
            {t.nav.langToggle}
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-violet-600 text-sm font-semibold tracking-widest uppercase mb-6 border border-violet-200 px-4 py-1.5 rounded-full bg-violet-50">
            {t.hero.badge}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] text-stone-900 mb-6"
        >
          {t.hero.titleLine1}{" "}
          <span className="text-violet-600">{t.hero.titleHighlight}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg sm:text-xl text-stone-500 max-w-xl mx-auto mb-10 leading-relaxed"
        >
          {t.hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
        >
          <a
            href="#waitlist"
            className="w-full sm:w-auto px-8 py-4 bg-violet-500 text-white font-bold rounded-full text-base hover:bg-violet-600 transition-colors shadow-lg shadow-violet-500/25"
          >
            {t.hero.ctaPrimary}
          </a>
          <a
            href="https://youtube.com/shorts/voI3zFbGugE"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 border border-stone-300 text-stone-600 font-medium rounded-full text-base hover:border-stone-400 hover:text-stone-800 transition-colors"
          >
            {t.hero.ctaSecondary}
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-sm text-stone-400"
        >
          {t.hero.note}
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-stone-400 tracking-widest uppercase">{t.hero.scrollLabel}</span>
        <div className="w-px h-8 bg-gradient-to-b from-stone-400 to-transparent" />
      </motion.div>
    </section>
  );
}
