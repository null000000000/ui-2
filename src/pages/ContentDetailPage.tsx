import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ExpandableSurface } from '../components/shared/ExpandableSurface';
import { PlatformLabel } from '../components/shared/PlatformIcon';
import { UnavailableMetricState } from '../components/shared/States';
import { PLATFORM_META } from '../data/metricRegistry';
import type { ContentItem } from '../types/social';
import {
  formatCompactNumber,
  formatDateTimeUtc,
  formatDurationSeconds,
  formatNumber,
  formatShortDate,
} from '../utils/format';

interface ContentDetailPageProps {
  item: ContentItem;
  allItems: ContentItem[];
  onBack: () => void;
  backLabel?: string;
}

type SnapshotMetricChoice = 'views' | 'impressions' | 'reach' | 'interactions';

export const ContentDetailPage: React.FC<ContentDetailPageProps> = ({
  item,
  allItems,
  onBack,
  backLabel = 'Back',
}) => {
  const defaultHistoryMetric: SnapshotMetricChoice =
    item.metrics.views !== null
      ? 'views'
      : item.metrics.impressions !== null
        ? 'impressions'
        : item.metrics.reach !== null
          ? 'reach'
          : 'interactions';

  const [historyMetric, setHistoryMetric] =
    useState<SnapshotMetricChoice>(defaultHistoryMetric);

  useEffect(() => {
    setHistoryMetric(defaultHistoryMetric);
  }, [item.id, defaultHistoryMetric]);

  const totalInteractions =
    (item.metrics.likes ?? 0) +
    (item.metrics.comments ?? 0) +
    (item.metrics.shares ?? 0) +
    (item.metrics.saves ?? 0);

  const baseline = useMemo(() => {
    const peers = allItems.filter(
      (c) => c.id !== item.id && c.platform === item.platform
    );
    const useViews = item.metrics.views !== null;
    const currentVal = useViews ? item.metrics.views : item.metrics.impressions;
    const peerValues = peers
      .map((p) => (useViews ? p.metrics.views : p.metrics.impressions))
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);

    if (currentVal === null || peerValues.length === 0) return null;
    const mean = Math.round(
      peerValues.reduce((a, b) => a + b, 0) / peerValues.length
    );
    const mid = Math.floor(peerValues.length / 2);
    const median = Math.round(
      peerValues.length % 2 === 0
        ? (peerValues[mid - 1] + peerValues[mid]) / 2
        : peerValues[mid]
    );
    const vsMedianPct = median > 0 ? ((currentVal - median) / median) * 100 : null;
    return {
      metricLabel: useViews ? 'Views' : 'Impressions',
      currentVal,
      mean,
      median,
      vsMedianPct,
      sampleSize: peerValues.length,
    };
  }, [item, allItems]);

  const snapshotRows = useMemo(() => {
    return item.snapshots.map((snap, idx) => {
      const prev = idx > 0 ? item.snapshots[idx - 1] : null;
      const val = snap[historyMetric];
      const prevVal = prev ? prev[historyMetric] : null;
      return {
        ...snap,
        shortLabel: snap.milestone ?? `${snap.hoursSincePublish}h`,
        value: val,
        delta: val !== null && prevVal !== null ? val - prevVal : null,
      };
    });
  }, [item.snapshots, historyMetric]);

  const availableMetrics: Array<{ key: SnapshotMetricChoice; label: string }> = [
    ...(item.metrics.views !== null ? [{ key: 'views' as const, label: 'Views' }] : []),
    ...(item.metrics.impressions !== null ? [{ key: 'impressions' as const, label: 'Impressions' }] : []),
    ...(item.metrics.reach !== null ? [{ key: 'reach' as const, label: 'Reach' }] : []),
    { key: 'interactions' as const, label: 'Interactions' },
  ];

  const allMetricDetails = [
    { label: 'Views / Plays', value: formatNumber(item.metrics.views), key: item.metrics.viewsSourceKey || 'Unavailable' },
    { label: 'Impressions', value: formatNumber(item.metrics.impressions), key: item.metrics.impressionsSourceKey || 'Unavailable' },
    { label: 'Reach', value: formatNumber(item.metrics.reach), key: item.metrics.reachSourceKey || 'Unavailable' },
    { label: item.metrics.likesLabel, value: formatNumber(item.metrics.likes), key: 'Native counter' },
    { label: item.metrics.commentsLabel, value: formatNumber(item.metrics.comments), key: 'Native counter' },
    { label: item.metrics.sharesLabel, value: formatNumber(item.metrics.shares), key: 'Native counter' },
    { label: 'Saves / Bookmarks', value: formatNumber(item.metrics.saves), key: item.metrics.saves !== null ? 'saved / bookmarks' : 'Unavailable' },
    { label: 'Watch Time', value: item.metrics.watchTimeMinutes !== null ? `${formatNumber(item.metrics.watchTimeMinutes)} min` : '—', key: item.metrics.watchTimeMinutes !== null ? 'estimatedMinutesWatched' : 'YouTube only' },
    { label: 'Avg Duration', value: formatDurationSeconds(item.metrics.avgViewDurationSec), key: item.metrics.avgViewDurationSec !== null ? 'averageViewDuration' : 'Unavailable' },
    { label: 'Link Clicks', value: formatNumber(item.metrics.linkClicks), key: item.metrics.linkClicks !== null ? 'url_clicks' : 'Unavailable' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-[#8E96A0] hover:text-[#FFFFFF] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          {backLabel}
        </button>
        <a
          href={item.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-[#A1A8B2] hover:text-[#FFFFFF] transition-colors"
        >
          Open Original
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        </a>
      </div>

      {/* Clean Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#737373]">
          <PlatformLabel platform={item.platform} />
          <span>·</span>
          <span>{item.contentType}</span>
          <span>·</span>
          <span className="font-mono">{formatShortDate(item.publishedAt)}</span>
          <span>·</span>
          <span className="font-mono">{item.externalId}</span>
        </div>
        <h1 className="mt-2 text-xl font-display font-bold text-[#FFFFFF]">
          {item.title}
        </h1>
        <p className="mt-1 text-xs text-[#8A8A8A] max-w-2xl leading-relaxed">
          {item.caption}
        </p>
      </div>

      {/* 4 Core Numbers + Expandable Full Provenance */}
      <ExpandableSurface
        className="p-5"
        scaleOnHover={1.008}
        ariaLabel="Post performance summary. Hover or click for all metrics and source fields."
        expandedContent={
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {allMetricDetails.map((m) => (
              <div key={m.label} className="bg-[#080808] border border-[#1C1C1C] rounded p-3">
                <div className="text-[10px] text-[#737373]">{m.label}</div>
                <div className="mt-1 text-sm font-mono font-semibold text-[#FFFFFF] tabular-nums">
                  {m.value}
                </div>
                <div className="mt-0.5 text-[10px] font-mono text-[#525252] truncate">
                  {m.key}
                </div>
              </div>
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pr-8 font-mono tabular-nums">
          <div>
            <span className="text-[11px] font-sans text-[#737373] block">Views</span>
            <span className="text-xl font-semibold text-[#FFFFFF]">
              {formatCompactNumber(item.metrics.views)}
            </span>
          </div>
          <div>
            <span className="text-[11px] font-sans text-[#737373] block">Impressions</span>
            <span className="text-xl font-semibold text-[#FFFFFF]">
              {formatCompactNumber(item.metrics.impressions)}
            </span>
          </div>
          <div>
            <span className="text-[11px] font-sans text-[#737373] block">Interactions</span>
            <span className="text-xl font-semibold text-[#FFFFFF]">
              {formatCompactNumber(totalInteractions)}
            </span>
          </div>
          <div>
            <span className="text-[11px] font-sans text-[#737373] block">vs Peer Median</span>
            <span className="text-xl font-semibold text-[#FFFFFF]">
              {baseline?.vsMedianPct !== null && baseline?.vsMedianPct !== undefined
                ? `${baseline.vsMedianPct >= 0 ? '+' : ''}${baseline.vsMedianPct.toFixed(0)}%`
                : '—'}
            </span>
          </div>
        </div>
      </ExpandableSurface>

      {/* Monochrome Snapshot History Curve + Expandable Snapshot Table */}
      <ExpandableSurface
        className="p-5"
        scaleOnHover={1.006}
        ariaLabel="Historical snapshot curve. Hover or click for snapshot log and peer baseline."
        expandedContent={
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {availableMetrics.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setHistoryMetric(m.key)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer ${
                      historyMetric === m.key
                        ? 'bg-[#FFFFFF] text-[#000000]'
                        : 'bg-[#171717] text-[#8A8A8A] hover:text-[#FFFFFF]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {baseline && (
                <span className="text-[11px] font-mono text-[#737373]">
                  {PLATFORM_META[item.platform].name} peer median: {formatNumber(baseline.median)} (n={baseline.sampleSize})
                </span>
              )}
            </div>

            {item.snapshots.length >= 2 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="border-b border-[#1F1F1F] text-[10px] text-[#666666]">
                      <th className="py-1.5 font-normal">Collected (UTC)</th>
                      <th className="py-1.5 font-normal">Age</th>
                      <th className="py-1.5 text-right font-normal">Cumulative</th>
                      <th className="py-1.5 text-right font-normal">Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#171717]">
                    {snapshotRows.map((row) => (
                      <tr key={row.collectedAt}>
                        <td className="py-1.5 text-[#8A8A8A]">
                          {formatDateTimeUtc(row.collectedAt)}
                        </td>
                        <td className="py-1.5 text-[#D4D4D4]">{row.shortLabel}</td>
                        <td className="py-1.5 text-right text-[#FFFFFF]">
                          {formatNumber(row.value)}
                        </td>
                        <td className="py-1.5 text-right text-[#A3A3A3]">
                          {row.delta !== null ? `+${formatNumber(row.delta)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        }
      >
        <div className="flex items-baseline justify-between gap-2 mb-4 pr-8">
          <h2 className="text-sm font-display font-semibold text-[#FFFFFF]">
            Snapshot History
          </h2>
          <span className="text-xs font-mono text-[#737373]">
            {item.snapshots.length} observations
          </span>
        </div>

        {item.snapshots.length < 2 ? (
          <UnavailableMetricState
            compact
            title="Historical trend will appear after multiple collections"
            reason="Only 1 snapshot has been stored for this item so far."
          />
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={snapshotRows} margin={{ top: 10, right: 16, left: -14, bottom: 0 }}>
                <CartesianGrid stroke="#171717" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fill: '#666666', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: '#1F1F1F' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => formatCompactNumber(v)}
                  tick={{ fill: '#666666', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  cursor={{ stroke: '#333333', strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const row = payload[0].payload as {
                      shortLabel: string;
                      collectedAt: string;
                      value: number | null;
                      delta: number | null;
                    };
                    return (
                      <div className="bg-[#0F0F0F] border border-[#333333] rounded px-3 py-2 text-xs font-mono shadow-2xl">
                        <div className="text-[#737373] mb-1">
                          {row.shortLabel} · {formatDateTimeUtc(row.collectedAt)}
                        </div>
                        <div className="flex items-center justify-between gap-4 tabular-nums">
                          <span className="text-[#A3A3A3] capitalize">{historyMetric}</span>
                          <span className="text-[#FFFFFF] font-semibold">
                            {formatNumber(row.value)}
                          </span>
                        </div>
                        {row.delta !== null && (
                          <div className="flex items-center justify-between gap-4 tabular-nums mt-1 pt-1 border-t border-[#1F1F1F]">
                            <span className="text-[#666666]">Since prior</span>
                            <span className="text-[#D4D4D4]">
                              +{formatNumber(row.delta)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#000000', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                  activeDot={{ r: 4.5, fill: '#FFFFFF' }}
                  isAnimationActive={false}
                />
                {snapshotRows
                  .filter((r) => r.milestone && r.value !== null)
                  .map((r) => (
                    <ReferenceDot
                      key={r.shortLabel}
                      x={r.shortLabel}
                      y={r.value!}
                      r={4}
                      fill="#FFFFFF"
                      stroke="#000000"
                      strokeWidth={1.5}
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </ExpandableSurface>
    </div>
  );
};
