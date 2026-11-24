import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Columns2,
  FileSearch,
  FolderKanban,
  LayoutDashboard,
  Link2,
  Menu,
  RefreshCw,
  Search,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { PLATFORM_LIST, PLATFORM_META } from '../../data/metricRegistry';
import { AxiomLogo } from '../shared/AxiomLogo';
import type {
  DateRangePreset,
  DateRangeSelection,
  NavRouteId,
  OptionalModuleKey,
  PlatformAccount,
  PlatformFilter,
  SocialMonitorPreferences,
} from '../../types/social';
import { formatShortDate } from '../../utils/format';

interface NavItemConfig {
  id: NavRouteId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  moduleKey?: OptionalModuleKey;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'content', label: 'Content', icon: FolderKanban, moduleKey: 'content_library' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, moduleKey: 'analytics' },
  { id: 'audience', label: 'Audience', icon: Users, moduleKey: 'audience_insights' },
  { id: 'compare', label: 'Compare', icon: Columns2, moduleKey: 'cross_platform_comparison' },
  { id: 'accounts', label: 'Accounts', icon: Link2 },
  { id: 'sync', label: 'n8n Sync', icon: Activity, moduleKey: 'sync_center' },
  { id: 'analyst', label: 'Signals', icon: FileSearch, moduleKey: 'ai_analyst' },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface SocialMonitorShellProps {
  activeRoute: NavRouteId;
  onNavigate: (route: NavRouteId) => void;
  preferences: SocialMonitorPreferences;
  platformFilter: PlatformFilter;
  onChangePlatform: (platform: PlatformFilter) => void;
  accounts: PlatformAccount[];
  selectedAccountId: string;
  onChangeAccountId: (accountId: string) => void;
  dateRange: DateRangeSelection;
  onChangeDatePreset: (preset: DateRangePreset, customStart?: string, customEnd?: string) => void;
  globalSearch: string;
  onChangeGlobalSearch: (q: string) => void;
  onSubmitGlobalSearch: () => void;
  lastUpdatedAt: string | null;
  onRefresh: () => void;
  isLoading: boolean;
  children: React.ReactNode;
}

export const SocialMonitorShell: React.FC<SocialMonitorShellProps> = ({
  activeRoute,
  onNavigate,
  preferences,
  platformFilter,
  onChangePlatform,
  dateRange,
  onChangeDatePreset,
  globalSearch,
  onChangeGlobalSearch,
  onSubmitGlobalSearch,
  onRefresh,
  isLoading,
  children,
}) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showCustomDates, setShowCustomDates] = useState(false);
  const [customStart, setCustomStart] = useState(dateRange.startDate);
  const [customEnd, setCustomEnd] = useState(dateRange.endDate);
  const customPopoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCustomStart(dateRange.startDate);
    setCustomEnd(dateRange.endDate);
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    if (!showCustomDates) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        customPopoverRef.current &&
        !customPopoverRef.current.contains(e.target as Node)
      ) {
        setShowCustomDates(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCustomDates(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showCustomDates]);

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.moduleKey || preferences.enabledModules[item.moduleKey]
  );

  const handleNavClick = (id: NavRouteId) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const applyCustomRange = () => {
    if (!customStart || !customEnd) return;
    const start = customStart <= customEnd ? customStart : customEnd;
    const end = customStart <= customEnd ? customEnd : customStart;
    onChangeDatePreset('custom', start, end);
    setShowCustomDates(false);
  };

  const renderPlatformSelect = (extraClass = '') => (
    <select
      aria-label="Filter by platform"
      value={platformFilter}
      onChange={(e) => onChangePlatform(e.target.value as PlatformFilter)}
      className={`bg-[#0E1012] border border-[#22252A] hover:border-[#3F444D] rounded-md px-2.5 py-1.5 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#FFFFFF] transition-colors cursor-pointer ${extraClass}`}
    >
      <option value="all" className="bg-[#0E1012]">All Platforms</option>
      {PLATFORM_LIST.map((pid) => (
        <option key={pid} value={pid} className="bg-[#0E1012]">
          {PLATFORM_META[pid].name}
        </option>
      ))}
    </select>
  );

  const renderDateSelect = (extraClass = '') => (
    <select
      aria-label="Select date range"
      value={dateRange.preset}
      onChange={(e) => {
        const val = e.target.value as DateRangePreset;
        if (val === 'custom') {
          setShowCustomDates(true);
        } else {
          setShowCustomDates(false);
          onChangeDatePreset(val);
        }
      }}
      className={`bg-[#0E1012] border border-[#22252A] hover:border-[#3F444D] rounded-md px-2.5 py-1.5 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#FFFFFF] transition-colors cursor-pointer ${extraClass}`}
    >
      <option value="today" className="bg-[#0E1012]">Today</option>
      <option value="7d" className="bg-[#0E1012]">7 days</option>
      <option value="28d" className="bg-[#0E1012]">28 days</option>
      <option value="90d" className="bg-[#0E1012]">90 days</option>
      <option value="custom" className="bg-[#0E1012]">Custom</option>
    </select>
  );

  return (
    <div className="min-h-screen bg-[#090A0B] text-[#E3E2E3] flex">
      {/* Optically Aligned Monochrome Icon Rail (Tablet & Desktop) */}
      <aside
        aria-label="AXIOM navigation"
        className={`hidden md:flex flex-col shrink-0 bg-[#0E1012] border-r border-[#22252A] sticky top-0 h-screen z-30 transition-[width] duration-500 ease-out ${
          sidebarExpanded ? 'w-[208px]' : 'w-[60px]'
        }`}
      >
        {/* Rail Header — Logo center locked on exact x=30px optical axis */}
        <div className="h-[56px] border-b border-[#22252A] flex items-center px-[14px]">
          <button
            type="button"
            onClick={() => handleNavClick('overview')}
            className="flex items-center gap-3 w-full cursor-pointer"
            title="AXIOM — Social Intelligence"
          >
            <div className="w-8 h-8 rounded bg-[#121314] border border-[#26292E] flex items-center justify-center shrink-0 p-1">
              <AxiomLogo className="w-full h-full" />
            </div>
            {sidebarExpanded && (
              <div className="min-w-0 text-left">
                <span className="block text-xs font-mono font-bold text-[#FFFFFF] tracking-[0.2em] leading-none">
                  AXIOM
                </span>
                <span className="block text-[9px] font-mono text-[#8E96A0] tracking-wider mt-0.5 truncate">
                  SOCIAL MONITOR
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Navigation Rail Items — every 16px icon shares exact x=30px optical center */}
        <nav className="flex-1 py-3 px-[10px] space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                title={!sidebarExpanded ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full h-9 flex items-center gap-3 rounded-md text-xs font-medium transition-colors duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-[#FFFFFF] text-[#090A0B]'
                    : 'text-[#8E96A0] hover:text-[#FFFFFF] hover:bg-[#181A1D]'
                } ${sidebarExpanded ? 'px-3 justify-start' : 'justify-center px-0'}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {sidebarExpanded && (
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse / Expand Trigger — aligned on exact same optical axis */}
        <div className="p-[10px] border-t border-[#22252A]">
          <button
            type="button"
            onClick={() => setSidebarExpanded((v) => !v)}
            aria-label={sidebarExpanded ? 'Collapse navigation' : 'Expand navigation'}
            className={`w-full h-9 flex items-center gap-3 rounded-md text-xs text-[#8E96A0] hover:text-[#FFFFFF] hover:bg-[#181A1D] transition-colors duration-300 cursor-pointer ${
              sidebarExpanded ? 'px-3 justify-start' : 'justify-center px-0'
            }`}
          >
            {sidebarExpanded ? (
              <>
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Collapse</span>
              </>
            ) : (
              <ChevronRight className="w-4 h-4 shrink-0" />
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[82vw] bg-[#0E1012] border-r border-[#22252A] flex flex-col z-10">
            <div className="h-[56px] border-b border-[#22252A] px-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-[#121314] border border-[#26292E] flex items-center justify-center p-1 shrink-0">
                  <AxiomLogo className="w-full h-full" />
                </div>
                <span className="text-sm font-mono font-bold tracking-[0.2em] text-[#FFFFFF]">
                  AXIOM
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation"
                className="w-8 h-8 rounded flex items-center justify-center text-[#8E96A0] hover:text-[#FFFFFF] hover:bg-[#181A1D] cursor-pointer"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>
            <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeRoute === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full h-10 flex items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-300 cursor-pointer ${
                      isActive
                        ? 'bg-[#FFFFFF] text-[#090A0B]'
                        : 'text-[#A1A8B2] hover:text-[#FFFFFF] hover:bg-[#181A1D]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Responsive Minimal Top Bar (Clean 2-row on Mobile, Single-row on Tablet & Desktop) */}
        <header
          ref={customPopoverRef}
          className="sticky top-0 z-30 bg-[#090A0B]/95 backdrop-blur border-b border-[#22252A]"
        >
          <div className="h-[56px] px-4 sm:px-5 lg:px-8 flex items-center justify-between gap-2.5">
            {/* Left: Mobile Trigger + AXIOM Wordmark + Quiet Collapsible Search */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1 sm:flex-initial">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="md:hidden w-8 h-8 rounded bg-[#0E1012] border border-[#22252A] flex items-center justify-center text-[#A1A8B2] hover:text-[#FFFFFF] shrink-0 cursor-pointer"
              >
                <Menu className="w-4 h-4 shrink-0" />
              </button>

              {!sidebarExpanded && (
                <button
                  type="button"
                  onClick={() => handleNavClick('overview')}
                  className="inline-flex items-center gap-2 pr-2.5 sm:pr-3 sm:mr-0.5 sm:border-r sm:border-[#22252A] shrink-0 cursor-pointer"
                >
                  <AxiomLogo className="w-5 h-5 md:hidden shrink-0" />
                  <span className="font-mono text-xs font-bold tracking-[0.2em] text-[#FFFFFF]">
                    AXIOM
                  </span>
                </button>
              )}

              {searchOpen || globalSearch ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onSubmitGlobalSearch();
                  }}
                  className="relative flex-1 sm:flex-initial sm:w-64 lg:w-72 max-w-[260px] sm:max-w-none"
                >
                  <Search className="w-3.5 h-3.5 text-[#8E96A0] absolute left-2.5 inset-y-0 my-auto pointer-events-none shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    value={globalSearch}
                    onChange={(e) => onChangeGlobalSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        onChangeGlobalSearch('');
                        setSearchOpen(false);
                      }
                    }}
                    onBlur={() => {
                      if (!globalSearch) setSearchOpen(false);
                    }}
                    placeholder="Search content..."
                    aria-label="Search owned content"
                    className="w-full bg-[#0E1012] border border-[#26292E] focus:border-[#FFFFFF] rounded-md pl-8 pr-7 py-1.5 text-xs text-[#FFFFFF] placeholder:text-[#5D636E] focus:outline-none transition-colors"
                  />
                  {globalSearch && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onChangeGlobalSearch('');
                        setSearchOpen(false);
                      }}
                      aria-label="Clear search"
                      className="absolute right-1.5 inset-y-0 my-auto w-5 h-5 rounded flex items-center justify-center text-[#8E96A0] hover:text-[#FFFFFF] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  )}
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search content"
                  className="inline-flex items-center justify-center gap-2 h-8 px-2 sm:px-2.5 rounded-md text-xs text-[#8E96A0] hover:text-[#FFFFFF] hover:bg-[#181A1D] transition-colors shrink-0 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              )}
            </div>

            {/* Right: Controls (Platform & Date show inline on Tablet/Desktop; Mode always visible) */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex items-center gap-2">
                {renderPlatformSelect()}
                {renderDateSelect()}
                {dateRange.preset === 'custom' && (
                  <button
                    type="button"
                    onClick={() => setShowCustomDates((v) => !v)}
                    title="Edit custom date range"
                    className="hidden lg:inline-flex items-center gap-1.5 bg-[#0E1012] border border-[#26292E] hover:border-[#FFFFFF] rounded-md px-2.5 py-1.5 text-[11px] font-mono text-[#E3E2E3] transition-colors cursor-pointer"
                  >
                    <Calendar className="w-3 h-3 text-[#8E96A0] shrink-0" />
                    <span>
                      {formatShortDate(dateRange.startDate)} – {formatShortDate(dateRange.endDate)}
                    </span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                title="Refresh live data"
                aria-label="Refresh live data"
                className="w-8 h-8 rounded-md bg-[#0E1012] border border-[#22252A] hover:border-[#3F444D] flex items-center justify-center text-[#A1A8B2] hover:text-[#FFFFFF] transition-colors shrink-0 cursor-pointer disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Mobile-only Clean Filter Row so Platform & Date never crowd icons on <640px screens */}
          <div className="sm:hidden px-4 py-2 border-t border-[#181A1D] flex items-center gap-2">
            {renderPlatformSelect('flex-1 min-w-0')}
            {renderDateSelect('flex-1 min-w-0')}
            {dateRange.preset === 'custom' && (
              <button
                type="button"
                onClick={() => setShowCustomDates((v) => !v)}
                aria-label="Edit custom date range"
                className="w-8 h-8 rounded-md bg-[#0E1012] border border-[#26292E] flex items-center justify-center text-[#E3E2E3] shrink-0 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
          </div>

          {/* Custom Date Range Popover (positioned cleanly for Mobile, Tablet, and Desktop) */}
          {showCustomDates && (
            <div className="absolute right-4 sm:right-5 lg:right-8 top-full mt-2 z-50 w-64 p-3 rounded-lg bg-[#121314] border border-[#3F444D] shadow-[0_20px_50px_rgba(0,0,0,0.92)] space-y-2.5">
              <div className="text-xs font-medium text-[#FFFFFF]">
                Custom Window (UTC)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] text-[#8E96A0] block">
                  Start
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="mt-1 w-full bg-[#090A0B] border border-[#26292E] rounded px-2 py-1 text-xs font-mono text-[#FFFFFF]"
                  />
                </label>
                <label className="text-[11px] text-[#8E96A0] block">
                  End
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="mt-1 w-full bg-[#090A0B] border border-[#26292E] rounded px-2 py-1 text-xs font-mono text-[#FFFFFF]"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCustomDates(false)}
                  className="px-2.5 py-1 text-xs text-[#8E96A0] hover:text-[#FFFFFF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyCustomRange}
                  className="px-2.5 py-1 rounded bg-[#FFFFFF] text-[#090A0B] text-xs font-medium cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Generous, Breathing Main Canvas */}
        <main className="flex-1 px-4 sm:px-5 lg:px-8 py-5 sm:py-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
