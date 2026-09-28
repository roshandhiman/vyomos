import React, { useState, useRef, useCallback, useEffect } from 'react';
import './DesktopSelection.css';

/**
 * DesktopSelection
 *
 * Renders the macOS-style rubber-band / marquee selection box when the user
 * clicks and drags on the empty desktop surface.
 *
 * Props:
 *   containerRef  – ref to the element to attach the drag listeners to
 *   onSelect      – callback({ x, y, w, h }) called every frame with the current rect
 *   onClear       – callback() called when the selection ends
 *   disabled      – skip rendering (e.g., when a window is focused)
 */
export default function DesktopSelection({ containerRef, onSelect, onClear, disabled }) {
  const [rect, setRect] = useState(null); // { x, y, w, h } in viewport px
  const dragRef = useRef(null);           // { startX, startY }
  const rafRef = useRef(null);

  const handleMouseDown = useCallback(
    (e) => {
      // Only left button on the bare surface (not on icons / windows)
      if (e.button !== 0) return;
      if (disabled) return;

      // If the click target is not the container itself or the click-surface, abort.
      // We check a data attribute so DesktopIcons icons can stop propagation.
      if (!e.target.closest('[data-desktop-surface]')) return;

      e.preventDefault();

      dragRef.current = { startX: e.clientX, startY: e.clientY };

      const onMove = (me) => {
        if (!dragRef.current) return;
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          const { startX, startY } = dragRef.current;
          const x = Math.min(startX, me.clientX);
          const y = Math.min(startY, me.clientY);
          const w = Math.abs(me.clientX - startX);
          const h = Math.abs(me.clientY - startY);
          const nextRect = { x, y, w, h };
          setRect(nextRect);
          onSelect?.(nextRect);
        });
      };

      const onUp = () => {
        cancelAnimationFrame(rafRef.current);
        dragRef.current = null;
        setRect(null);
        onClear?.();
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [disabled, onSelect, onClear]
  );

  // Attach to the container
  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;
    el.addEventListener('mousedown', handleMouseDown);
    return () => el.removeEventListener('mousedown', handleMouseDown);
  }, [containerRef, handleMouseDown]);

  if (!rect || rect.w < 4 || rect.h < 4) return null;

  return (
    <div
      className="desktop-selection-rect"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
      }}
    />
  );
}

/**
 * Helper: checks if a desktop icon rect intersects the selection rect.
 * Both rects are in viewport coordinates.
 */
export function iconIntersectsSelection(iconEl, selRect) {
  if (!iconEl || !selRect) return false;
  const ir = iconEl.getBoundingClientRect();
  return !(
    ir.right < selRect.x ||
    ir.left > selRect.x + selRect.w ||
    ir.bottom < selRect.y ||
    ir.top > selRect.y + selRect.h
  );
}
