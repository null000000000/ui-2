import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { ExpandableSurface } from '../components/shared/ExpandableSurface';
import { EmptyState } from '../components/shared/States';
import { PLATFORM_META } from '../data/metricRegistry';
import { computeEvidenceInsights } from '../services/apiClient';
import type {
  DateRangeSelection,
  NavRouteId,
  PlatformFilter,
  SocialMonitorDataset,
} from '../types/social';

interface AnalystPageProps {
  dataset: SocialMonitorDataset;
  platformFilter: PlatformFilter;
  dateRange: DateRangeSelection;
  onInspectContent: (contentId: string) => void;
  onNavigate: (route: NavRouteId, platform?: PlatformFilter) => void;
}

export const AnalystPage: React.FC<AnalystPageProps> = ({
  dataset,
  platformFilter,
  dateRange,
  onInspectContent,
  onNavigate,
}) => {
  const insights = useMemo(
    () => computeEvidenceInsights(dataset, platformFilter, dateRange),
    [dataset, platformFilter, dateRange]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-display font-bold text-[#FFFFFF]">Signals</h1>
        <span className="text-xs font-mono text-[#666666]">
          Evidence-backed findings · hover to inspect baseline & provenance
        </span>
      </div>

      {insights.length === 0 ? (
        <EmptyState
          title="No signals detected yet"
          description="Evidence-backed findings are generated automatically once daily observations and content metrics are synced from n8n."
          actionLabel="Open n8n Sync"
          onAction={() => onNavigate('sync')}
          secondaryLabel="Configure API"
          onSecondaryAction={() => onNavigate('settings')}
        />
      ) : (
        <div className="space-y-3">
          {insights.map((ins) => (
            <ExpandableSurface
              key={ins.id}
              className="p-5"
              scaleOnHover={1.01}
              ariaLabel={`${ins.question}. Hover or click for evidence details.`}
              expandedContent={
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                    <div>
                      <span className="font-sans text-[#666666] block">Observed</span>
                      <span className="text-[#FFFFFF]">{ins.observedValue}</span>
                    </div>
                    <div>
                      <span className="font-sans text-[#666666] block">Baseline</span>
                      <span className="text-[#D4D4D4]">{ins.baselineValue}</span>
                    </div>
                    <div>
                      <span className="font-sans text-[#666666] block">Scope</span>
                      <span className="text-[#A3A3A3]">
                        {ins.platformsIncluded.map((p) => PLATFORM_META[p].shortName).join(' · ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#737373] leading-relaxed">
                    {ins.metricDefinition} · {ins.freshnessCaveat}
                  </p>

                  <div className="flex justify-end">
                    {ins.relatedContentId ? (
                      <button
                        type="button"
                        onClick={() => onInspectContent(ins.relatedContentId!)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#FFFFFF] text-[#000000] text-xs font-medium cursor-pointer"
                      >
                        Inspect Post
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onNavigate(ins.targetRoute, ins.targetPlatform)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#FFFFFF] text-[#000000] text-xs font-medium cursor-pointer"
                      >
                        Open Chart
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    )}
                  </div>
                </div>
              }
            >
              <div className="pr-8">
                <div className="text-[11px] font-mono text-[#666666]">
                  {ins.question} · {ins.dateRangeLabel}
                </div>
                <h2 className="mt-1.5 text-sm font-display font-semibold text-[#FFFFFF] leading-relaxed">
                  {ins.conclusion}
                </h2>
              </div>
            </ExpandableSurface>
          ))}
        </div>
      )}
    </div>
  );
};
