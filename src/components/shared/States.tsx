import React from 'react';
import { AlertCircle, Database, Lock, RefreshCw } from 'lucide-react';

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}> = ({
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
}) => (
  <div className="bg-[#0E1012] border border-[#22252A] rounded-lg px-6 py-12 text-center flex flex-col items-center justify-center">
    <div className="w-9 h-9 rounded-md bg-[#121314] border border-[#22252A] flex items-center justify-center mb-3">
      <Database className="w-4 h-4 text-[#8E96A0] shrink-0" />
    </div>
    <h3 className="text-sm font-display font-semibold text-[#FFFFFF]">{title}</h3>
    <p className="mt-1.5 text-xs text-[#8E96A0] max-w-md leading-relaxed">
      {description}
    </p>
    {(actionLabel || secondaryLabel) && (
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="px-4 py-1.5 rounded bg-[#FFFFFF] text-[#000000] hover:bg-[#E5E5E5] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            {actionLabel}
          </button>
        )}
        {secondaryLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="px-4 py-1.5 rounded bg-[#141619] border border-[#26292E] hover:border-[#40454E] text-xs font-medium text-[#D4D4D4] hover:text-[#FFFFFF] transition-colors cursor-pointer whitespace-nowrap"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    )}
  </div>
);

export const UnavailableMetricState: React.FC<{
  title: string;
  reason: string;
  sourceNote?: string;
  compact?: boolean;
}> = ({ title, reason, sourceNote, compact = false }) => (
  <div
    className={`flex flex-col items-center justify-center text-center border border-dashed border-[#26292E] rounded-md bg-[#090A0B] ${
      compact ? 'px-4 py-6' : 'px-6 py-10'
    }`}
  >
    <div className="w-8 h-8 rounded-md bg-[#121314] border border-[#22252A] flex items-center justify-center mb-2.5">
      <Lock className="w-3.5 h-3.5 text-[#8E96A0] shrink-0" />
    </div>
    <div className="text-xs font-medium text-[#D4D4D4]">{title}</div>
    <p className="mt-1 text-xs text-[#737373] max-w-sm leading-relaxed">{reason}</p>
    {sourceNote && (
      <p className="mt-1.5 text-[11px] font-mono text-[#525252]">{sourceNote}</p>
    )}
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}> = ({
  title = 'Backend Unavailable',
  message,
  onRetry,
  secondaryLabel,
  onSecondaryAction,
}) => (
  <div className="bg-[#0E1012] border border-[#2E3238] rounded-lg px-5 py-4 flex flex-wrap items-start justify-between gap-4">
    <div className="flex items-start gap-3 min-w-0">
      <AlertCircle className="w-4 h-4 text-[#FFFFFF] shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="text-xs font-semibold text-[#FFFFFF]">{title}</div>
        <p className="mt-0.5 text-xs text-[#A1A8B2] leading-relaxed">{message}</p>
      </div>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#181A1D] border border-[#2E3238] hover:border-[#4A505A] text-xs font-medium text-[#FFFFFF] transition-colors cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
          Retry
        </button>
      )}
      {secondaryLabel && onSecondaryAction && (
        <button
          type="button"
          onClick={onSecondaryAction}
          className="px-3 py-1.5 rounded bg-[#FFFFFF] hover:bg-[#E5E5E5] text-xs font-medium text-[#000000] transition-colors cursor-pointer whitespace-nowrap"
        >
          {secondaryLabel}
        </button>
      )}
    </div>
  </div>
);

export const LoadingSkeletonPanel: React.FC<{ heightClass?: string }> = ({
  heightClass = 'h-40',
}) => (
  <div
    className={`bg-[#0E1012] border border-[#22252A] rounded-lg p-4 ${heightClass} animate-pulse flex flex-col justify-between`}
  >
    <div className="h-3 w-28 bg-[#181A1D] rounded" />
    <div className="space-y-2">
      <div className="h-2.5 w-full bg-[#141619] rounded" />
      <div className="h-2.5 w-2/3 bg-[#141619] rounded" />
    </div>
  </div>
);
