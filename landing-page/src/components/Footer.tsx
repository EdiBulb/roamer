"use client";

import { useLocale } from "@/context/LocaleContext";

export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] py-12 px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-stone-100 font-bold text-lg mb-1">Roamer</p>
          <p className="text-stone-600 text-sm">{t.footer.tagline}</p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-stone-500">
          <a href="/privacy" className="hover:text-stone-300 transition-colors">{t.footer.privacy}</a>
          <a href="mailto:qudgns246@gmail.com" className="hover:text-stone-300 transition-colors">{t.footer.contact}</a>
          <a href="https://github.com/EdiBulb/roamer" target="_blank" rel="noopener noreferrer" className="hover:text-stone-300 transition-colors">GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
