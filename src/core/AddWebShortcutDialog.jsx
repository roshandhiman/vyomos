import React, { useState, useEffect, useRef } from 'react';
import { Globe, X } from 'lucide-react';
import './AddWebShortcutDialog.css';

export default function AddWebShortcutDialog({ open, onConfirm, onClose }) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUrl('');
      setName('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    let target = url.trim();
    if (!target) {
      setError('Please enter a URL.');
      return;
    }
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    try {
      new URL(target);
    } catch {
      setError('Please enter a valid URL (e.g. github.com)');
      return;
    }
    const siteName = name.trim() || target.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    onConfirm(target, siteName);
  };

  return (
    <div className="add-web-dialog-overlay" onClick={onClose}>
      <div className="add-web-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="add-web-dialog-header">
          <Globe size={18} />
          <span>Add Website Shortcut</span>
          <button className="add-web-dialog-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="add-web-dialog-body">
          <label>Website URL</label>
          <input
            ref={inputRef}
            type="text"
            className="add-web-dialog-input"
            placeholder="e.g. github.com"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(''); }}
            spellCheck={false}
          />
          <label>Shortcut Name (optional)</label>
          <input
            type="text"
            className="add-web-dialog-input"
            placeholder="e.g. GitHub"
            value={name}
            onChange={(e) => setName(e.target.value)}
            spellCheck={false}
          />
          {error && <p className="add-web-dialog-error">{error}</p>}
          <div className="add-web-dialog-actions">
            <button type="button" className="add-web-dialog-btn add-web-dialog-btn--cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="add-web-dialog-btn add-web-dialog-btn--confirm">
              Add to Desktop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
