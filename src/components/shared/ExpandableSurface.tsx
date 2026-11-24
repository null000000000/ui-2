import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Pin, PinOff } from 'lucide-react';

interface ExpandableSurfaceProps {
  children: React.ReactNode;
  expandedContent: React.ReactNode;
  className?: string;
  pinnedByDefault?: boolean;
  scaleOnHover?: number;
  ariaLabel?: string;
  /**
   * 'inline' expands smoothly in document flow (best for stacked sections and list rows).
   * 'overlay' preserves exact resting grid height and floats smoothly over neighbors (best for compact grid tiles so nothing below jumps).
   */
  mode?: 'inline' | 'overlay';
  /** Direction for overlay expansion ('down' from top edge, or 'up' from bottom edge for bottom-row strips). */
  expandDirection?: 'down' | 'up';
  /** Deliberate hover-intent delay in ms so casual scrolling or cursor traversal never triggers distractions. */
  openDelayMs?: number;
  /** Gentle leave grace delay in ms so minor pointer jitter doesn't immediately close an opened card. */
  closeDelayMs?: number;
  /** Optical pin button alignment: 'panel' for p-5 cards (top-4 right-4), 'compact' for p-3.5/p-4 cards (top-3 right-3). */
  pinOffset?: 'panel' | 'compact';
  /** Stretch surface to fill equal-height grid rows with zero dead space. */
  fullHeight?: boolean;
}

const CALM_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Track global page scrolling so hover expansion never triggers while the user is actively browsing/scrolling.
let lastGlobalScrollAt = 0;
let scrollListenerAttached = false;

function ensureGlobalScrollTracker() {
  if (scrollListenerAttached || typeof window === 'undefined') return;
  scrollListenerAttached = true;
  window.addEventListener(
    'scroll',
    () => {
      lastGlobalScrollAt = Date.now();
    },
    { passive: true }
  );
}

/**
 * Calm, deliberate AXIOM surface: stays minimal at rest, ignores casual scrolling or passing cursors,
 * gently scales and reveals deeper telemetry only after intentional hover dwell (~0.78s),
 * and pins immediately on click.
 */
export const ExpandableSurface: React.FC<ExpandableSurfaceProps> = ({
  children,
  expandedContent,
  className = '',
  pinnedByDefault = false,
  scaleOnHover = 1.015,
  ariaLabel,
  mode = 'inline',
  expandDirection = 'down',
  openDelayMs = 700,
  closeDelayMs = 260,
  pinOffset = 'panel',
  fullHeight = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(pinnedByDefault);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const isOpen = isHovered || isPinned;

  const clearTimers = () => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  useEffect(() => {
    ensureGlobalScrollTracker();
    // Cancel pending hover-open immediately whenever the user starts scrolling
    const cancelPendingOnScroll = () => {
      if (openTimerRef.current !== null) {
        window.clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
      }
    };
    window.addEventListener('scroll', cancelPendingOnScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', cancelPendingOnScroll);
      clearTimers();
    };
  }, []);

  const scheduleHoverOpen = () => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
    }
    const msSinceScroll = Date.now() - lastGlobalScrollAt;
    // If user just scrolled, wait a little longer so scrolling never feels jittery
    const effectiveDelay = msSinceScroll < 450 ? openDelayMs + 350 : openDelayMs;

    openTimerRef.current = window.setTimeout(() => {
      // Double-check the user didn't scroll during the dwell period
      if (Date.now() - lastGlobalScrollAt < 400) {
        openTimerRef.current = null;
        return;
      }
      setIsHovered(true);
      openTimerRef.current = null;
    }, effectiveDelay);
  };

  const handleMouseEnter = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (isHovered || isPinned) {
      setIsHovered(true);
      return;
    }
    scheduleHoverOpen();
  };

  const handleMouseMove = () => {
    // If user stopped scrolling while cursor is resting on the card and no timer is running, start dwell
    if (!isHovered && !isPinned && openTimerRef.current === null) {
      const msSinceScroll = Date.now() - lastGlobalScrollAt;
      if (msSinceScroll >= 400) {
        scheduleHoverOpen();
      }
    }
  };

  const handleMouseLeave = () => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (!isHovered) return;
    closeTimerRef.current = window.setTimeout(() => {
      setIsHovered(false);
      closeTimerRef.current = null;
    }, closeDelayMs);
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, select, input, textarea, label, [data-no-pin="true"]')) {
      return;
    }
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      return;
    }
    clearTimers();
    setIsPinned((prev) => {
      const next = !prev;
      if (!next) {
        setIsHovered(false);
      }
      return next;
    });
  };

  const handlePinButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    clearTimers();
    setIsPinned((prev) => {
      const next = !prev;
      if (!next) {
        setIsHovered(false);
      }
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsPinned((prev) => !prev);
    } else if (e.key === 'Escape' && isPinned) {
      e.preventDefault();
      setIsPinned(false);
      setIsHovered(false);
    }
  };

  const surfaceBody = (
    <motion.div
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      animate={{
        scale: isOpen ? scaleOnHover : 1,
        borderColor: isPinned
          ? '#8E9192'
          : isHovered
            ? '#3F444D'
            : '#22252A',
        backgroundColor: isOpen ? '#181A1D' : '#0E1012',
      }}
      transition={{ duration: 0.62, ease: CALM_EASE }}
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      style={{
        transformOrigin: expandDirection === 'up' ? 'bottom center' : 'top center',
      }}
      className={`rounded-lg border cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FFFFFF] ${
        isPinned ? 'select-text' : 'select-none'
      } ${
        mode === 'overlay'
          ? `absolute inset-x-0 ${expandDirection === 'up' ? 'bottom-0' : 'top-0'} ${
              fullHeight ? 'min-h-full flex flex-col justify-between' : ''
            } ${
              isPinned
                ? 'z-40 shadow-[0_24px_64px_rgba(0,0,0,0.94)]'
                : isHovered
                  ? 'z-30 shadow-[0_20px_52px_rgba(0,0,0,0.88)]'
                  : 'z-0 shadow-none'
            }`
          : `relative ${fullHeight ? 'h-full flex flex-col' : ''} ${isOpen ? 'z-20' : 'z-0'}`
      } ${className}`}
    >
      {/* Optically Aligned Non-Overlapping Pin Action Button */}
      <button
        type="button"
        onClick={handlePinButtonClick}
        title={isPinned ? 'Unpin card' : 'Pin open'}
        aria-label={isPinned ? 'Unpin card' : 'Pin open'}
        className={`absolute ${
          pinOffset === 'compact' ? 'top-3 right-3' : 'top-4 right-4'
        } z-10 w-6 h-6 rounded flex items-center justify-center transition-all duration-500 cursor-pointer ${
          isPinned
            ? 'opacity-100 bg-[#FFFFFF] text-[#090A0B] hover:bg-[#F4F5F6]'
            : isHovered
              ? 'opacity-90 bg-[#26292E] text-[#A1A8B2] hover:text-[#FFFFFF] hover:bg-[#343536]'
              : 'opacity-40 sm:opacity-0 sm:pointer-events-none text-[#8E96A0]'
        }`}
      >
        {isPinned ? <PinOff className="w-3 h-3 shrink-0" /> : <Pin className="w-3 h-3 shrink-0" />}
      </button>

      {/* Resting minimal content (if expanding upward, expanded drawer appears above resting row) */}
      {expandDirection === 'up' && (
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="expanded-up"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.66, ease: CALM_EASE }}
              className="overflow-hidden"
            >
              <div className="pb-3 mb-3 border-b border-[#26292E]">
                {expandedContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <div className={fullHeight ? 'flex-1 flex flex-col' : undefined}>{children}</div>

      {/* Smoothly animated expanded details (default downward) */}
      {expandDirection === 'down' && (
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="expanded-down"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.66, ease: CALM_EASE }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3 border-t border-[#26292E]">
                {expandedContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );

  if (mode === 'overlay') {
    return (
      <div
        className={`relative ${fullHeight ? 'h-full' : ''} ${
          isPinned ? 'z-40' : isHovered ? 'z-30' : 'z-0'
        }`}
      >
        {/* Invisible structural spacer locks grid row height at exact resting size so neighbors never jump */}
        <div
          aria-hidden="true"
          className={`invisible pointer-events-none select-none rounded-lg border border-transparent ${
            fullHeight ? 'h-full' : ''
          } ${className}`}
        >
          {children}
        </div>
        {surfaceBody}
      </div>
    );
  }

  return surfaceBody;
};
