import React, { useState, useRef, useCallback, useEffect } from 'react';
import './Dock.css';

/**
 * MacOS-authentic Dock magnification.
 *
 * Key insight: macOS measures distance to the *fixed* icon center (as if no magnification),
 * then applies a gaussian / cosine curve. The icons expand *in place* — they do NOT push
 * neighbors by re-computing positions on every frame. Instead the outer pill just grows.
 *
 * This means each icon is absolutely positioned at its natural slot, then scaled with
 * `transform: scale()` from the correct origin. Neighbors get slightly scaled too via the
 * falloff curve. The total dock width is recomputed from the accumulated scaled widths.
 */
export default function Dock({
  items = [],
  className = '',
  baseItemSize = 52,
  magnification = 72,
  position = 'bottom',
  autoHide = false,
  showIndicators = true,
  dockStyle = 'glass',
  onContextMenu,
}) {
  const isVertical = position === 'left' || position === 'right';
  const dockRef = useRef(null);
  const rafRef = useRef(null);
  const iconRefs = useRef([]);

  // Use a ref for mouseCoord so the single rAF loop always reads latest value
  const mouseCoordRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  // renderScales drives the JSX
  const scalesRef = useRef(items.map(() => 1));
  const [renderScales, setRenderScales] = useState(() => items.map(() => 1));
  const [isNearEdge, setIsNearEdge] = useState(!autoHide);
  const hideTimerRef = useRef(null);
  // Track whether a hover tooltip should show
  const [mouseVisible, setMouseVisible] = useState(false);

  const gap = Math.max(6, Math.round(baseItemSize * 0.12));
  const maxScale = magnification > baseItemSize ? magnification / baseItemSize : 1.0;

  // Keep ref in sync with items length
  useEffect(() => {
    const ones = items.map(() => 1);
    scalesRef.current = ones;
    setRenderScales(ones);
  }, [items.length]);

  // Compute target scales from current mouseCoord ref value
  const computeTargetScales = useCallback(
    (coord) => {
      if (coord === null || maxScale <= 1.0) return items.map(() => 1);
      const spread = baseItemSize * 2.5;
      return items.map((_, i) => {
        const naturalCenter = i * (baseItemSize + gap) + baseItemSize / 2;
        const dist = Math.abs(naturalCenter - coord);
        if (dist >= spread) return 1;
        const t = (Math.cos((dist / spread) * Math.PI) + 1) / 2;
        return 1 + t * (maxScale - 1);
      });
    },
    [items, baseItemSize, gap, maxScale]
  );

  // Single persistent rAF loop — reads mouseCoordRef so it never has stale closure
  useEffect(() => {
    let alive = true;
    const loop = () => {
      if (!alive) return;
      const targets = computeTargetScales(mouseCoordRef.current);
      let needsMore = false;
      const next = scalesRef.current.map((cur, i) => {
        const target = targets[i] ?? 1;
        const diff = target - cur;
        // Snap when close enough
        if (Math.abs(diff) < 0.0008) {
          if (target !== 1) needsMore = true; // still decaying toward 1
          return target;
        }
        needsMore = true;
        return cur + diff * 0.28;
      });
      scalesRef.current = next;
      // Always update render scales when animating
      const isHovering = mouseCoordRef.current !== null;
      const settled = !needsMore;
      setRenderScales([...next]);
      if (isHovering || !settled) {
        rafRef.current = requestAnimationFrame(loop);
      }
      // If settled and not hovering: loop stops; mouse-enter will restart it
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
    };
  // Only re-create loop when the scale formula changes (items, sizes)
  // NOT on every mouseCoord change — that's the whole point of the ref
  }, [computeTargetScales]);

  // Helper to (re)start the rAF loop after mouse-enter
  const ensureLoopRunning = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const loop = () => {
      const targets = computeTargetScales(mouseCoordRef.current);
      let needsMore = false;
      const next = scalesRef.current.map((cur, i) => {
        const target = targets[i] ?? 1;
        const diff = target - cur;
        if (Math.abs(diff) < 0.0008) return target;
        needsMore = true;
        return cur + diff * 0.28;
      });
      scalesRef.current = next;
      setRenderScales([...next]);
      const isHovering = mouseCoordRef.current !== null;
      if (isHovering || needsMore) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [computeTargetScales]);

  // Mouse tracking
  const handleMouseMove = useCallback(
    (e) => {
      if (!dockRef.current) return;
      const rect = dockRef.current.getBoundingClientRect();
      const padding = Math.max(8, Math.round(baseItemSize * 0.14));
      mouseCoordRef.current = isVertical
        ? e.clientY - rect.top - padding
        : e.clientX - rect.left - padding;
      ensureLoopRunning();
    },
    [baseItemSize, isVertical, ensureLoopRunning]
  );

  const handleMouseLeave = useCallback(() => {
    mouseCoordRef.current = null;
    setHoveredIndex(null);
    setMouseVisible(false);
    ensureLoopRunning(); // keep running so scales decay back to 1
    if (autoHide) {
      hideTimerRef.current = setTimeout(() => setIsNearEdge(false), 400);
    }
  }, [autoHide, ensureLoopRunning]);

  const handleMouseEnter = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    setIsNearEdge(true);
    setMouseVisible(true);
  }, []);

  // Auto-hide edge detection
  useEffect(() => {
    if (!autoHide) { setIsNearEdge(true); return; }
    const onMove = (e) => {
      const t = 18;
      const near =
        position === 'bottom' ? e.clientY >= window.innerHeight - t :
        position === 'left'   ? e.clientX <= t :
        /* right */             e.clientX >= window.innerWidth - t;
      if (near) { clearTimeout(hideTimerRef.current); setIsNearEdge(true); }
    };
    window.addEventListener('mousemove', onMove);
    return () => { window.removeEventListener('mousemove', onMove); clearTimeout(hideTimerRef.current); };
  }, [autoHide, position]);

  // Click bounce
  const handleAppClick = (item, index) => {
    const el = iconRefs.current[index];
    if (el) {
      el.classList.remove('dock-icon--bouncing');
      void el.offsetWidth;
      el.classList.add('dock-icon--bouncing');
      setTimeout(() => el.classList.remove('dock-icon--bouncing'), 450);
    }
    item.onClick?.();
  };

  // Layout
  const padding = Math.max(8, Math.round(baseItemSize * 0.14));
  const isHidden = autoHide && !isNearEdge;

  // Compute total dock length so the pill auto-sizes
  const totalContentLength = renderScales.reduce(
    (sum, s, i) => sum + baseItemSize * s + (i < items.length - 1 ? gap : 0),
    0
  );

  return (
    <div className={`dock-wrapper dock-wrapper--${position} ${isHidden ? 'dock-wrapper--hidden' : ''}`}>
      <div className="dock-outer">
        <div
          ref={dockRef}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onContextMenu={onContextMenu}
          className={`dock-shelf dock-shelf--${position} dock-shelf--${dockStyle} ${className}`}
          style={{
            '--dock-padding': `${padding}px`,
            borderRadius: `${Math.max(14, baseItemSize * 0.38)}px`,
            padding: `${padding}px`,
            // Grow the pill to contain scaled icons
            ...(isVertical
              ? { width: `${baseItemSize * Math.max(...renderScales) + padding * 2}px`, height: `${totalContentLength + padding * 2}px` }
              : { height: `${baseItemSize * Math.max(...renderScales) + padding * 2}px`, width: `${totalContentLength + padding * 2}px` }),
          }}
          role="toolbar"
          aria-label="Application dock"
        >
          <div
            className="dock-stage"
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: isVertical ? 'column' : 'row',
              alignItems: isVertical ? 'flex-start' : 'flex-end',
              gap: `${gap}px`,
              width: isVertical ? `${baseItemSize}px` : '100%',
              height: isVertical ? '100%' : `${baseItemSize}px`,
            }}
          >
            {items.map((item, index) => {
              const scale = renderScales[index] ?? 1;
              const scaledSize = Math.round(baseItemSize * scale);
              const isHovered = hoveredIndex === index;

              return (
                <div
                  key={item.id || index}
                  ref={(el) => { iconRefs.current[index] = el; }}
                  className="dock-item-mac"
                  style={{
                    width: `${scaledSize}px`,
                    height: `${scaledSize}px`,
                    flexShrink: 0,
                    position: 'relative',
                    zIndex: Math.round(scale * 10),
                    transition: 'none',
                  }}
                  title={item.label}
                  onClick={() => handleAppClick(item, index)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div
                    className="dock-icon-mac"
                    style={{ width: `${scaledSize}px`, height: `${scaledSize}px` }}
                  >
                    {React.isValidElement(item.icon)
                      ? React.cloneElement(item.icon, { size: Math.round(scaledSize * 0.82) })
                      : item.icon}
                  </div>

                  {/* Tooltip */}
                  {isHovered && mouseVisible && (
                    <div className={`dock-tooltip dock-tooltip--${position}`}>{item.label}</div>
                  )}

                  {/* Running indicator */}
                  {showIndicators && item.running && (
                    <div className={`dock-dot dock-dot--${position} ${item.active ? 'dock-dot--active' : ''}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
