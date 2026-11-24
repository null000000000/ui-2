import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Film,
  FileText,
  Image as ImageIcon,
  Layers,
  X,
} from 'lucide-react';
import { ExpandableSurface } from '../components/shared/ExpandableSurface';
import { PlatformLabel } from '../components/shared/PlatformIcon';
import { EmptyState } from '../components/shared/States';
import { PLATFORM_LIST, PLATFORM_META } from '../data/metricRegistry';
import type {
  ContentItem,
  ContentType,
  DateRangeSelection,
  PlatformFilter,
} from '../types/social';
import {
  formatCompactNumber,
  formatDurationSeconds,
  formatNumber,
  formatShortDate,
} from '../utils/format';

type SortOption = 'recent' | 'views' | 'interactions' | 'impressions';

const ALL_CONTENT_TYPES: ContentType[] = [
  'Video',
  'Short',
  'Reel',
  'Carousel',
  'Image',
  'Text',
  'Article',
];

interface ContentLibraryPageProps {
  items: ContentItem[];
  platformFilter: PlatformFilter;
  onChangePlatform: (platform: PlatformFilter) => void;
  dateRange: DateRangeSelection;
  searchQuery: string;
  onChangeSearch: (q: string) => void;
  initialContentType?: ContentType | 'all';
  onSelectContent: (contentId: string) => void;
  onOpenSync: () => void;
  onOpenSettings: () => void;
}

function getInteractions(item: ContentItem): number {
  return (
    (item.metrics.likes ?? 0) +
    (item.metrics.comments ?? 0) +
    (item.metrics.shares ?? 0) +
    (item.metrics.saves ?? 0)
  );
}

const TypeIcon: React.FC<{ type: ContentType }> = ({ type }) => {
  switch (type) {
    case 'Video':
    case 'Short':
    case 'Reel':
      return <Film className="w-3.5 h-3.5 text-[#A1A8B2] shrink-0" />;
    case 'Carousel':
      return <Layers className="w-3.5 h-3.5 text-[#A1A8B2] shrink-0" />;
    case 'Image':
    case 'Story':
      return <ImageIcon className="w-3.5 h-3.5 text-[#A1A8B2] shrink-0" />;
    default:
      return <FileText className="w-3.5 h-3.5 text-[#A1A8B2] shrink-0" />;
  }
};

export const ContentLibraryPage: React.FC<ContentLibraryPageProps> = ({
  items,
  platformFilter,
  onChangePlatform,
  searchQuery,
  onChangeSearch,
  initialContentType = 'all',
  onSelectContent,
  onOpenSync,
  onOpenSettings,
}) => {
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentType | 'all'>(
    initialContentType
  );
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    setContentTypeFilter(initialContentType);
    setPage(1);
  }, [initialContentType]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    platformFilter !== 'all' ||
    contentTypeFilter !== 'all';

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (platformFilter !== 'all' && item.platform !== platformFilter) return false;
      if (contentTypeFilter !== 'all' && item.contentType !== contentTypeFilter) {
        return false;
      }
      if (q) {
        const hay =
          `${item.title} ${item.caption} ${item.externalId} ${item.accountHandle} ${PLATFORM_META[item.platform].name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, platformFilter, contentTypeFilter, searchQuery]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sortBy === 'views') return (b.metrics.views ?? -1) - (a.metrics.views ?? -1);
      if (sortBy === 'interactions') return getInteractions(b) - getInteractions(a);
      if (sortBy === 'impressions') {
        return (b.metrics.impressions ?? -1) - (a.metrics.impressions ?? -1);
      }
      return b.publishedAt.localeCompare(a.publishedAt);
    });
    return arr;
  }, [filtered, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const exportCsv = () => {
    const headers = ['id', 'platform', 'type', 'title', 'published_at', 'views', 'impressions', 'reach', 'interactions'];
    const rows = [
      headers.join(','),
      ...sorted.map((i) =>
        [
          i.id,
          i.platform,
          i.contentType,
          `"${i.title.replace(/"/g, '""')}"`,
          i.publishedAt,
          i.metrics.views ?? '',
          i.metrics.impressions ?? '',
          i.metrics.reach ?? '',
          getInteractions(i),
        ].join(',')
      ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `axiom-content-${platformFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Minimal Header & Compact Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-display font-bold text-[#FFFFFF]">Content</h1>
          <span className="text-xs font-mono text-[#666666]">
            {sorted.length} items · hover a post to inspect
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by platform"
            value={platformFilter}
            onChange={(e) => {
              onChangePlatform(e.target.value as PlatformFilter);
              setPage(1);
            }}
            className="bg-[#0B0B0B] border border-[#222222] rounded-md px-2.5 py-1.5 text-xs text-[#FFFFFF] cursor-pointer"
          >
            <option value="all" className="bg-[#0B0B0B]">All Platforms</option>
            {PLATFORM_LIST.map((pid) => (
              <option key={pid} value={pid} className="bg-[#0B0B0B]">
                {PLATFORM_META[pid].name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by format"
            value={contentTypeFilter}
            onChange={(e) => {
              setContentTypeFilter(e.target.value as ContentType | 'all');
              setPage(1);
            }}
            className="bg-[#0B0B0B] border border-[#222222] rounded-md px-2.5 py-1.5 text-xs text-[#FFFFFF] cursor-pointer"
          >
            <option value="all" className="bg-[#0B0B0B]">All Formats</option>
            {ALL_CONTENT_TYPES.map((t) => (
              <option key={t} value={t} className="bg-[#0B0B0B]">
                {t}
              </option>
            ))}
          </select>

          <select
            aria-label="Sort posts"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-[#0B0B0B] border border-[#222222] rounded-md px-2.5 py-1.5 text-xs text-[#FFFFFF] cursor-pointer"
          >
            <option value="recent" className="bg-[#0B0B0B]">Most Recent</option>
            <option value="views" className="bg-[#0B0B0B]">Views</option>
            <option value="interactions" className="bg-[#0B0B0B]">Interactions</option>
            <option value="impressions" className="bg-[#0B0B0B]">Impressions</option>
          </select>

          <button
            type="button"
            disabled={sorted.length === 0}
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0B0B0B] border border-[#222222] hover:border-[#404040] text-xs text-[#D4D4D4] hover:text-[#FFFFFF] disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            CSV
          </button>
        </div>
      </div>

      {hasActiveFilters && sorted.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-md bg-[#0A0A0A] border border-[#1C1C1C] text-xs">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[#A3A3A3]">
            <span className="text-[#666666] font-sans">Active:</span>
            {platformFilter !== 'all' && (
              <span className="text-[#FFFFFF]">{PLATFORM_META[platformFilter].name}</span>
            )}
            {contentTypeFilter !== 'all' && (
              <span className="text-[#FFFFFF]">{contentTypeFilter}</span>
            )}
            {searchQuery.trim() && (
              <span className="text-[#FFFFFF]">“{searchQuery.trim()}”</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onChangeSearch('');
              onChangePlatform('all');
              setContentTypeFilter('all');
              setPage(1);
            }}
            className="inline-flex items-center gap-1 text-[11px] text-[#8A8A8A] hover:text-[#FFFFFF] cursor-pointer"
          >
            <X className="w-3 h-3 shrink-0" />
            Clear filters
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="No content records yet"
          description="Connect your n8n ingestion workflows and backend API to automatically track posts and performance timelines."
          actionLabel="Open n8n Sync"
          onAction={onOpenSync}
          secondaryLabel="Configure API"
          onSecondaryAction={onOpenSettings}
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No matching posts"
          description="Reset your platform, format, or search filters."
          actionLabel="Reset Filters"
          onAction={() => {
            onChangeSearch('');
            onChangePlatform('all');
            setContentTypeFilter('all');
          }}
        />
      ) : (
        <>
          {/* Minimal Expandable Content List */}
          <div className="space-y-2.5">
            {paginated.map((item) => {
              const primaryMetric = item.metrics.views ?? item.metrics.impressions;
              const primaryLabel = item.metrics.views !== null ? 'views' : 'impressions';
              const totalActions = getInteractions(item);

              return (
                <ExpandableSurface
                  key={item.id}
                  pinOffset="compact"
                  className="p-4"
                  scaleOnHover={1.01}
                  ariaLabel={`${item.title}. Hover or click for full metrics.`}
                  expandedContent={
                    <div className="space-y-3">
                      <p className="text-xs text-[#A3A3A3] leading-relaxed">
                        {item.caption}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono tabular-nums">
                        <div>
                          <span className="text-[10px] font-sans text-[#666666] block">
                            Views
                          </span>
                          <span className="text-[#FFFFFF]">
                            {formatNumber(item.metrics.views)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-sans text-[#666666] block">
                            Impressions / Reach
                          </span>
                          <span className="text-[#D4D4D4]">
                            {formatNumber(item.metrics.impressions)} / {formatNumber(item.metrics.reach)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-sans text-[#666666] block">
                            {item.metrics.likesLabel} · {item.metrics.commentsLabel}
                          </span>
                          <span className="text-[#D4D4D4]">
                            {formatNumber(item.metrics.likes)} · {formatNumber(item.metrics.comments)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-sans text-[#666666] block">
                            {item.metrics.sharesLabel} · Saves
                          </span>
                          <span className="text-[#D4D4D4]">
                            {formatNumber(item.metrics.shares)} · {formatNumber(item.metrics.saves)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-sans text-[#666666] block">
                            Snapshots
                          </span>
                          <span className="text-[#8A8A8A]">
                            {item.snapshots.length} collected
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-mono text-[#525252]">
                          {item.externalId} · {item.accountHandle}
                        </span>
                        <button
                          type="button"
                          onClick={() => onSelectContent(item.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#FFFFFF] text-[#000000] hover:bg-[#E5E5E5] text-xs font-medium transition-colors cursor-pointer"
                        >
                          Open Full Timeline
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </div>
                    </div>
                  }
                >
                  {/* Minimal Resting Row */}
                  <div className="flex items-center justify-between gap-3 sm:gap-4 pr-8">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-md bg-[#121314] border border-[#26292E] shrink-0 flex flex-col items-center justify-center gap-0.5">
                        <TypeIcon type={item.contentType} />
                        {item.durationSeconds !== null && (
                          <span className="text-[8px] font-mono leading-none text-[#8E96A0]">
                            {formatDurationSeconds(item.durationSeconds)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[#FFFFFF] truncate">
                          {item.title}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#737373]">
                          <PlatformLabel platform={item.platform} showShort />
                          <span aria-hidden="true">·</span>
                          <span>{item.contentType}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{formatShortDate(item.publishedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono tabular-nums shrink-0">
                      <div className="text-sm font-semibold text-[#FFFFFF]">
                        {formatCompactNumber(primaryMetric)}
                        <span className="hidden sm:inline text-[10px] text-[#666666] ml-1">
                          {primaryMetric !== null ? primaryLabel : ''}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#737373]">
                        {formatCompactNumber(totalActions)} actions
                      </div>
                    </div>
                  </div>
                </ExpandableSurface>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-[#737373] font-mono">
              <span>
                Page {safePage} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-md border border-[#22252A] hover:border-[#40454E] flex items-center justify-center text-[#D4D4D4] hover:text-[#FFFFFF] disabled:opacity-30 cursor-pointer transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="w-8 h-8 rounded-md border border-[#22252A] hover:border-[#40454E] flex items-center justify-center text-[#D4D4D4] hover:text-[#FFFFFF] disabled:opacity-30 cursor-pointer transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
