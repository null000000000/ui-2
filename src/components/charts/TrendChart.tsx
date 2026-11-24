import React, { useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { METRIC_REGISTRY, isMetricSupportedOnPlatform } from '../../data/metricRegistry';
import type {
  CanonicalMetricKey,
  DailySeriesPoint,
  DateRangeSelection,
  PlatformFilter,
} from '../../types/social';
import { formatCompactNumber, formatNumber, formatShortDate } from '../../utils/format';
import { ExpandableSurface } from '../shared/ExpandableSurface';
import { UnavailableMetricState } from '../shared/States';

const TREND_METRIC_OPTIONS: CanonicalMetricKey[] = [
  'platform_views',
  'impressions',
  'reach',
  'content_interactions',
  'watch_time_minutes',
  'net_audience_change',
  'profile_visits',
  'link_clicks',
  'saves',
];

function extractMetricFromPoint(
  point: DailySeriesPoint,
  metricKey: CanonicalMetricKey
): number | null {
  switch (metricKey) {
    case 'platform_views':
      return point.views;
    case 'reach':
      return point.reach;
    case 'impressions':
      return point.impressions;
    case 'content_interactions':
      return point.interactions;
    case 'watch_time_minutes':
      return point.watchTimeMinutes;
    case 'net_audience_change':
      return point.netAudienceChange;
    case 'profile_visits':
      return point.profileVisits;
    case 'link_clicks':
      return point.linkClicks;
    case 'saves':
      return point.saves;
    case 'audience_size':
      return point.audienceTotal;
    case 'published_posts':
      return point.postsPublished;
    default:
      return null;
  }
}

interface TrendChartProps {
  series: DailySeriesPoint[];
  previousSeries: DailySeriesPoint[];
  platformFilter: PlatformFilter;
  dateRange: DateRangeSelection;
  selectedMetric: CanonicalMetricKey;
  onSelectMetric?: (metric: CanonicalMetricKey) => void;
  lockedMetric?: boolean;
  title?: string;
  height?: number;
  fullHeight?: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  series,
  previousSeries,
  platformFilter,
  dateRange,
  selectedMetric,
  onSelectMetric,
  lockedMetric = false,
  title = 'Performance Trend',
  height = 240,
  fullHeight = false,
}) => {
  const [viewMode, setViewMode] = useState<'daily' | 'cumulative'>('daily');

  const availableMetrics = useMemo(() => {
    if (platformFilter === 'all') return TREND_METRIC_OPTIONS;
    return TREND_METRIC_OPTIONS.filter((k) =>
      isMetricSupportedOnPlatform(k, platformFilter)
    );
  }, [platformFilter]);

  const effectiveMetric = availableMetrics.includes(selectedMetric)
    ? selectedMetric
    : availableMetrics[0] ?? 'platform_views';

  const entry = METRIC_REGISTRY[effectiveMetric];
  const allowCumulative = entry.supportsDailyCumulativeToggle;
  const activeViewMode = allowCumulative ? viewMode : 'daily';

  const chartData = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const pt of series) {
      const val = extractMetricFromPoint(pt, effectiveMetric);
      if (val === null) continue;
      byDate.set(pt.date, (byDate.get(pt.date) ?? 0) + val);
    }

    const prevByDate = new Map<string, number>();
    for (const pt of previousSeries) {
      const val = extractMetricFromPoint(pt, effectiveMetric);
      if (val === null) continue;
      prevByDate.set(pt.date, (prevByDate.get(pt.date) ?? 0) + val);
    }

    const sortedDates = Array.from(byDate.keys()).sort();
    const sortedPrevDates = Array.from(prevByDate.keys()).sort();

    let runningCur = 0;
    let runningPrev = 0;

    return sortedDates.map((date, idx) => {
      const rawCur = byDate.get(date) ?? null;
      const prevDate = sortedPrevDates[idx];
      const rawPrev = prevDate ? (prevByDate.get(prevDate) ?? null) : null;

      if (rawCur !== null) runningCur += rawCur;
      if (rawPrev !== null) runningPrev += rawPrev;

      return {
        date,
        label: formatShortDate(date),
        current: activeViewMode === 'cumulative' ? runningCur : rawCur,
        previous:
          rawPrev !== null
            ? activeViewMode === 'cumulative'
              ? runningPrev
              : rawPrev
            : null,
        prevDateLabel: prevDate ? formatShortDate(prevDate) : null,
      };
    });
  }, [series, previousSeries, effectiveMetric, activeViewMode]);

  const summaryStats = useMemo(() => {
    const vals = chartData
      .map((d) => d.current)
      .filter((v): v is number => v !== null);
    if (vals.length === 0) return null;
    const peak = Math.max(...vals);
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    const total =
      activeViewMode === 'cumulative'
        ? vals[vals.length - 1]
        : allowCumulative
          ? vals.reduce((a, b) => a + b, 0)
          : avg;
    return { total, peak, avg };
  }, [chartData, activeViewMode, allowCumulative]);

  return (
    <ExpandableSurface
      className="p-5"
      fullHeight={fullHeight}
      scaleOnHover={1.006}
      openDelayMs={800}
      ariaLabel={`${title} chart. Hover or click to view controls and period statistics.`}
      expandedContent={
        <div className="space-y-3">
          {/* Metric & Daily/Cumulative Controls revealed smoothly on hover/pin */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {!lockedMetric && onSelectMetric ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {availableMetrics.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSelectMetric(key)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      effectiveMetric === key
                        ? 'bg-[#FFFFFF] text-[#000000]'
                        : 'bg-[#171717] text-[#8A8A8A] hover:text-[#FFFFFF]'
                    }`}
                  >
                    {METRIC_REGISTRY[key].shortLabel}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-[11px] font-mono text-[#8A8A8A]">
                {entry.label}
              </span>
            )}

            <div
              className="inline-flex items-center bg-[#000000] border border-[#242424] rounded p-0.5"
              role="group"
              aria-label="Chart aggregation view"
            >
              <button
                type="button"
                onClick={() => setViewMode('daily')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-sm transition-colors cursor-pointer ${
                  activeViewMode === 'daily'
                    ? 'bg-[#262626] text-[#FFFFFF]'
                    : 'text-[#666666] hover:text-[#A3A3A3]'
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                disabled={!allowCumulative}
                onClick={() => allowCumulative && setViewMode('cumulative')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-sm transition-colors ${
                  !allowCumulative
                    ? 'text-[#3D3D3D] cursor-not-allowed'
                    : activeViewMode === 'cumulative'
                      ? 'bg-[#262626] text-[#FFFFFF] cursor-pointer'
                      : 'text-[#666666] hover:text-[#A3A3A3] cursor-pointer'
                }`}
              >
                Cumulative
              </button>
            </div>
          </div>

          {summaryStats && (
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#1C1C1C] text-xs font-mono tabular-nums">
              <div>
                <span className="text-[10px] text-[#666666] font-sans block">
                  {!allowCumulative ? 'Daily Average' : 'Window Total'}
                </span>
                <span className="text-[#FFFFFF] font-semibold">
                  {formatNumber(summaryStats.total)} {entry.unit}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#666666] font-sans block">
                  Peak Point
                </span>
                <span className="text-[#D4D4D4]">
                  {formatNumber(summaryStats.peak)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#666666] font-sans block">
                  Daily Mean
                </span>
                <span className="text-[#D4D4D4]">
                  {formatNumber(summaryStats.avg)}
                </span>
              </div>
            </div>
          )}

          <p className="text-[11px] text-[#666666] leading-relaxed">
            {entry.description} · Dashed line shows prior equivalent period.
          </p>
        </div>
      }
    >
      {/* Minimal Resting Header */}
      <div className="flex items-baseline justify-between gap-3 mb-4 pr-8">
        <div className="flex items-baseline gap-2.5 min-w-0">
          <h2 className="text-sm font-display font-semibold text-[#FFFFFF] whitespace-nowrap">
            {title}
          </h2>
          <span className="text-xs text-[#737373] truncate">
            {entry.shortLabel} · {formatShortDate(dateRange.startDate)} – {formatShortDate(dateRange.endDate)}
          </span>
        </div>
        {summaryStats && (
          <span className="text-sm font-mono tabular-nums text-[#FFFFFF] whitespace-nowrap">
            {formatCompactNumber(summaryStats.total)}
          </span>
        )}
      </div>

      {chartData.length === 0 ? (
        <div className={fullHeight ? 'flex-1 flex flex-col justify-center' : undefined}>
          <UnavailableMetricState
            compact
            title={`No ${entry.shortLabel} data in this window`}
            reason={
              platformFilter !== 'all' && entry.unavailableReasons[platformFilter]
                ? entry.unavailableReasons[platformFilter]!
                : 'No stored observations match the selected scope.'
            }
          />
        </div>
      ) : (
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 6, right: 6, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="monoTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#171717" strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#525252', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#1F1F1F' }}
                tickLine={false}
                minTickGap={34}
              />
              <YAxis
                tickFormatter={(v: number) => formatCompactNumber(v)}
                tick={{ fill: '#525252', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                cursor={{ stroke: '#333333', strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const row = payload[0].payload as {
                    date: string;
                    current: number | null;
                    previous: number | null;
                    prevDateLabel: string | null;
                  };
                  return (
                    <div className="bg-[#0F0F0F] border border-[#333333] rounded px-3 py-2 text-xs shadow-2xl">
                      <div className="font-mono text-[#737373] mb-1">
                        {row.date}
                      </div>
                      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
                        <span className="text-[#A3A3A3]">{entry.shortLabel}</span>
                        <span className="text-[#FFFFFF] font-semibold">
                          {formatNumber(row.current)}
                        </span>
                      </div>
                      {row.previous !== null && (
                        <div className="flex items-center justify-between gap-4 font-mono tabular-nums mt-1 pt-1 border-t border-[#1F1F1F]">
                          <span className="text-[#666666]">
                            Prior ({row.prevDateLabel})
                          </span>
                          <span className="text-[#8A8A8A]">
                            {formatNumber(row.previous)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="previous"
                stroke="#404040"
                strokeWidth={1.25}
                strokeDasharray="4 4"
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="current"
                stroke="#FFFFFF"
                strokeWidth={1.75}
                fill="url(#monoTrendFill)"
                dot={false}
                activeDot={{ r: 3.5, fill: '#FFFFFF', stroke: '#000000', strokeWidth: 1.5 }}
                connectNulls
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </ExpandableSurface>
  );
};
