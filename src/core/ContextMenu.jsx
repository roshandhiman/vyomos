import React, { useEffect, useRef } from 'react';
import './ContextMenu.css';

export default function ContextMenu({ menu, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!menu) return null;

  const { x, y, items } = menu;

  // Clamp within viewport
  const menuWidth = 180;
  const menuHeight = items.length * 34 + 10;
  const clampedX = Math.min(x, window.innerWidth - menuWidth - 8);
  const clampedY = Math.min(y, window.innerHeight - menuHeight - 8);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: clampedX, top: clampedY }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={index} className="context-menu-separator" />;
        }
        const ItemIcon = item.icon;
        return (
          <button
            key={index}
            className={`context-menu-item ${item.danger ? 'context-menu-item--danger' : ''}`}
            onClick={() => {
              item.action();
              onClose();
            }}
          >
            {ItemIcon && <ItemIcon size={14} color={item.danger ? '#EF4444' : 'var(--accent-primary)'} />}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
