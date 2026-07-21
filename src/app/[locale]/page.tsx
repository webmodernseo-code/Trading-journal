import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('home');
  return <main className="p-8">{t('scaffolding')}</main>;
}
