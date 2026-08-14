"use client";

import { useLocale } from "@/context/LocaleContext";

export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="bg-[#FAF8FF] border-t border-stone-200 py-12 px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-stone-900 font-bold text-lg mb-1">Roamer</p>
          <p className="text-stone-500 text-sm">{t.footer.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
