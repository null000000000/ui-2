import { METRIC_REGISTRY, PLATFORM_META } from '../data/metricRegistry';
import { DEFAULT_PLATFORM_ACCOUNTS } from '../data/platformDefaults';
import type {
  AudienceBreakdown,
  BackendHealthStatus,
  ContentItem,
  DailySeriesPoint,
  DateRangeSelection,
  EvidenceInsight,
  OverviewWidgetKey,
  PlatformAccount,
  PlatformFilter,
  PlatformId,
  SocialMonitorDataset,
  SocialMonitorPreferences,
  SyncRunRecord,
} from '../types/social';

const PREFS_STORAGE_KEY = 'axiom_social_monitor_prefs_v2';

export const DEFAULT_WIDGET_ORDER: OverviewWidgetKey[] = [
  'primary_trend',
  'audience_location',
  'top_content',
  'content_type_breakdown',
  'profile_activity',
  'insights_panel',
];

export const DEFAULT_PREFERENCES: SocialMonitorPreferences = {
  enabledModules: {
    content_library: true,
    analytics: true,
    audience_insights: true,
    cross_platform_comparison: true,
    ai_analyst: true,
    sync_center: true,
  },
  visibleWidgets: {
    audience_location: true,
    primary_trend: true,
    top_content: true,
    content_type_breakdown: true,
    profile_activity: true,
    insights_panel: true,
  },
  widgetOrder: [...DEFAULT_WIDGET_ORDER],
  defaultPlatform: 'all',
  defaultDatePreset: '28d',
};

export function loadPreferences(): SocialMonitorPreferences {
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<SocialMonitorPreferences>;
    return {
      enabledModules: {
        ...DEFAULT_PREFERENCES.enabledModules,
        ...(parsed.enabledModules ?? {}),
      },
      visibleWidgets: {
        ...DEFAULT_PREFERENCES.visibleWidgets,
        ...(parsed.visibleWidgets ?? {}),
      },
      widgetOrder:
        Array.isArray(parsed.widgetOrder) &&
        parsed.widgetOrder.length === DEFAULT_WIDGET_ORDER.length
          ? parsed.widgetOrder
          : [...DEFAULT_WIDGET_ORDER],
      defaultPlatform: parsed.defaultPlatform ?? DEFAULT_PREFERENCES.defaultPlatform,
      defaultDatePreset: parsed.defaultDatePreset ?? DEFAULT_PREFERENCES.defaultDatePreset,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(prefs: SocialMonitorPreferences): void {
  try {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota errors in restricted environments
  }
}

export function getConfiguredApiBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';
  return configured.trim().replace(/\/+$/, '');
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 6000): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Backend responded with HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function checkBackendHealth(): Promise<BackendHealthStatus> {
  const apiBaseUrl = getConfiguredApiBaseUrl();
  const checkedAt = new Date().toISOString();

  if (!apiBaseUrl) {
    return {
      configured: false,
      reachable: false,
      apiBaseUrl: '',
      checkedAt,
      statusCode: null,
      message:
        'VITE_API_BASE_URL is not configured yet. Set it in your .env file to connect your n8n / Backend API.',
    };
  }

  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${apiBaseUrl}/api/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
      signal: controller.signal,
    });
    window.clearTimeout(timer);

    if (res.ok) {
      return {
        configured: true,
        reachable: true,
        apiBaseUrl,
        checkedAt,
        statusCode: res.status,
        message: 'Backend /api/health responded OK.',
      };
    }

    return {
      configured: true,
      reachable: false,
      apiBaseUrl,
      checkedAt,
      statusCode: res.status,
      message: `Backend /api/health returned HTTP ${res.status}.`,
    };
  } catch {
    return {
      configured: true,
      reachable: false,
      apiBaseUrl,
      checkedAt,
      statusCode: null,
      message: `Unable to reach ${apiBaseUrl}/api/health. Verify the backend service is running and CORS allows this origin.`,
    };
  }
}

function isArrayOfObjects<T>(val: unknown): val is T[] {
  return Array.isArray(val);
}

function transformBackendContentItem(raw: any): ContentItem {
  if (raw && raw.metrics && typeof raw.metrics === 'object' && raw.platform) {
    return raw as ContentItem;
  }
  const pub =
    Array.isArray(raw.publications) && raw.publications.length > 0
      ? raw.publications[0]
      : null;
  const platRaw = String(
    pub?.platformAccount?.platform?.code || raw.platform || 'youtube'
  ).toLowerCase();
  const platform: PlatformId =
    platRaw.includes('yt') || platRaw.includes('youtube')
      ? 'youtube'
      : platRaw.includes('tiktok')
      ? 'tiktok'
      : platRaw.includes('instagram') || platRaw.includes('ig')
      ? 'instagram'
      : platRaw.includes('facebook') || platRaw.includes('fb')
      ? 'facebook'
      : platRaw === 'x' || platRaw.includes('twitter')
      ? 'x'
      : platRaw.includes('linkedin')
      ? 'linkedin'
      : 'youtube';

  const formatRaw = String(
    pub?.format || raw.contentType || 'VIDEO'
  ).toUpperCase();
  const contentType: ContentType =
    formatRaw === 'SHORT'
      ? 'Short'
      : formatRaw === 'REEL'
      ? 'Reel'
      : formatRaw === 'CAROUSEL'
      ? 'Carousel'
      : formatRaw === 'IMAGE'
      ? 'Image'
      : formatRaw === 'TEXT' || formatRaw === 'THREAD'
      ? 'Text'
      : formatRaw === 'ARTICLE'
      ? 'Article'
      : 'Video';

  const obsList: any[] = Array.isArray(pub?.metricObservations)
    ? pub.metricObservations
    : [];
  const getObsValue = (metricKeyPart: string): number | null => {
    const found = obsList.find((o) => {
      const key = String(
        o?.metricDefinition?.metricKey || o?.metricKey || ''
      ).toLowerCase();
      return key.includes(metricKeyPart);
    });
    if (!found) return null;
    const num = parseFloat(String(found.value));
    return isNaN(num) ? null : num;
  };

  const publishedAt =
    pub?.publishedAt ||
    raw.publishedAt ||
    raw.createdAt ||
    new Date().toISOString();

  return {
    id: String(raw.id || Math.random().toString(36).slice(2)),
    externalId: String(pub?.externalPostId || raw.externalId || raw.id || ''),
    platform,
    accountId: String(pub?.platformAccountId || raw.accountId || ''),
    accountHandle: String(
      pub?.platformAccount?.handle || raw.accountHandle || '@founder_builds'
    ),
    title: String(pub?.publishedTitle || raw.title || 'Untitled Publication'),
    caption: String(raw.canonicalSummary || raw.caption || ''),
    contentType,
    publishedAt,
    permalink: String(pub?.url || raw.permalink || ''),
    thumbnailTone: '#121417',
    durationSeconds:
      typeof raw.durationSeconds === 'number' ? raw.durationSeconds : null,
    source: (raw.source || 'API') as any,
    lastCollectedAt: String(
      raw.updatedAt || raw.createdAt || new Date().toISOString()
    ),
    metrics: {
      views: getObsValue('view'),
      viewsSourceKey: 'platform_views',
      reach: getObsValue('reach'),
      reachSourceKey: 'reach',
      impressions: getObsValue('impression'),
      impressionsSourceKey: 'impressions',
      likes: getObsValue('like') ?? getObsValue('reaction'),
      likesLabel: 'Likes',
      comments: getObsValue('comment') ?? getObsValue('repl'),
      commentsLabel: 'Comments',
      shares: getObsValue('share') ?? getObsValue('repost'),
      sharesLabel: 'Shares',
      saves: getObsValue('save') ?? getObsValue('bookmark'),
      watchTimeMinutes: getObsValue('watch'),
      avgViewDurationSec: null,
      linkClicks: getObsValue('click'),
    },
    snapshots: [],
  };
}

/**
 * Production typed data adapter for AXIOM Social Monitor.
 * Reads live telemetry strictly from the configured n8n / Backend API.
 */
export async function loadSocialMonitorDataset(): Promise<SocialMonitorDataset> {
  const apiBaseUrl = getConfiguredApiBaseUrl();

  if (!apiBaseUrl) {
    return {
      apiConfigured: false,
      lastFetchedAt: null,
      accounts: DEFAULT_PLATFORM_ACCOUNTS,
      content: [],
      dailySeries: [],
      audience: [],
      syncRuns: [],
      backendError: null,
    };
  }

  try {
    const [brandRes, contentRes, syncRes] = await Promise.allSettled([
      fetchJsonWithTimeout<any>(`${apiBaseUrl}/api/dashboard/brand`),
      fetchJsonWithTimeout<any>(`${apiBaseUrl}/api/content/items`),
      fetchJsonWithTimeout<any>(`${apiBaseUrl}/api/synchronization/runs`),
    ]);

    const allRejected = [brandRes, contentRes, syncRes].every((r) => r.status === 'rejected');

    if (allRejected) {
      return {
        apiConfigured: true,
        lastFetchedAt: null,
        accounts: DEFAULT_PLATFORM_ACCOUNTS,
        content: [],
        dailySeries: [],
        audience: [],
        syncRuns: [],
        backendError: `Could not reach Backend API at ${apiBaseUrl}. Verify your n8n / Backend service is running and CORS is enabled.`,
      };
    }

    // Merge or overlay accounts from backend
    let accounts: PlatformAccount[] = DEFAULT_PLATFORM_ACCOUNTS;
    if (brandRes.status === 'fulfilled' && Array.isArray(brandRes.value?.platforms)) {
      accounts = DEFAULT_PLATFORM_ACCOUNTS.map((def) => {
        const foundPlatform = brandRes.value.platforms.find(
          (p: any) => (p.slug || p.code || p.name || '').toLowerCase() === def.platform
        );
        const firstAccount = foundPlatform?.accounts?.[0];
        if (firstAccount) {
          return {
            ...def,
            id: firstAccount.id || def.id,
            handle: firstAccount.handle || firstAccount.accountIdentifier || def.handle,
            displayName: firstAccount.displayName || def.displayName,
            connectionState: firstAccount.status === 'ACTIVE' ? 'CONNECTED' : def.connectionState,
            lastSuccessfulSyncAt: firstAccount.lastSyncedAt || def.lastSuccessfulSyncAt,
          };
        }
        return def;
      });
    }

    const content: ContentItem[] =
      contentRes.status === 'fulfilled' && Array.isArray(contentRes.value)
        ? contentRes.value.map(transformBackendContentItem)
        : [];
    const dailySeries: DailySeriesPoint[] = [];
    const audience: AudienceBreakdown[] = [];
    const syncRuns: SyncRunRecord[] =
      syncRes.status === 'fulfilled' && Array.isArray(syncRes.value)
        ? syncRes.value.map((raw: any, index: number): SyncRunRecord => {
            const rawStatus = String(raw.status || '').toUpperCase();
            const status: SyncRunRecord['status'] =
              rawStatus === 'SUCCEEDED' || rawStatus === 'SUCCESS'
                ? 'SUCCESS'
                : rawStatus === 'PARTIAL'
                ? 'PARTIAL'
                : rawStatus === 'SKIPPED'
                ? 'SKIPPED'
                : 'FAILED';

            const platCode = String(
              raw.platform ||
              raw.platformAccount?.platform?.code ||
              raw.platformAccount?.platform?.name ||
              ''
            ).toLowerCase();

            const platform: SyncRunRecord['platform'] =
              platCode.includes('yt') || platCode.includes('youtube')
                ? 'youtube'
                : platCode.includes('tiktok')
                ? 'tiktok'
                : platCode.includes('instagram') || platCode.includes('ig')
                ? 'instagram'
                : platCode.includes('facebook') || platCode.includes('fb')
                ? 'facebook'
                : platCode === 'x' || platCode.includes('twitter')
                ? 'x'
                : platCode.includes('linkedin')
                ? 'linkedin'
                : 'orchestrator';

            const startedAt = raw.startedAt || new Date().toISOString();
            const finishedAt = raw.completedAt || raw.finishedAt || null;
            let durationMs = raw.durationMs ?? null;
            if (durationMs === null && startedAt && finishedAt) {
              const diff = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
              durationMs = isNaN(diff) || diff < 0 ? null : diff;
            }

            return {
              runId: raw.id || raw.runId || `run-${index + 1}`,
              workflowNumber: raw.workflowNumber || `WF-${String(index + 1).padStart(2, '0')}`,
              workflowName:
                raw.workflowName ||
                (platform === 'orchestrator'
                  ? 'Social Telemetry Ingestion'
                  : `${PLATFORM_META[platform]?.name || platform} Sync Pipeline`),
              platform,
              status,
              deliveryState:
                raw.deliveryState ||
                (status === 'SUCCESS'
                  ? 'DELIVERED'
                  : status === 'FAILED'
                  ? 'RETRY_SCHEDULED'
                  : 'PENDING'),
              startedAt,
              finishedAt,
              durationMs,
              recordsFetched: typeof raw.recordsFetched === 'number' ? raw.recordsFetched : 0,
              recordsNormalized:
                typeof raw.recordsNormalized === 'number'
                  ? raw.recordsNormalized
                  : typeof raw.recordsFetched === 'number'
                  ? raw.recordsFetched
                  : 0,
              recordsValidated:
                typeof raw.recordsValidated === 'number'
                  ? raw.recordsValidated
                  : typeof raw.recordsPersisted === 'number'
                  ? raw.recordsPersisted
                  : 0,
              recordsRejected:
                typeof raw.recordsRejected === 'number'
                  ? raw.recordsRejected
                  : Array.isArray(raw.errors)
                  ? raw.errors.length
                  : 0,
              recordsDuplicate:
                typeof raw.recordsDuplicate === 'number' ? raw.recordsDuplicate : 0,
              errorMessage: raw.errorMessage || (raw.errors?.[0]?.message ?? null),
              remediation:
                raw.remediation ||
                (raw.errors?.[0]
                  ? 'Inspect connector credentials and retry manual sync from n8n.'
                  : null),
            };
          })
        : [];

    return {
      apiConfigured: true,
      lastFetchedAt: new Date().toISOString(),
      accounts,
      content,
      dailySeries,
      audience,
      syncRuns,
      backendError: null,
    };
  } catch (err) {
    return {
      apiConfigured: true,
      lastFetchedAt: null,
      accounts: DEFAULT_PLATFORM_ACCOUNTS,
      content: [],
      dailySeries: [],
      audience: [],
      syncRuns: [],
      backendError:
        err instanceof Error
          ? err.message
          : 'Unexpected error communicating with Backend API.',
    };
  }
}

export function getDateRangeFromPreset(
  preset: DateRangeSelection['preset'],
  customStart?: string,
  customEnd?: string
): DateRangeSelection {
  const now = new Date();
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const format = (d: Date) => d.toISOString().slice(0, 10);

  if (preset === 'custom' && customStart && customEnd) {
    return {
      preset: 'custom',
      startDate: customStart <= customEnd ? customStart : customEnd,
      endDate: customEnd >= customStart ? customEnd : customStart,
    };
  }

  const start = new Date(end);
  if (preset === 'today') {
    // 1 day
  } else if (preset === '7d') {
    start.setUTCDate(start.getUTCDate() - 6);
  } else if (preset === '90d') {
    start.setUTCDate(start.getUTCDate() - 89);
  } else {
    start.setUTCDate(start.getUTCDate() - 27);
  }

  return {
    preset,
    startDate: format(start),
    endDate: format(end),
  };
}

export function getPreviousEquivalentRange(range: DateRangeSelection): {
  startDate: string;
  endDate: string;
} {
  const start = new Date(`${range.startDate}T00:00:00Z`);
  const end = new Date(`${range.endDate}T00:00:00Z`);
  const diffDays = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (24 * 3600 * 1000)) + 1
  );
  const prevEnd = new Date(start);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevStart.getUTCDate() - (diffDays - 1));

  return {
    startDate: prevStart.toISOString().slice(0, 10),
    endDate: prevEnd.toISOString().slice(0, 10),
  };
}

/**
 * Deterministic, evidence-based analytical insight generator.
 * Strictly computes insights from stored observations in the current dataset/filter window.
 * Never fabricates numbers, causal claims, or missing metrics.
 */
export function computeEvidenceInsights(
  dataset: SocialMonitorDataset,
  platformFilter: PlatformFilter,
  dateRange: DateRangeSelection
): EvidenceInsight[] {
  const series = dataset.dailySeries.filter(
    (p) =>
      (platformFilter === 'all' || p.platform === platformFilter) &&
      p.date >= dateRange.startDate &&
      p.date <= dateRange.endDate
  );

  const prevRange = getPreviousEquivalentRange(dateRange);
  const prevSeries = dataset.dailySeries.filter(
    (p) =>
      (platformFilter === 'all' || p.platform === platformFilter) &&
      p.date >= prevRange.startDate &&
      p.date <= prevRange.endDate
  );

  const contentInWindow = dataset.content.filter(
    (c) =>
      (platformFilter === 'all' || c.platform === platformFilter) &&
      (c.publishedAt ? c.publishedAt.slice(0, 10) >= dateRange.startDate : false) &&
      (c.publishedAt ? c.publishedAt.slice(0, 10) <= dateRange.endDate : false)
  );

  if (series.length === 0 && contentInWindow.length === 0) {
    return [];
  }

  const rangeLabel = `${dateRange.startDate} to ${dateRange.endDate}`;
  const freshnessCaveat = dataset.lastFetchedAt
    ? `Last Backend sync read at ${new Date(dataset.lastFetchedAt).toUTCString()}.`
    : 'Data freshness timestamp unavailable.';

  const insights: EvidenceInsight[] = [];

  // 1. Platform with highest net follower/subscriber growth in selected period
  const growthByPlatform = new Map<PlatformId, number>();
  for (const p of series) {
    if (p.netAudienceChange !== null) {
      growthByPlatform.set(
        p.platform,
        (growthByPlatform.get(p.platform) ?? 0) + p.netAudienceChange
      );
    }
  }
  if (growthByPlatform.size > 0) {
    const sorted = Array.from(growthByPlatform.entries()).sort((a, b) => b[1] - a[1]);
    const [topPlatform, topGrowth] = sorted[0];
    const prevTopGrowth = prevSeries
      .filter((p) => p.platform === topPlatform && p.netAudienceChange !== null)
      .reduce((sum, p) => sum + (p.netAudienceChange ?? 0), 0);
    const meta = PLATFORM_META[topPlatform];

    insights.push({
      id: 'ins-growth-leader',
      question: 'Which platform grew audience fastest in this window?',
      conclusion: `${meta.name} recorded the highest net ${meta.audienceNoun.toLowerCase()} addition (+${topGrowth.toLocaleString()}) during the selected window.`,
      severity: topGrowth > prevTopGrowth ? 'positive' : 'neutral',
      dateRangeLabel: rangeLabel,
      platformsIncluded: Array.from(growthByPlatform.keys()),
      metricKey: 'net_audience_change',
      metricLabel: METRIC_REGISTRY.net_audience_change.label,
      metricDefinition: METRIC_REGISTRY.net_audience_change.description,
      observedValue: `+${topGrowth.toLocaleString()} ${meta.audienceNoun.toLowerCase()}`,
      baselineValue:
        prevSeries.length > 0
          ? `Prior equivalent window: +${prevTopGrowth.toLocaleString()}`
          : 'No prior equivalent window available',
      freshnessCaveat,
      targetRoute: 'analytics',
      targetPlatform: topPlatform,
    });
  }

  // 2. Top outperforming content item vs same-platform baseline
  if (contentInWindow.length > 0) {
    const scored = contentInWindow
      .map((item) => {
        const peers = dataset.content.filter(
          (c) => c.platform === item.platform && c.id !== item.id
        );
        const useViews = item.metrics.views !== null;
        const primaryVal = useViews ? item.metrics.views : item.metrics.impressions;
        const peerVals = peers
          .map((p) => (useViews ? p.metrics.views : p.metrics.impressions))
          .filter((v): v is number => v !== null);
        if (primaryVal === null || peerVals.length === 0) return null;
        const mean = peerVals.reduce((a, b) => a + b, 0) / peerVals.length;
        if (mean <= 0) return null;
        return {
          item,
          primaryVal,
          mean,
          ratio: primaryVal / mean,
          metricKey: useViews ? ('platform_views' as const) : ('impressions' as const),
          peerCount: peerVals.length,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.ratio - a.ratio);

    if (scored.length > 0) {
      const top = scored[0];
      const pctAbove = Math.round((top.ratio - 1) * 100);
      const metricName = top.metricKey === 'platform_views' ? 'views' : 'impressions';
      insights.push({
        id: 'ins-top-content-baseline',
        question: 'Which recent content outperformed its account baseline?',
        conclusion: `"${top.item.title}" (${PLATFORM_META[top.item.platform].name} ${top.item.contentType}) is tracking ${pctAbove >= 0 ? `+${pctAbove}%` : `${pctAbove}%`} vs recent ${PLATFORM_META[top.item.platform].name} peer average.`,
        severity: pctAbove >= 15 ? 'positive' : 'neutral',
        dateRangeLabel: rangeLabel,
        platformsIncluded: [top.item.platform],
        metricKey: top.metricKey,
        metricLabel: METRIC_REGISTRY[top.metricKey].label,
        metricDefinition: METRIC_REGISTRY[top.metricKey].description,
        observedValue: `${top.primaryVal.toLocaleString()} ${metricName}`,
        baselineValue: `Peer mean: ${Math.round(top.mean).toLocaleString()} (n=${top.peerCount} same-platform items)`,
        freshnessCaveat,
        relatedContentId: top.item.id,
        relatedContentTitle: top.item.title,
        targetRoute: 'content',
        targetPlatform: top.item.platform,
      });
    }
  }

  // 3. Period movement: Views vs Interactions divergence check
  const curViews = series.reduce((acc, p) => acc + (p.views ?? 0), 0);
  const prevViews = prevSeries.reduce((acc, p) => acc + (p.views ?? 0), 0);
  const curInt = series.reduce((acc, p) => acc + (p.interactions ?? 0), 0);
  const prevInt = prevSeries.reduce((acc, p) => acc + (p.interactions ?? 0), 0);

  if (prevViews > 0 && prevInt > 0 && curViews > 0) {
    const viewsDeltaPct = ((curViews - prevViews) / prevViews) * 100;
    const intDeltaPct = ((curInt - prevInt) / prevInt) * 100;
    const diverged = viewsDeltaPct > 5 && intDeltaPct < viewsDeltaPct - 8;

    insights.push({
      id: 'ins-views-vs-interactions',
      question: 'Did views and content interactions move together vs prior period?',
      conclusion: diverged
        ? `Platform-reported views increased ${viewsDeltaPct.toFixed(1)}%, while interactions grew more slowly (${intDeltaPct.toFixed(1)}%) — correlation only; inspect top posts for format shifts.`
        : `Platform-reported views moved ${viewsDeltaPct >= 0 ? '+' : ''}${viewsDeltaPct.toFixed(1)}% alongside ${intDeltaPct >= 0 ? '+' : ''}${intDeltaPct.toFixed(1)}% in content interactions vs the previous equivalent window.`,
      severity: diverged ? 'warning' : viewsDeltaPct >= 0 ? 'positive' : 'neutral',
      dateRangeLabel: rangeLabel,
      platformsIncluded: Array.from(new Set(series.map((s) => s.platform))),
      metricKey: 'content_interactions',
      metricLabel: 'Platform-Reported Views & Interactions',
      metricDefinition:
        'Period-over-period comparison of summed platform-reported counters. Non-deduplicated; does not imply causation.',
      observedValue: `${curViews.toLocaleString()} views · ${curInt.toLocaleString()} interactions`,
      baselineValue: `Prior window (${prevRange.startDate} to ${prevRange.endDate}): ${prevViews.toLocaleString()} views · ${prevInt.toLocaleString()} interactions`,
      freshnessCaveat,
      targetRoute: 'analytics',
      targetPlatform: platformFilter,
    });
  }

  return insights;
}

export async function triggerManualSync(platform?: string): Promise<{ success: boolean; message: string }> {
  const apiBaseUrl = getConfiguredApiBaseUrl();
  if (!apiBaseUrl) {
    return { success: false, message: 'Backend API URL not configured.' };
  }
  try {
    const res = await fetch(`${apiBaseUrl}/api/synchronization/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ scope: 'SOCIAL', platform: platform || 'all' }),
    });
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    const data = await res.json();
    return { success: true, message: `Sync triggered successfully (Run ID: ${data.syncRunId || 'OK'})` };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'Failed to trigger sync' };
  }
}
