import React from 'react';
import { RefreshCw } from 'lucide-react';
import { ExpandableSurface } from '../components/shared/ExpandableSurface';
import { PlatformLabel } from '../components/shared/PlatformIcon';
import { EmptyState } from '../components/shared/States';
import type { SyncRunRecord } from '../types/social';
import { formatDateTimeUtc, formatDurationMs, formatNumber } from '../utils/format';

interface SyncCenterPageProps {
  runs: SyncRunRecord[];
  apiConfigured: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
}

export const SyncCenterPage: React.FC<SyncCenterPageProps> = ({
  runs,
  apiConfigured,
  onRefresh,
  onOpenSettings,
}) => {
  const totalFetched = runs.reduce((acc, r) => acc + r.recordsFetched, 0);
  const totalValidated = runs.reduce((acc, r) => acc + r.recordsValidated, 0);
  const failedCount = runs.filter((r) => r.status === 'FAILED').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-display font-bold text-[#FFFFFF]">n8n Sync</h1>
          <span className="text-xs font-mono text-[#666666]">
            {runs.length > 0 ? `${runs.length} recorded runs` : 'Pipeline execution monitor'}
          </span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0E1012] border border-[#22252A] hover:border-[#40454E] text-xs font-medium text-[#FFFFFF] transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
          Refresh
        </button>
      </div>

      {/* Minimal 3-stat Pipeline Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0E1012] border border-[#22252A] rounded-lg p-4">
          <div className="text-xs text-[#8E96A0]">Pipeline Status</div>
          <div className="mt-2 text-lg font-mono font-semibold text-[#FFFFFF]">
            {apiConfigured ? 'LIVE API' : 'AWAITING API'}
          </div>
        </div>
        <div className="bg-[#0E1012] border border-[#22252A] rounded-lg p-4">
          <div className="text-xs text-[#8E96A0]">Validated / Fetched</div>
          <div className="mt-2 text-lg font-mono font-semibold text-[#FFFFFF] tabular-nums">
            {formatNumber(totalValidated)} / {formatNumber(totalFetched)}
          </div>
        </div>
        <div className="bg-[#0E1012] border border-[#22252A] rounded-lg p-4">
          <div className="text-xs text-[#8E96A0]">Alerts</div>
          <div className="mt-2 text-lg font-mono font-semibold text-[#FFFFFF] tabular-nums">
            {failedCount} failed
          </div>
        </div>
      </div>

      {/* Expandable Workflow Run Cards or Production Empty State */}
      {runs.length === 0 ? (
        <EmptyState
          title="No sync runs recorded yet"
          description={
            apiConfigured
              ? 'Your backend API is configured, and workflow execution logs will appear here as soon as n8n completes a run.'
              : 'Configure VITE_API_BASE_URL in your environment and point your n8n delivery adapter to your backend to monitor live pipeline runs.'
          }
          actionLabel={apiConfigured ? 'Refresh Runs' : 'Configure API'}
          onAction={apiConfigured ? onRefresh : onOpenSettings}
          secondaryLabel={apiConfigured ? 'API Settings' : undefined}
          onSecondaryAction={apiConfigured ? onOpenSettings : undefined}
        />
      ) : (
        <div className="space-y-2.5">
          {runs.map((run) => (
            <ExpandableSurface
              key={run.runId}
              pinOffset="compact"
              className="p-4"
              scaleOnHover={1.008}
              ariaLabel={`${run.workflowName}. Hover or click for run metrics and remediation.`}
              expandedContent={
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono tabular-nums text-[11px]">
                    <div>
                      <span className="font-sans text-[#666666] block">Fetched</span>
                      <span className="text-[#FFFFFF]">{run.recordsFetched}</span>
                    </div>
                    <div>
                      <span className="font-sans text-[#666666] block">Normalized</span>
                      <span className="text-[#D4D4D4]">{run.recordsNormalized}</span>
                    </div>
                    <div>
                      <span className="font-sans text-[#666666] block">Validated</span>
                      <span className="text-[#FFFFFF]">{run.recordsValidated}</span>
                    </div>
                    <div>
                      <span className="font-sans text-[#666666] block">Rejected</span>
                      <span className="text-[#A3A3A3]">{run.recordsRejected}</span>
                    </div>
                    <div>
                      <span className="font-sans text-[#666666] block">Duplicates</span>
                      <span className="text-[#8A8A8A]">{run.recordsDuplicate}</span>
                    </div>
                  </div>

                  {run.errorMessage && (
                    <p className="text-[#D4D4D4] leading-relaxed">
                      <span className="text-[#FFFFFF] font-medium">Diagnostic: </span>
                      {run.errorMessage}
                    </p>
                  )}

                  {run.remediation && (
                    <p className="text-[#8A8A8A] leading-relaxed">
                      <span className="text-[#D4D4D4] font-medium">Next step: </span>
                      {run.remediation}
                    </p>
                  )}

                  <div className="text-[10px] font-mono text-[#525252]">
                    {run.runId} · Started {formatDateTimeUtc(run.startedAt)}
                  </div>
                </div>
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-[#666666] shrink-0">
                    {run.workflowNumber}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#FFFFFF] truncate">
                      {run.workflowName}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#737373]">
                      {run.platform === 'orchestrator' ? (
                        <span className="font-mono">Orchestrator</span>
                      ) : (
                        <PlatformLabel platform={run.platform} />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono tabular-nums shrink-0">
                  <span className="text-[#8A8A8A]">{formatDurationMs(run.durationMs)}</span>
                  <span
                    className={
                      run.status === 'FAILED' ? 'text-[#FFFFFF] underline' : 'text-[#A3A3A3]'
                    }
                  >
                    {run.deliveryState}
                  </span>
                </div>
              </div>
            </ExpandableSurface>
          ))}
        </div>
      )}
    </div>
  );
};
