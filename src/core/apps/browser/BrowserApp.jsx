import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Search,
  ExternalLink,
  Plus,
  X,
  Globe,
  Lock,
  Bookmark,
} from 'lucide-react';
import './BrowserApp.css';

const BOOKMARKS = [
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com' },
  { name: 'Wikipedia', url: 'https://en.wikipedia.org' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com' },
  { name: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
  { name: 'Dev.to', url: 'https://dev.to' },
];

const DEFAULT_URL = 'https://duckduckgo.com';

export default function BrowserApp() {
  const [tabs, setTabs] = useState([
    { id: 1, title: 'DuckDuckGo', url: DEFAULT_URL },
  ]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [addressInput, setAddressInput] = useState(DEFAULT_URL);
  const [iframeKey, setIframeKey] = useState(1);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const navigateTo = (inputVal) => {
    let target = inputVal.trim();
    if (!target) return;

    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      if (target.includes('.') && !target.includes(' ')) {
        target = `https://${target}`;
      } else {
        // Search query
        target = `https://duckduckgo.com/?q=${encodeURIComponent(target)}`;
      }
    }

    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              url: target,
              title: target.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || 'Web Page',
            }
          : t
      )
    );
    setAddressInput(target);
    setIframeKey((k) => k + 1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      navigateTo(addressInput);
    }
  };

  const handleNewTab = () => {
    const newId = Date.now();
    const newTab = { id: newId, title: 'New Tab', url: DEFAULT_URL };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    setAddressInput(DEFAULT_URL);
  };

  const handleCloseTab = (e, tabId) => {
    e.stopPropagation();
    if (tabs.length === 1) return; // Keep at least one tab
    const filtered = tabs.filter((t) => t.id !== tabId);
    setTabs(filtered);
    if (activeTabId === tabId) {
      setActiveTabId(filtered[0].id);
      setAddressInput(filtered[0].url);
    }
  };

  const handleSelectTab = (tab) => {
    setActiveTabId(tab.id);
    setAddressInput(tab.url);
  };

  return (
    <div className="browser-app">
      {/* Tabs */}
      <div className="browser-tabs-bar">
        {tabs.map((t) => (
          <div
            key={t.id}
            className={`browser-tab ${t.id === activeTabId ? 'browser-tab--active' : ''}`}
            onClick={() => handleSelectTab(t)}
          >
            <Globe size={13} color="var(--accent-primary)" />
            <span className="browser-tab-title">{t.title}</span>
            {tabs.length > 1 && (
              <button
                className="browser-tab-close"
                onClick={(e) => handleCloseTab(e, t.id)}
                title="Close Tab"
              >
                <X size={11} />
              </button>
            )}
          </div>
        ))}
        <button
          className="browser-new-tab-btn"
          onClick={handleNewTab}
          title="New Tab"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Main Toolbar */}
      <div className="browser-toolbar">
        <div className="browser-nav-btns">
          <button
            className="browser-tool-btn"
            onClick={() => setIframeKey((k) => k + 1)}
            title="Reload"
          >
            <RotateCw size={14} />
          </button>
          <button
            className="browser-tool-btn"
            onClick={() => navigateTo(DEFAULT_URL)}
            title="Home"
          >
            <Home size={14} />
          </button>
        </div>

        {/* Address & Search Bar */}
        <div className="browser-address-bar">
          <Lock size={12} color="#10B981" />
          <input
            type="text"
            className="browser-address-input"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search with DuckDuckGo or enter web address..."
          />
          <button
            className="browser-tool-btn"
            style={{ width: 22, height: 22 }}
            onClick={() => navigateTo(addressInput)}
          >
            <Search size={13} />
          </button>
        </div>

        <a
          href={activeTab.url}
          target="_blank"
          rel="noopener noreferrer"
          className="browser-tool-btn"
          title="Open in Native Browser Tab"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Bookmarks Bar */}
      <div className="browser-bookmarks-bar">
        {BOOKMARKS.map((b) => (
          <button
            key={b.name}
            className="browser-bookmark-item"
            onClick={() => navigateTo(b.url)}
          >
            <Bookmark size={11} color="var(--accent-primary)" />
            <span>{b.name}</span>
          </button>
        ))}
      </div>

      {/* Viewport */}
      <div className="browser-viewport">
        <iframe
          key={iframeKey}
          src={activeTab.url}
          title={activeTab.title}
          className="browser-iframe"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          allow="camera 'none'; microphone 'none'; geolocation 'none'"
        />

        {/* Helpful frame tip */}
        <div className="browser-frame-notice">
          <span>Viewing within Vyom OS</span>
          <span>·</span>
          <a href={activeTab.url} target="_blank" rel="noopener noreferrer">
            Open in new window ↗
          </a>
        </div>
      </div>
    </div>
  );
}
