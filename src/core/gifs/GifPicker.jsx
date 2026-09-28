import React, { useMemo, useState } from 'react';
import { X, Smile } from 'lucide-react';
import './GifPicker.css';

/**
 * GifPicker — Modal that shows all GIFs from src/gifs.
 * Uses Vite import.meta.glob to auto-discover every *.gif.
 */

// Eagerly import all GIFs from src/gifs at build time
const GIF_MODULES = import.meta.glob('/src/gifs/*.gif', { eager: true, as: 'url' });

function buildGifList() {
  return Object.entries(GIF_MODULES).map(([path, url]) => {
    const filename = path.split('/').pop();
    const name = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    return { filename, name, url };
  });
}

export default function GifPicker({ open, dropX, dropY, onSelect, onClose }) {
  const gifs = useMemo(() => buildGifList(), []);
  const [search, setSearch] = useState('');
  const [hovered, setHovered] = useState(null);

  if (!open) return null;

  const filtered = search.trim()
    ? gifs.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : gifs;

  const handlePick = (gif) => {
    onSelect(gif.url, dropX, dropY);
    onClose();
    setSearch('');
  };

  return (
    <div className="gif-picker-overlay" onClick={onClose}>
      <div
        className="gif-picker-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ left: Math.min(dropX, window.innerWidth - 340), top: Math.min(dropY, window.innerHeight - 420) }}
      >
        {/* Header */}
        <div className="gif-picker-header">
          <Smile size={16} className="gif-picker-header-icon" />
          <span>Add GIF to Desktop</span>
          <button className="gif-picker-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="gif-picker-search-row">
          <input
            className="gif-picker-search"
            placeholder="Search GIFs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Grid */}
        <div className="gif-picker-grid">
          {filtered.length === 0 && (
            <div className="gif-picker-empty">No GIFs found.</div>
          )}
          {filtered.map((gif) => (
            <button
              key={gif.filename}
              className={`gif-picker-item ${hovered === gif.filename ? 'gif-picker-item--hovered' : ''}`}
              onMouseEnter={() => setHovered(gif.filename)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handlePick(gif)}
              title={gif.name}
            >
              <img src={gif.url} alt={gif.name} className="gif-picker-img" />
              <span className="gif-picker-label">{gif.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
