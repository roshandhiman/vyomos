import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Folder,
  FileText,
  FileCode,
  Image as ImageIcon,
  File as FileIcon,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  LayoutGrid,
  List as ListIcon,
  FolderPlus,
  Search,
  HardDrive,
  Home,
  Monitor,
  Download,
  FolderGit2,
  Trash2,
  Edit2,
  FilePlus,
  Info,
} from 'lucide-react';
import { useFsStore, vfs, normalizePath, splitPath } from '../../store/fs';
import { FcFolder } from 'react-icons/fc';
import {
  MacDocTextIcon,
  MacDocCodeIcon,
  MacDocImageIcon,
} from '../../icons/AppIcons.js';
import './FilesApp.css';

const QUICK_LINKS = [
  { name: 'Home', path: '/home/user', icon: Home },
  { name: 'Desktop', path: '/home/user/Desktop', icon: Monitor },
  { name: 'Documents', path: '/home/user/Documents', icon: FileText },
  { name: 'Downloads', path: '/home/user/Downloads', icon: Download },
  { name: 'Projects', path: '/home/user/Projects', icon: FolderGit2 },
  { name: 'Pictures', path: '/home/user/Pictures', icon: ImageIcon },
];

const getFileIcon = (fileName, isFolder) => {
  if (isFolder) return <FcFolder size={34} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }} />;
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'html':
    case 'css':
    case 'json':
    case 'py':
      return <MacDocCodeIcon size={32} label={ext ? ext.toUpperCase().slice(0, 3) : 'JS'} />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'gif':
    case 'webp':
      return <MacDocImageIcon size={32} />;
    case 'md':
    case 'txt':
    case 'log':
    default:
      return <MacDocTextIcon size={32} />;
  }
};

const getSmallFileIcon = (fileName, isFolder) => {
  if (isFolder) return <FcFolder size={16} />;
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'html':
    case 'css':
    case 'json':
      return <FileCode size={16} color="#67E8F9" />;
    case 'md':
    case 'txt':
      return <FileText size={16} color="#94A3B8" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
      return <ImageIcon size={16} color="#A78BFA" />;
    default:
      return <FileIcon size={16} color="#94A3B8" />;
  }
};

const formatSize = (bytes) => {
  if (typeof bytes !== 'number' || isNaN(bytes)) return '--';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (timestamp) => {
  if (!timestamp) return '--';
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function FilesApp({ initialPath = '/home/user' }) {
  const revision = useFsStore((state) => state.revision);

  const [currentPath, setCurrentPath] = useState(() => normalizePath(initialPath));
  const [history, setHistory] = useState([normalizePath(initialPath)]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [items, setItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);

  const containerRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Load items in current folder
  useEffect(() => {
    let active = true;
    vfs.list(currentPath).then((list) => {
      if (active) {
        setItems(list);
        setSelectedIds(new Set());
        setRenamingId(null);
      }
    });
    return () => {
      active = false;
    };
  }, [currentPath, revision]);

  // Navigate to path with history
  const navigateTo = useCallback(
    (targetPath) => {
      const normalized = normalizePath(targetPath);
      if (normalized === currentPath) return;

      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(normalized);
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
      setCurrentPath(normalized);
      setSearchQuery('');
    },
    [currentPath, history, historyIndex]
  );

  const handleBack = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setCurrentPath(history[nextIndex]);
      setSearchQuery('');
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setCurrentPath(history[nextIndex]);
      setSearchQuery('');
    }
  };

  const handleUp = () => {
    if (currentPath === '/' || currentPath === '') return;
    const { parentPath } = splitPath(currentPath);
    navigateTo(parentPath);
  };

  // Breadcrumbs
  const breadcrumbSegments = useMemo(() => {
    if (currentPath === '/') return [{ name: 'root', path: '/' }];
    const parts = currentPath.split('/').filter(Boolean);
    const crumbs = [{ name: 'root', path: '/' }];
    let acc = '';
    for (const part of parts) {
      acc += `/${part}`;
      crumbs.push({ name: part, path: acc });
    }
    return crumbs;
  }, [currentPath]);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, searchQuery]);

  // Keyboard navigation & actions
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.size > 0) {
          e.preventDefault();
          const toDelete = items.filter((it) => selectedIds.has(it.id));
          toDelete.forEach((item) => vfs.remove(item.path));
          setSelectedIds(new Set());
        }
      } else if (e.key === 'F2') {
        if (selectedIds.size === 1) {
          e.preventDefault();
          const target = items.find((it) => selectedIds.has(it.id));
          if (target) {
            setRenamingId(target.id);
            setRenameValue(target.name);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIds]);

  // Selection handlers
  const handleItemClick = (e, item) => {
    e.stopPropagation();
    if (e.metaKey || e.ctrlKey) {
      const next = new Set(selectedIds);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      setSelectedIds(next);
    } else {
      setSelectedIds(new Set([item.id]));
    }
  };

  const handleBackgroundClick = () => {
    setSelectedIds(new Set());
    setRenamingId(null);
  };

  const handleItemDoubleClick = (item) => {
    if (item.type === 'folder') {
      navigateTo(item.path);
    } else {
      showToast(`Editor coming soon! File: ${item.name}`);
    }
  };

  const handleCreateFolder = async () => {
    try {
      const created = await vfs.mkdir(`${currentPath}/New Folder`);
      setSelectedIds(new Set([created.id]));
      setRenamingId(created.id);
      setRenameValue(created.name);
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleCreateFile = async () => {
    try {
      const created = await vfs.writeFile(`${currentPath}/untitled.txt`, '');
      setSelectedIds(new Set([created.id]));
      setRenamingId(created.id);
      setRenameValue(created.name);
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleFinishRename = async (item) => {
    if (renameValue && renameValue.trim() && renameValue !== item.name) {
      try {
        await vfs.rename(item.path, renameValue.trim());
      } catch (err) {
        showToast(err.message);
      }
    }
    setRenamingId(null);
  };

  // Drag and drop to move
  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('text/plain', item.path);
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(targetId);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverTarget(null);
  };

  const handleDrop = async (e, targetFolder) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);
    const sourcePath = e.dataTransfer.getData('text/plain');
    if (!sourcePath || !targetFolder) return;

    if (sourcePath === targetFolder.path) return;
    try {
      await vfs.move(sourcePath, targetFolder.path);
    } catch (err) {
      showToast('Cannot move item here');
    }
  };

  // Context menu on item
  const handleItemContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds(new Set([item.id]));

    // Simple prompt/confirm for actions
    const action = window.confirm(`File options for "${item.name}":\n\nClick OK to Rename or Cancel to Delete.`)
      ? 'rename'
      : 'delete';

    if (action === 'rename') {
      const newName = window.prompt(`Rename "${item.name}":`, item.name);
      if (newName && newName.trim() && newName !== item.name) {
        vfs.rename(item.path, newName.trim()).catch((err) => showToast(err.message));
      }
    } else {
      const confirmDel = window.confirm(`Delete "${item.name}"?`);
      if (confirmDel) {
        vfs.remove(item.path);
      }
    }
  };

  // Context menu on empty background
  const handleBgContextMenu = (e) => {
    e.preventDefault();
    const action = window.prompt('Directory Actions:\n1. New Folder\n2. New File\nEnter 1 or 2:');
    if (action === '1') {
      handleCreateFolder();
    } else if (action === '2') {
      handleCreateFile();
    }
  };

  return (
    <div className="files-app" ref={containerRef}>
      {/* Toolbar */}
      <div className="files-toolbar">
        <div className="files-nav-btns">
          <button
            className="files-tool-btn"
            onClick={handleBack}
            disabled={historyIndex <= 0}
            title="Back"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="files-tool-btn"
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
            title="Forward"
          >
            <ChevronRight size={16} />
          </button>
          <button
            className="files-tool-btn"
            onClick={handleUp}
            disabled={currentPath === '/'}
            title="Up to Parent Directory"
          >
            <ArrowUp size={16} />
          </button>
        </div>

        {/* Breadcrumb Path Bar */}
        <div className="files-breadcrumbs">
          {breadcrumbSegments.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              {idx > 0 && <span className="breadcrumb-sep">/</span>}
              <span
                className="breadcrumb-crumb"
                onClick={() => navigateTo(crumb.path)}
                title={crumb.path}
              >
                {crumb.name}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* View Mode Toggle */}
        <button
          className="files-tool-btn"
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
        >
          {viewMode === 'grid' ? <ListIcon size={16} /> : <LayoutGrid size={16} />}
        </button>

        {/* New Folder Button */}
        <button
          className="files-tool-btn"
          onClick={handleCreateFolder}
          title="New Folder"
        >
          <FolderPlus size={16} />
        </button>

        {/* Search */}
        <div className="files-search">
          <Search size={14} color="var(--text-dim)" />
          <input
            type="text"
            placeholder="Search folder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Body: Sidebar + Main Content */}
      <div className="files-body">
        {/* Sidebar Quick Links */}
        <aside className="files-sidebar">
          <span className="sidebar-heading">Quick Access</span>
          {QUICK_LINKS.map((link) => {
            const LinkIcon = link.icon;
            const isActive = currentPath === link.path;
            const isTarget = dragOverTarget === `sidebar-${link.name}`;
            return (
              <div
                key={link.name}
                className={`sidebar-item ${isActive ? 'sidebar-item--active' : ''} ${
                  isTarget ? 'sidebar-item--drop-target' : ''
                }`}
                onClick={() => navigateTo(link.path)}
                onDragOver={(e) => handleDragOver(e, `sidebar-${link.name}`)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, { path: link.path })}
              >
                <LinkIcon size={16} />
                <span>{link.name}</span>
              </div>
            );
          })}
        </aside>

        {/* Main Content Area */}
        <main
          className="files-main"
          onClick={handleBackgroundClick}
          onContextMenu={handleBgContextMenu}
        >
          <div className="files-container">
            {filteredItems.length === 0 ? (
              <div className="files-empty">
                <Folder size={48} strokeWidth={1} color="var(--text-dim)" />
                <p>This folder is empty</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="files-grid">
                {filteredItems.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const isRenaming = renamingId === item.id;
                  const isDropTarget = dragOverTarget === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`file-card ${isSelected ? 'file-card--selected' : ''} ${
                        isDropTarget ? 'file-card--drop-target' : ''
                      }`}
                      onClick={(e) => handleItemClick(e, item)}
                      onDoubleClick={() => handleItemDoubleClick(item)}
                      onContextMenu={(e) => handleItemContextMenu(e, item)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragOver={(e) => {
                        if (item.type === 'folder') handleDragOver(e, item.id);
                      }}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => {
                        if (item.type === 'folder') handleDrop(e, item);
                      }}
                    >
                      <div className="file-card-icon">
                        {getFileIcon(item.name, item.type === 'folder')}
                      </div>
                      {isRenaming ? (
                        <input
                          className="inline-rename-input"
                          type="text"
                          value={renameValue}
                          autoFocus
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleFinishRename(item);
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          onBlur={() => handleFinishRename(item)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="file-card-name" title={item.name}>
                          {item.name}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="files-list">
                <div className="files-list-header">
                  <span>Name</span>
                  <span>Date Modified</span>
                  <span>Size</span>
                </div>
                {filteredItems.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const isRenaming = renamingId === item.id;
                  const isDropTarget = dragOverTarget === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`files-list-row ${isSelected ? 'files-list-row--selected' : ''} ${
                        isDropTarget ? 'files-list-row--drop-target' : ''
                      }`}
                      onClick={(e) => handleItemClick(e, item)}
                      onDoubleClick={() => handleItemDoubleClick(item)}
                      onContextMenu={(e) => handleItemContextMenu(e, item)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragOver={(e) => {
                        if (item.type === 'folder') handleDragOver(e, item.id);
                      }}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => {
                        if (item.type === 'folder') handleDrop(e, item);
                      }}
                    >
                      <div className="list-name-col">
                        {getSmallFileIcon(item.name, item.type === 'folder')}
                        {isRenaming ? (
                          <input
                            className="inline-rename-input"
                            type="text"
                            value={renameValue}
                            autoFocus
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleFinishRename(item);
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            onBlur={() => handleFinishRename(item)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span title={item.name}>{item.name}</span>
                        )}
                      </div>
                      <span className="list-col">{formatDate(item.modifiedAt)}</span>
                      <span className="list-col">
                        {item.type === 'folder' ? '--' : formatSize(item.size)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="files-toast">
          <Info size={16} color="var(--accent-primary)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Status Bar */}
      <footer className="files-statusbar">
        <span>{filteredItems.length} items</span>
        <span>
          {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'None selected'}
        </span>
      </footer>
    </div>
  );
}
