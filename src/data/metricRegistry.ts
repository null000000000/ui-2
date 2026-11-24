import type {
  CanonicalMetricKey,
  ContentType,
  MetricAggregation,
  PlatformId,
} from '../types/social';

export interface PlatformMeta {
  id: PlatformId;
  name: string;
  shortName: string;
  accentHex: string;
  audienceNoun: 'Subscribers' | 'Followers';
  ingestionSummary: string;
  supportedContentTypes: ContentType[];
  apiConstraintNote: string;
}

export const PLATFORM_LIST: PlatformId[] = [
  'youtube',
  'tiktok',
  'instagram',
  'facebook',
  'x',
  'linkedin',
];

export const PLATFORM_META: Record<PlatformId, PlatformMeta> = {
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    shortName: 'YT',
    accentHex: '#FFFFFF',
    audienceNoun: 'Subscribers',
    ingestionSummary: 'YouTube Data API v3 + YouTube Analytics API',
    supportedContentTypes: ['Video', 'Short'],
    apiConstraintNote:
      'Owner-authorized Analytics API required for watch time & geography. Reach/Impressions require Studio export or eligible report scopes.',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    shortName: 'TT',
    accentHex: '#E5E5E5',
    audienceNoun: 'Followers',
    ingestionSummary: 'TikTok Display API (public video & profile stats)',
    supportedContentTypes: ['Video'],
    apiConstraintNote:
      'Display API exposes public counters (view_count, like_count, comment_count, share_count) only. Watch time, retention, reach, and audience demographics are not exposed.',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    shortName: 'IG',
    accentHex: '#D4D4D4',
    audienceNoun: 'Followers',
    ingestionSummary: 'Instagram API with Instagram Login (Professional)',
    supportedContentTypes: ['Reel', 'Carousel', 'Image', 'Story'],
    apiConstraintNote:
      'Requires Professional (Creator/Business) account and approved insights scopes. Audience demographics require minimum follower eligibility.',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    shortName: 'FB',
    accentHex: '#B5B5B5',
    audienceNoun: 'Followers',
    ingestionSummary: 'Meta Pages API + Page Insights',
    supportedContentTypes: ['Video', 'Reel', 'Image', 'Text'],
    apiConstraintNote:
      'Requires Page admin access token and eligible Page. Most Page Insights refresh on a daily cadence.',
  },
  x: {
    id: 'x',
    name: 'X',
    shortName: 'X',
    accentHex: '#A3A3A3',
    audienceNoun: 'Followers',
    ingestionSummary: 'CSV Import ($0 MVP; official API deferred)',
    supportedContentTypes: ['Text', 'Image', 'Video'],
    apiConstraintNote:
      'Zero-budget MVP ingests user-exported X Analytics CSV files. Only columns present in the export are stored; demographics and unique reach are unavailable.',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    shortName: 'LI',
    accentHex: '#8A8A8A',
    audienceNoun: 'Followers',
    ingestionSummary: 'CSV Import (optional Community Management API later)',
    supportedContentTypes: ['Text', 'Article', 'Carousel', 'Video'],
    apiConstraintNote:
      'Uses CSV import while Community Management API memberCreatorPostAnalytics approval is pending. Audience geography is unavailable via basic member CSV.',
  },
};

export interface MetricRegistryEntry {
  key: CanonicalMetricKey;
  label: string;
  shortLabel: string;
  unit: string;
  aggregation: MetricAggregation;
  supportsDailyCumulativeToggle: boolean;
  showInOverview: boolean;
  crossPlatformComparable: boolean;
  crossPlatformLabel: string;
  crossPlatformCaveat: string;
  description: string;
  sourceKeys: Partial<Record<PlatformId, string>>;
  unavailableReasons: Partial<Record<PlatformId, string>>;
}

export const METRIC_REGISTRY: Record<CanonicalMetricKey, MetricRegistryEntry> = {
  platform_views: {
    key: 'platform_views',
    label: 'Platform-Reported Views',
    shortLabel: 'Views',
    unit: 'views',
    aggregation: 'DAILY',
    supportsDailyCumulativeToggle: true,
    showInOverview: true,
    crossPlatformComparable: false,
    crossPlatformLabel: 'Combined Platform-Reported Views',
    crossPlatformCaveat:
      'Sum of each platform’s native view/play counter. Definitions vary (e.g. 3s video view vs play start); never deduplicated unique views.',
    description:
      'Count of video or content views as reported by each platform’s native counter over the selected date window.',
    sourceKeys: {
      youtube: 'views',
      tiktok: 'view_count (delta from snapshots)',
      instagram: 'plays / views',
      facebook: 'post_video_views',
      x: 'video_views (CSV)',
      linkedin: 'videoViews (CSV)',
    },
    unavailableReasons: {},
  },
  reach: {
    key: 'reach',
    label: 'Account / Content Reach',
    shortLabel: 'Reach',
    unit: 'accounts',
    aggregation: 'DAILY',
    supportsDailyCumulativeToggle: false,
    showInOverview: true,
    crossPlatformComparable: false,
    crossPlatformLabel: 'Platform Reach (Not Unique Across Platforms)',
    crossPlatformCaveat:
      'Reach is only reported by Instagram & Facebook. Daily reach cannot be summed into unique multi-day or cross-platform people.',
    description:
      'Platform-estimated unique accounts that saw content during a reporting interval. Shown only where officially exposed.',
    sourceKeys: {
      instagram: 'reach',
      facebook: 'page_impressions_unique',
    },
    unavailableReasons: {
      youtube: 'YouTube Analytics API reports views and unique viewers separately; daily cross-channel Reach is not exposed in the standard report.',
      tiktok: 'TikTok Display API does not expose unique account reach.',
      x: 'Standard X Analytics CSV exports provide impressions, not deduplicated reach.',
      linkedin: 'Member CSV export provides impressions, not unique reach.',
    },
  },
  impressions: {
    key: 'impressions',
    label: 'Total Impressions',
    shortLabel: 'Impressions',
    unit: 'impressions',
    aggregation: 'DAILY',
    supportsDailyCumulativeToggle: true,
    showInOverview: true,
    crossPlatformComparable: false,
    crossPlatformLabel: 'Combined Reported Impressions',
    crossPlatformCaveat:
      'Sum of non-deduplicated impressions from platforms that expose impressions (Instagram, Facebook, X CSV, LinkedIn CSV).',
    description:
      'Total number of times content was displayed on screen, including repeat views by the same account.',
    sourceKeys: {
      instagram: 'impressions',
      facebook: 'page_impressions',
      x: 'impressions (CSV)',
      linkedin: 'impressionCount (CSV)',
    },
    unavailableReasons: {
      youtube: 'YouTube thumbnail impressions are not exposed via the standard Analytics API v2 report.',
      tiktok: 'TikTok Display API does not provide an impressions counter.',
    },
  },
  content_interactions: {
    key: 'content_interactions',
    label: 'Content Interactions',
    shortLabel: 'Interactions',
    unit: 'actions',
    aggregation: 'DAILY',
    supportsDailyCumulativeToggle: true,
    showInOverview: true,
    crossPlatformComparable: false,
    crossPlatformLabel: 'Combined Platform Interactions',
    crossPlatformCaveat:
      'Aggregates platform-specific engagements (likes/reactions, comments/replies, shares/reposts, and saves where exposed). Not a universal engagement rate.',
    description:
      'Total explicit audience engagement actions recorded across posts and videos within the selected window.',
    sourceKeys: {
      youtube: 'likes + comments + shares',
      tiktok: 'like_count + comment_count + share_count',
      instagram: 'likes + comments + shares + saved',
      facebook: 'reactions + comments + shares',
      x: 'likes + replies + retweets + bookmarks (CSV)',
      linkedin: 'reactions + comments + reposts (CSV)',
    },
    unavailableReasons: {},
  },
  audience_size: {
    key: 'audience_size',
    label: 'Followers / Subscribers',
    shortLabel: 'Audience',
    unit: 'accounts',
    aggregation: 'SNAPSHOT',
    supportsDailyCumulativeToggle: false,
    showInOverview: true,
    crossPlatformComparable: false,
    crossPlatformLabel: 'Combined Account Followers / Subscribers',
    crossPlatformCaveat:
      'Gross sum of channel subscribers (YouTube) and account followers (other platforms). Does not represent deduplicated unique individuals.',
    description:
      'Latest snapshot count of subscribers (YouTube) or followers (TikTok, Instagram, Facebook, X, LinkedIn).',
    sourceKeys: {
      youtube: 'statistics.subscriberCount',
      tiktok: 'follower_count',
      instagram: 'followers_count',
      facebook: 'followers_count',
      x: 'followers (CSV snapshot)',
      linkedin: 'followers (CSV snapshot)',
    },
    unavailableReasons: {},
  },
  published_posts: {
    key: 'published_posts',
    label: 'Published Content',
    shortLabel: 'Posts',
    unit: 'items',
    aggregation: 'PERIOD',
    supportsDailyCumulativeToggle: true,
    showInOverview: true,
    crossPlatformComparable: true,
    crossPlatformLabel: 'Published Posts & Videos',
    crossPlatformCaveat:
      'Total content items published across the selected platform(s) within the chosen date range.',
    description:
      'Count of owned posts, videos, reels, shorts, carousels, or articles published inside the selected window.',
    sourceKeys: {
      youtube: 'playlistItems (uploads)',
      tiktok: 'video.list',
      instagram: 'ig_user/media',
      facebook: 'page/published_posts',
      x: 'posts (CSV rows)',
      linkedin: 'posts (CSV rows)',
    },
    unavailableReasons: {},
  },
  watch_time_minutes: {
    key: 'watch_time_minutes',
    label: 'Estimated Watch Time',
    shortLabel: 'Watch Time',
    unit: 'min',
    aggregation: 'DAILY',
    supportsDailyCumulativeToggle: true,
    showInOverview: false,
    crossPlatformComparable: false,
    crossPlatformLabel: 'Watch Time (YouTube Only)',
    crossPlatformCaveat:
      'Kept in minutes exactly as returned by YouTube Analytics API (estimatedMinutesWatched). Unavailable on other configured connections.',
    description:
      'Total estimated minutes viewers spent watching channel videos during the reporting period.',
    sourceKeys: {
      youtube: 'estimatedMinutesWatched',
    },
    unavailableReasons: {
      tiktok: 'TikTok Display API does not expose watch time or retention metrics.',
      instagram: 'Instagram Insights API does not expose aggregate channel watch time minutes.',
      facebook: 'Standard Page Insights connection does not include full video watch minutes.',
      x: 'X Analytics CSV does not include total watch time minutes.',
      linkedin: 'LinkedIn CSV export does not include video watch time minutes.',
    },
  },
  profile_visits: {
    key: 'profile_visits',
    label: 'Profile Visits',
    shortLabel: 'Profile Visits',
    unit: 'visits',
    aggregation: 'DAILY',
    supportsDailyCumulativeToggle: true,
    showInOverview: false,
    crossPlatformComparable: false,
    crossPlatformLabel: 'Profile Visits (Supported Platforms)',
    crossPlatformCaveat:
      'Reported by Instagram, Facebook, X CSV, and LinkedIn CSV. Unavailable on YouTube Analytics API and TikTok Display API.',
    description: 'Number of times users viewed your profile or Page during the selected period.',
    sourceKeys: {
      instagram: 'profile_views',
      facebook: 'page_views_total',
      x: 'user_profile_clicks (CSV)',
      linkedin: 'profile_views (CSV)',
    },
    unavailableReasons: {
      youtube: 'YouTube Analytics API does not expose a generic profile visits counter.',
      tiktok: 'TikTok Display API does not expose profile view telemetry.',
    },
  },
  link_clicks: {
    key: 'link_clicks',
    label: 'External Link Clicks',
    shortLabel: 'Link Clicks',
    unit: 'clicks',
    aggregation: 'DAILY',
    supportsDailyCumulativeToggle: true,
    showInOverview: false,
    crossPlatformComparable: false,
    crossPlatformLabel: 'External Link Clicks',
    crossPlatformCaveat:
      'Includes bio/website clicks on Instagram/Facebook and URL clicks in X/LinkedIn exports.',
    description: 'Clicks on profile bio links or outbound links attached to posts.',
    sourceKeys: {
      instagram: 'website_clicks',
      facebook: 'page_website_clicks_logged_in_unique',
      x: 'url_clicks (CSV)',
      linkedin: 'clicks (CSV)',
    },
    unavailableReasons: {
      youtube: 'Outbound description link clicks are not exposed via YouTube Analytics API.',
      tiktok: 'TikTok Display API does not expose bio link click counts.',
    },
  },
  net_audience_change: {
    key: 'net_audience_change',
    label: 'Net Follower / Subscriber Change',
    shortLabel: 'Net Growth',
    unit: 'accounts',
    aggregation: 'DAILY',
    supportsDailyCumulativeToggle: true,
    showInOverview: false,
    crossPlatformComparable: false,
    crossPlatformLabel: 'Net Combined Audience Change',
    crossPlatformCaveat:
      'Derived from daily net change or sequential account snapshots; subscribers and followers remain distinct concepts.',
    description:
      'Net gain or loss of subscribers/followers across the selected date window.',
    sourceKeys: {
      youtube: 'subscribersGained - subscribersLost',
      tiktok: 'derived delta (follower_count)',
      instagram: 'follower_count (daily delta)',
      facebook: 'page_fan_adds - page_fan_removes',
      x: 'derived delta (CSV)',
      linkedin: 'new_followers (CSV)',
    },
    unavailableReasons: {},
  },
  saves: {
    key: 'saves',
    label: 'Post Saves / Bookmarks',
    shortLabel: 'Saves',
    unit: 'saves',
    aggregation: 'DAILY',
    supportsDailyCumulativeToggle: true,
    showInOverview: false,
    crossPlatformComparable: false,
    crossPlatformLabel: 'Saves & Bookmarks',
    crossPlatformCaveat: 'Available on Instagram (saved) and X CSV (bookmarks) only.',
    description: 'Times users saved or bookmarked posts for later reference.',
    sourceKeys: {
      instagram: 'saved',
      x: 'bookmarks (CSV)',
    },
    unavailableReasons: {
      youtube: 'Playlist saves are not broken out as a standard post-save metric.',
      tiktok: 'TikTok Display API does not expose favorites/saves count.',
      facebook: 'Facebook Page Insights does not expose post saves.',
      linkedin: 'LinkedIn CSV export does not expose post saves.',
    },
  },
};

export function isMetricSupportedOnPlatform(
  metricKey: CanonicalMetricKey,
  platform: PlatformId
): boolean {
  return Boolean(METRIC_REGISTRY[metricKey].sourceKeys[platform]);
}

export function getMetricUnavailableReason(
  metricKey: CanonicalMetricKey,
  platform: PlatformId
): string {
  return (
    METRIC_REGISTRY[metricKey].unavailableReasons[platform] ||
    `${PLATFORM_META[platform].name} does not expose ${METRIC_REGISTRY[metricKey].label} through the currently configured ingestion path.`
  );
}
