import React, { useMemo, useState } from 'react';
import type { ContentItem, ContentType } from '../../types/social';
import { formatCompactNumber } from '../../utils/format';
import { ExpandableSurface } from '../shared/ExpandableSurface';
import { UnavailableMetricState } from '../shared/States';

type BreakdownBasis = 'interactions' | 'views' | 'count';

interface ContentTypeBreakdownProps {
  items: ContentItem[];
  onSelectType?: (type: ContentType) => void;
  mode?: 'inline' | 'overlay';
  fullHeight?: boolean;
}

export const ContentTypeBreakdown: React.FC<ContentTypeBreakdownProps> = ({
  items,
  onSelectType,
  mode = 'inline',
  fullHeight = false,
}) => {
  const [basis, setBasis] = useState<BreakdownBasis>('interactions');

  const rows = useMemo(() => {
    const map = new Map<
      ContentType,
      { count: number; views: number; hasViews: boolean; interactions: number }
    >();

    for (const item of items) {
      const existing = map.get(item.contentType) ?? {
        count: 0,
        views: 0,
        hasViews: false,
        interactions: 0,
      };
      existing.count += 1;
      if (item.metrics.views !== null) {
        existing.views += item.metrics.views;
        existing.hasViews = true;
      }
      existing.interactions +=
        (item.metrics.likes ?? 0) +
        (item.metrics.comments ?? 0) +
        (item.metrics.shares ?? 0) +
        (item.metrics.saves ?? 0);
      map.set(item.contentType, existing);
    }

    const list = Array.from(map.entries()).map(([type, stats]) => ({
      type,
      value:
        basis === 'count'
          ? stats.count
          : basis === 'views'
            ? stats.hasViews
              ? stats.views
              : 0
            : stats.interactions,
      count: stats.count,
      hasViews: stats.hasViews,
    }));

    const filtered =
      basis === 'views' ? list.filter((r) => r.hasViews && r.value > 0) : list;
    const total = filtered.reduce((acc, r) => acc + r.value, 0);

    return filtered
      .sort((a, b) => b.value - a.value)
      .map((r) => ({
        ...r,
        sharePct: total > 0 ? (r.value / total) * 100 : 0,
      }));
  }, [items, basis]);

  const leader = rows[0];

  return (
    <ExpandableSurface
      mode={mode}
      fullHeight={fullHeight}
      className="p-5"
      scaleOnHover={1.012}
      ariaLabel="Content formats breakdown. Hover or click to inspect all formats."
      expandedContent={
        rows.length === 0 ? (
          <UnavailableMetricState
            compact
            title="No format breakdown"
            reason="No items match the current platform and basis."
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-1">
              {(['interactions', 'views', 'count'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setBasis(opt)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    basis === opt
                      ? 'bg-[#FFFFFF] text-[#000000]'
                      : 'bg-[#171717] text-[#8A8A8A] hover:text-[#FFFFFF]'
                  }`}
                >
                  {opt === 'interactions' ? 'Actions' : opt === 'views' ? 'Views' : 'Posts'}
                </button>
              ))}
            </div>

            <div className="space-y-2.5">
              {rows.map((row) => (
                <button
                  key={row.type}
                  type="button"
                  onClick={() => onSelectType?.(row.type)}
                  className="w-full text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#D4D4D4] group-hover:text-[#FFFFFF]">
                      {row.type}
                      <span className="text-[#666666] ml-1.5 font-mono text-[11px]">
                        ({row.count})
                      </span>
                    </span>
                    <span className="font-mono tabular-nums text-[#FFFFFF]">
                      {row.sharePct.toFixed(1)}%
                      <span className="text-[#666666] ml-1.5 text-[11px]">
                        {formatCompactNumber(row.value)}
                      </span>
                    </span>
                  </div>
                  <div className="h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FFFFFF] rounded-full"
                      style={{ width: `${Math.max(3, row.sharePct)}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      }
    >
      <div className="flex items-baseline justify-between gap-2 pr-8">
        <h2 className="text-sm font-display font-semibold text-[#FFFFFF]">
          Content Formats
        </h2>
        <span className="text-xs font-mono text-[#737373]">
          {rows.length} types
        </span>
      </div>

      {leader ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-base font-display font-semibold text-[#FFFFFF]">
              {leader.type}
            </span>
            <span className="text-sm font-mono tabular-nums text-[#A3A3A3]">
              {leader.sharePct.toFixed(0)}% share
            </span>
          </div>
          <div className="h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FFFFFF] rounded-full"
              style={{ width: `${leader.sharePct}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-3 text-xs text-[#666666]">No published content</div>
      )}
    </ExpandableSurface>
  );
};
