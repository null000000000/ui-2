import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { EvidenceInsight, NavRouteId, PlatformFilter } from '../../types/social';
import { ExpandableSurface } from './ExpandableSurface';

interface InsightPanelProps {
  insights: EvidenceInsight[];
  onOpenAnalyst?: () => void;
  onInspectContent?: (contentId: string) => void;
  onNavigate?: (route: NavRouteId, platform?: PlatformFilter) => void;
  analystEnabled: boolean;
  mode?: 'inline' | 'overlay';
  fullHeight?: boolean;
}

export const InsightPanel: React.FC<InsightPanelProps> = ({
  insights,
  onOpenAnalyst,
  onInspectContent,
  onNavigate,
  analystEnabled,
  mode = 'inline',
  fullHeight = false,
}) => {
  const lead = insights[0];

  return (
    <ExpandableSurface
      mode={mode}
      fullHeight={fullHeight}
      className="p-5"
      scaleOnHover={1.012}
      ariaLabel="Observed signals. Hover or click to inspect full analytical evidence."
      expandedContent={
        insights.length === 0 ? (
          <p className="text-xs text-[#666666]">
            Insufficient observations for the selected window.
          </p>
        ) : (
          <div className="space-y-3 divide-y divide-[#1C1C1C]">
            {insights.map((ins) => (
              <div key={ins.id} className="pt-3 first:pt-0 space-y-1.5">
                <p className="text-xs text-[#E5E5E5] leading-relaxed">
                  {ins.conclusion}
                </p>
                <div className="text-[11px] font-mono text-[#737373]">
                  {ins.observedValue} · {ins.baselineValue}
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] font-mono text-[#525252]">
                    {ins.dateRangeLabel}
                  </span>
                  {ins.relatedContentId && onInspectContent ? (
                    <button
                      type="button"
                      onClick={() => onInspectContent(ins.relatedContentId!)}
                      className="text-[11px] text-[#FFFFFF] hover:text-[#A3A3A3] transition-colors cursor-pointer"
                    >
                      Inspect post →
                    </button>
                  ) : onNavigate ? (
                    <button
                      type="button"
                      onClick={() => onNavigate(ins.targetRoute, ins.targetPlatform)}
                      className="text-[11px] text-[#FFFFFF] hover:text-[#A3A3A3] transition-colors cursor-pointer"
                    >
                      View chart →
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            {analystEnabled && onOpenAnalyst && (
              <div className="pt-3">
                <button
                  type="button"
                  onClick={onOpenAnalyst}
                  className="w-full inline-flex items-center justify-between px-3 py-1.5 rounded bg-[#1A1A1A] hover:bg-[#262626] border border-[#2E2E2E] text-[11px] font-medium text-[#FFFFFF] transition-colors cursor-pointer"
                >
                  <span>Open Full Evidence Analyst</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            )}
          </div>
        )
      }
    >
      <div className="flex items-baseline justify-between gap-2 pr-8">
        <h2 className="text-sm font-display font-semibold text-[#FFFFFF]">
          Signals
        </h2>
        <span className="text-xs font-mono text-[#737373]">
          {insights.length} noted
        </span>
      </div>
      <p className="mt-2.5 text-xs text-[#A3A3A3] line-clamp-2 leading-relaxed">
        {lead ? lead.conclusion : 'No signals available in this window.'}
      </p>
    </ExpandableSurface>
  );
};
