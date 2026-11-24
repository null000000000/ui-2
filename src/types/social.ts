export type PlatformId =
  | 'youtube'
  | 'tiktok'
  | 'instagram'
  | 'facebook'
  | 'x'
  | 'linkedin';

export type PlatformFilter = 'all' | PlatformId;

export type DateRangePreset = 'today' | '7d' | '28d' | '90d' | 'custom';

export interface DateRangeSelection {
  preset: DateRangePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export type DataOrigin = 'API' | 'CSV' | 'MANUAL';

export type MetricAggregation =
  | 'SNAPSHOT'
  | 'DAILY'
  | 'PERIOD'
  | 'LIFETIME'
  | 'TOTAL';

export type ConnectionState =
  | 'NOT_CONNECTED'
  | 'PENDING_ACCOUNT_SETUP'
  | 'PENDING_APP_REVIEW'
  | 'CONNECTED'
  | 'PARTIAL_ACCESS'
  | 'REAUTH_REQUIRED'
  | 'PERMISSION_MISSING'
  | 'RATE_LIMITED'
  | 'ERROR'
  | 'DISCONNECTED';

export type DeliveryState =
  | 'DELIVERED'
  | 'NOT_CONFIGURED'
  | 'FAILED';

export type ContentType =
  | 'Video'
  | 'Short'
  | 'Reel'
  | 'Carousel'
  | 'Image'
  | 'Story'
  | 'Text'
  | 'Article';

export type CanonicalMetricKey =
  | 'platform_views'
  | 'reach'
  | 'impressions'
  | 'content_interactions'
  | 'audience_size'
  | 'published_posts'
  | 'watch_time_minutes'
  | 'profile_visits'
  | 'link_clicks'
  | 'net_audience_change'
  | 'saves';

export type NavRouteId =
  | 'overview'
  | 'content'
  | 'analytics'
  | 'audience'
  | 'compare'
  | 'accounts'
  | 'sync'
  | 'analyst'
  | 'settings';

export type OptionalModuleKey =
  | 'content_library'
  | 'analytics'
  | 'audience_insights'
  | 'cross_platform_comparison'
  | 'ai_analyst'
  | 'sync_center';

export type OverviewWidgetKey =
  | 'audience_location'
  | 'primary_trend'
  | 'top_content'
  | 'content_type_breakdown'
  | 'profile_activity'
  | 'insights_panel';

export interface PlatformAccount {
  id: string;
  platform: PlatformId;
  handle: string | null;
  displayName: string;
  accountType: string;
  ingestionPath: 'API' | 'CSV' | 'CSV_OR_API';
  connectionState: ConnectionState;
  grantedScopes: string[];
  requiredScopes: string[];
  lastSuccessfulSyncAt: string | null;
  nextScheduledSyncAt: string | null;
  lastError: string | null;
  timezone: string;
  audienceLabel: 'Subscribers' | 'Followers';
  audienceCount: number | null;
  setupNote: string;
}

export interface MetricObservation {
  id: string;
  platform: PlatformId;
  accountId: string;
  contentId: string | null;
  metricKey: CanonicalMetricKey | string;
  sourceMetricKey: string;
  value: number | null;
  unit: string;
  aggregation: MetricAggregation;
  periodStart: string | null;
  periodEnd: string | null;
  collectedAt: string;
  sourceUpdatedAt: string | null;
  source: DataOrigin;
  syncRunId: string | null;
}

export interface ContentSnapshot {
  collectedAt: string;
  hoursSincePublish: number;
  milestone?: '24h' | '72h' | '7d' | '28d';
  views: number | null;
  reach: number | null;
  impressions: number | null;
  interactions: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
}

export interface ContentItem {
  id: string;
  externalId: string;
  platform: PlatformId;
  accountId: string;
  accountHandle: string;
  title: string;
  caption: string;
  contentType: ContentType;
  publishedAt: string;
  permalink: string;
  thumbnailTone: string;
  durationSeconds: number | null;
  source: DataOrigin;
  lastCollectedAt: string;
  metrics: {
    views: number | null;
    viewsSourceKey: string | null;
    reach: number | null;
    reachSourceKey: string | null;
    impressions: number | null;
    impressionsSourceKey: string | null;
    likes: number | null;
    likesLabel: string;
    comments: number | null;
    commentsLabel: string;
    shares: number | null;
    sharesLabel: string;
    saves: number | null;
    watchTimeMinutes: number | null;
    avgViewDurationSec: number | null;
    linkClicks: number | null;
  };
  snapshots: ContentSnapshot[];
}

export interface DailySeriesPoint {
  date: string; // YYYY-MM-DD
  platform: PlatformId;
  accountId: string;
  views: number | null;
  reach: number | null;
  impressions: number | null;
  interactions: number | null;
  audienceTotal: number | null;
  netAudienceChange: number | null;
  watchTimeMinutes: number | null;
  profileVisits: number | null;
  linkClicks: number | null;
  saves: number | null;
  postsPublished: number;
  source: DataOrigin;
  collectedAt: string;
}

export interface CountryMetric {
  countryCode: string;
  countryName: string;
  topCity?: string;
  topCitySharePct?: number;
  sharePct: number;
  value: number;
}

export interface AgeGenderBucket {
  ageGroup: string;
  malePct: number;
  femalePct: number;
  otherPct: number;
}

export interface AudienceBreakdown {
  platform: PlatformId;
  accountId: string;
  periodLabel: string;
  lastUpdatedAt: string;
  source: DataOrigin;
  geographyMetricLabel: string | null;
  geographyTotal: number | null;
  countries: CountryMetric[] | null;
  geographyUnavailableReason: string | null;
  ageGender: AgeGenderBucket[] | null;
  ageGenderUnavailableReason: string | null;
  followerSplit: {
    followersPct: number;
    nonFollowersPct: number;
    basisMetric: string;
  } | null;
  followerSplitUnavailableReason: string | null;
  activeHours: { hourLabel: string; relativeIndex: number }[] | null;
  activeHoursUnavailableReason: string | null;
  eligibilityNote: string;
}

export interface SyncRunRecord {
  runId: string;
  workflowNumber: string;
  workflowName: string;
  platform: PlatformId | 'orchestrator';
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'SKIPPED';
  deliveryState: DeliveryState;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  recordsFetched: number;
  recordsNormalized: number;
  recordsValidated: number;
  recordsRejected: number;
  recordsDuplicate: number;
  errorMessage: string | null;
  remediation: string | null;
}

export interface EvidenceInsight {
  id: string;
  question: string;
  conclusion: string;
  severity: 'positive' | 'neutral' | 'warning';
  dateRangeLabel: string;
  platformsIncluded: PlatformId[];
  metricKey: CanonicalMetricKey;
  metricLabel: string;
  metricDefinition: string;
  observedValue: string;
  baselineValue: string;
  freshnessCaveat: string;
  relatedContentId?: string;
  relatedContentTitle?: string;
  targetRoute: NavRouteId;
  targetPlatform?: PlatformFilter;
}

export interface SocialMonitorPreferences {
  enabledModules: Record<OptionalModuleKey, boolean>;
  visibleWidgets: Record<OverviewWidgetKey, boolean>;
  widgetOrder: OverviewWidgetKey[];
  defaultPlatform: PlatformFilter;
  defaultDatePreset: DateRangePreset;
}

export interface BackendHealthStatus {
  configured: boolean;
  reachable: boolean;
  apiBaseUrl: string;
  checkedAt: string | null;
  statusCode: number | null;
  message: string;
}

export interface SocialMonitorDataset {
  apiConfigured: boolean;
  lastFetchedAt: string | null;
  accounts: PlatformAccount[];
  content: ContentItem[];
  dailySeries: DailySeriesPoint[];
  audience: AudienceBreakdown[];
  syncRuns: SyncRunRecord[];
  backendError: string | null;
}
