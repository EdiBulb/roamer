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

      </div>
    </footer>
  );
}
