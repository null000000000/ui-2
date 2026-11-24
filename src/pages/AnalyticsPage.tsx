import React, { useMemo } from 'react';
import { TrendChart } from '../components/charts/TrendChart';
import { ExpandableSurface } from '../components/shared/ExpandableSurface';
import { MetricCard } from '../components/shared/MetricCard';
import { PlatformIcon } from '../components/shared/PlatformIcon';
import { EmptyState } from '../components/shared/States';
import {
  METRIC_REGISTRY,
  PLATFORM_LIST,
  PLATFORM_META,
  getMetricUnavailableReason,
  isMetricSupportedOnPlatform,
} from '../data/metricRegistry';
import { getPreviousEquivalentRange } from '../services/apiClient';
import type {
  CanonicalMetricKey,
  DailySeriesPoint,
  DateRangeSelection,
  PlatformFilter,
  SocialMonitorDataset,
} from '../types/social';
import { formatCompactNumber, formatShortDate } from '../utils/format';

interface AnalyticsPageProps {
  dataset: SocialMonitorDataset;
  platformFilter: PlatformFilter;
  onChangePlatform: (platform: PlatformFilter) => void;
  dateRange: DateRangeSelection;
  selectedMetric: CanonicalMetricKey;
  onSelectMetric: (metric: CanonicalMetricKey) => void;
  onSelectContent: (contentId: string) => void;
  onOpenAccounts: () => void;
  onOpenSettings: () => void;
}

const ALL_METRICS_FOR_PLATFORM: CanonicalMetricKey[] = [
  'platform_views',
  'impressions',
  'reach',
  'content_interactions',
  'watch_time_minutes',
  'profile_visits',
  'link_clicks',
  'net_audience_change',
];

function extractSum(series: DailySeriesPoint[], key: CanonicalMetricKey): number | null {
  let has = false;
  let total = 0;
  let count = 0;
  for (const p of series) {
    let val: number | null = null;
    if (key === 'platform_views') val = p.views;
    else if (key === 'reach') val = p.reach;
    else if (key === 'impressions') val = p.impressions;
    else if (key === 'content_interactions') val = p.interactions;
    else if (key === 'watch_time_minutes') val = p.watchTimeMinutes;
    else if (key === 'profile_visits') val = p.profileVisits;
    else if (key === 'link_clicks') val = p.linkClicks;
    else if (key === 'net_audience_change') val = p.netAudienceChange;

    if (val !== null) {
      has = true;
      total += val;
      count += 1;
    }
  }
  if (!has) return null;
  if (key === 'reach') return Math.round(total / count);
  return total;
}

function dailyValues(series: DailySeriesPoint[], key: CanonicalMetricKey): number[] {
  const map = new Map<string, number>();
  for (const p of series) {
    let val: number | null = null;
    if (key === 'platform_views') val = p.views;
    else if (key === 'reach') val = p.reach;
    else if (key === 'impressions') val = p.impressions;
    else if (key === 'content_interactions') val = p.interactions;
    else if (key === 'watch_time_minutes') val = p.watchTimeMinutes;
    else if (key === 'profile_visits') val = p.profileVisits;
    else if (key === 'link_clicks') val = p.linkClicks;
    else if (key === 'net_audience_change') val = p.netAudienceChange;
    if (val !== null) map.set(p.date, (map.get(p.date) ?? 0) + val);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  dataset,
  platformFilter,
  onChangePlatform,
  dateRange,
  selectedMetric,
  onSelectMetric,
  onSelectContent,
  onOpenAccounts,
  onOpenSettings,
}) => {
  const prevRange = useMemo(() => getPreviousEquivalentRange(dateRange), [dateRange]);

  const series = useMemo(
    () =>
      dataset.dailySeries.filter(
        (p) =>
          (platformFilter === 'all' || p.platform === platformFilter) &&
          p.date >= dateRange.startDate &&
          p.date <= dateRange.endDate
      ),
    [dataset.dailySeries, platformFilter, dateRange]
  );

  const prevSeries = useMemo(
    () =>
      dataset.dailySeries.filter(
        (p) =>
          (platformFilter === 'all' || p.platform === platformFilter) &&
          p.date >= prevRange.startDate &&
          p.date <= prevRange.endDate
      ),
    [dataset.dailySeries, platformFilter, prevRange]
  );

  const platformContent = useMemo(
    () =>
      dataset.content
        .filter((c) => platformFilter === 'all' || c.platform === platformFilter)
        .sort((a, b) => (b.metrics.views ?? b.metrics.impressions ?? 0) - (a.metrics.views ?? a.metrics.impressions ?? 0)),
    [dataset.content, platformFilter]
  );

  const supportedMetrics = useMemo(() => {
    if (platformFilter === 'all') return ALL_METRICS_FOR_PLATFORM.slice(0, 4);
    return ALL_METRICS_FOR_PLATFORM.filter((k) =>
      isMetricSupportedOnPlatform(k, platformFilter)
    ).slice(0, 4);
  }, [platformFilter]);

  const unsupportedMetrics = useMemo(() => {
    if (platformFilter === 'all') return [];
    return ALL_METRICS_FOR_PLATFORM.filter(
      (k) => !isMetricSupportedOnPlatform(k, platformFilter)
    );
  }, [platformFilter]);

  return (
    <div className="space-y-6">
      {/* Header & Platform Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-display font-bold text-[#FFFFFF]">
          {platformFilter === 'all'
            ? 'Analytics'
            : PLATFORM_META[platformFilter].name}
        </h1>

        <div className="flex items-center gap-1 bg-[#0E1012] border border-[#22252A] rounded-md p-1 overflow-x-auto max-w-full flex-nowrap sm:flex-wrap">
          <button
            type="button"
            onClick={() => onChangePlatform('all')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer shrink-0 ${
              platformFilter === 'all'
                ? 'bg-[#FFFFFF] text-[#000000]'
                : 'text-[#8E96A0] hover:text-[#FFFFFF]'
            }`}
          >
            All
          </button>
          {PLATFORM_LIST.map((pid) => (
            <button
              key={pid}
              type="button"
              onClick={() => onChangePlatform(pid)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                platformFilter === pid
                  ? 'bg-[#FFFFFF] text-[#000000]'
                  : 'text-[#8E96A0] hover:text-[#FFFFFF]'
              }`}
            >
              <PlatformIcon platform={pid} className="w-3.5 h-3.5 shrink-0" />
              <span>{PLATFORM_META[pid].shortName}</span>
            </button>
          ))}
        </div>
      </div>

      {series.length === 0 ? (
        <EmptyState
          title="No analytics data in this range"
          description="Connect your platforms via n8n and configure your backend endpoint to populate daily time-series metrics."
          actionLabel="Open Accounts"
          onAction={onOpenAccounts}
          secondaryLabel="Configure API"
          onSecondaryAction={onOpenSettings}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {supportedMetrics.map((metricKey) => {
              const entry = METRIC_REGISTRY[metricKey];
              return (
                <MetricCard
                  key={metricKey}
                  metricKey={metricKey}
                  titleOverride={metricKey === 'reach' ? 'Avg Daily Reach' : entry.shortLabel}
                  value={extractSum(series, metricKey)}
                  previousValue={extractSum(prevSeries, metricKey)}
                  unitLabel={metricKey === 'watch_time_minutes' ? 'min' : undefined}
                  sparkline={dailyValues(series, metricKey)}
                  platformFilter={platformFilter}
                  lastCollectedAt={dataset.lastFetchedAt}
                  onDrillDown={() => onSelectMetric(metricKey)}
                />
              );
            })}
          </div>

          <TrendChart
            series={series}
            previousSeries={prevSeries}
            platformFilter={platformFilter}
            dateRange={dateRange}
            selectedMetric={selectedMetric}
            onSelectMetric={onSelectMetric}
            title="Trend"
            height={280}
          />

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            <div className="xl:col-span-8">
              <ExpandableSurface
                className="p-5"
                scaleOnHover={1.008}
                ariaLabel="Platform content ranking. Hover or click to view all posts."
                expandedContent={
                  <div className="space-y-2">
                    {platformContent.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectContent(item.id)}
                        className="w-full text-left p-2.5 rounded bg-[#080808] hover:bg-[#1A1A1A] border border-[#1C1C1C] flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-[#FFFFFF] truncate">
                            {item.title}
                          </div>
                          <div className="text-[10px] font-mono text-[#666666]">
                            {item.contentType} · {formatShortDate(item.publishedAt)}
                          </div>
                        </div>
                        <span className="text-xs font-mono tabular-nums text-[#FFFFFF] shrink-0">
                          {formatCompactNumber(item.metrics.views ?? item.metrics.impressions)}
                        </span>
                      </button>
                    ))}
                  </div>
                }
              >
                <div className="flex items-baseline justify-between gap-2 pr-8">
                  <h2 className="text-sm font-display font-semibold text-[#FFFFFF]">
                    Content Performance
                  </h2>
                  <span className="text-xs font-mono text-[#737373]">
                    {platformContent.length} items
                  </span>
                </div>
                {platformContent[0] && (
                  <div className="mt-3 flex items-baseline justify-between gap-4">
                    <span className="text-xs text-[#D4D4D4] truncate">
                      Top: {platformContent[0].title}
                    </span>
                    <span className="text-xs font-mono text-[#FFFFFF] shrink-0">
                      {formatCompactNumber(
                        platformContent[0].metrics.views ?? platformContent[0].metrics.impressions
                      )}
                    </span>
                  </div>
                )}
              </ExpandableSurface>
            </div>

            <div className="xl:col-span-4">
              <ExpandableSurface
                className="p-5"
                scaleOnHover={1.012}
                ariaLabel="Metric availability and API limits. Hover or click to inspect."
                expandedContent={
                  platformFilter === 'all' ? (
                    <p className="text-xs text-[#8A8A8A]">
                      Select a single platform above to inspect exact API boundaries and unavailable metrics.
                    </p>
                  ) : unsupportedMetrics.length === 0 ? (
                    <p className="text-xs text-[#8A8A8A]">
                      All primary metrics are available on this platform.
                    </p>
                  ) : (
                    <div className="space-y-2.5 text-xs">
                      {unsupportedMetrics.map((k) => (
                        <div key={k}>
                          <div className="text-[#FFFFFF] font-medium">
                            {METRIC_REGISTRY[k].shortLabel}
                          </div>
                          <div className="text-[11px] text-[#737373] leading-relaxed">
                            {getMetricUnavailableReason(k, platformFilter)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
              >
                <div className="flex items-baseline justify-between gap-2 pr-8">
                  <h2 className="text-sm font-display font-semibold text-[#FFFFFF]">
                    API Boundaries
                  </h2>
                  <span className="text-xs font-mono text-[#737373]">
                    {platformFilter === 'all' ? '6 sources' : `${unsupportedMetrics.length} omitted`}
                  </span>
                </div>
                <p className="mt-2.5 text-xs text-[#737373] truncate">
                  {platformFilter === 'all'
                    ? 'Select a platform to inspect native metric support.'
                    : PLATFORM_META[platformFilter].ingestionSummary}
                </p>
              </ExpandableSurface>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
