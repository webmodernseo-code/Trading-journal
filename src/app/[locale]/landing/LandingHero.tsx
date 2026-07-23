import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { playfairItalic } from '../fonts';

export async function LandingHero() {
  const t = await getTranslations('landing.hero');

  return (
    <section className="bg-[radial-gradient(circle_at_25%_0%,rgba(255,163,97,0.10),transparent_45%)] px-6 py-16 text-center md:py-24">
      <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ffa361]">
        {t('eyebrow')}
      </div>
      <h1 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight text-[#f9fafb] md:text-4xl">
        {t('titleLine1')}
      </h1>
      <p className={`${playfairItalic.className} mt-1 text-2xl text-[#ffa361] md:text-3xl`}>
        {t('titleLine2')}
      </p>
      <p className="mx-auto mt-6 max-w-md text-[13.5px] leading-relaxed text-[#9ca3af]">
        {t('subtitle')}
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/register" className="rounded-md bg-[#ffa361] px-6 py-3 text-[13px] font-bold text-[#1a0e05]">
          {t('ctaPrimary')}
        </Link>
        <a href="#fonctionnalites" className="rounded-md border border-[rgba(255,255,255,0.15)] px-6 py-3 text-[13px] font-semibold text-[#f9fafb]">
          {t('ctaSecondary')}
        </a>
      </div>
    </section>
  );
}
