import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ExpandableSurface } from '../components/shared/ExpandableSurface';
import { PlatformLabel } from '../components/shared/PlatformIcon';
import { EmptyState } from '../components/shared/States';
import { PLATFORM_LIST, PLATFORM_META } from '../data/metricRegistry';
import { getPreviousEquivalentRange } from '../services/apiClient';
import type {
  DateRangeSelection,
  PlatformId,
  SocialMonitorDataset,
} from '../types/social';
import { formatCompactNumber, formatDeltaPct, formatNumber, formatShortDate } from '../utils/format';

interface ComparePageProps {
  dataset: SocialMonitorDataset;
  dateRange: DateRangeSelection;
  onInspectPlatform: (platform: PlatformId) => void;
  onOpenAccounts: () => void;
  onOpenSettings: () => void;
}

export const ComparePage: React.FC<ComparePageProps> = ({
  dataset,
  dateRange,
  onInspectPlatform,
  onOpenAccounts,
  onOpenSettings,
}) => {
  const [showIndexed, setShowIndexed] = useState(false);
  const prevRange = useMemo(() => getPreviousEquivalentRange(dateRange), [dateRange]);

  const rows = useMemo(() => {
    return PLATFORM_LIST.map((pid) => {
      const curSeries = dataset.dailySeries.filter(
        (p) => p.platform === pid && p.date >= dateRange.startDate && p.date <= dateRange.endDate
      );
      const prevSeries = dataset.dailySeries.filter(
        (p) => p.platform === pid && p.date >= prevRange.startDate && p.date <= prevRange.endDate
      );

      const sumField = (
        arr: typeof curSeries,
        getter: (p: (typeof curSeries)[number]) => number | null
      ): number | null => {
        let has = false;
        let sum = 0;
        for (const p of arr) {
          const v = getter(p);
          if (v !== null) {
            has = true;
            sum += v;
          }
        }
        return has ? sum : null;
      };

      const avgField = (
        arr: typeof curSeries,
        getter: (p: (typeof curSeries)[number]) => number | null
      ): number | null => {
        let count = 0;
        let sum = 0;
        for (const p of arr) {
          const v = getter(p);
          if (v !== null) {
            count += 1;
            sum += v;
          }
        }
        return count > 0 ? Math.round(sum / count) : null;
      };

      const account = dataset.accounts.find((a) => a.platform === pid);

      return {
        platform: pid,
        audienceNoun: PLATFORM_META[pid].audienceNoun,
        audienceCount: account?.audienceCount ?? null,
        views: sumField(curSeries, (p) => p.views),
        prevViews: sumField(prevSeries, (p) => p.views),
        impressions: sumField(curSeries, (p) => p.impressions),
        prevImpressions: sumField(prevSeries, (p) => p.impressions),
        avgDailyReach: avgField(curSeries, (p) => p.reach),
        interactions: sumField(curSeries, (p) => p.interactions),
        prevInteractions: sumField(prevSeries, (p) => p.interactions),
        netAudience: sumField(curSeries, (p) => p.netAudienceChange),
        prevNetAudience: sumField(prevSeries, (p) => p.netAudienceChange),
        posts: curSeries.length > 0 ? curSeries.reduce((a, p) => a + p.postsPublished, 0) : null,
      };
    });
  }, [dataset, dateRange, prevRange]);

  const fmt = (cur: number | null, prev: number | null) => {
    if (cur === null) return '—';
    if (showIndexed) {
      if (prev === null || prev <= 0) return '—';
      return `${((cur / prev) * 100).toFixed(0)} idx`;
    }
    return formatCompactNumber(cur);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-display font-bold text-[#FFFFFF]">Compare</h1>
          <span className="text-xs font-mono text-[#666666]">
            {formatShortDate(dateRange.startDate)} – {formatShortDate(dateRange.endDate)}
          </span>
        </div>

        <div className="inline-flex items-center bg-[#0A0A0A] border border-[#1F1F1F] rounded-md p-0.5">
          <button
            type="button"
            onClick={() => setShowIndexed(false)}
            className={`px-3 py-1 text-xs font-medium rounded cursor-pointer ${
              !showIndexed ? 'bg-[#FFFFFF] text-[#000000]' : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
            }`}
          >
            Native
          </button>
          <button
            type="button"
            onClick={() => setShowIndexed(true)}
            className={`px-3 py-1 text-xs font-medium rounded cursor-pointer ${
              showIndexed ? 'bg-[#FFFFFF] text-[#000000]' : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
            }`}
          >
            Base 100
          </button>
        </div>
      </div>

      {dataset.dailySeries.length === 0 ? (
        <EmptyState
          title="No data to compare yet"
          description="Connect your platforms via n8n and sync daily observations to compare cross-platform performance side by side."
          actionLabel="Open Accounts"
          onAction={onOpenAccounts}
          secondaryLabel="Configure API"
          onSecondaryAction={onOpenSettings}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {rows.map((r) => {
            const viewsDelta = formatDeltaPct(r.views, r.prevViews);
            const actionsDelta = formatDeltaPct(r.interactions, r.prevInteractions);

            return (
              <ExpandableSurface
                key={r.platform}
                mode="overlay"
                className="p-5"
                scaleOnHover={1.018}
                ariaLabel={`Compare ${PLATFORM_META[r.platform].name}. Hover or click for detailed metrics.`}
                expandedContent={
                  <div className="space-y-2.5 text-xs font-mono tabular-nums">
                    <div className="flex justify-between">
                      <span className="font-sans text-[#666666]">Impressions</span>
                      <span className="text-[#D4D4D4]">{formatNumber(r.impressions)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-[#666666]">Avg Daily Reach</span>
                      <span className="text-[#D4D4D4]">{formatNumber(r.avgDailyReach)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-[#666666]">Net {r.audienceNoun}</span>
                      <span className="text-[#FFFFFF]">
                        {r.netAudience !== null ? `+${formatNumber(r.netAudience)}` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-[#666666]">Published Items</span>
                      <span className="text-[#D4D4D4]">{formatNumber(r.posts)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-[#666666]">Views / Actions Δ</span>
                      <span className="text-[#A3A3A3]">
                        {viewsDelta.label} / {actionsDelta.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onInspectPlatform(r.platform)}
                      className="w-full mt-2 inline-flex items-center justify-between px-3 py-1.5 rounded bg-[#FFFFFF] text-[#000000] font-sans text-xs font-medium cursor-pointer"
                    >
                      <span>Open {PLATFORM_META[r.platform].name} Analytics</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </div>
                }
              >
                <div className="flex items-center justify-between pr-8">
                  <PlatformLabel platform={r.platform} />
                  <span className="text-xs font-mono text-[#737373]">
                    {formatCompactNumber(r.audienceCount)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 font-mono tabular-nums">
                  <div>
                    <span className="text-[10px] font-sans text-[#666666] block">Views</span>
                    <span className="text-lg font-semibold text-[#FFFFFF]">
                      {fmt(r.views, r.prevViews)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans text-[#666666] block">Interactions</span>
                    <span className="text-lg font-semibold text-[#D4D4D4]">
                      {fmt(r.interactions, r.prevInteractions)}
                    </span>
                  </div>
                </div>
              </ExpandableSurface>
            );
          })}
        </div>
      )}
    </div>
  );
};
