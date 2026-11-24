import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AudienceLocationPanel } from '../components/charts/AudienceLocationPanel';
import { TrendChart } from '../components/charts/TrendChart';
import { ExpandableSurface } from '../components/shared/ExpandableSurface';
import { PlatformIcon } from '../components/shared/PlatformIcon';
import { EmptyState, UnavailableMetricState } from '../components/shared/States';
import { PLATFORM_LIST, PLATFORM_META } from '../data/metricRegistry';
import { getPreviousEquivalentRange } from '../services/apiClient';
import type {
  DateRangeSelection,
  PlatformFilter,
  SocialMonitorDataset,
} from '../types/social';

interface AudiencePageProps {
  dataset: SocialMonitorDataset;
  platformFilter: PlatformFilter;
  onChangePlatform: (platform: PlatformFilter) => void;
  dateRange: DateRangeSelection;
  onOpenAccounts: () => void;
  onOpenSettings: () => void;
}

export const AudiencePage: React.FC<AudiencePageProps> = ({
  dataset,
  platformFilter,
  onChangePlatform,
  dateRange,
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

  const activeAudience = useMemo(() => {
    if (platformFilter !== 'all') {
      return dataset.audience.find((a) => a.platform === platformFilter) ?? null;
    }
    return dataset.audience.find((a) => a.ageGender !== null) ?? dataset.audience[0] ?? null;
  }, [dataset.audience, platformFilter]);

  const topAgeBracket = useMemo(() => {
    if (!activeAudience?.ageGender || activeAudience.ageGender.length === 0) return null;
    const sorted = [...activeAudience.ageGender].sort(
      (a, b) => (b.malePct + b.femalePct + b.otherPct) - (a.malePct + a.femalePct + a.otherPct)
    );
    const top = sorted[0];
    const pct = top.malePct + top.femalePct + top.otherPct;
    return `${top.ageGroup} (${pct.toFixed(0)}%)`;
  }, [activeAudience]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-display font-bold text-[#FFFFFF]">Audience</h1>
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

      {dataset.audience.length === 0 && series.length === 0 && !dataset.apiConfigured ? (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            <div className="xl:col-span-6">
              <AudienceLocationPanel
                audienceList={dataset.audience}
                platformFilter={platformFilter}
              />
            </div>
            <div className="xl:col-span-6">
              <EmptyState
                title="No audience insights collected yet"
                description="Connect an eligible platform (YouTube, Instagram, or Facebook) via n8n to track city distribution, demographics, and net audience growth."
                actionLabel="Open Accounts"
                onAction={onOpenAccounts}
                secondaryLabel="Configure API"
                onSecondaryAction={onOpenSettings}
              />
            </div>
          </div>
        </>
      ) : dataset.audience.length === 0 && series.length === 0 ? (
        <EmptyState
          title="No audience insights collected yet"
          description="Your connected accounts have not reported audience breakdowns for this window yet."
          actionLabel="Open Accounts"
          onAction={onOpenAccounts}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            <div className="xl:col-span-6">
              <AudienceLocationPanel
                audienceList={dataset.audience}
                platformFilter={platformFilter}
              />
            </div>

            <div className="xl:col-span-6 space-y-5">
              {/* Age & Gender Expandable */}
              <ExpandableSurface
                className="p-5"
                scaleOnHover={1.01}
                ariaLabel="Age and gender demographics. Hover or click for chart."
                expandedContent={
                  !activeAudience?.ageGender ? (
                    <UnavailableMetricState
                      compact
                      title="Demographics unavailable"
                      reason={
                        activeAudience?.ageGenderUnavailableReason ||
                        'Not exposed by this connection.'
                      }
                    />
                  ) : (
                    <div className="space-y-2">
                      <div style={{ width: '100%', height: 190 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={activeAudience.ageGender} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
                            <CartesianGrid stroke="#171717" strokeDasharray="2 4" vertical={false} />
                            <XAxis
                              dataKey="ageGroup"
                              tick={{ fill: '#8A8A8A', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                              axisLine={{ stroke: '#1F1F1F' }}
                              tickLine={false}
                            />
                            <YAxis
                              tickFormatter={(v: number) => `${v}%`}
                              tick={{ fill: '#666666', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              cursor={{ fill: '#171717' }}
                              content={({ active, payload, label }) => {
                                if (!active || !payload || payload.length === 0) return null;
                                return (
                                  <div className="bg-[#0F0F0F] border border-[#333333] rounded px-3 py-2 text-xs font-mono shadow-2xl space-y-1">
                                    <div className="text-[#FFFFFF] font-semibold">Age {label}</div>
                                    {payload.map((entry) => (
                                      <div key={String(entry.name)} className="flex items-center justify-between gap-4 tabular-nums">
                                        <span className="text-[#8A8A8A]">{entry.name}</span>
                                        <span className="text-[#FFFFFF]">
                                          {Number(entry.value).toFixed(1)}%
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }}
                            />
                            <Bar dataKey="malePct" name="Male" fill="#FFFFFF" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                            <Bar dataKey="femalePct" name="Female" fill="#737373" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                            <Bar dataKey="otherPct" name="Other" fill="#333333" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-[10px] font-mono text-[#666666]">
                        {activeAudience.eligibilityNote}
                      </p>
                    </div>
                  )
                }
              >
                <div className="flex items-baseline justify-between gap-2 pr-8">
                  <h2 className="text-sm font-display font-semibold text-[#FFFFFF]">
                    Demographics
                  </h2>
                  <span className="text-xs font-mono text-[#737373]">
                    {activeAudience?.ageGender
                      ? PLATFORM_META[activeAudience.platform].shortName
                      : 'Unavailable'}
                  </span>
                </div>
                <p className="mt-2.5 text-xs text-[#8A8A8A]">
                  {topAgeBracket
                    ? `Primary bracket: ${topAgeBracket} · hover to inspect breakdown`
                    : activeAudience?.ageGenderUnavailableReason || 'Not exposed by this source.'}
                </p>
              </ExpandableSurface>

              {/* Followers vs Non-Followers */}
              <ExpandableSurface
                className="p-5"
                scaleOnHover={1.01}
                ariaLabel="Follower vs non-follower reach split."
                expandedContent={
                  !activeAudience?.followerSplit ? (
                    <p className="text-xs text-[#737373]">
                      {activeAudience?.followerSplitUnavailableReason ||
                        'Not exposed by this connection.'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="bg-[#080808] border border-[#1C1C1C] rounded p-2.5">
                        <span className="text-[10px] font-sans text-[#666666] block">Followers</span>
                        <span className="text-base text-[#FFFFFF]">
                          {activeAudience.followerSplit.followersPct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="bg-[#080808] border border-[#1C1C1C] rounded p-2.5">
                        <span className="text-[10px] font-sans text-[#666666] block">Non-Followers</span>
                        <span className="text-base text-[#A3A3A3]">
                          {activeAudience.followerSplit.nonFollowersPct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="col-span-2 text-[10px] text-[#666666]">
                        Basis: {activeAudience.followerSplit.basisMetric}
                      </div>
                    </div>
                  )
                }
              >
                <div className="flex items-baseline justify-between gap-2 pr-8">
                  <h2 className="text-sm font-display font-semibold text-[#FFFFFF]">
                    Follower Split
                  </h2>
                  {activeAudience?.followerSplit && (
                    <span className="text-xs font-mono text-[#FFFFFF]">
                      {activeAudience.followerSplit.nonFollowersPct.toFixed(0)}% discovery
                    </span>
                  )}
                </div>
                {activeAudience?.followerSplit ? (
                  <div className="mt-3 h-1.5 bg-[#1C1C1C] rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-[#FFFFFF]"
                      style={{ width: `${activeAudience.followerSplit.followersPct}%` }}
                    />
                    <div
                      className="h-full bg-[#525252]"
                      style={{ width: `${activeAudience.followerSplit.nonFollowersPct}%` }}
                    />
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-[#666666]">Unavailable on this platform</p>
                )}
              </ExpandableSurface>
            </div>
          </div>

          <TrendChart
            series={series}
            previousSeries={prevSeries}
            platformFilter={platformFilter}
            dateRange={dateRange}
            selectedMetric="net_audience_change"
            lockedMetric
            title="Net Audience Growth"
            height={210}
          />
        </>
      )}
    </div>
  );
};
