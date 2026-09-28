import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { APP_REGISTRY } from '../registry';
import { useWindowsStore } from '../../store/windows';
import './Launchpad.css';

export default function Launchpad({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const openApp = useWindowsStore((state) => state.openApp);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const apps = Object.values(APP_REGISTRY).filter((app) =>
    app.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLaunch = (app) => {
    openApp(app.id, app);
    onClose();
  };

  return (
    <div className="launchpad-overlay" onClick={onClose}>
      {/* Search Header */}
      <div className="launchpad-header" onClick={(e) => e.stopPropagation()}>
        <Search size={15} color="rgba(255, 255, 255, 0.7)" />
        <input
          ref={searchInputRef}
          type="text"
          className="launchpad-search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Applications..."
        />
      </div>

      {/* Grid of Apps */}
      <div className="launchpad-grid-container" onClick={(e) => e.stopPropagation()}>
        <div className="launchpad-grid">
          {apps.map((app) => {
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                className="launchpad-app-item"
                onClick={() => handleLaunch(app)}
                title={app.title}
              >
                <Icon size={64} />
                <span className="launchpad-app-label">{app.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="launchpad-hint">Click anywhere or press Esc to exit</div>
    </div>
  );
}
