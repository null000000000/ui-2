import React, { useState } from 'react';
import { CheckCircle2, Upload, X } from 'lucide-react';
import { ExpandableSurface } from '../components/shared/ExpandableSurface';
import { ConnectionStatus, PlatformIcon } from '../components/shared/PlatformIcon';
import { PLATFORM_META } from '../data/metricRegistry';
import type { PlatformAccount, PlatformId } from '../types/social';
import { formatCompactNumber, formatDateTimeUtc } from '../utils/format';

interface AccountsPageProps {
  accounts: PlatformAccount[];
  onOpenSyncCenter: () => void;
}

const KNOWN_CSV_MAPPINGS: Record<'x' | 'linkedin', Record<string, string>> = {
  x: {
    'post id': 'externalContentId',
    'tweet id': 'externalContentId',
    date: 'publishedAt',
    impressions: 'impressions',
    likes: 'likes',
    replies: 'comments',
    reposts: 'shares',
    bookmarks: 'saves',
    'url clicks': 'linkClicks',
    'video views': 'platform_views',
  },
  linkedin: {
    'post link': 'permalink',
    date: 'publishedAt',
    impressions: 'impressions',
    reactions: 'likes',
    comments: 'comments',
    reposts: 'shares',
    clicks: 'linkClicks',
  },
};

export const AccountsPage: React.FC<AccountsPageProps> = ({
  accounts,
  onOpenSyncCenter,
}) => {
  const [csvPlatform, setCsvPlatform] = useState<'x' | 'linkedin'>('x');
  const [csvSummary, setCsvSummary] = useState<{
    fileName: string;
    rows: number;
    mapped: string[];
  } | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  const handleCsvFile = (file: File | null) => {
    if (!file) return;
    setCsvError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result || '')
        .trim()
        .split(/\r?\n/)
        .filter(Boolean);
      if (lines.length < 1) {
        setCsvSummary(null);
        setCsvError('The selected CSV file is empty.');
        return;
      }
      const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim());
      const table = KNOWN_CSV_MAPPINGS[csvPlatform];
      const mapped = headers
        .filter((h) => Boolean(table[h.toLowerCase()]))
        .map((h) => `${h} → ${table[h.toLowerCase()]}`);
      setCsvSummary({
        fileName: file.name,
        rows: Math.max(0, lines.length - 1),
        mapped,
      });
    };
    reader.onerror = () => {
      setCsvSummary(null);
      setCsvError('Could not read the selected file.');
    };
    reader.readAsText(file);
  };

  const getOAuthParams = () => {
    const rawSearch =
      window.location.search ||
      (window.location.hash.includes('?')
        ? window.location.hash.slice(window.location.hash.indexOf('?'))
        : '');
    const params = new URLSearchParams(rawSearch);
    return {
      status: params.get('oauth'),
      platform: params.get('platform'),
      message: params.get('message'),
      page: params.get('page'),
      channel: params.get('channel'),
    };
  };

  const oauth = getOAuthParams();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-display font-bold text-[#FFFFFF]">Accounts</h1>
          <span className="text-xs font-mono text-[#666666]">
            6 sources · hover any card for scopes & actions
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenSyncCenter}
          className="px-3 py-1.5 rounded-md bg-[#0B0B0B] border border-[#222222] hover:border-[#404040] text-xs font-medium text-[#FFFFFF] cursor-pointer"
        >
          Sync Center
        </button>
      </div>

      {oauth.status === 'error' && (
        <div className="p-4 rounded-lg bg-[#2A1215] border border-[#EF4444]/40 text-xs text-[#FCA5A5] flex items-start justify-between gap-3 shadow-lg">
          <div>
            <div className="font-semibold text-sm text-[#EF4444] mb-1">
              {oauth.platform === 'facebook'
                ? 'Facebook OAuth Authorization Incomplete'
                : 'OAuth Authorization Incomplete'}
            </div>
            <p className="font-mono text-[11px] text-[#FCA5A5]/90 mb-2">
              {oauth.message || 'Authorization failed.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#/accounts';
            }}
            className="text-[#A3A3A3] hover:text-[#FFFFFF] p-1 cursor-pointer text-lg leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {oauth.status === 'success' && (
        <div className="p-4 rounded-lg bg-[#0E2818] border border-[#22C55E]/40 text-xs text-[#86EFAC] flex items-start justify-between gap-3 shadow-lg">
          <div>
            <div className="font-semibold text-sm text-[#22C55E] mb-1">
              {oauth.platform === 'facebook'
                ? `Facebook Page "${oauth.page || 'Managed Page'}" Successfully Connected!`
                : `Account "${oauth.channel || 'Channel'}" Successfully Connected!`}
            </div>
            <p className="text-[11px] text-[#A3A3A3]">
              OAuth 2.0 credentials have been encrypted and stored in PostgreSQL. API scopes verified.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#/accounts';
            }}
            className="text-[#A3A3A3] hover:text-[#FFFFFF] p-1 cursor-pointer text-lg leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* 6 Minimal Expandable Platform Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {accounts.map((acc) => {
          const meta = PLATFORM_META[acc.platform as PlatformId];
          return (
            <ExpandableSurface
              key={acc.id}
              mode="overlay"
              className="p-5"
              scaleOnHover={1.018}
              ariaLabel={`${meta.name} account. Hover or click for scopes and ingestion details.`}
              expandedContent={
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="font-sans text-[#666666]">Ingestion</span>
                    <span className="text-[#FFFFFF]">{acc.ingestionPath}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="font-sans text-[#666666]">Last Live Sync</span>
                    <span className="text-[#A3A3A3]">
                      {formatDateTimeUtc(acc.lastSuccessfulSyncAt)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#1C1C1C]">
                    <div className="text-[10px] text-[#666666] mb-1">Required Scopes</div>
                    <div className="font-mono text-[11px] text-[#A3A3A3] break-words">
                      {acc.requiredScopes.join(' · ')}
                    </div>
                  </div>
                  <p className="text-[11px] text-[#737373] leading-relaxed">
                    {acc.setupNote}
                  </p>
                  {acc.platform === 'youtube' && (
                    <div className="pt-2.5 border-t border-[#1C1C1C] flex items-center justify-between">
                      <span className="text-[11px] text-[#A3A3A3]">Google OAuth</span>
                      <a
                        href="http://127.0.0.1:3001/api/integrations/google/authorize"
                        className="px-2.5 py-1 rounded bg-[#FF0000]/15 hover:bg-[#FF0000]/25 border border-[#FF0000]/30 text-xs font-mono text-[#FF4E4E] transition-colors inline-block cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Authorize Channel &rarr;
                      </a>
                    </div>
                  )}
                  {acc.platform === 'facebook' && (
                    <div className="pt-2.5 border-t border-[#1C1C1C] flex items-center justify-between">
                      <span className="text-[11px] text-[#A3A3A3]">Meta Graph API</span>
                      <div className="flex items-center gap-2">
                        {acc.connectionState === 'CONNECTED' ? (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const res = await fetch(`http://127.0.0.1:3001/api/integrations/facebook/sync/${acc.id}`, { method: 'POST' });
                                if (res.ok) {
                                  window.location.reload();
                                }
                              } catch {
                                // ignore
                              }
                            }}
                            className="px-2.5 py-1 rounded bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/30 text-xs font-mono text-[#1877F2] transition-colors inline-block cursor-pointer"
                          >
                            Sync Page &rarr;
                          </button>
                        ) : (
                          <a
                            href="http://127.0.0.1:3001/api/integrations/facebook/authorize"
                            className="px-2.5 py-1 rounded bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/30 text-xs font-mono text-[#1877F2] transition-colors inline-block cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Authorize Page &rarr;
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              }
            >
              <div className="flex items-center justify-between gap-2 pr-8">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-[#121314] border border-[#26292E] flex items-center justify-center text-[#FFFFFF] shrink-0">
                    <PlatformIcon platform={acc.platform} className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-display font-semibold text-[#FFFFFF] truncate">
                      {acc.displayName || meta.name}
                    </div>
                    <div className="text-[11px] font-mono text-[#666666] truncate">
                      {acc.handle || 'Not linked'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs">
                <ConnectionStatus state={acc.connectionState} />
                <span className="font-mono tabular-nums text-[#D4D4D4]">
                  {acc.audienceCount !== null ? formatCompactNumber(acc.audienceCount) : '—'}
                </span>
              </div>
            </ExpandableSurface>
          );
        })}
      </div>

      {/* Collapsible CSV Check Tool for X & LinkedIn */}
      <ExpandableSurface
        className="p-5"
        scaleOnHover={1.006}
        ariaLabel="CSV Header Validator for X and LinkedIn."
        expandedContent={
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              {(['x', 'linkedin'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setCsvPlatform(p);
                    setCsvSummary(null);
                    setCsvError(null);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                    csvPlatform === p
                      ? 'bg-[#FFFFFF] text-[#000000]'
                      : 'bg-[#171717] text-[#8A8A8A] hover:text-[#FFFFFF]'
                  }`}
                >
                  {PLATFORM_META[p].name} CSV
                </button>
              ))}
            </div>

            <label className="flex items-center justify-between gap-3 p-3.5 rounded border border-dashed border-[#333333] bg-[#090A0B] hover:border-[#FFFFFF] transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5 text-xs text-[#A3A3A3] min-w-0">
                <Upload className="w-4 h-4 text-[#FFFFFF] shrink-0" />
                <span className="truncate sm:whitespace-normal">
                  Select {PLATFORM_META[csvPlatform].name} `.csv` export to validate headers
                </span>
              </div>
              <span className="px-3 py-1 rounded bg-[#FFFFFF] text-[#000000] text-xs font-medium shrink-0">
                Browse
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  handleCsvFile(e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
              />
            </label>

            {csvError && (
              <div className="p-3 rounded bg-[#080808] border border-[#383838] text-xs text-[#D4D4D4]">
                {csvError}
              </div>
            )}

            {csvSummary && (
              <div className="p-3 rounded bg-[#080808] border border-[#242424] text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[#FFFFFF] font-medium min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {csvSummary.fileName} ({csvSummary.rows} rows)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCsvSummary(null)}
                    aria-label="Clear CSV validation"
                    className="w-6 h-6 rounded flex items-center justify-center text-[#737373] hover:text-[#FFFFFF] shrink-0 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
                <div className="font-mono text-[11px] text-[#8A8A8A]">
                  {csvSummary.mapped.length > 0
                    ? csvSummary.mapped.join(' · ')
                    : 'No standard columns matched'}
                </div>
              </div>
            )}
          </div>
        }
      >
        <div className="flex items-baseline justify-between pr-8">
          <h2 className="text-sm font-display font-semibold text-[#FFFFFF]">
            X & LinkedIn CSV Validator
          </h2>
          <span className="text-xs font-mono text-[#666666]">Dry check</span>
        </div>
      </ExpandableSurface>
    </div>
  );
};
