"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { useLocale } from "@/context/LocaleContext";

export function Waitlist() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px" });
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setEmail("");
      setName("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section ref={ref} id="waitlist" className="py-32 px-6 bg-[#FAF8FF] map-grid">
      <div className="max-w-xl mx-auto text-center">
        {/* Ambient glow */}
        <div className="absolute left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-400/15 blur-3xl rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative z-10"
        >
          <span className="inline-block text-violet-600 text-sm font-semibold tracking-widest uppercase mb-6 border border-violet-200 px-4 py-1.5 rounded-full bg-violet-50">
            {t.waitlist.badge}
          </span>

          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-stone-900 mb-4 leading-tight">
            {t.waitlist.heading}
          </h2>

          <p className="text-stone-600 text-lg mb-4 leading-relaxed">
            {t.waitlist.subheading}
          </p>
          <p className="text-stone-500 text-base mb-12">
            {t.waitlist.body}
          </p>

          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-violet-50 border border-violet-200 rounded-2xl p-8"
            >
              <p className="text-3xl mb-3">🗺️</p>
              <p className="text-violet-700 font-bold text-xl mb-2">{t.waitlist.successTitle}</p>
              <p className="text-stone-600 text-sm">{t.waitlist.successBody}</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder={t.waitlist.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl px-5 py-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-violet-400 transition-colors text-base"
              />
              <input
                type="email"
                placeholder={t.waitlist.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-stone-200 rounded-xl px-5 py-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-violet-400 transition-colors text-base"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full px-8 py-4 bg-violet-500 text-white font-bold rounded-xl text-base hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
              >
                {status === "loading" ? t.waitlist.submitting : t.waitlist.submit}
              </button>
              {status === "error" && (
                <p className="text-red-500 text-sm text-center">{t.waitlist.error}</p>
              )}
            </form>
          )}

          <p className="text-stone-400 text-xs mt-6">
            {t.waitlist.note}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
