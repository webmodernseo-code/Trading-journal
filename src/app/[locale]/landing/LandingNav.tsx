'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';

export function LandingNav() {
  const t = useTranslations('landing.nav');
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const withoutLocale = pathname.replace(/^\/(fr|en)/, '') || '/';
  const currentLocale = pathname.startsWith('/en') ? 'en' : 'fr';

  return (
    <nav className="flex items-center border-b border-[rgba(255,255,255,0.06)] px-6 py-4 md:px-8">
      <div className="flex items-center gap-2 text-[15px] font-bold text-[#f9fafb]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 17L9 11L13 15L21 6" stroke="#ffa361" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 6H21V12" stroke="#ffa361" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t('brand')}
      </div>

      <div className="ml-11 hidden gap-6 text-[13px] text-[#6f7480] md:flex">
        <a href="#fonctionnalites" className="hover:text-[#f9fafb]">{t('features')}</a>
        <a href="#pricing" className="hover:text-[#f9fafb]">{t('pricing')}</a>
        <a href="#avis" className="hover:text-[#f9fafb]">{t('reviews')}</a>
        <a href="#faq" className="hover:text-[#f9fafb]">{t('faq')}</a>
      </div>

      <div className="ml-auto hidden items-center gap-3 md:flex">
        <div className="flex overflow-hidden rounded-md border border-[rgba(255,255,255,0.08)] text-[11px]">
          <Link href={`/fr${withoutLocale}`} className={`px-2 py-1 ${currentLocale === 'fr' ? 'bg-[#ffa361]/15 font-bold text-[#ffa361]' : 'text-[#6f7480]'}`}>FR</Link>
          <Link href={`/en${withoutLocale}`} className={`px-2 py-1 ${currentLocale === 'en' ? 'bg-[#ffa361]/15 font-bold text-[#ffa361]' : 'text-[#6f7480]'}`}>EN</Link>
        </div>
        <Link href="/login" className="text-[13px] text-[#c9c7d1]">{t('login')}</Link>
        <Link href="/register" className="rounded-md bg-[#ffa361] px-4 py-2 text-[12.5px] font-bold text-[#1a0e05]">{t('cta')}</Link>
      </div>

      <button
        type="button"
        aria-label={t('menuToggle')}
        onClick={() => setMobileOpen((open) => !open)}
        className="ml-auto text-[#f9fafb] md:hidden"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-[57px] z-10 flex flex-col gap-4 border-b border-[rgba(255,255,255,0.06)] bg-[#0a0c14] px-6 py-5 md:hidden">
          <a href="#fonctionnalites" className="text-sm text-[#c9c7d1]" onClick={() => setMobileOpen(false)}>{t('features')}</a>
          <a href="#pricing" className="text-sm text-[#c9c7d1]" onClick={() => setMobileOpen(false)}>{t('pricing')}</a>
          <a href="#avis" className="text-sm text-[#c9c7d1]" onClick={() => setMobileOpen(false)}>{t('reviews')}</a>
          <a href="#faq" className="text-sm text-[#c9c7d1]" onClick={() => setMobileOpen(false)}>{t('faq')}</a>
          <div className="flex gap-3 pt-2">
            <Link href={`/fr${withoutLocale}`} className={`text-sm ${currentLocale === 'fr' ? 'font-bold text-[#ffa361]' : 'text-[#6f7480]'}`}>FR</Link>
            <Link href={`/en${withoutLocale}`} className={`text-sm ${currentLocale === 'en' ? 'font-bold text-[#ffa361]' : 'text-[#6f7480]'}`}>EN</Link>
          </div>
          <Link href="/login" className="text-sm text-[#c9c7d1]">{t('login')}</Link>
          <Link href="/register" className="rounded-md bg-[#ffa361] px-4 py-2 text-center text-sm font-bold text-[#1a0e05]">{t('cta')}</Link>
        </div>
      )}
    </nav>
  );
}
