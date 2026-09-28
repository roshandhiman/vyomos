import React, { useRef, useState, useCallback, useEffect } from 'react';
import useGifsStore from '../store/gifs';
import './DesktopGif.css';

/**
 * DesktopGif — a single GIF pinned to the desktop.
 * - Drag anywhere to reposition
 * - Drag the resize handle (bottom-right corner) to resize
 * - Right-click to remove
 * - Click brings it to front
 */
export default function DesktopGif({ gif }) {
  const updateGif = useGifsStore((s) => s.updateGif);
  const removeGif = useGifsStore((s) => s.removeGif);
  const bringToFront = useGifsStore((s) => s.bringToFront);

  const [contextMenu, setContextMenu] = useState(null);

  // ── Drag ─────────────────────────────────────────────────────────────────
  const dragState = useRef(null);

  const onDragMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      bringToFront(gif.id);
      dragState.current = {
        type: 'drag',
        startX: e.clientX,
        startY: e.clientY,
        origX: gif.x,
        origY: gif.y,
      };

      const onMove = (me) => {
        if (!dragState.current) return;
        const dx = me.clientX - dragState.current.startX;
        const dy = me.clientY - dragState.current.startY;
        updateGif(gif.id, {
          x: Math.max(0, dragState.current.origX + dx),
          y: Math.max(0, dragState.current.origY + dy),
        });
      };

      const onUp = () => {
        dragState.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [gif.id, gif.x, gif.y, updateGif, bringToFront]
  );

  // ── Resize ───────────────────────────────────────────────────────────────
  const onResizeMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      bringToFront(gif.id);
      const startX = e.clientX;
      const startY = e.clientY;
      const origW = gif.width;
      const origH = gif.height;

      const onMove = (me) => {
        const w = Math.max(80, origW + (me.clientX - startX));
        const h = Math.max(60, origH + (me.clientY - startY));
        updateGif(gif.id, { width: w, height: h });
      };

      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [gif.id, gif.width, gif.height, updateGif, bringToFront]
  );

  // ── Context Menu ─────────────────────────────────────────────────────────
  const handleContextMenu = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY });
    },
    []
  );

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [contextMenu]);

  return (
    <>
      <div
        className="desktop-gif"
        style={{
          left: gif.x,
          top: gif.y,
          width: gif.width,
          height: gif.height,
          // Always clamp to max 20 — GIFs must stay behind icons, widgets & windows
          // even if old localStorage data has a high value.
          zIndex: Math.min(gif.zIndex ?? 5, 20),
        }}
        onMouseDown={onDragMouseDown}
        onContextMenu={handleContextMenu}
        onClick={() => bringToFront(gif.id)}
      >
        {/* The GIF */}
        <img
          src={gif.src}
          alt="desktop gif"
          className="desktop-gif-img"
          draggable={false}
        />

        {/* Resize handle — bottom-right corner */}
        <div
          className="desktop-gif-resize"
          onMouseDown={onResizeMouseDown}
          title="Drag to resize"
        />
      </div>

      {/* Mini context menu */}
      {contextMenu && (
        <div
          className="desktop-gif-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            className="desktop-gif-menu-item desktop-gif-menu-item--danger"
            onClick={() => { removeGif(gif.id); setContextMenu(null); }}
          >
            🗑 Remove GIF
          </button>
        </div>
      )}
    </>
  );
}
