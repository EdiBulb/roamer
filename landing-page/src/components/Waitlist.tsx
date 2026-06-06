"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

export function Waitlist() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
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
    <section ref={ref} id="waitlist" className="py-32 px-6 bg-[#0d0d0d] map-grid">
      <div className="max-w-xl mx-auto text-center">
        {/* Ambient glow */}
        <div className="absolute left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500/5 blur-3xl rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative z-10"
        >
          <span className="inline-block text-green-400 text-sm font-semibold tracking-widest uppercase mb-6 border border-green-400/20 px-4 py-1.5 rounded-full bg-green-400/5">
            Closed Beta
          </span>

          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-stone-50 mb-4 leading-tight">
            Become one of the first explorers.
          </h2>

          <p className="text-stone-400 text-lg mb-4 leading-relaxed">
            Roamer is currently in closed beta.
          </p>
          <p className="text-stone-500 text-base mb-12">
            Join the waitlist and help shape the future of exploration-focused running.
          </p>

          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-400/10 border border-green-400/30 rounded-2xl p-8"
            >
              <p className="text-3xl mb-3">🗺️</p>
              <p className="text-green-400 font-bold text-xl mb-2">You&apos;re on the list!</p>
              <p className="text-stone-400 text-sm">We&apos;ll reach out when your spot is ready. Start planning your first exploration.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded-xl px-5 py-4 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-green-400/50 transition-colors text-base"
              />
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded-xl px-5 py-4 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-green-400/50 transition-colors text-base"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full px-8 py-4 bg-green-400 text-black font-bold rounded-xl text-base hover:bg-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-400/20"
              >
                {status === "loading" ? "Joining..." : "Join the Beta"}
              </button>
              {status === "error" && (
                <p className="text-red-400 text-sm text-center">Something went wrong. Please try again.</p>
              )}
            </form>
          )}

          <p className="text-stone-700 text-xs mt-6">
            No spam. No account required. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
