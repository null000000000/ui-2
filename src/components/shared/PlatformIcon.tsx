import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Link2Off,
  ShieldAlert,
} from 'lucide-react';
import { PLATFORM_META } from '../../data/metricRegistry';
import type { ConnectionState, PlatformId } from '../../types/social';
import { formatDateTimeUtc } from '../../utils/format';

export const PlatformIcon: React.FC<{
  platform: PlatformId;
  className?: string;
}> = ({ platform, className = 'w-4 h-4' }) => {
  switch (platform) {
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M23.5 6.2a3.01 3.01 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.01 3.01 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3.01 3.01 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.01 3.01 0 0 0 2.12-2.14A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.27 3.6-6.27 3.6Z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1Z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      );
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99C18.34 21.13 22 16.99 22 12Z" />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z" />
        </svg>
      );
  }
};

export const PlatformLabel: React.FC<{
  platform: PlatformId;
  showShort?: boolean;
}> = ({ platform, showShort = false }) => {
  const meta = PLATFORM_META[platform];
  return (
    <span className="inline-flex items-center gap-1.5 text-[#FFFFFF] whitespace-nowrap">
      <span className="inline-flex shrink-0 text-[#B5B5B5]">
        <PlatformIcon platform={platform} className="w-3.5 h-3.5" />
      </span>
      <span>{showShort ? meta.shortName : meta.name}</span>
    </span>
  );
};

const CONNECTION_META: Record<
  ConnectionState,
  { label: string; colorClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  CONNECTED: { label: 'Connected', colorClass: 'text-[#FFFFFF]', icon: CheckCircle2 },
  PARTIAL_ACCESS: { label: 'Partial', colorClass: 'text-[#A3A3A3]', icon: AlertTriangle },
  PENDING_ACCOUNT_SETUP: { label: 'Pending', colorClass: 'text-[#8A8A8A]', icon: Clock },
  PENDING_APP_REVIEW: { label: 'In Review', colorClass: 'text-[#8A8A8A]', icon: Clock },
  NOT_CONNECTED: { label: 'Unlinked', colorClass: 'text-[#666666]', icon: Link2Off },
  DISCONNECTED: { label: 'Disconnected', colorClass: 'text-[#666666]', icon: Link2Off },
  REAUTH_REQUIRED: { label: 'Reauth', colorClass: 'text-[#D4D4D4]', icon: ShieldAlert },
  PERMISSION_MISSING: { label: 'Missing Scope', colorClass: 'text-[#A3A3A3]', icon: ShieldAlert },
  RATE_LIMITED: { label: 'Rate Limited', colorClass: 'text-[#A3A3A3]', icon: AlertTriangle },
  ERROR: { label: 'Error', colorClass: 'text-[#FFFFFF]', icon: AlertCircle },
};

export const ConnectionStatus: React.FC<{ state: ConnectionState }> = ({ state }) => {
  const cfg = CONNECTION_META[state] ?? CONNECTION_META.NOT_CONNECTED;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap ${cfg.colorClass}`}>
      <Icon className="w-3 h-3 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
};

export const DataFreshnessLabel: React.FC<{
  lastUpdatedAt: string | null;
  compact?: boolean;
}> = ({ lastUpdatedAt, compact = false }) => {
  if (!lastUpdatedAt) {
    return (
      <span className="text-xs text-[#666666] whitespace-nowrap">
        Not synced
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[#737373] whitespace-nowrap font-mono tabular-nums">
      <Clock className="w-3 h-3 text-[#525252] shrink-0" />
      {compact ? (
        <span>{formatDateTimeUtc(lastUpdatedAt)}</span>
      ) : (
        <span>Updated: {formatDateTimeUtc(lastUpdatedAt)}</span>
      )}
    </span>
  );
};
