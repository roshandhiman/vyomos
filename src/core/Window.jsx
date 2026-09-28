import React, { useRef, Suspense, useCallback } from 'react';
import { X, Minus, Square } from 'lucide-react';
import { useWindowsStore } from './store/windows';
import { getAppManifest } from './apps/registry';
import './Window.css';

const MIN_WIDTH = 360;
const MIN_HEIGHT = 240;
const TOPBAR_HEIGHT = 30;
const DOCK_RESERVE_HEIGHT = 76;

export default function Window({ windowData, isFocused }) {
  const {
    id,
    appId,
    title,
    x,
    y,
    w,
    h,
    minimized,
    maximized,
    z,
    props = {},
  } = windowData;

  const closeWindow = useWindowsStore((state) => state.closeWindow);
  const minimizeWindow = useWindowsStore((state) => state.minimizeWindow);
  const toggleMaximize = useWindowsStore((state) => state.toggleMaximize);
  const focusWindow = useWindowsStore((state) => state.focusWindow);
  const updateWindowBounds = useWindowsStore((state) => state.updateWindowBounds);

  const windowRef = useRef(null);
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    initX: x,
    initY: y,
    currentX: x,
    currentY: y,
    active: false,
  });

  const resizeRef = useRef({
    dir: '',
    startX: 0,
    startY: 0,
    initX: x,
    initY: y,
    initW: w,
    initH: h,
    currentX: x,
    currentY: y,
    currentW: w,
    currentH: h,
    active: false,
  });

  const manifest = getAppManifest(appId);
  const AppIcon = manifest?.icon;
  const AppComponent = manifest?.component;

  // Handle Dragging
  const handleTitleBarPointerDown = (e) => {
    // Only left click and not on window control buttons
    if (e.button !== 0) return;
    if (e.target.closest('.window-controls')) return;

    focusWindow(id);
    if (maximized) return; // Do not drag while maximized

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: x,
      initY: y,
      currentX: x,
      currentY: y,
      active: true,
    };
  };

  const handleTitleBarPointerMove = (e) => {
    if (!dragRef.current.active) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // Boundary constraints: keep at least 100px of titlebar in viewport, y >= TOPBAR_HEIGHT
    const rawX = dragRef.current.initX + dx;
    const rawY = dragRef.current.initY + dy;

    const clampedX = Math.max(-w + 100, Math.min(viewportW - 100, rawX));
    const clampedY = Math.max(TOPBAR_HEIGHT, Math.min(viewportH - 40, rawY));

    dragRef.current.currentX = clampedX;
    dragRef.current.currentY = clampedY;

    if (windowRef.current) {
      windowRef.current.style.transform = `translate3d(${clampedX - x}px, ${clampedY - y}px, 0)`;
    }
  };

  const handleTitleBarPointerUp = (e) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }

    if (windowRef.current) {
      windowRef.current.style.transform = '';
    }

    updateWindowBounds(id, {
      x: dragRef.current.currentX,
      y: dragRef.current.currentY,
    });
  };

  // Handle Resizing
  const handleResizePointerDown = (e, dir) => {
    if (e.button !== 0 || maximized) return;
    e.stopPropagation();
    focusWindow(id);

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    resizeRef.current = {
      dir,
      startX: e.clientX,
      startY: e.clientY,
      initX: x,
      initY: y,
      initW: w,
      initH: h,
      currentX: x,
      currentY: y,
      currentW: w,
      currentH: h,
      active: true,
    };
  };

  const handleResizePointerMove = (e) => {
    if (!resizeRef.current.active) return;

    const { dir, startX, startY, initX, initY, initW, initH } = resizeRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newW = initW;
    let newH = initH;
    let newX = initX;
    let newY = initY;

    if (dir.includes('e')) newW = Math.max(MIN_WIDTH, initW + dx);
    if (dir.includes('s')) newH = Math.max(MIN_HEIGHT, initH + dy);

    if (dir.includes('w')) {
      const calculatedW = initW - dx;
      if (calculatedW >= MIN_WIDTH) {
        newW = calculatedW;
        newX = initX + dx;
      } else {
        newW = MIN_WIDTH;
        newX = initX + (initW - MIN_WIDTH);
      }
    }

    if (dir.includes('n')) {
      const calculatedH = initH - dy;
      const targetY = initY + dy;
      if (calculatedH >= MIN_HEIGHT && targetY >= TOPBAR_HEIGHT) {
        newH = calculatedH;
        newY = targetY;
      } else {
        newH = Math.max(MIN_HEIGHT, initH - (TOPBAR_HEIGHT - initY));
        newY = Math.max(TOPBAR_HEIGHT, initY + (initH - MIN_HEIGHT));
      }
    }

    resizeRef.current.currentW = newW;
    resizeRef.current.currentH = newH;
    resizeRef.current.currentX = newX;
    resizeRef.current.currentY = newY;

    if (windowRef.current) {
      windowRef.current.style.width = `${newW}px`;
      windowRef.current.style.height = `${newH}px`;
      if (newX !== x || newY !== y) {
        windowRef.current.style.transform = `translate3d(${newX - x}px, ${newY - y}px, 0)`;
      }
    }
  };

  const handleResizePointerUp = (e) => {
    if (!resizeRef.current.active) return;
    resizeRef.current.active = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }

    if (windowRef.current) {
      windowRef.current.style.transform = '';
    }

    updateWindowBounds(id, {
      x: resizeRef.current.currentX,
      y: resizeRef.current.currentY,
      w: resizeRef.current.currentW,
      h: resizeRef.current.currentH,
    });
  };

  // Window positioning style
  const windowStyle = maximized
    ? {
        left: 0,
        top: TOPBAR_HEIGHT,
        width: '100vw',
        height: `calc(100vh - ${TOPBAR_HEIGHT}px - ${DOCK_RESERVE_HEIGHT}px)`,
        zIndex: z,
      }
    : {
        left: x,
        top: y,
        width: w,
        height: h,
        zIndex: z,
      };

  return (
    <div
      ref={windowRef}
      className={`window-frame ${isFocused ? 'window-frame--focused' : ''} ${
        minimized ? 'window-frame--minimized' : ''
      } ${maximized ? 'window-frame--maximized' : ''}`}
      style={windowStyle}
      onPointerDown={() => focusWindow(id)}
    >
      {/* Title Bar */}
      <div
        className="window-titlebar"
        onPointerDown={handleTitleBarPointerDown}
        onPointerMove={handleTitleBarPointerMove}
        onPointerUp={handleTitleBarPointerUp}
        onDoubleClick={() => toggleMaximize(id)}
      >
        <div className="window-titlebar-left">
          {/* macOS-style control buttons */}
          <div className="window-controls">
            <button
              className="window-ctrl-btn window-ctrl-close"
              onClick={(e) => {
                e.stopPropagation();
                closeWindow(id);
              }}
              aria-label="Close"
            >
              <X size={8} color="#450A0A" strokeWidth={3} />
            </button>
            <button
              className="window-ctrl-btn window-ctrl-minimize"
              onClick={(e) => {
                e.stopPropagation();
                minimizeWindow(id);
              }}
              aria-label="Minimize"
            >
              <Minus size={8} color="#78350F" strokeWidth={3} />
            </button>
            <button
              className="window-ctrl-btn window-ctrl-maximize"
              onClick={(e) => {
                e.stopPropagation();
                toggleMaximize(id);
              }}
              aria-label="Maximize"
            >
              <Square size={6} color="#064E3B" strokeWidth={3} />
            </button>
          </div>

          <div className="window-titlebar-title">
            {AppIcon && (
              <span className="window-titlebar-icon">
                <AppIcon size={14} />
              </span>
            )}
            <span>{title}</span>
          </div>
        </div>
      </div>

      {/* Window Content */}
      <div className="window-content">
        <Suspense
          fallback={
            <div className="window-loading-skeleton">
              <div className="skeleton-spinner" />
              <span>Loading {title}...</span>
            </div>
          }
        >
          {AppComponent ? (
            <AppComponent appId={appId} title={title} {...props} />
          ) : (
            <div style={{ padding: '2rem' }}>App not found</div>
          )}
        </Suspense>
      </div>

      {/* Resize Handles (disabled when maximized) */}
      {!maximized && (
        <>
          {['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map((dir) => (
            <div
              key={dir}
              className={`resize-handle resize-${dir}`}
              onPointerDown={(e) => handleResizePointerDown(e, dir)}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
            />
          ))}
        </>
      )}
    </div>
  );
}
