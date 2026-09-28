import React, { useState, useEffect, useRef, useCallback } from 'react';
import { vfs } from '../../store/fs';
import { useWindowsStore } from '../../store/windows';
import { APP_REGISTRY } from '../registry';
import {
  Save,
  FilePlus,
  FolderOpen,
  FileText,
  ChevronDown,
  X,
  Circle,
  Check,
  RefreshCw,
} from 'lucide-react';
import './TextEditor.css';

const TEXT_EXTENSIONS = ['txt', 'md', 'log', 'json', 'js', 'jsx', 'ts', 'tsx', 'css', 'html', 'py', 'sh', 'yaml', 'yml', 'env', 'csv'];
const DEFAULT_PATH = '/home/user/Documents';

function getExtension(name = '') {
  return name.split('.').pop()?.toLowerCase() || '';
}

function getLanguage(name = '') {
  const ext = getExtension(name);
  const map = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    json: 'json', css: 'css', html: 'html', py: 'python',
    sh: 'bash', md: 'markdown', yaml: 'yaml', yml: 'yaml',
  };
  return map[ext] || 'text';
}

// ── Syntax Highlighter (lightweight, no deps) ────────────────────────────────
function highlight(code, lang) {
  if (!code) return '';

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  if (lang === 'json') {
    return esc(code)
      .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="te-key">$1</span>:')
      .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="te-string">$1</span>')
      .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="te-number">$1</span>')
      .replace(/:\s*(true|false|null)/g, ': <span class="te-keyword">$1</span>');
  }

  if (lang === 'javascript' || lang === 'typescript') {
    return esc(code)
      .replace(/(\/\/[^\n]*)/g, '<span class="te-comment">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="te-comment">$1</span>')
      .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, '<span class="te-string">$1</span>')
      .replace(/\b(const|let|var|function|return|import|export|default|class|extends|new|if|else|for|while|do|switch|case|break|continue|typeof|instanceof|async|await|try|catch|finally|throw|from|of|in|null|undefined|true|false|this|super)\b/g, '<span class="te-keyword">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="te-number">$1</span>');
  }

  if (lang === 'markdown') {
    return esc(code)
      .replace(/^(#{1,6} .+)$/gm, '<span class="te-keyword">$1</span>')
      .replace(/(\*\*[^*]+\*\*)/g, '<span class="te-string">$1</span>')
      .replace(/(`[^`]+`)/g, '<span class="te-number">$1</span>')
      .replace(/^(\s*[-*+] .+)$/gm, '<span class="te-prop">$1</span>');
  }

  if (lang === 'css') {
    return esc(code)
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="te-comment">$1</span>')
      .replace(/([.#]?[\w-]+)\s*\{/g, '<span class="te-keyword">$1</span> {')
      .replace(/([\w-]+)\s*:/g, '<span class="te-prop">$1</span>:')
      .replace(/:\s*([^;{}\n]+)/g, ': <span class="te-string">$1</span>');
  }

  return esc(code);
}

// ── File Browser Sidebar ─────────────────────────────────────────────────────
function FileBrowser({ currentPath, onOpen, onClose }) {
  const [entries, setEntries] = useState([]);
  const [path, setPath] = useState(currentPath || DEFAULT_PATH);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p) => {
    setLoading(true);
    try {
      const items = await vfs.list(p);
      setEntries(items);
      setPath(p);
    } catch (_) {
      setEntries([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(path); }, []);

  const parentPath = path.split('/').slice(0, -1).join('/') || '/';

  return (
    <div className="te-filebrowser">
      <div className="te-filebrowser-header">
        <span className="te-filebrowser-title">Open File</span>
        <button className="te-filebrowser-close" onClick={onClose}><X size={13} /></button>
      </div>
      <div className="te-filebrowser-path">{path}</div>
      <div className="te-filebrowser-list">
        {path !== '/' && (
          <div className="te-filebrowser-item te-filebrowser-item--folder" onClick={() => load(parentPath)}>
            <span>📁</span> ..
          </div>
        )}
        {loading && <div className="te-filebrowser-empty">Loading…</div>}
        {!loading && entries.length === 0 && <div className="te-filebrowser-empty">Empty folder</div>}
        {entries.map((e) => {
          const isTextFile = e.type === 'file' && TEXT_EXTENSIONS.includes(getExtension(e.name));
          return (
            <div
              key={e.id}
              className={`te-filebrowser-item ${e.type === 'folder' ? 'te-filebrowser-item--folder' : isTextFile ? 'te-filebrowser-item--file' : 'te-filebrowser-item--other'}`}
              onClick={() => {
                if (e.type === 'folder') load(e.path);
                else if (isTextFile) onOpen(e);
              }}
            >
              <span>{e.type === 'folder' ? '📁' : '📄'}</span>
              <span className="te-filebrowser-name">{e.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main TextEditor ──────────────────────────────────────────────────────────
export default function TextEditor({ filePath, fileName, fileContent }) {
  // Each tab: { id, path, name, content, original, dirty, lang }
  const [tabs, setTabs] = useState(() => {
    const first = {
      id: Date.now(),
      path: filePath || null,
      name: fileName || 'Untitled.txt',
      content: fileContent ?? '',
      original: fileContent ?? '',
      dirty: false,
      lang: getLanguage(fileName || 'Untitled.txt'),
    };
    return [first];
  });
  const [activeId, setActiveId] = useState(() => tabs[0].id);
  const [showFileBrowser, setShowFileBrowser] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving' | 'saved' | 'error'
  const [showNew, setShowNew] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFilePath, setNewFilePath] = useState(DEFAULT_PATH);
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);

  const openApp = useWindowsStore((s) => s.openApp);

  const activeTab = tabs.find((t) => t.id === activeId) || tabs[0];

  // Sync scroll between textarea and highlight layer
  const syncScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Update content in active tab
  const updateContent = (val) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeId
          ? { ...t, content: val, dirty: val !== t.original }
          : t
      )
    );
  };

  // Handle Tab key inside textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newContent = activeTab.content.substring(0, start) + '  ' + activeTab.content.substring(end);
      updateContent(newContent);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
    // Cmd/Ctrl + S → save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  // Save active tab
  const handleSave = useCallback(async () => {
    if (!activeTab.path) {
      // No path — show new file dialog pre-filled
      setNewFileName(activeTab.name);
      setShowNew(true);
      return;
    }
    setSaveStatus('saving');
    try {
      await vfs.writeFile(activeTab.path, activeTab.content);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, original: t.content, dirty: false } : t
        )
      );
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 1800);
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 2500);
    }
  }, [activeTab, activeId]);

  // Open a file from the VFS browser
  const handleOpenFile = async (entry) => {
    // Check if already open
    const existing = tabs.find((t) => t.path === entry.path);
    if (existing) {
      setActiveId(existing.id);
      setShowFileBrowser(false);
      return;
    }
    const content = entry.content ?? '';
    const newTab = {
      id: Date.now(),
      path: entry.path,
      name: entry.name,
      content,
      original: content,
      dirty: false,
      lang: getLanguage(entry.name),
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveId(newTab.id);
    setShowFileBrowser(false);
  };

  // New tab (blank)
  const handleNewTab = () => {
    const id = Date.now();
    setTabs((prev) => [
      ...prev,
      { id, path: null, name: 'Untitled.txt', content: '', original: '', dirty: false, lang: 'text' },
    ]);
    setActiveId(id);
  };

  // Close a tab
  const handleCloseTab = (e, tabId) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      // Reset to blank instead of closing
      setTabs([{ id: Date.now(), path: null, name: 'Untitled.txt', content: '', original: '', dirty: false, lang: 'text' }]);
      return;
    }
    const idx = tabs.findIndex((t) => t.id === tabId);
    const remaining = tabs.filter((t) => t.id !== tabId);
    setTabs(remaining);
    if (activeId === tabId) {
      setActiveId(remaining[Math.max(0, idx - 1)].id);
    }
  };

  // Create new file in VFS
  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;
    const fullPath = `${newFilePath.replace(/\/$/, '')}/${newFileName.trim()}`;
    try {
      const content = activeTab.path ? activeTab.content : '';
      await vfs.writeFile(fullPath, content);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeId
            ? { ...t, path: fullPath, name: newFileName.trim(), original: t.content, dirty: false, lang: getLanguage(newFileName.trim()) }
            : t
        )
      );
      setShowNew(false);
      setNewFileName('');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 1800);
    } catch (err) {
      alert('Could not create file: ' + err.message);
    }
  };

  const lineCount = (activeTab.content.match(/\n/g) || []).length + 1;
  const lang = activeTab.lang;
  const highlighted = highlight(activeTab.content, lang);

  return (
    <div className="te-root">
      {/* ── Toolbar ── */}
      <div className="te-toolbar">
        <button className="te-toolbar-btn" title="New File (Ctrl+N)" onClick={handleNewTab}>
          <FilePlus size={15} />
          <span>New</span>
        </button>
        <button className="te-toolbar-btn" title="Open File" onClick={() => setShowFileBrowser((v) => !v)}>
          <FolderOpen size={15} />
          <span>Open</span>
        </button>
        <button
          className={`te-toolbar-btn ${activeTab.dirty ? 'te-toolbar-btn--dirty' : ''}`}
          title="Save (Ctrl+S)"
          onClick={handleSave}
        >
          <Save size={15} />
          <span>Save</span>
        </button>
        <button className="te-toolbar-btn" title="Save As…" onClick={() => { setNewFileName(activeTab.name); setShowNew(true); }}>
          <FileText size={15} />
          <span>Save As</span>
        </button>

        <div className="te-toolbar-spacer" />

        {/* Language badge */}
        <div className="te-lang-badge">{lang}</div>

        {/* Save status */}
        {saveStatus === 'saving' && <div className="te-status te-status--saving"><RefreshCw size={12} className="te-spin" /> Saving…</div>}
        {saveStatus === 'saved' && <div className="te-status te-status--saved"><Check size={12} /> Saved</div>}
        {saveStatus === 'error' && <div className="te-status te-status--error">Save failed</div>}
      </div>

      {/* ── Tabs ── */}
      <div className="te-tabs">
        {tabs.map((t) => (
          <div
            key={t.id}
            className={`te-tab ${t.id === activeId ? 'te-tab--active' : ''}`}
            onClick={() => setActiveId(t.id)}
            title={t.path || t.name}
          >
            {t.dirty && <Circle size={7} className="te-tab-dirty" fill="currentColor" />}
            <span className="te-tab-name">{t.name}</span>
            <button className="te-tab-close" onClick={(e) => handleCloseTab(e, t.id)} title="Close tab">
              <X size={11} />
            </button>
          </div>
        ))}
        <button className="te-tab-new" onClick={handleNewTab} title="New Tab">+</button>
      </div>

      {/* ── Body ── */}
      <div className="te-body">
        {/* File Browser Sidebar */}
        {showFileBrowser && (
          <FileBrowser
            currentPath={activeTab.path ? activeTab.path.split('/').slice(0, -1).join('/') : DEFAULT_PATH}
            onOpen={handleOpenFile}
            onClose={() => setShowFileBrowser(false)}
          />
        )}

        {/* Line Numbers */}
        <div className="te-gutter" aria-hidden="true">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="te-gutter-line">{i + 1}</div>
          ))}
        </div>

        {/* Editor area: layered textarea over syntax highlight */}
        <div className="te-editor-wrap">
          {/* Syntax highlight layer (behind) */}
          <div
            ref={highlightRef}
            className="te-highlight"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
          />
          {/* Editable textarea (on top, transparent background) */}
          <textarea
            ref={textareaRef}
            className="te-textarea"
            value={activeTab.content}
            onChange={(e) => updateContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            data-gramm="false"
            placeholder={lang === 'text' ? 'Start typing…' : `// ${lang}`}
          />
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div className="te-statusbar">
        <span>{activeTab.path || 'Unsaved'}</span>
        <span>·</span>
        <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
        <span>·</span>
        <span>{activeTab.content.length} chars</span>
        <span>·</span>
        <span>{lang}</span>
        {activeTab.dirty && <span className="te-statusbar-dirty">● unsaved changes</span>}
      </div>

      {/* ── New / Save As Dialog ── */}
      {showNew && (
        <div className="te-dialog-overlay">
          <div className="te-dialog">
            <div className="te-dialog-title">Save File</div>
            <label className="te-dialog-label">File name</label>
            <input
              className="te-dialog-input"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
            />
            <label className="te-dialog-label">Location</label>
            <select
              className="te-dialog-input"
              value={newFilePath}
              onChange={(e) => setNewFilePath(e.target.value)}
            >
              <option value="/home/user/Desktop">Desktop</option>
              <option value="/home/user/Documents">Documents</option>
              <option value="/home/user/Downloads">Downloads</option>
              <option value="/home/user/Projects">Projects</option>
              <option value="/home/user/Pictures">Pictures</option>
              <option value="/home/user">Home</option>
            </select>
            <div className="te-dialog-actions">
              <button className="te-dialog-btn" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="te-dialog-btn te-dialog-btn--primary" onClick={handleCreateFile}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
