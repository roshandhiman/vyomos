import React, { useState, useRef, useCallback, useEffect } from 'react';
import './Dock.css';

/**
 * Authentic macOS Dock — Proper Flex Layout + CSS Scale Magnification
 *
 * Icons live in a regular flexbox row (no absolute positioning).
 * Each icon wrapper keeps its natural baseItemSize slot in the layout,
 * and the inner icon is scaled via CSS transform: scale() from "bottom center".
 * This means:
 *   - The pill background NEVER moves or resizes
 *   - Icons grow UPWARD from their bottom edge (authentic macOS feel)
 *   - Magnified icons render ON TOP of neighbors via z-index (no collision)
 */
export default function Dock({
  items = [],
  className = '',
  baseItemSize = 54,
  magnification = 88,
  position = 'bottom',
  autoHide = false,
  showIndicators = true,
  dockStyle = 'glass',
  onContextMenu,
  onAppDrop,
  onAppDragOut,
}) {
  const isVertical = position === 'left' || position === 'right';
  const dockRef = useRef(null);
  const animFrameRef = useRef(null);

  // Mouse coordinate relative to the dock content area
  const [mouseCoord, setMouseCoord] = useState(null);
  // Per-icon scale (animated via lerp)
  const [scales, setScales] = useState(() => items.map(() => 1));
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isVisible, setIsVisible] = useState(!autoHide);
  const hideTimerRef = useRef(null);
  const lastMoveTime = useRef(0);

  // Sync scales array length when items change
  useEffect(() => {
    setScales(prev => {
      const next = items.map((_, i) => prev[i] ?? 1);
      return next;
    });
  }, [items.length]);

  // ── Magnification config ──────────────────────────────────────────────────
  const minScale = 1.0;
  const maxScale = Math.max(1.35, magnification / baseItemSize);
  // How far (in icon-center units) the magnification wave reaches on each side
  const waveRadius = baseItemSize * 2.2;

  // Calculate target scale for each icon given current mouse coord
  const getTargetScales = useCallback(
    (coord) => {
      if (coord === null) return items.map(() => minScale);

      return items.map((_, i) => {
        // Natural center of this icon slot
        const center = i * baseItemSize + baseItemSize / 2;
        const dist = Math.abs(coord - center);

        if (dist >= waveRadius) return minScale;

        // Cosine falloff: 1 at dist=0, 0 at dist=waveRadius
        const t = (Math.cos((dist / waveRadius) * Math.PI) + 1) / 2;
        return minScale + t * (maxScale - minScale);
      });
    },
    [items, baseItemSize, waveRadius, maxScale, minScale]
  );

  // ── Animation loop (lerp toward target) ──────────────────────────────────
  const targetScalesRef = useRef(items.map(() => 1));

  useEffect(() => {
    targetScalesRef.current = getTargetScales(mouseCoord);
  }, [mouseCoord, getTargetScales]);

  const animate = useCallback(() => {
    const lerpFactor = 0.22;
    let dirty = false;

    setScales(prev => {
      const next = prev.map((cur, i) => {
        const tgt = targetScalesRef.current[i] ?? minScale;
        const diff = tgt - cur;
        if (Math.abs(diff) < 0.0008) return tgt;
        dirty = true;
        return cur + diff * lerpFactor;
      });
      return dirty ? next : prev;
    });

    animFrameRef.current = requestAnimationFrame(animate);
  }, [minScale]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [animate]);

  // ── Mouse tracking ────────────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e) => {
      const now = performance.now();
      if (now - lastMoveTime.current < 10) return;
      lastMoveTime.current = now;

      if (!dockRef.current) return;
      const rect = dockRef.current.getBoundingClientRect();

      if (isVertical) {
        setMouseCoord(e.clientY - rect.top);
      } else {
        setMouseCoord(e.clientX - rect.left);
      }
    },
    [isVertical]
  );

  const handleMouseLeave = useCallback(() => {
    setMouseCoord(null);
    setHoveredIndex(null);
    if (autoHide) {
      hideTimerRef.current = setTimeout(() => setIsVisible(false), 400);
    }
  }, [autoHide]);

  const handleMouseEnter = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    setIsVisible(true);
  }, []);

  // ── Auto-hide edge detection ──────────────────────────────────────────────
  useEffect(() => {
    if (!autoHide) {
      setIsVisible(true);
      return;
    }
    const onMove = (e) => {
      const thr = 20;
      const near =
        position === 'bottom'
          ? e.clientY >= window.innerHeight - thr
          : position === 'left'
          ? e.clientX <= thr
          : e.clientX >= window.innerWidth - thr;
      if (near) {
        clearTimeout(hideTimerRef.current);
        setIsVisible(true);
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      clearTimeout(hideTimerRef.current);
    };
  }, [autoHide, position]);

  // ── Click bounce ──────────────────────────────────────────────────────────
  const iconWrapperRefs = useRef([]);

  const handleClick = (item, index) => {
    const el = iconWrapperRefs.current[index];
    if (el) {
      el.animate(
        [
          { transform: 'translateY(0px)' },
          { transform: 'translateY(-14px)' },
          { transform: 'translateY(-3px)' },
          { transform: 'translateY(-8px)' },
          { transform: 'translateY(0px)' },
        ],
        { duration: 480, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      );
    }
    item.onClick?.();
  };

  // ── Dock sizing: fixed pill — never changes with magnification ────────────
  const padding = Math.round(baseItemSize * 0.13);
  const dockContentLength = items.length * baseItemSize;
  const pillLength = dockContentLength + padding * 2;
  const pillThickness = baseItemSize + padding * 2;

  const pillStyle = isVertical
    ? { width: `${pillThickness}px`, height: `${pillLength}px` }
    : { width: `${pillLength}px`, height: `${pillThickness}px` };

  const isHidden = autoHide && !isVisible;

  return (
    <div
      className={`dock-wrapper dock-wrapper--${position} ${isHidden ? 'dock-wrapper--hidden' : ''}`}
    >
      <div className="dock-outer">
        {/* The pill — fixed size, NEVER resizes */}
        <div
          ref={dockRef}
          className={`dock-shelf dock-shelf--${position} dock-shelf--${dockStyle} ${className}`}
          style={{
            ...pillStyle,
            borderRadius: `${Math.round(baseItemSize * 0.36)}px`,
            padding: `${padding}px`,
            overflow: 'visible',
            boxSizing: 'content-box',
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
          onContextMenu={onContextMenu}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes('application/x-devos-desktop-app')) {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }
          }}
          onDrop={(e) => {
            const appId = e.dataTransfer.getData('application/x-devos-desktop-app');
            if (appId && onAppDrop) {
              onAppDrop(appId);
            }
          }}
          role="toolbar"
          aria-label="Application dock"
        >
          {/* Flex row of slots — each slot is always baseItemSize wide */}
          <div
            className={`dock-row ${isVertical ? 'dock-row--vertical' : 'dock-row--horizontal'}`}
          >
            {items.map((item, index) => {
              const scale = scales[index] ?? 1;
              const isHov = hoveredIndex === index;
              // z-index: hovered/magnified icon floats above neighbors
              const zIndex = Math.round(scale * 40);

              const scaleTransform = isVertical
                ? `scale(${scale})`       // vertical: scale from center
                : `scale(${scale})`;      // horizontal: scale from bottom (CSS transform-origin handles it)

              return (
                <div
                  key={item.id ?? index}
                  className={`dock-slot ${isVertical ? 'dock-slot--v' : 'dock-slot--h'}`}
                  style={{
                    width: isVertical ? `${baseItemSize}px` : `${baseItemSize}px`,
                    height: isVertical ? `${baseItemSize}px` : `${baseItemSize}px`,
                    zIndex,
                    // overflow visible so magnified icon can bleed out
                    overflow: 'visible',
                  }}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/x-devos-dock-app', item.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={(e) => {
                    // If dropped outside the dock (e.g. desktop)
                    if (e.dataTransfer.dropEffect === 'move' && onAppDragOut) {
                      onAppDragOut(item.id);
                    }
                  }}
                  onClick={() => handleClick(item, index)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Inner wrapper: scaled from bottom-center, never affects layout */}
                  <div
                    ref={el => { iconWrapperRefs.current[index] = el; }}
                    className="dock-icon-inner"
                    style={{
                      transform: scaleTransform,
                      transformOrigin: isVertical
                        ? (position === 'left' ? 'center left' : 'center right')
                        : 'bottom center',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="dock-icon-mac"
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {React.isValidElement(item.icon)
                        ? React.cloneElement(item.icon, {
                            size: Math.round(baseItemSize * 0.82),
                          })
                        : item.icon}
                    </div>

                    {/* Tooltip */}
                    {isHov && mouseCoord !== null && (
                      <div
                        className={`dock-tooltip dock-tooltip--${position}`}
                        style={{
                          // Push tooltip above the magnified icon
                          ...(position === 'bottom'
                            ? { bottom: `calc(100% + 6px)`, top: 'auto' }
                            : {}),
                        }}
                      >
                        {item.label}
                      </div>
                    )}
                  </div>

                  {/* Running dot — outside the scaler so it stays at pill edge */}
                  {showIndicators && item.running && (
                    <div
                      className={`dock-dot dock-dot--${position} ${item.active ? 'dock-dot--active' : ''}`}
                    />
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
