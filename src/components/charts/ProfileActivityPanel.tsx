import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import {
  getMetricUnavailableReason,
  isMetricSupportedOnPlatform,
} from '../../data/metricRegistry';
import type {
  CanonicalMetricKey,
  DailySeriesPoint,
  PlatformFilter,
} from '../../types/social';
import { formatCompactNumber, formatDeltaPct, formatNumber } from '../../utils/format';
import { ExpandableSurface } from '../shared/ExpandableSurface';

interface ProfileActivityPanelProps {
  series: DailySeriesPoint[];
  previousSeries: DailySeriesPoint[];
  platformFilter: PlatformFilter;
  onSelectMetric?: (metric: CanonicalMetricKey) => void;
  mode?: 'inline' | 'overlay';
  fullHeight?: boolean;
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

export const ProfileActivityPanel: React.FC<ProfileActivityPanelProps> = ({
  series,
  previousSeries,
  platformFilter,
  onSelectMetric,
  mode = 'inline',
  fullHeight = false,
}) => {
  const rows = [
    {
      metricKey: 'profile_visits' as CanonicalMetricKey,
      label: 'Profile Visits',
      current: sumNullable(series, (p) => p.profileVisits),
      previous: sumNullable(previousSeries, (p) => p.profileVisits),
      unavailableReason:
        platformFilter !== 'all' && !isMetricSupportedOnPlatform('profile_visits', platformFilter)
          ? getMetricUnavailableReason('profile_visits', platformFilter)
          : 'No profile visit data',
    },
    {
      metricKey: 'link_clicks' as CanonicalMetricKey,
      label: 'Link Clicks',
      current: sumNullable(series, (p) => p.linkClicks),
      previous: sumNullable(previousSeries, (p) => p.linkClicks),
      unavailableReason:
        platformFilter !== 'all' && !isMetricSupportedOnPlatform('link_clicks', platformFilter)
          ? getMetricUnavailableReason('link_clicks', platformFilter)
          : 'No link click data',
    },
    {
      metricKey: 'net_audience_change' as CanonicalMetricKey,
      label: 'Net Audience Change',
      current: sumNullable(series, (p) => p.netAudienceChange),
      previous: sumNullable(previousSeries, (p) => p.netAudienceChange),
      unavailableReason: 'No growth observations',
    },
    {
      metricKey: 'saves' as CanonicalMetricKey,
      label: 'Saves & Bookmarks',
      current: sumNullable(series, (p) => p.saves),
      previous: sumNullable(previousSeries, (p) => p.saves),
      unavailableReason:
        platformFilter !== 'all' && !isMetricSupportedOnPlatform('saves', platformFilter)
          ? getMetricUnavailableReason('saves', platformFilter)
          : 'Instagram & X only',
    },
  ];

  const visits = rows[0].current;
  const netGrowth = rows[2].current;

  return (
    <ExpandableSurface
      mode={mode}
      fullHeight={fullHeight}
      className="p-5"
      scaleOnHover={1.012}
      ariaLabel="Profile activity. Hover or click to inspect visits, link clicks, growth, and saves."
      expandedContent={
        <div className="divide-y divide-[#1C1C1C]">
          {rows.map((row) => {
            const delta = formatDeltaPct(row.current, row.previous);
            return (
              <button
                key={row.metricKey}
                type="button"
                disabled={row.current === null}
                onClick={() => row.current !== null && onSelectMetric?.(row.metricKey)}
                className="w-full py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-left hover:bg-[#171717] -mx-2 px-2 rounded transition-colors disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
              >
                <div className="min-w-0">
                  <div className="text-xs text-[#D4D4D4]">{row.label}</div>
                  {row.current === null && (
                    <div className="text-[10px] text-[#525252] truncate">
                      {row.unavailableReason}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0 font-mono tabular-nums">
                  {row.current === null ? (
                    <span className="text-xs text-[#525252]">—</span>
                  ) : (
                    <>
                      <div className="text-xs font-semibold text-[#FFFFFF]">
                        {row.metricKey === 'net_audience_change' && row.current > 0 ? '+' : ''}
                        {formatNumber(row.current)}
                      </div>
                      <div
                        className={`inline-flex items-center gap-0.5 text-[10px] ${
                          delta.direction === 'up' ? 'text-[#D4D4D4]' : 'text-[#666666]'
                        }`}
                      >
                        {delta.direction === 'up' && <ArrowUpRight className="w-2.5 h-2.5 shrink-0" />}
                        {delta.direction === 'down' && <ArrowDownRight className="w-2.5 h-2.5 shrink-0" />}
                        {delta.direction === 'flat' && <Minus className="w-2.5 h-2.5 shrink-0" />}
                        <span>{delta.label}</span>
                      </div>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      }
    >
      <div className="flex items-baseline justify-between gap-2 pr-8">
        <h2 className="text-sm font-display font-semibold text-[#FFFFFF]">
          Profile Activity
        </h2>
        <span className="text-xs font-mono text-[#737373]">4 metrics</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 font-mono tabular-nums">
        <div>
          <span className="text-[10px] font-sans text-[#666666] block">Visits</span>
          <span className="text-base font-semibold text-[#FFFFFF]">
            {visits !== null ? formatCompactNumber(visits) : '—'}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-sans text-[#666666] block">Net Growth</span>
          <span className="text-base font-semibold text-[#FFFFFF]">
            {netGrowth !== null
              ? `${netGrowth > 0 ? '+' : ''}${formatCompactNumber(netGrowth)}`
              : '—'}
          </span>
        </div>
      </div>
    </ExpandableSurface>
  );
};
