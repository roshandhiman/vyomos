import React, { useState, useRef } from 'react';
import {
  RotateCw,
  Home,
  Search,
  ExternalLink,
  Plus,
  X,
  Globe,
  Lock,
  Bookmark,
  ArrowRight,
} from 'lucide-react';
import './BrowserApp.css';

const BOOKMARKS = [
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'Google', url: 'https://www.google.com' },
  { name: 'YouTube', url: 'https://www.youtube.com' },
  { name: 'Wikipedia', url: 'https://en.wikipedia.org' },
  { name: 'Dev.to', url: 'https://dev.to' },
  { name: 'MDN', url: 'https://developer.mozilla.org' },
];

const HOME_URL = 'https://www.google.com';

const toProxyUrl = (raw) => {
  let target = raw.trim();
  if (!target) return toProxyUrl(HOME_URL);
  if (!target.startsWith('http://') && !target.startsWith('https://')) {
    if (target.includes('.') && !target.includes(' ')) {
      target = `https://${target}`;
    } else {
      target = `https://www.google.com/search?q=${encodeURIComponent(target)}`;
    }
  }
  return `/proxy?url=${encodeURIComponent(target)}`;
};

const extractOriginalUrl = (proxyUrl) => {
  try {
    const params = new URLSearchParams(proxyUrl.replace(/^.*\?/, ''));
    return params.get('url') || proxyUrl;
  } catch {
    return proxyUrl;
  }
};

let tabIdCounter = 2;

export default function BrowserApp({ initialUrl }) {
  const startProxy = toProxyUrl(initialUrl || HOME_URL);
  const startDisplay = initialUrl || HOME_URL;

  const [tabs, setTabs] = useState([
    { id: 1, title: 'New Tab', url: startProxy, display: startDisplay },
  ]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [addressInput, setAddressInput] = useState(startDisplay);
  const [iframeKey, setIframeKey] = useState(1);
  const [loading, setLoading] = useState(true);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const navigateTo = (inputVal) => {
    const display = inputVal.trim();
    const proxyUrl = toProxyUrl(display);

    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              url: proxyUrl,
              display,
              title: display.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || 'Web Page',
            }
          : t
      )
    );
    setAddressInput(display);
    setLoading(true);
    setIframeKey((k) => k + 1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') navigateTo(addressInput);
  };

  const handleNewTab = () => {
    const id = tabIdCounter++;
    setTabs([...tabs, { id, title: 'New Tab', url: toProxyUrl(HOME_URL), display: HOME_URL }]);
    setActiveTabId(id);
    setAddressInput(HOME_URL);
    setLoading(true);
    setIframeKey((k) => k + 1);
  };

  const handleCloseTab = (e, tabId) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const filtered = tabs.filter((t) => t.id !== tabId);
    setTabs(filtered);
    if (activeTabId === tabId) {
      const last = filtered[filtered.length - 1];
      setActiveTabId(last.id);
      setAddressInput(last.display);
    }
  };

  const handleSelectTab = (tab) => {
    setActiveTabId(tab.id);
    setAddressInput(tab.display);
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
            <Globe size={12} color="var(--accent-primary)" />
            <span className="browser-tab-title">{t.title}</span>
            {tabs.length > 1 && (
              <button className="browser-tab-close" onClick={(e) => handleCloseTab(e, t.id)}>
                <X size={10} />
              </button>
            )}
          </div>
        ))}
        <button className="browser-new-tab-btn" onClick={handleNewTab} title="New Tab">
          <Plus size={13} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="browser-toolbar">
        <div className="browser-nav-btns">
          <button
            className="browser-tool-btn"
            onClick={() => { setLoading(true); setIframeKey((k) => k + 1); }}
            title="Reload"
          >
            <RotateCw size={13} />
          </button>
          <button
            className="browser-tool-btn"
            onClick={() => navigateTo(HOME_URL)}
            title="Home"
          >
            <Home size={13} />
          </button>
        </div>

        <div className="browser-address-bar">
          <Lock size={11} color="#10B981" />
          <input
            type="text"
            className="browser-address-input"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search Google or enter address..."
            onFocus={(e) => e.target.select()}
          />
          <button className="browser-tool-btn" onClick={() => navigateTo(addressInput)}>
            <ArrowRight size={13} />
          </button>
        </div>

        <a
          href={activeTab.display}
          target="_blank"
          rel="noopener noreferrer"
          className="browser-tool-btn"
          title="Open in real browser tab"
        >
          <ExternalLink size={13} />
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
            <Bookmark size={10} color="var(--accent-primary)" />
            <span>{b.name}</span>
          </button>
        ))}
      </div>

      {/* Viewport */}
      <div className="browser-viewport">
        {loading && (
          <div className="browser-loading-bar">
            <div className="browser-loading-progress" />
          </div>
        )}
        <iframe
          key={iframeKey}
          src={activeTab.url}
          title={activeTab.title}
          className="browser-iframe"
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
      </div>
    </div>
  );
}
