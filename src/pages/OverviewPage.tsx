import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { AudienceLocationPanel } from '../components/charts/AudienceLocationPanel';
import { ContentTypeBreakdown } from '../components/charts/ContentTypeBreakdown';
import { ProfileActivityPanel } from '../components/charts/ProfileActivityPanel';
import { TrendChart } from '../components/charts/TrendChart';
import { ExpandableSurface } from '../components/shared/ExpandableSurface';
import { InsightPanel } from '../components/shared/InsightPanel';
import { MetricCard } from '../components/shared/MetricCard';
import { PlatformIcon } from '../components/shared/PlatformIcon';
import { ErrorState, LoadingSkeletonPanel } from '../components/shared/States';
import {
  PLATFORM_LIST,
  PLATFORM_META,
  getMetricUnavailableReason,
  isMetricSupportedOnPlatform,
} from '../data/metricRegistry';
import {
  computeEvidenceInsights,
  getPreviousEquivalentRange,
} from '../services/apiClient';
import type {
  CanonicalMetricKey,
  ContentItem,
  ContentType,
  DailySeriesPoint,
  DateRangeSelection,
  NavRouteId,
  PlatformFilter,
  SocialMonitorDataset,
  SocialMonitorPreferences,
} from '../types/social';
import {
  formatCompactNumber,
  formatNumber,
  formatShortDate,
} from '../utils/format';

interface OverviewPageProps {
  dataset: SocialMonitorDataset;
  isLoading: boolean;
  platformFilter: PlatformFilter;
  onChangePlatform: (platform: PlatformFilter) => void;
  dateRange: DateRangeSelection;
  selectedTrendMetric: CanonicalMetricKey;
  onSelectTrendMetric: (metric: CanonicalMetricKey) => void;
  preferences: SocialMonitorPreferences;
  onNavigate: (
    route: NavRouteId,
    opts?: {
      platform?: PlatformFilter;
      metric?: CanonicalMetricKey;
      contentType?: ContentType;
    }
  ) => void;
  onSelectContent: (contentId: string) => void;
  onRetryBackend: () => void;
}

function sumNullable(
  points: DailySeriesPoint[],
  getter: (p: DailySeriesPoint) => number | null
): number | null {
  let hasAny = false;
  let total = 0;
  for (const p of points) {
    const val = getter(p);
    if (val !== null) {
      hasAny = true;
      total += val;
    }
  }
  return hasAny ? total : null;
}

function dailyTotals(
  points: DailySeriesPoint[],
  getter: (p: DailySeriesPoint) => number | null
): number[] {
  const map = new Map<string, number>();
  for (const p of points) {
    const val = getter(p);
    if (val === null) continue;
    map.set(p.date, (map.get(p.date) ?? 0) + val);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  dataset,
  isLoading,
  platformFilter,
  onChangePlatform,
  dateRange,
  selectedTrendMetric,
  onSelectTrendMetric,
  preferences,
  onNavigate,
  onSelectContent,
  onRetryBackend,
}) => {
  const prevRange = useMemo(() => getPreviousEquivalentRange(dateRange), [dateRange]);

  const filteredSeries = useMemo(
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

  const filteredContent = useMemo(
    () =>
      dataset.content.filter(
        (c) =>
          (platformFilter === 'all' || c.platform === platformFilter) &&
          c.publishedAt.slice(0, 10) >= dateRange.startDate &&
          c.publishedAt.slice(0, 10) <= dateRange.endDate
      ),
    [dataset.content, platformFilter, dateRange]
  );

  const allPlatformContent = useMemo(
    () =>
      dataset.content.filter(
        (c) => platformFilter === 'all' || c.platform === platformFilter
      ),
    [dataset.content, platformFilter]
  );

  const insights = useMemo(
    () => computeEvidenceInsights(dataset, platformFilter, dateRange),
    [dataset, platformFilter, dateRange]
  );

  const audienceMetrics = useMemo(() => {
    const matchingAccs = dataset.accounts.filter(
      (a) => platformFilter === 'all' || a.platform === platformFilter
    );
    const counts = matchingAccs
      .map((a) => a.audienceCount)
      .filter((v): v is number => v !== null);
    if (counts.length === 0) return { current: null, previous: null };
    const current = counts.reduce((a, b) => a + b, 0);
    const netDelta = sumNullable(filteredSeries, (p) => p.netAudienceChange);
    return {
      current,
      previous: netDelta !== null ? Math.max(0, current - netDelta) : null,
    };
  }, [dataset.accounts, platformFilter, filteredSeries]);

  const topContent: ContentItem[] = useMemo(() => {
    const pool = filteredContent.length > 0 ? filteredContent : allPlatformContent;
    return [...pool]
      .sort((a, b) => {
        const aScore = a.metrics.views ?? a.metrics.impressions ?? (a.metrics.likes ?? 0);
        const bScore = b.metrics.views ?? b.metrics.impressions ?? (b.metrics.likes ?? 0);
        return bScore - aScore;
      })
      .slice(0, 4);
  }, [filteredContent, allPlatformContent]);

  // Keep Overview focused on 4 clean primary KPI cards (all expand on hover/click for deep breakdown)
  const kpiCards = useMemo(() => {
    const viewsCur = sumNullable(filteredSeries, (p) => p.views);
    const viewsPrev = sumNullable(prevSeries, (p) => p.views);
    const impCur = sumNullable(filteredSeries, (p) => p.impressions);
    const impPrev = sumNullable(prevSeries, (p) => p.impressions);
    const intCur = sumNullable(filteredSeries, (p) => p.interactions);
    const intPrev = sumNullable(prevSeries, (p) => p.interactions);
    const watchCur = sumNullable(filteredSeries, (p) => p.watchTimeMinutes);
    const watchPrev = sumNullable(prevSeries, (p) => p.watchTimeMinutes);

    const secondCard =
      platformFilter === 'youtube'
        ? {
            key: 'watch_time_minutes' as CanonicalMetricKey,
            titleOverride: 'Watch Time',
            unitLabel: 'min',
            value: watchCur,
            previous: watchPrev,
            sparkline: dailyTotals(filteredSeries, (p) => p.watchTimeMinutes),
            subtitle: 'YouTube Analytics estimatedMinutesWatched.',
            unavailableReason: 'Requires YouTube Analytics API.',
          }
        : {
            key: 'impressions' as CanonicalMetricKey,
            titleOverride: 'Impressions',
            unitLabel: undefined,
            value: impCur,
            previous: impPrev,
            sparkline: dailyTotals(filteredSeries, (p) => p.impressions),
            subtitle:
              platformFilter === 'all'
                ? 'Combined impressions across IG, FB, X, and LinkedIn.'
                : `${PLATFORM_META[platformFilter].name} reported impressions.`,
            unavailableReason:
              platformFilter !== 'all'
                ? getMetricUnavailableReason('impressions', platformFilter)
                : 'No impression data',
          };

    return [
      {
        key: 'platform_views' as CanonicalMetricKey,
        titleOverride: 'Views',
        unitLabel: undefined,
        value: viewsCur,
        previous: viewsPrev,
        sparkline: dailyTotals(filteredSeries, (p) => p.views),
        subtitle:
          platformFilter === 'all'
            ? 'Sum of platform-reported native view/play counters.'
            : `${PLATFORM_META[platformFilter].name} native view counter.`,
        unavailableReason:
          platformFilter !== 'all' && !isMetricSupportedOnPlatform('platform_views', platformFilter)
            ? getMetricUnavailableReason('platform_views', platformFilter)
            : 'No view data',
      },
      secondCard,
      {
        key: 'content_interactions' as CanonicalMetricKey,
        titleOverride: 'Interactions',
        unitLabel: undefined,
        value: intCur,
        previous: intPrev,
        sparkline: dailyTotals(filteredSeries, (p) => p.interactions),
        subtitle: 'Combined likes/reactions, comments/replies, shares, and saves.',
        unavailableReason: 'No interaction data',
      },
      {
        key: 'audience_size' as CanonicalMetricKey,
        titleOverride:
          platformFilter === 'all'
            ? 'Audience'
            : PLATFORM_META[platformFilter].audienceNoun,
        unitLabel: undefined,
        value: audienceMetrics.current,
        previous: audienceMetrics.previous,
        sparkline: dailyTotals(filteredSeries, (p) => p.audienceTotal),
        subtitle:
          platformFilter === 'all'
            ? 'Combined account followers & subscribers (not deduplicated individuals).'
            : `Latest ${PLATFORM_META[platformFilter].name} snapshot.`,
        unavailableReason: 'Account not linked',
      },
    ];
  }, [filteredSeries, prevSeries, platformFilter, audienceMetrics]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeletonPanel key={i} heightClass="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-8">
            <LoadingSkeletonPanel heightClass="h-72" />
          </div>
          <div className="xl:col-span-4">
            <LoadingSkeletonPanel heightClass="h-72" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clean Minimal Page Title */}
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-display font-bold text-[#FFFFFF] tracking-tight">
            Overview
          </h1>
          <span className="text-xs font-mono text-[#666666]">
            {platformFilter === 'all'
              ? 'All 6 platforms'
              : PLATFORM_META[platformFilter].name}
            {' · '}
            {formatShortDate(dateRange.startDate)} – {formatShortDate(dateRange.endDate)}
          </span>
        </div>

        <span className="text-[11px] font-mono text-[#8E96A0]">
          Pause on a card to expand · Click to pin
        </span>
      </div>

      {dataset.backendError && (
        <ErrorState
          title="Backend API Unreachable"
          message={dataset.backendError}
          onRetry={onRetryBackend}
          secondaryLabel="Open Settings"
          onSecondaryAction={() => onNavigate('settings')}
        />
      )}

      {!dataset.apiConfigured && !dataset.backendError && (
        <div className="bg-[#0E1012] border border-[#22252A] rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-[#FFFFFF]">
              Ready for n8n / Backend Telemetry
            </div>
            <p className="text-[11px] text-[#8E96A0] mt-0.5">
              Set <span className="font-mono text-[#E3E2E3]">VITE_API_BASE_URL</span> in your environment to stream live metrics from your connected accounts.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('accounts')}
              className="px-3 py-1.5 rounded bg-[#181A1D] border border-[#2E3238] hover:border-[#4A505A] text-xs font-medium text-[#FFFFFF] transition-colors cursor-pointer whitespace-nowrap"
            >
              Accounts
            </button>
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="px-3 py-1.5 rounded bg-[#FFFFFF] hover:bg-[#E5E5E5] text-xs font-medium text-[#090A0B] transition-colors cursor-pointer whitespace-nowrap"
            >
              Configure API
            </button>
          </div>
        </div>
      )}

      {/* 1. Minimal 4-Card KPI Row (each scales & expands on hover, pins on click) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {kpiCards.map((card) => (
              <MetricCard
                key={card.key}
                metricKey={card.key}
                titleOverride={card.titleOverride}
                unitLabel={card.unitLabel}
                value={card.value}
                previousValue={card.previous}
                sparkline={card.sparkline}
                subtitle={card.subtitle}
                unavailableReason={card.unavailableReason}
                platformFilter={platformFilter}
                lastCollectedAt={dataset.lastFetchedAt}
                onDrillDown={
                  preferences.enabledModules.analytics
                    ? () =>
                        onNavigate('analytics', {
                          metric: card.key,
                          platform: platformFilter,
                        })
                    : undefined
                }
              />
            ))}
          </div>

          {/* 2. Hero Visual Row (Performance & Audience Geography stretch to flush equal height) */}
          {(() => {
            const heroWidgets = preferences.widgetOrder.filter(
              (w) =>
                (w === 'primary_trend' || w === 'audience_location') &&
                preferences.visibleWidgets[w]
            );
            if (heroWidgets.length === 0) return null;
            const singleHero = heroWidgets.length === 1;

            return (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
                {heroWidgets.map((widgetKey) => {
                  if (widgetKey === 'primary_trend') {
                    return (
                      <div
                        key={widgetKey}
                        className={`${singleHero ? 'xl:col-span-12' : 'xl:col-span-7'} min-w-0`}
                      >
                        <TrendChart
                          series={filteredSeries}
                          previousSeries={prevSeries}
                          platformFilter={platformFilter}
                          dateRange={dateRange}
                          selectedMetric={selectedTrendMetric}
                          onSelectMetric={onSelectTrendMetric}
                          title="Performance"
                          height={250}
                          fullHeight
                        />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={widgetKey}
                      className={`${singleHero ? 'xl:col-span-12' : 'xl:col-span-5'} min-w-0`}
                    >
                      <AudienceLocationPanel
                        audienceList={dataset.audience}
                        platformFilter={platformFilter}
                        fullHeight
                      />
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* 3. Balanced Full-Width Secondary Telemetry Grid (zero empty voids on Desktop, Tablet, or Mobile) */}
          {(() => {
            const secondaryWidgets = preferences.widgetOrder.filter(
              (w) =>
                (w === 'top_content' ||
                  w === 'content_type_breakdown' ||
                  w === 'profile_activity' ||
                  w === 'insights_panel') &&
                preferences.visibleWidgets[w]
            );
            if (secondaryWidgets.length === 0) return null;

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                {secondaryWidgets.map((widgetKey, idx) => {
                  const isOddTrailing =
                    secondaryWidgets.length % 2 === 1 &&
                    idx === secondaryWidgets.length - 1;
                  const spanClass = isOddTrailing ? 'md:col-span-2 min-w-0' : 'min-w-0';

                  if (widgetKey === 'top_content') {
                    return (
                      <div key={widgetKey} className={spanClass}>
                        <ExpandableSurface
                          mode="overlay"
                          fullHeight
                          className="p-5"
                          scaleOnHover={1.01}
                          ariaLabel="Top content. Hover or click to expand metrics and open posts."
                          expandedContent={
                            topContent.length === 0 ? (
                              <p className="text-xs text-[#8E96A0]">
                                Published posts will appear here once your n8n connectors complete their first sync.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {topContent.map((item) => {
                                  const actions =
                                    (item.metrics.likes ?? 0) +
                                    (item.metrics.comments ?? 0) +
                                    (item.metrics.shares ?? 0) +
                                    (item.metrics.saves ?? 0);
                                  return (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => onSelectContent(item.id)}
                                      className="w-full text-left p-2.5 rounded bg-[#0A0A0A] hover:bg-[#1A1A1A] border border-[#1C1C1C] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                                    >
                                      <div className="min-w-0">
                                        <div className="text-xs font-medium text-[#FFFFFF] truncate">
                                          {item.title}
                                        </div>
                                        <div className="mt-0.5 text-[11px] font-mono text-[#737373]">
                                          {PLATFORM_META[item.platform].name} · {item.contentType} · {formatShortDate(item.publishedAt)}
                                        </div>
                                      </div>
                                      <div className="text-right font-mono tabular-nums shrink-0">
                                        <div className="text-xs text-[#FFFFFF]">
                                          {formatCompactNumber(
                                            item.metrics.views ?? item.metrics.impressions
                                          )}
                                        </div>
                                        <div className="text-[10px] text-[#666666]">
                                          {formatCompactNumber(actions)} actions
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}

                                {preferences.enabledModules.content_library && (
                                  <button
                                    type="button"
                                    onClick={() => onNavigate('content')}
                                    className="w-full mt-1 inline-flex items-center justify-between px-3 py-1.5 rounded bg-[#1A1A1A] hover:bg-[#262626] border border-[#2E2E2E] text-[11px] font-medium text-[#FFFFFF] transition-colors cursor-pointer"
                                  >
                                    <span>Open Content Library</span>
                                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                                  </button>
                                )}
                              </div>
                            )
                          }
                        >
                          <div className="flex items-baseline justify-between gap-2 pr-8">
                            <h2 className="text-sm font-display font-semibold text-[#FFFFFF]">
                              Top Content
                            </h2>
                            <span className="text-xs font-mono text-[#737373]">
                              {topContent.length} highlights
                            </span>
                          </div>

                          {topContent[0] ? (
                            <div className="mt-3 flex items-baseline justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-[#E5E5E5] truncate">
                                  {topContent[0].title}
                                </div>
                                <div className="text-[11px] font-mono text-[#666666] mt-0.5">
                                  {PLATFORM_META[topContent[0].platform].name} · {topContent[0].contentType}
                                </div>
                              </div>
                              <span className="text-sm font-mono tabular-nums text-[#FFFFFF] shrink-0">
                                {formatCompactNumber(
                                  topContent[0].metrics.views ?? topContent[0].metrics.impressions
                                )}
                              </span>
                            </div>
                          ) : (
                            <p className="mt-3 text-xs text-[#666666]">
                              No published items collected yet
                            </p>
                          )}
                        </ExpandableSurface>
                      </div>
                    );
                  }

                  if (widgetKey === 'content_type_breakdown') {
                    return (
                      <div key={widgetKey} className={spanClass}>
                        <ContentTypeBreakdown
                          mode="overlay"
                          fullHeight
                          items={
                            filteredContent.length > 0 ? filteredContent : allPlatformContent
                          }
                          onSelectType={
                            preferences.enabledModules.content_library
                              ? (type) => onNavigate('content', { contentType: type })
                              : undefined
                          }
                        />
                      </div>
                    );
                  }

                  if (widgetKey === 'profile_activity') {
                    return (
                      <div key={widgetKey} className={spanClass}>
                        <ProfileActivityPanel
                          mode="overlay"
                          fullHeight
                          series={filteredSeries}
                          previousSeries={prevSeries}
                          platformFilter={platformFilter}
                          onSelectMetric={(metric) => onSelectTrendMetric(metric)}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={widgetKey} className={spanClass}>
                      <InsightPanel
                        mode="overlay"
                        fullHeight
                        insights={insights}
                        analystEnabled={preferences.enabledModules.ai_analyst}
                        onOpenAnalyst={() => onNavigate('analyst')}
                        onInspectContent={onSelectContent}
                        onNavigate={(route, platform) => onNavigate(route, { platform })}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* 3. Quiet Expandable Platform Strip (hover/click each platform for breakdown & quick filter) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 items-start pt-1">
            {PLATFORM_LIST.map((pid) => {
              const acc = dataset.accounts.find((a) => a.platform === pid);
              const pSeries = dataset.dailySeries.filter(
                (p) =>
                  p.platform === pid &&
                  p.date >= dateRange.startDate &&
                  p.date <= dateRange.endDate
              );
              const pViews = sumNullable(pSeries, (p) => p.views);
              const pActions = sumNullable(pSeries, (p) => p.interactions);
              const isSelected = platformFilter === pid;

              return (
                <ExpandableSurface
                  key={pid}
                  mode="overlay"
                  expandDirection="up"
                  pinOffset="compact"
                  className={`p-3.5 ${isSelected ? 'ring-1 ring-[#FFFFFF]' : ''}`}
                  scaleOnHover={1.025}
                  ariaLabel={`${PLATFORM_META[pid].name}. Hover or click for platform metrics.`}
                  expandedContent={
                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between gap-2 font-mono">
                        <span className="text-[#666666] shrink-0">Handle</span>
                        <span className="text-[#D4D4D4] truncate max-w-[110px]">
                          {acc?.handle || 'Unlinked'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2 font-mono">
                        <span className="text-[#666666]">Views</span>
                        <span className="text-[#FFFFFF]">
                          {pViews !== null ? formatNumber(pViews) : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2 font-mono">
                        <span className="text-[#666666]">Actions</span>
                        <span className="text-[#D4D4D4]">
                          {pActions !== null ? formatNumber(pActions) : '—'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onChangePlatform(isSelected ? 'all' : pid)}
                        className="w-full mt-1 py-1 rounded bg-[#FFFFFF] text-[#000000] font-medium text-[11px] cursor-pointer"
                      >
                        {isSelected ? 'Show All' : `Filter ${PLATFORM_META[pid].shortName}`}
                      </button>
                    </div>
                  }
                >
                  <div className="flex items-center gap-2 pr-7 min-w-0">
                    <PlatformIcon
                      platform={pid}
                      className="w-3.5 h-3.5 text-[#A1A8B2] shrink-0"
                    />
                    <span className="text-xs font-medium text-[#FFFFFF] truncate">
                      {PLATFORM_META[pid].shortName}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-mono tabular-nums font-semibold text-[#FFFFFF]">
                    {acc?.audienceCount !== null && acc?.audienceCount !== undefined
                      ? formatCompactNumber(acc.audienceCount)
                      : '—'}
                  </div>
                </ExpandableSurface>
              );
            })}
          </div>
    </div>
  );
};
