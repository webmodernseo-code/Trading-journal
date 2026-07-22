'use client';

import { useTranslations } from 'next-intl';
import { uploadScreenshot } from './actions';

export function ScreenshotUpload({ tradeId }: { tradeId: string }) {
  const t = useTranslations('trades');
  return (
    <form
      action={(formData) => uploadScreenshot(tradeId, formData)}
      className="flex items-end gap-3 rounded-md border border-border-subtle p-3"
    >
      <label className="text-sm text-text-muted">
        {t('screenshot')}
        <input name="file" type="file" accept="image/png,image/jpeg" required className="mt-1 block text-text-primary" />
      </label>
      <label className="text-sm text-text-muted">
        {t('caption')}
        <input name="caption" className="mt-1 block rounded-md bg-bg p-2 text-text-primary" />
      </label>
      <button type="submit" className="rounded-md bg-cta px-4 py-2 font-bold text-bg">
        {t('upload')}
      </button>
    </form>
  );
}
