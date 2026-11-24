import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { SocialMonitorShell } from './components/layout/SocialMonitorShell';
import { DEFAULT_PLATFORM_ACCOUNTS } from './data/platformDefaults';
import { AccountsPage } from './pages/AccountsPage';
import { AnalystPage } from './pages/AnalystPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AudiencePage } from './pages/AudiencePage';
import { ComparePage } from './pages/ComparePage';
import { ContentDetailPage } from './pages/ContentDetailPage';
import { ContentLibraryPage } from './pages/ContentLibraryPage';
import { OverviewPage } from './pages/OverviewPage';
import { SettingsPage } from './pages/SettingsPage';
import { SyncCenterPage } from './pages/SyncCenterPage';
import {
  getConfiguredApiBaseUrl,
  getDateRangeFromPreset,
  loadPreferences,
  loadSocialMonitorDataset,
  savePreferences,
} from './services/apiClient';
import type {
  CanonicalMetricKey,
  ContentType,
  DateRangePreset,
  DateRangeSelection,
  NavRouteId,
  PlatformFilter,
  SocialMonitorDataset,
  SocialMonitorPreferences,
} from './types/social';

const ROUTE_TO_HASH: Record<NavRouteId, string> = {
  overview: '#/overview',
  content: '#/content',
  analytics: '#/analytics',
  audience: '#/audience',
  compare: '#/compare',
  accounts: '#/accounts',
  sync: '#/sync',
  analyst: '#/analyst',
  settings: '#/settings',
};

const ROUTE_LABELS: Record<NavRouteId, string> = {
  overview: 'Overview',
  content: 'Content',
  analytics: 'Analytics',
  audience: 'Audience',
  compare: 'Compare',
  accounts: 'Accounts',
  sync: 'n8n Sync',
  analyst: 'Signals',
  settings: 'Settings',
};

function parseRouteFromHash(): NavRouteId {
  const hash = window.location.hash.replace(/^#\/?/, '').split('/')[0];
  if (
    hash === 'overview' ||
    hash === 'content' ||
    hash === 'analytics' ||
    hash === 'audience' ||
    hash === 'compare' ||
    hash === 'accounts' ||
    hash === 'sync' ||
    hash === 'analyst' ||
    hash === 'settings'
  ) {
    return hash;
  }
  return 'overview';
}

export default function App() {
  const [preferences, setPreferences] = useState<SocialMonitorPreferences>(() =>
    loadPreferences()
  );
  const [activeRoute, setActiveRoute] = useState<NavRouteId>(() =>
    parseRouteFromHash()
  );
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>(
    () => loadPreferences().defaultPlatform
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRangeSelection>(() =>
    getDateRangeFromPreset(loadPreferences().defaultDatePreset)
  );
  const [selectedTrendMetric, setSelectedTrendMetric] =
    useState<CanonicalMetricKey>('platform_views');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [libraryContentType, setLibraryContentType] = useState<ContentType | 'all'>(
    'all'
  );

  const [dataset, setDataset] = useState<SocialMonitorDataset>({
    apiConfigured: Boolean(getConfiguredApiBaseUrl()),
    lastFetchedAt: null,
    accounts: DEFAULT_PLATFORM_ACCOUNTS,
    content: [],
    dailySeries: [],
    audience: [],
    syncRuns: [],
    backendError: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDataset = useCallback(async () => {
    setIsLoading(true);
    const data = await loadSocialMonitorDataset();
    setDataset(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDataset();
  }, [fetchDataset]);

  useEffect(() => {
    const onHashChange = () => {
      setActiveRoute(parseRouteFromHash());
      setSelectedContentId(null);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (
    route: NavRouteId,
    opts?: {
      platform?: PlatformFilter;
      metric?: CanonicalMetricKey;
      contentType?: ContentType;
    }
  ) => {
    if (opts?.platform) {
      setPlatformFilter(opts.platform);
      setSelectedAccountId('all');
    }
    if (opts?.metric) {
      setSelectedTrendMetric(opts.metric);
    }
    if (opts?.contentType) {
      setLibraryContentType(opts.contentType);
    } else if (route !== 'content') {
      setLibraryContentType('all');
    }

    setSelectedContentId(null);
    setActiveRoute(route);
    if (window.location.hash !== ROUTE_TO_HASH[route]) {
      window.location.hash = ROUTE_TO_HASH[route];
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleUpdatePreferences = (next: SocialMonitorPreferences) => {
    setPreferences(next);
    savePreferences(next);

    const routeToModule: Partial<
      Record<NavRouteId, keyof SocialMonitorPreferences['enabledModules']>
    > = {
      content: 'content_library',
      analytics: 'analytics',
      audience: 'audience_insights',
      compare: 'cross_platform_comparison',
      sync: 'sync_center',
      analyst: 'ai_analyst',
    };
    const modKey = routeToModule[activeRoute];
    if (modKey && !next.enabledModules[modKey]) {
      navigate('overview');
    }
  };

  const handleChangePlatform = (platform: PlatformFilter) => {
    setPlatformFilter(platform);
    setSelectedAccountId('all');
  };

  const handleChangeDatePreset = (
    preset: DateRangePreset,
    customStart?: string,
    customEnd?: string
  ) => {
    setDateRange(getDateRangeFromPreset(preset, customStart, customEnd));
  };

  const handleSelectContent = (contentId: string) => {
    setSelectedContentId(contentId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGlobalSearchSubmit = () => {
    if (preferences.enabledModules.content_library) {
      setSelectedContentId(null);
      setActiveRoute('content');
      window.location.hash = ROUTE_TO_HASH.content;
    }
  };

  const selectedContentItem = selectedContentId
    ? dataset.content.find((c) => c.id === selectedContentId) ?? null
    : null;

  const renderPage = () => {
    if (selectedContentItem) {
      return (
        <ContentDetailPage
          item={selectedContentItem}
          allItems={dataset.content}
          onBack={() => setSelectedContentId(null)}
          backLabel={`Back to ${ROUTE_LABELS[activeRoute]}`}
        />
      );
    }

    switch (activeRoute) {
      case 'content':
        return (
          <ContentLibraryPage
            items={dataset.content}
            platformFilter={platformFilter}
            onChangePlatform={handleChangePlatform}
            dateRange={dateRange}
            searchQuery={globalSearch}
            onChangeSearch={setGlobalSearch}
            initialContentType={libraryContentType}
            onSelectContent={handleSelectContent}
            onOpenSync={() => navigate('sync')}
            onOpenSettings={() => navigate('settings')}
          />
        );
      case 'analytics':
        return (
          <AnalyticsPage
            dataset={dataset}
            platformFilter={platformFilter}
            onChangePlatform={handleChangePlatform}
            dateRange={dateRange}
            selectedMetric={selectedTrendMetric}
            onSelectMetric={setSelectedTrendMetric}
            onSelectContent={handleSelectContent}
            onOpenAccounts={() => navigate('accounts')}
            onOpenSettings={() => navigate('settings')}
          />
        );
      case 'audience':
        return (
          <AudiencePage
            dataset={dataset}
            platformFilter={platformFilter}
            onChangePlatform={handleChangePlatform}
            dateRange={dateRange}
            onOpenAccounts={() => navigate('accounts')}
            onOpenSettings={() => navigate('settings')}
          />
        );
      case 'compare':
        return (
          <ComparePage
            dataset={dataset}
            dateRange={dateRange}
            onInspectPlatform={(p) => navigate('analytics', { platform: p })}
            onOpenAccounts={() => navigate('accounts')}
            onOpenSettings={() => navigate('settings')}
          />
        );
      case 'accounts':
        return (
          <AccountsPage
            accounts={dataset.accounts}
            onOpenSyncCenter={() => navigate('sync')}
          />
        );
      case 'sync':
        return (
          <SyncCenterPage
            runs={dataset.syncRuns}
            apiConfigured={dataset.apiConfigured}
            onRefresh={fetchDataset}
            onOpenSettings={() => navigate('settings')}
          />
        );
      case 'analyst':
        return (
          <AnalystPage
            dataset={dataset}
            platformFilter={platformFilter}
            dateRange={dateRange}
            onInspectContent={handleSelectContent}
            onNavigate={(route, platform) => navigate(route, { platform })}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
          />
        );
      case 'overview':
      default:
        return (
          <OverviewPage
            dataset={dataset}
            isLoading={isLoading}
            platformFilter={platformFilter}
            onChangePlatform={handleChangePlatform}
            dateRange={dateRange}
            selectedTrendMetric={selectedTrendMetric}
            onSelectTrendMetric={setSelectedTrendMetric}
            preferences={preferences}
            onNavigate={navigate}
            onSelectContent={handleSelectContent}
            onRetryBackend={fetchDataset}
          />
        );
    }
  };

  return (
    <SocialMonitorShell
      activeRoute={activeRoute}
      onNavigate={(route) => navigate(route)}
      preferences={preferences}
      platformFilter={platformFilter}
      onChangePlatform={handleChangePlatform}
      accounts={dataset.accounts}
      selectedAccountId={selectedAccountId}
      onChangeAccountId={setSelectedAccountId}
      dateRange={dateRange}
      onChangeDatePreset={handleChangeDatePreset}
      globalSearch={globalSearch}
      onChangeGlobalSearch={setGlobalSearch}
      onSubmitGlobalSearch={handleGlobalSearchSubmit}
      lastUpdatedAt={dataset.lastFetchedAt}
      onRefresh={fetchDataset}
      isLoading={isLoading}
    >
      <motion.div
        key={selectedContentItem ? `content-${selectedContentItem.id}` : activeRoute}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
      >
        {renderPage()}
      </motion.div>
    </SocialMonitorShell>
  );
}
