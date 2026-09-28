import React from 'react';
import { useWindowsStore } from './store/windows';
import Window from './Window';

export default function WindowManager() {
  const windows = useWindowsStore((state) => state.windows);
  const focusedWindowId = useWindowsStore((state) => state.focusedWindowId);

  const currentDesktop = useWindowsStore((state) => state.currentDesktop);

  return (
    <div
      className="window-manager-layer"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {windows.map((win) => (
        <div 
          key={win.id} 
          style={{ 
            pointerEvents: 'auto',
            display: win.desktop === currentDesktop ? 'block' : 'none'
          }}
        >
          <Window windowData={win} isFocused={win.id === focusedWindowId} />
        </div>
      ))}
    </div>
  );
}
