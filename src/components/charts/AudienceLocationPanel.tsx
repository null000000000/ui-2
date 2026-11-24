import React, { useState } from 'react';
import { PLATFORM_META } from '../../data/metricRegistry';
import type { AudienceBreakdown, CountryMetric, PlatformFilter } from '../../types/social';
import { formatCompactNumber, formatNumber } from '../../utils/format';
import { ExpandableSurface } from '../shared/ExpandableSurface';
import { UnavailableMetricState } from '../shared/States';

interface CityCoordinate {
  leftPct: number;
  topPct: number;
  fallbackCity: string;
}

/**
 * Pixel-calibrated city coordinates (% from top-left) measured directly against
 * the uploaded 1376x768 world map image (/assets/aistudio/screen_2085f7a4.png).
 */
const CITY_COORDINATES: Record<string, { leftPct: number; topPct: number }> = {
  'San Francisco': { leftPct: 19.6, topPct: 33.4 },
  'New York': { leftPct: 30.8, topPct: 31.6 },
  Toronto: { leftPct: 29.4, topPct: 30.2 },
  'São Paulo': { leftPct: 38.0, topPct: 63.6 },
  London: { leftPct: 48.8, topPct: 26.0 },
  Paris: { leftPct: 49.7, topPct: 27.6 },
  Amsterdam: { leftPct: 50.6, topPct: 25.5 },
  Berlin: { leftPct: 52.8, topPct: 25.4 },
  Cairo: { leftPct: 57.0, topPct: 38.5 },
  Riyadh: { leftPct: 60.8, topPct: 41.2 },
  Dubai: { leftPct: 62.9, topPct: 40.9 },
  Mumbai: { leftPct: 67.2, topPct: 43.8 },
  Bengaluru: { leftPct: 68.4, topPct: 46.6 },
  Singapore: { leftPct: 74.7, topPct: 52.2 },
  Tokyo: { leftPct: 82.9, topPct: 34.9 },
  Sydney: { leftPct: 86.1, topPct: 68.6 },
};

const COUNTRY_FALLBACK_CITY: Record<string, CityCoordinate> = {
  US: { leftPct: 30.8, topPct: 31.6, fallbackCity: 'New York' },
  CA: { leftPct: 29.4, topPct: 30.2, fallbackCity: 'Toronto' },
  BR: { leftPct: 38.0, topPct: 63.6, fallbackCity: 'São Paulo' },
  GB: { leftPct: 48.8, topPct: 26.0, fallbackCity: 'London' },
  FR: { leftPct: 49.7, topPct: 27.6, fallbackCity: 'Paris' },
  NL: { leftPct: 50.6, topPct: 25.5, fallbackCity: 'Amsterdam' },
  DE: { leftPct: 52.8, topPct: 25.4, fallbackCity: 'Berlin' },
  EG: { leftPct: 57.0, topPct: 38.5, fallbackCity: 'Cairo' },
  SA: { leftPct: 60.8, topPct: 41.2, fallbackCity: 'Riyadh' },
  AE: { leftPct: 62.9, topPct: 40.9, fallbackCity: 'Dubai' },
  IN: { leftPct: 68.4, topPct: 46.6, fallbackCity: 'Bengaluru' },
  SG: { leftPct: 74.7, topPct: 52.2, fallbackCity: 'Singapore' },
  JP: { leftPct: 82.9, topPct: 34.9, fallbackCity: 'Tokyo' },
  AU: { leftPct: 86.1, topPct: 68.6, fallbackCity: 'Sydney' },
};

function resolveCityPin(country: CountryMetric): {
  cityName: string;
  leftPct: number;
  topPct: number;
} | null {
  if (country.topCity && CITY_COORDINATES[country.topCity]) {
    const c = CITY_COORDINATES[country.topCity];
    return { cityName: country.topCity, leftPct: c.leftPct, topPct: c.topPct };
  }
  const fb = COUNTRY_FALLBACK_CITY[country.countryCode];
  if (!fb) return null;
  return {
    cityName: country.topCity || fb.fallbackCity,
    leftPct: fb.leftPct,
    topPct: fb.topPct,
  };
}

/**
 * Precision pin SVG whose sharp pointer tip lands at exact (10, 24) — the dead-center bottom pixel —
 * so zero visual offset occurs between the pin tip and the city coordinate.
 */
const PrecisionPinIcon: React.FC<{
  primary?: boolean;
  active?: boolean;
  className?: string;
}> = ({ primary = false, active = false, className = 'w-4 h-5' }) => (
  <svg
    viewBox="0 0 20 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M10 1C5.03 1 1 5.03 1 10C1 15.8 10 24 10 24C10 24 19 15.8 19 10C19 5.03 14.97 1 10 1Z"
      fill={primary || active ? '#FFFFFF' : '#181A1D'}
      stroke={primary || active ? '#090A0B' : '#A1A8B2'}
      strokeWidth={primary ? '1.4' : '1.6'}
    />
    <circle
      cx="10"
      cy="9.5"
      r={primary ? '3' : '2.5'}
      fill={primary || active ? '#090A0B' : '#E3E2E3'}
    />
  </svg>
);

interface AudienceLocationPanelProps {
  audienceList: AudienceBreakdown[];
  platformFilter: PlatformFilter;
  fullHeight?: boolean;
}

export const AudienceLocationPanel: React.FC<AudienceLocationPanelProps> = ({
  audienceList,
  platformFilter,
  fullHeight = false,
}) => {
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const supportedSources = audienceList.filter((a) => a.countries && a.countries.length > 0);
  const [selectedSourcePlatform, setSelectedSourcePlatform] = useState<string | null>(null);

  const activeBreakdown: AudienceBreakdown | null = (() => {
    if (platformFilter !== 'all') {
      return audienceList.find((a) => a.platform === platformFilter) ?? null;
    }
    if (selectedSourcePlatform) {
      const match = supportedSources.find((a) => a.platform === selectedSourcePlatform);
      if (match) return match;
    }
    return supportedSources[0] ?? null;
  })();

  const sortedCountries = [...(activeBreakdown?.countries ?? [])].sort(
    (a, b) => b.sharePct - a.sharePct
  );
  const hasGeo = sortedCountries.length > 0;
  const maxShare = Math.max(...sortedCountries.map((c) => c.sharePct), 1);
  const topCountry = sortedCountries[0] ?? null;
  const countryMap = new Map(sortedCountries.map((c) => [c.countryCode, c]));
  const focusedCountry =
    (hoveredCode ? countryMap.get(hoveredCode) : null) ?? topCountry;
  const focusedPin = focusedCountry ? resolveCityPin(focusedCountry) : null;

  return (
    <ExpandableSurface
      className="p-5"
      fullHeight={fullHeight}
      scaleOnHover={1.008}
      openDelayMs={740}
      ariaLabel="Audience geography. Pause or click to expand full city and country breakdown."
      expandedContent={
        !hasGeo || !activeBreakdown ? (
          <p className="text-xs text-[#8E96A0]">
            {activeBreakdown?.geographyUnavailableReason ||
              'Geography requires an eligible YouTube, Instagram, or Facebook source.'}
          </p>
        ) : (
          <div className="space-y-3">
            {platformFilter === 'all' && supportedSources.length > 1 && (
              <div className="flex items-center gap-1.5">
                {supportedSources.map((src) => (
                  <button
                    key={src.platform}
                    type="button"
                    onClick={() => setSelectedSourcePlatform(src.platform)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors duration-300 cursor-pointer ${
                      activeBreakdown.platform === src.platform
                        ? 'bg-[#FFFFFF] text-[#090A0B]'
                        : 'bg-[#181A1D] text-[#A1A8B2] hover:text-[#FFFFFF]'
                    }`}
                  >
                    {PLATFORM_META[src.platform].name}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {sortedCountries.slice(0, 7).map((c, idx) => {
                const pin = resolveCityPin(c);
                const isRowActive = hoveredCode === c.countryCode;
                return (
                  <div
                    key={c.countryCode}
                    onMouseEnter={() => setHoveredCode(c.countryCode)}
                    onMouseLeave={() => setHoveredCode(null)}
                    className={`space-y-1 rounded px-1.5 py-1 -mx-1.5 transition-colors duration-300 ${
                      isRowActive ? 'bg-[#26292E]/60' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="truncate">
                        <span className={isRowActive || idx === 0 ? 'text-[#FFFFFF] font-medium' : 'text-[#E3E2E3]'}>
                          {pin ? pin.cityName : c.countryName}
                        </span>
                        <span className="text-[#8E96A0] ml-1.5 text-[11px]">
                          {c.countryName}
                        </span>
                      </span>
                      <span className="font-mono tabular-nums text-[#FFFFFF] shrink-0">
                        {c.sharePct.toFixed(1)}%
                        <span className="text-[#8E96A0] ml-2 text-[11px]">
                          {formatNumber(c.value)}
                        </span>
                      </span>
                    </div>
                    <div className="h-1 bg-[#22252A] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FFFFFF] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (c.sharePct / maxShare) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] font-mono text-[#8E96A0]">
              {activeBreakdown.geographyMetricLabel} · {activeBreakdown.periodLabel}
            </div>
          </div>
        )
      }
    >
      <div className="flex items-baseline justify-between gap-2 mb-3 pr-8">
        <h2 className="text-sm font-display font-semibold text-[#FFFFFF]">
          Audience Geography
        </h2>
        {hasGeo && activeBreakdown && (
          <span className="text-xs font-mono tabular-nums text-[#A1A8B2]">
            {formatCompactNumber(activeBreakdown.geographyTotal)}
          </span>
        )}
      </div>

      {(() => {
        const isUnsupportedPlatform =
          platformFilter === 'tiktok' ||
          platformFilter === 'x' ||
          platformFilter === 'linkedin';

        if (isUnsupportedPlatform || activeBreakdown?.geographyUnavailableReason) {
          return (
            <UnavailableMetricState
              compact
              title="Geography unavailable"
              reason={
                activeBreakdown?.geographyUnavailableReason ||
                `${platformFilter !== 'all' ? PLATFORM_META[platformFilter].name : 'Selected source'} does not expose audience country breakdowns via this integration.`
              }
            />
          );
        }

        if (!hasGeo || !activeBreakdown) {
          return (
            <div className="space-y-2.5">
              <div className="relative w-full aspect-[1376/768] bg-[#090A0B] border border-[#22252A] rounded-md overflow-hidden select-none">
                <img
                  src="/assets/aistudio/screen_2085f7a4.png"
                  alt="World audience distribution map"
                  draggable={false}
                  className="w-full h-full block opacity-65 pointer-events-none"
                />
                <div className="pointer-events-none absolute left-2 bottom-2 sm:left-2.5 sm:bottom-2.5 px-2.5 py-1 rounded bg-[#0E1012]/95 border border-[#26292E] text-[10px] sm:text-[11px] font-mono text-[#A1A8B2] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5D636E] shrink-0" />
                  <span>Awaiting live city telemetry</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#737373]">
                <span>No geographic observations synced yet</span>
                <span>UTC</span>
              </div>
            </div>
          );
        }

        return (
        <div className="space-y-2.5">
          {/* Exact 1376:768 aspect ratio locks pixel coordinates 1:1 with the uploaded world map */}
          <div className="relative w-full aspect-[1376/768] bg-[#090A0B] border border-[#22252A] rounded-md overflow-hidden select-none">
            <img
              src="/assets/aistudio/screen_2085f7a4.png"
              alt="World audience distribution map"
              draggable={false}
              className="w-full h-full block opacity-90 pointer-events-none"
            />

            {/* Secondary Top Cities per Region — de-overlapped cleanly across Mobile, Tablet, and Desktop */}
            {(() => {
              const placedPins: Array<{ leftPct: number; topPct: number }> = [];
              if (topCountry) {
                const tp = resolveCityPin(topCountry);
                if (tp) placedPins.push({ leftPct: tp.leftPct, topPct: tp.topPct });
              }

              return sortedCountries.slice(1, 7).map((c) => {
                const pin = resolveCityPin(c);
                if (!pin) return null;
                const isHovered = hoveredCode === c.countryCode;
                // Detect tight spatial cluster (e.g. Amsterdam/Paris next to London) so icons never pile on mobile/desktop
                const isTightNeighbor = placedPins.some(
                  (p) => Math.hypot(p.leftPct - pin.leftPct, p.topPct - pin.topPct) < 2.6
                );
                if (!isTightNeighbor) {
                  placedPins.push({ leftPct: pin.leftPct, topPct: pin.topPct });
                }

                if (isTightNeighbor && !isHovered) {
                  return (
                    <button
                      key={c.countryCode}
                      type="button"
                      data-no-pin="true"
                      onMouseEnter={() => setHoveredCode(c.countryCode)}
                      onMouseLeave={() => setHoveredCode(null)}
                      onFocus={() => setHoveredCode(c.countryCode)}
                      onBlur={() => setHoveredCode(null)}
                      aria-label={`${pin.cityName}, ${c.countryName}: ${c.sharePct.toFixed(1)}%`}
                      style={{
                        left: `${pin.leftPct}%`,
                        top: `${pin.topPct}%`,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 p-1 z-10 cursor-pointer focus:outline-none"
                    >
                      <span className="block w-1.5 h-1.5 rounded-full bg-[#A1A8B2] ring-1 ring-[#090A0B]" />
                    </button>
                  );
                }

                return (
                  <button
                    key={c.countryCode}
                    type="button"
                    data-no-pin="true"
                    onMouseEnter={() => setHoveredCode(c.countryCode)}
                    onMouseLeave={() => setHoveredCode(null)}
                    onFocus={() => setHoveredCode(c.countryCode)}
                    onBlur={() => setHoveredCode(null)}
                    aria-label={`${pin.cityName}, ${c.countryName}: ${c.sharePct.toFixed(1)}%`}
                    style={{
                      left: `${pin.leftPct}%`,
                      top: `${pin.topPct}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-full origin-bottom transition-transform duration-400 cursor-pointer focus:outline-none ${
                      isHovered ? 'z-30 scale-125' : 'z-10 hover:scale-115'
                    }`}
                  >
                    <PrecisionPinIcon
                      active={isHovered}
                      className="w-2.5 h-3 sm:w-3 sm:h-3.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
                    />
                  </button>
                );
              });
            })()}

            {/* Primary #1 Top Viewer City Pin (exact-tip white pointer + grounded target anchor) */}
            {topCountry && (() => {
              const topPin = resolveCityPin(topCountry);
              if (!topPin) return null;
              const isTopActive = !hoveredCode || hoveredCode === topCountry.countryCode;

              return (
                <button
                  key={topCountry.countryCode}
                  type="button"
                  data-no-pin="true"
                  onMouseEnter={() => setHoveredCode(topCountry.countryCode)}
                  onMouseLeave={() => setHoveredCode(null)}
                  onFocus={() => setHoveredCode(topCountry.countryCode)}
                  onBlur={() => setHoveredCode(null)}
                  aria-label={`Top viewer city: ${topPin.cityName}, ${topCountry.countryName} (${topCountry.sharePct.toFixed(1)}%)`}
                  style={{
                    left: `${topPin.leftPct}%`,
                    top: `${topPin.topPct}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-full origin-bottom z-20 cursor-pointer focus:outline-none"
                >
                  {/* Exact city target point directly under pin tip */}
                  <span className="pointer-events-none absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#FFFFFF] ring-4 ring-[#FFFFFF]/20" />
                  <PrecisionPinIcon
                    primary
                    active={isTopActive}
                    className={`w-3.5 h-[17px] sm:w-4 sm:h-5 transition-transform duration-400 drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)] ${
                      isTopActive ? 'scale-110' : 'scale-95 opacity-85'
                    }`}
                  />
                </button>
              );
            })()}

            {/* Anchored Top-City / Hovered-City Telemetry Callout (cleanly sized for Mobile, Tablet & Desktop) */}
            {focusedCountry && focusedPin && (
              <div className="pointer-events-none absolute left-2 bottom-2 sm:left-2.5 sm:bottom-2.5 max-w-[calc(100%-16px)] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-[#0E1012]/95 border border-[#3F444D] text-[10px] sm:text-[11px] font-mono text-[#FFFFFF] flex items-center gap-1.5">
                <PrecisionPinIcon primary className="w-2.5 h-3 shrink-0" />
                <span className="text-[#8E96A0] shrink-0">
                  {hoveredCode && hoveredCode !== topCountry?.countryCode ? 'City' : 'Top'}
                </span>
                <span className="font-semibold truncate">{focusedPin.cityName}</span>
                <span className="text-[#8E96A0] shrink-0">({focusedCountry.countryCode})</span>
                <span className="text-[#A1A8B2] shrink-0">·</span>
                <span className="tabular-nums font-semibold shrink-0">
                  {focusedCountry.sharePct.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-[#A1A8B2]">
            <span className="truncate">
              {focusedCountry && focusedPin
                ? `${focusedPin.cityName}, ${focusedCountry.countryName} · ${formatNumber(focusedCountry.value)}`
                : ''}
            </span>
            <span className="text-[#8E96A0] shrink-0">
              {PLATFORM_META[activeBreakdown.platform].shortName}
            </span>
          </div>
        </div>
        );
      })()}
    </ExpandableSurface>
  );
};
