import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, RefreshCw, RotateCcw } from 'lucide-react';
import { ExpandableSurface } from '../components/shared/ExpandableSurface';
import { PLATFORM_LIST, PLATFORM_META } from '../data/metricRegistry';
import {
  DEFAULT_PREFERENCES,
  checkBackendHealth,
  getConfiguredApiBaseUrl,
} from '../services/apiClient';
import type {
  BackendHealthStatus,
  DateRangePreset,
  OptionalModuleKey,
  OverviewWidgetKey,
  PlatformFilter,
  SocialMonitorPreferences,
} from '../types/social';

interface SettingsPageProps {
  preferences: SocialMonitorPreferences;
  onUpdatePreferences: (next: SocialMonitorPreferences) => void;
}

const OPTIONAL_MODULES: Array<{ key: OptionalModuleKey; label: string }> = [
  { key: 'content_library', label: 'Content Library' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'audience_insights', label: 'Audience' },
  { key: 'cross_platform_comparison', label: 'Compare' },
  { key: 'sync_center', label: 'n8n Sync' },
  { key: 'ai_analyst', label: 'Signals' },
];

const WIDGET_LABELS: Record<OverviewWidgetKey, string> = {
  primary_trend: 'Performance Chart',
  top_content: 'Top Content',
  audience_location: 'Audience Geography',
  content_type_breakdown: 'Content Formats',
  profile_activity: 'Profile Activity',
  insights_panel: 'Signals',
};

const HERO_ROW_SET = new Set<OverviewWidgetKey>(['primary_trend', 'audience_location']);

export const SettingsPage: React.FC<SettingsPageProps> = ({
  preferences,
  onUpdatePreferences,
}) => {
  const [health, setHealth] = useState<BackendHealthStatus | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const runHealthCheck = async () => {
    setCheckingHealth(true);
    const res = await checkBackendHealth();
    setHealth(res);
    setCheckingHealth(false);
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const toggleModule = (key: OptionalModuleKey) => {
    onUpdatePreferences({
      ...preferences,
      enabledModules: {
        ...preferences.enabledModules,
        [key]: !preferences.enabledModules[key],
      },
    });
  };

  const toggleWidget = (key: OverviewWidgetKey) => {
    onUpdatePreferences({
      ...preferences,
      visibleWidgets: {
        ...preferences.visibleWidgets,
        [key]: !preferences.visibleWidgets[key],
      },
    });
  };

  const heroRowWidgets = preferences.widgetOrder.filter((k) => HERO_ROW_SET.has(k));
  const secondaryGridWidgets = preferences.widgetOrder.filter((k) => !HERO_ROW_SET.has(k));

  const moveWidgetWithinColumn = (
    column: 'main' | 'side',
    indexInColumn: number,
    delta: -1 | 1
  ) => {
    const list = column === 'main' ? [...heroRowWidgets] : [...secondaryGridWidgets];
    const target = indexInColumn + delta;
    if (target < 0 || target >= list.length) return;
    const [moved] = list.splice(indexInColumn, 1);
    list.splice(target, 0, moved);
    const nextOrder =
      column === 'main'
        ? [...list, ...secondaryGridWidgets]
        : [...heroRowWidgets, ...list];
    onUpdatePreferences({ ...preferences, widgetOrder: nextOrder });
  };

  const apiBase = getConfiguredApiBaseUrl();

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-display font-bold text-[#FFFFFF]">Settings</h1>
        <button
          type="button"
          onClick={() =>
            onUpdatePreferences({
              ...DEFAULT_PREFERENCES,
            })
          }
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0B0B0B] border border-[#222222] hover:border-[#404040] text-xs text-[#D4D4D4] hover:text-[#FFFFFF] cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          Reset
        </button>
      </div>

      {/* Modules Toggle Section */}
      <ExpandableSurface
        className="p-5"
        pinnedByDefault
        scaleOnHover={1.005}
        ariaLabel="Navigation modules settings."
        expandedContent={
          <div className="divide-y divide-[#1A1A1A]">
            {OPTIONAL_MODULES.map((mod) => {
              const enabled = preferences.enabledModules[mod.key];
              return (
                <div
                  key={mod.key}
                  className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between"
                >
                  <span className="text-xs text-[#E5E5E5]">{mod.label}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    onClick={() => toggleModule(mod.key)}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      enabled ? 'bg-[#FFFFFF]' : 'bg-[#262626]'
                    }`}
                  >
                    <span
                      className={`block w-3.5 h-3.5 rounded-full transition-transform ${
                        enabled
                          ? 'translate-x-4.5 bg-[#000000]'
                          : 'translate-x-1 bg-[#737373]'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        }
      >
        <div className="flex items-baseline justify-between pr-8">
          <h2 className="text-sm font-display font-semibold text-[#FFFFFF]">
            Visible Modules
          </h2>
          <span className="text-xs font-mono text-[#666666]">
            Hiding preserves data
          </span>
        </div>
      </ExpandableSurface>

      {/* Overview Widgets grouped by actual Overview column */}
      <ExpandableSurface
        className="p-5"
        scaleOnHover={1.005}
        ariaLabel="Overview widget visibility and ordering."
        expandedContent={
          <div className="space-y-4">
            {(
              [
                { id: 'main', label: 'Primary Row', items: heroRowWidgets },
                { id: 'side', label: 'Secondary Grid', items: secondaryGridWidgets },
              ] as const
            ).map((group) => (
              <div key={group.id}>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#666666] mb-1.5">
                  {group.label}
                </div>
                <div className="divide-y divide-[#1A1A1A] border border-[#1A1A1A] rounded-md px-3">
                  {group.items.map((wKey, idx) => {
                    const visible = preferences.visibleWidgets[wKey];
                    return (
                      <div
                        key={wKey}
                        className="py-2 flex items-center justify-between text-xs"
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={visible}
                            onChange={() => toggleWidget(wKey)}
                            className="accent-[#FFFFFF]"
                          />
                          <span className={visible ? 'text-[#FFFFFF]' : 'text-[#666666]'}>
                            {WIDGET_LABELS[wKey]}
                          </span>
                        </label>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveWidgetWithinColumn(group.id, idx, -1)}
                            aria-label={`Move ${WIDGET_LABELS[wKey]} up`}
                            className="w-7 h-7 rounded border border-[#22252A] flex items-center justify-center text-[#A1A8B2] hover:text-[#FFFFFF] hover:border-[#40454E] disabled:opacity-25 cursor-pointer transition-colors"
                          >
                            <ArrowUp className="w-3.5 h-3.5 shrink-0" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === group.items.length - 1}
                            onClick={() => moveWidgetWithinColumn(group.id, idx, 1)}
                            aria-label={`Move ${WIDGET_LABELS[wKey]} down`}
                            className="w-7 h-7 rounded border border-[#22252A] flex items-center justify-center text-[#A1A8B2] hover:text-[#FFFFFF] hover:border-[#40454E] disabled:opacity-25 cursor-pointer transition-colors"
                          >
                            <ArrowDown className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        }
      >
        <div className="flex items-baseline justify-between pr-8">
          <h2 className="text-sm font-display font-semibold text-[#FFFFFF]">
            Overview Widgets
          </h2>
          <span className="text-xs font-mono text-[#666666]">
            Show, hide, reorder
          </span>
        </div>
      </ExpandableSurface>

      {/* Defaults & n8n / Backend Connection */}
      <ExpandableSurface
        className="p-5"
        scaleOnHover={1.005}
        ariaLabel="Default filters and n8n backend endpoint."
        expandedContent={
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="block text-[#8A8A8A]">
                Default Platform
                <select
                  value={preferences.defaultPlatform}
                  onChange={(e) =>
                    onUpdatePreferences({
                      ...preferences,
                      defaultPlatform: e.target.value as PlatformFilter,
                    })
                  }
                  className="mt-1 w-full bg-[#000000] border border-[#262626] rounded px-2.5 py-1.5 text-xs text-[#FFFFFF]"
                >
                  <option value="all">All Platforms</option>
                  {PLATFORM_LIST.map((pid) => (
                    <option key={pid} value={pid}>
                      {PLATFORM_META[pid].name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-[#8A8A8A]">
                Default Window
                <select
                  value={preferences.defaultDatePreset}
                  onChange={(e) =>
                    onUpdatePreferences({
                      ...preferences,
                      defaultDatePreset: e.target.value as DateRangePreset,
                    })
                  }
                  className="mt-1 w-full bg-[#000000] border border-[#262626] rounded px-2.5 py-1.5 text-xs text-[#FFFFFF]"
                >
                  <option value="today">Today</option>
                  <option value="7d">7 days</option>
                  <option value="28d">28 days</option>
                  <option value="90d">90 days</option>
                </select>
              </label>
            </div>

            <div className="pt-3 border-t border-[#1C1C1C] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#8A8A8A]">Backend / n8n API Base</span>
                <button
                  type="button"
                  onClick={runHealthCheck}
                  className="inline-flex items-center gap-1 text-[11px] text-[#FFFFFF] hover:text-[#A3A3A3] cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 shrink-0 ${checkingHealth ? 'animate-spin' : ''}`} />
                  Check
                </button>
              </div>
              <div className="font-mono text-[11px] text-[#D4D4D4]">
                VITE_API_BASE_URL: {apiBase || 'Not configured (set in .env)'}
              </div>
              {health && (
                <div className="text-[11px] text-[#737373]">{health.message}</div>
              )}
            </div>
          </div>
        }
      >
        <div className="flex items-baseline justify-between pr-8">
          <h2 className="text-sm font-display font-semibold text-[#FFFFFF]">
            Defaults & n8n Connection
          </h2>
          <span className="text-xs font-mono text-[#666666]">
            {health?.reachable ? 'Reachable' : 'Ready for n8n'}
          </span>
        </div>
      </ExpandableSurface>
    </div>
  );
};
