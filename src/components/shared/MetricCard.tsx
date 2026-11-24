import React from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from 'lucide-react';
import { METRIC_REGISTRY, PLATFORM_META } from '../../data/metricRegistry';
import type { CanonicalMetricKey, PlatformFilter, PlatformId } from '../../types/social';
import { formatCompactNumber, formatDeltaPct, formatNumber } from '../../utils/format';
import { ExpandableSurface } from './ExpandableSurface';

export const MetricInfoTooltip: React.FC<{
  metricKey: CanonicalMetricKey;
  platformFilter: PlatformFilter;
}> = ({ metricKey, platformFilter }) => {
  const entry = METRIC_REGISTRY[metricKey];
  const srcKey =
    platformFilter !== 'all' ? entry.sourceKeys[platformFilter] : entry.key;
  return (
    <span
      className="text-[10px] font-mono text-[#666666]"
      title={`${entry.description} (${srcKey || entry.key})`}
    >
      {entry.aggregation}
    </span>
  );
};

interface MetricCardProps {
  metricKey: CanonicalMetricKey;
  titleOverride?: string;
  value: number | null;
  previousValue: number | null;
  unitLabel?: string;
  subtitle?: string;
  platformFilter: PlatformFilter;
  sparkline?: number[];
  unavailableReason?: string;
  lastCollectedAt?: string | null;
  onDrillDown?: () => void;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  metricKey,
  titleOverride,
  value,
  previousValue,
  unitLabel,
  subtitle,
  platformFilter,
  sparkline,
  unavailableReason,
  lastCollectedAt,
  onDrillDown,
  onClick,
}) => {
  const entry = METRIC_REGISTRY[metricKey];
  const title =
    titleOverride ||
    (platformFilter === 'all' ? entry.crossPlatformLabel : entry.label);
  const delta = formatDeltaPct(value, previousValue);
  const actionHandler = onDrillDown || onClick;

  const sourceList: Array<{ platform: PlatformId; key: string }> =
    platformFilter === 'all'
      ? (Object.entries(entry.sourceKeys) as Array<[PlatformId, string]>).map(
          ([platform, key]) => ({ platform, key })
        )
      : entry.sourceKeys[platformFilter]
        ? [{ platform: platformFilter, key: entry.sourceKeys[platformFilter]! }]
        : [];

  const renderSparkline = () => {
    if (!sparkline || sparkline.length < 2) return null;
    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min || 1;
    const width = 120;
    const height = 28;
    const points = sparkline
      .map((v, idx) => {
        const x = (idx / (sparkline.length - 1)) * width;
        const y = height - ((v - min) / range) * (height - 4) - 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-7 overflow-visible"
        aria-hidden="true"
      >
        <polyline
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <ExpandableSurface
      mode="overlay"
      pinOffset="compact"
      className="p-4"
      scaleOnHover={1.02}
      ariaLabel={`${title}: ${value === null ? 'Unavailable' : formatNumber(value)}. Hover or click for details.`}
      expandedContent={
        <div className="space-y-3 text-xs">
          {value !== null && sparkline && sparkline.length >= 2 && (
            <div className="bg-[#080808] border border-[#1C1C1C] rounded p-2">
              {renderSparkline()}
            </div>
          )}

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between gap-2">
              <span className="text-[#666666]">Exact Value</span>
              <span className="font-mono text-[#FFFFFF] tabular-nums">
                {value === null ? 'Unavailable' : `${formatNumber(value)} ${unitLabel || entry.unit}`}
              </span>
            </div>
            {previousValue !== null && (
              <div className="flex justify-between gap-2">
                <span className="text-[#666666]">Prior Window</span>
                <span className="font-mono text-[#A3A3A3] tabular-nums">
                  {formatNumber(previousValue)} {unitLabel || entry.unit}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-2">
              <span className="text-[#666666]">Aggregation</span>
              <span className="font-mono text-[#A3A3A3]">{entry.aggregation}</span>
            </div>
          </div>

          {sourceList.length > 0 && (
            <div className="pt-2 border-t border-[#1C1C1C] space-y-1 text-[11px]">
              <div className="text-[#666666]">Source field(s)</div>
              {sourceList.slice(0, 3).map((s) => (
                <div key={s.platform} className="flex justify-between gap-2">
                  <span className="text-[#8A8A8A]">{PLATFORM_META[s.platform].shortName}</span>
                  <span className="font-mono text-[#D4D4D4] truncate max-w-[140px]">
                    {s.key}
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className="text-[11px] text-[#737373] leading-relaxed">
            {value === null
              ? unavailableReason || entry.description
              : subtitle || entry.description}
          </p>

          {lastCollectedAt && (
            <div className="text-[10px] font-mono text-[#525252]">
              Updated {new Date(lastCollectedAt).toISOString().slice(0, 16).replace('T', ' ')} UTC
            </div>
          )}

          {actionHandler && (
            <button
              type="button"
              onClick={actionHandler}
              className="w-full mt-1 inline-flex items-center justify-between px-2.5 py-1.5 rounded bg-[#1A1A1A] hover:bg-[#262626] border border-[#2E2E2E] text-[11px] font-medium text-[#FFFFFF] transition-colors cursor-pointer"
            >
              <span>Inspect in Analytics</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          )}
        </div>
      }
    >
      {/* Minimal resting state: Label + Primary Figure + Quiet Delta */}
      <div className="pr-8">
        <span className="text-xs font-medium text-[#8A8A8A] block truncate">
          {title}
        </span>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        {value === null ? (
          <span className="text-xl font-mono text-[#525252]">—</span>
        ) : (
          <span className="text-2xl font-display font-semibold font-mono tabular-nums text-[#FFFFFF] tracking-tight leading-none">
            {formatCompactNumber(value)}
            {unitLabel && (
              <span className="text-xs font-normal text-[#737373] ml-1">
                {unitLabel}
              </span>
            )}
          </span>
        )}

        {value !== null && delta.direction !== 'unavailable' && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-mono tabular-nums whitespace-nowrap ${
              delta.direction === 'up' ? 'text-[#FFFFFF]' : 'text-[#737373]'
            }`}
          >
            {delta.direction === 'up' && <ArrowUpRight className="w-3 h-3 shrink-0" />}
            {delta.direction === 'down' && <ArrowDownRight className="w-3 h-3 shrink-0" />}
            {delta.direction === 'flat' && <Minus className="w-3 h-3 shrink-0" />}
            <span>{delta.label}</span>
          </span>
        )}
      </div>
    </ExpandableSurface>
  );
};
