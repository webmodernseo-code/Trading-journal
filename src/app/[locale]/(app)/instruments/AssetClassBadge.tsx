'use client';

import { useTranslations } from 'next-intl';
import type { Instrument } from '@/db/schema';

const CLASS_STYLES: Record<Instrument['assetClass'], string> = {
  forex: 'bg-info-dim text-info',
  crypto: 'bg-warning-dim text-warning',
  commodity: 'bg-asset-commodity-dim text-asset-commodity',
  index: 'bg-asset-index-dim text-asset-index',
  other: 'bg-surface-2 text-text-muted',
};

export function AssetClassBadge({ assetClass }: { assetClass: Instrument['assetClass'] }) {
  const t = useTranslations('instruments');
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${CLASS_STYLES[assetClass]}`}>
      {t(`assetClassLabels.${assetClass}`)}
    </span>
  );
}
