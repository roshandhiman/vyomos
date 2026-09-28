import React, { useState, useEffect } from 'react';
import { Terminal, Maximize2, Minimize2, Cpu } from 'lucide-react';
import { useWindowsStore } from './store/windows';
import './TopBar.css';

export default function TopBar() {
  const focusedWindowId = useWindowsStore((state) => state.focusedWindowId);
  const windows = useWindowsStore((state) => state.windows);

  const focusedWindow = windows.find((w) => w.id === focusedWindowId && !w.minimized);
  const activeTitle = focusedWindow ? focusedWindow.title : 'Vyom OS';

  const [timeStr, setTimeStr] = useState('');
  const [dateTooltip, setDateTooltip] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
      setDateTooltip(
        now.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-brand">
          <span className="topbar-brand-icon">
            <Cpu size={15} />
          </span>
          <span>Vyom OS</span>
        </div>
        {focusedWindow && (
          <>
            <span className="topbar-separator">/</span>
            <span className="topbar-active-app">{activeTitle}</span>
          </>
        )}
      </div>

      <div className="topbar-right">
        <span className="topbar-clock" title={dateTooltip}>
          {timeStr}
        </span>
        <button
          className="topbar-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
      </div>
    </header>
  );
}
