import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function LandingFooter() {
  const t = await getTranslations('landing.footer');

  return (
    <>
      <section className="bg-[radial-gradient(circle_at_75%_100%,rgba(255,163,97,0.10),transparent_45%)] px-6 py-16 text-center">
        <h2 className="mb-5 text-xl font-extrabold text-[#f9fafb] md:text-2xl">{t('ctaTitle')}</h2>
        <Link href="/register" className="inline-block rounded-md bg-[#ffa361] px-7 py-3 text-[13px] font-bold text-[#1a0e05]">
          {t('ctaButton')}
        </Link>
      </section>

      <footer className="border-t border-[rgba(255,255,255,0.06)] px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 text-[12px] text-[#6f7480] sm:flex-row">
          <p>{t('copyright')}</p>
          <div className="flex gap-5">
            <span>{t('legalNotice')}</span>
            <span>{t('privacy')}</span>
            <a href="mailto:contact@journal-trading.app">{t('contact')}</a>
          </div>
        </div>
      </footer>
    </>
  );
}
