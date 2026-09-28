import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FcFolder } from 'react-icons/fc';
import { Globe } from 'lucide-react';
import {
  MacDocTextIcon,
  MacDocCodeIcon,
  MacDocImageIcon,
} from './icons/AppIcons.js';
import { useFsStore, vfs } from './store/fs';
import { useWindowsStore } from './store/windows';
import { useClipboardStore } from './store/clipboard';
import { APP_REGISTRY } from './apps/registry';
import { iconIntersectsSelection } from './DesktopSelection';
import './DesktopIcons.css';

const DESKTOP_PATH = '/home/user/Desktop';
const STORAGE_POS_KEY = 'vyom_desktop_positions_v1';

const getDesktopIcon = (fileName, isFolder) => {
  if (isFolder) {
    return <FcFolder size={44} style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))' }} />;
  }
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'url':
      return <Globe size={40} color="#60a5fa" strokeWidth={1.5} />;
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'json':
    case 'html':
    case 'css':
    case 'py':
      return <MacDocCodeIcon size={40} label={ext ? ext.toUpperCase().slice(0, 4) : 'JS'} />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'webp':
    case 'gif':
      return <MacDocImageIcon size={40} />;
    case 'md':
    case 'txt':
    case 'log':
    default:
      return <MacDocTextIcon size={40} />;
  }
};

export default function DesktopIcons({ onIconContextMenu, onNotify, onDesktopClick, selectionRect }) {
  const revision = useFsStore((state) => state.revision);
  const openApp = useWindowsStore((state) => state.openApp);

  const clipboard = useClipboardStore((state) => state.clipboard);
  const copyItem = useClipboardStore((state) => state.copyItem);
  const cutItem = useClipboardStore((state) => state.cutItem);
  const pasteItem = useClipboardStore((state) => state.pasteItem);
  const duplicateItem = useClipboardStore((state) => state.duplicateItem);

  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Persistent icon positions: { [item.path]: { x: number, y: number } }
  const [positions, setPositions] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(STORAGE_POS_KEY);
        if (stored) return JSON.parse(stored);
      } catch (err) {
        // ignore
      }
    }
    return {};
  });

  const [dragState, setDragState] = useState(null);

  // Refs for each icon element — needed to check intersection with selection rect
  const iconEls = useRef({});

  // Save positions to localStorage
  const savePositions = useCallback((newPositions) => {
    setPositions(newPositions);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(newPositions));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Fetch desktop items
  useEffect(() => {
    let active = true;
    vfs.list(DESKTOP_PATH).then((res) => {
      if (active) setItems(res);
    });
    return () => {
      active = false;
    };
  }, [revision]);

  // Clear selection when parent signals a desktop click
  useEffect(() => {
    if (onDesktopClick !== undefined) {
      setSelectedId(null);
    }
  }, [onDesktopClick]);

  // Compute position for an item
  const getItemPos = useCallback(
    (item, index) => {
      if (dragState && dragState.id === item.id) {
        return { x: dragState.curX, y: dragState.curY };
      }
      if (positions[item.path]) {
        return positions[item.path];
      }
      // Default auto-grid column layout
      const TOP_OFFSET = 44;
      const LEFT_OFFSET = 20;
      const ROW_HEIGHT = 96;
      const COL_WIDTH = 96;
      const windowH = typeof window !== 'undefined' ? window.innerHeight : 800;
      const rowsPerCol = Math.max(1, Math.floor((windowH - 180) / ROW_HEIGHT));
      const col = Math.floor(index / rowsPerCol);
      const row = index % rowsPerCol;
      return {
        x: LEFT_OFFSET + col * COL_WIDTH,
        y: TOP_OFFSET + row * ROW_HEIGHT,
      };
    },
    [positions, dragState]
  );

  // Keyboard actions on desktop icons (Cmd+C, Cmd+V, Cmd+X, Cmd+D, Delete, Enter)
  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (e.target.tagName === 'INPUT') return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      const selectedItem = items.find((i) => i.id === selectedId);

      // Copy: Cmd/Ctrl + C
      if (modKey && (e.key === 'c' || e.key === 'C')) {
        if (selectedItem) {
          e.preventDefault();
          copyItem(selectedItem.path, selectedItem.name);
          onNotify?.(`Copied "${selectedItem.name}" to clipboard`);
        }
      }

      // Cut: Cmd/Ctrl + X
      else if (modKey && (e.key === 'x' || e.key === 'X')) {
        if (selectedItem) {
          e.preventDefault();
          cutItem(selectedItem.path, selectedItem.name);
          onNotify?.(`Cut "${selectedItem.name}" to clipboard`);
        }
      }

      // Paste: Cmd/Ctrl + V
      else if (modKey && (e.key === 'v' || e.key === 'V')) {
        if (clipboard) {
          e.preventDefault();
          try {
            const pasted = await pasteItem(DESKTOP_PATH);
            onNotify?.(`Pasted "${pasted?.name || 'item'}" on Desktop`);
          } catch (err) {
            onNotify?.(err.message);
          }
        }
      }

      // Duplicate: Cmd/Ctrl + D
      else if (modKey && (e.key === 'd' || e.key === 'D')) {
        if (selectedItem) {
          e.preventDefault();
          try {
            const dup = await duplicateItem(selectedItem.path);
            onNotify?.(`Duplicated "${dup?.name || selectedItem.name}"`);
          } catch (err) {
            onNotify?.(err.message);
          }
        }
      }

      // Delete: Delete or Backspace
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItem) {
          e.preventDefault();
          try {
            await vfs.remove(selectedItem.path);
            setSelectedId(null);
            onNotify?.(`Deleted "${selectedItem.name}"`);
          } catch (err) {
            onNotify?.(err.message);
          }
        }
      }

      // Rename: F2 or Enter
      else if (e.key === 'F2' || e.key === 'Enter') {
        if (selectedItem && !renamingId) {
          e.preventDefault();
          setRenamingId(selectedItem.id);
          setRenameValue(selectedItem.name);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedId, clipboard, renamingId, copyItem, cutItem, pasteItem, duplicateItem, onNotify]);

  // Pointer Dragging Handlers for movable desktop icons
  const handlePointerDown = (e, item, index) => {
    if (e.button !== 0) return; // Only left click
    if (renamingId === item.id) return;

    e.stopPropagation();
    setSelectedId(item.id);

    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }

    const curPos = getItemPos(item, index);
    setDragState({
      id: item.id,
      path: item.path,
      startX: e.clientX,
      startY: e.clientY,
      initX: curPos.x,
      initY: curPos.y,
      curX: curPos.x,
      curY: curPos.y,
      hasMoved: false,
    });
  };

  const handlePointerMove = (e) => {
    if (!dragState) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    if (!dragState.hasMoved && Math.hypot(dx, dy) < 4) {
      return;
    }

    const clampedX = Math.max(10, Math.min(window.innerWidth - 90, dragState.initX + dx));
    const clampedY = Math.max(34, Math.min(window.innerHeight - 100, dragState.initY + dy));

    setDragState((prev) => ({
      ...prev,
      curX: clampedX,
      curY: clampedY,
      hasMoved: true,
    }));
  };

  const handlePointerUp = (e) => {
    if (!dragState) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }

    if (dragState.hasMoved) {
      // Save new position
      const newPos = {
        ...positions,
        [dragState.path]: { x: dragState.curX, y: dragState.curY },
      };
      savePositions(newPos);
    }

    setDragState(null);
  };

  const handleDragOver = (e) => {
    if (e.dataTransfer.types.includes('application/x-devos-dock-app')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = async (e) => {
    const appId = e.dataTransfer.getData('application/x-devos-dock-app');
    if (appId) {
      e.preventDefault();
      const app = APP_REGISTRY[appId];
      if (app) {
        try {
          await vfs.writeFile(`${DESKTOP_PATH}/${app.title}.app`, JSON.stringify({ appId }));
          onNotify?.(`Added ${app.title} to Desktop`);
        } catch (err) {
          onNotify?.(err.message);
        }
      }
    }
  };

  const TEXT_EXTENSIONS = ['txt', 'md', 'log', 'json', 'js', 'jsx', 'ts', 'tsx', 'css', 'html', 'py', 'sh', 'yaml', 'yml', 'csv'];

  const handleItemDoubleClick = async (e, item) => {
    e.stopPropagation();
    if (dragState && dragState.hasMoved) return;

    if (item.type === 'folder') {
      openApp('files', APP_REGISTRY.files, { initialPath: item.path });
    } else {
      const ext = item.name.split('.').pop()?.toLowerCase() || '';
      if (ext === 'url') {
        try {
          const data = JSON.parse(item.content);
          if (data.url) {
            openApp('browser', APP_REGISTRY.browser, { initialUrl: data.url });
            return;
          }
        } catch (e) {}
      }
      if (ext === 'app') {
        try {
          const data = JSON.parse(item.content);
          if (data.appId && APP_REGISTRY[data.appId]) {
            openApp(data.appId, APP_REGISTRY[data.appId]);
            return;
          }
        } catch (e) {
          // fallback
        }
      }
      if (TEXT_EXTENSIONS.includes(ext)) {
        // Open in TextEditor with file content
        const content = item.content ?? '';
        openApp('editor', APP_REGISTRY.editor, {
          filePath: item.path,
          fileName: item.name,
          fileContent: content,
        });
      } else {
        openApp('files', APP_REGISTRY.files, { initialPath: DESKTOP_PATH });
      }
    }
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(item.id);

    if (onIconContextMenu) {
      onIconContextMenu(e, item, {
        onRename: () => {
          setRenamingId(item.id);
          setRenameValue(item.name);
        },
      });
    }
  };

  const handleFinishRename = async (item) => {
    if (renameValue && renameValue.trim() && renameValue !== item.name) {
      try {
        await vfs.rename(item.path, renameValue.trim());
      } catch (err) {
        if (onNotify) onNotify(err.message);
      }
    }
    setRenamingId(null);
  };

  return (
    <div 
      className="desktop-icons-container"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {items.map((item, index) => {
        const isSelected =
          selectedId === item.id ||
          (!!selectionRect && iconIntersectsSelection(iconEls.current[item.id], selectionRect));
        const isRenaming = renamingId === item.id;
        const isDragging = dragState && dragState.id === item.id && dragState.hasMoved;
        const isCut = clipboard && clipboard.action === 'cut' && clipboard.path === item.path;

        const pos = getItemPos(item, index);

        return (
          <div
            key={item.id}
            ref={(el) => { iconEls.current[item.id] = el; }}
            className={`desktop-icon-item ${isSelected ? 'desktop-icon-item--selected' : ''} ${
              isDragging ? 'desktop-icon-item--dragging' : ''
            } ${isCut ? 'desktop-icon-item--cut' : ''}`}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
            }}
            onPointerDown={(e) => handlePointerDown(e, item, index)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onDoubleClick={(e) => handleItemDoubleClick(e, item)}
            onContextMenu={(e) => handleContextMenu(e, item)}
            draggable={item.name.endsWith('.app')}
            onDragStart={(e) => {
              if (item.name.endsWith('.app')) {
                try {
                  const data = JSON.parse(item.content);
                  if (data.appId) {
                    e.dataTransfer.setData('application/x-devos-desktop-app', data.appId);
                    e.dataTransfer.effectAllowed = 'copy';
                  }
                } catch(err) {}
              }
            }}
          >
            <div className="desktop-icon-glyph">
              {getDesktopIcon(item.name, item.type === 'folder')}
            </div>

            {isRenaming ? (
              <input
                className="desktop-icon-rename-input"
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
              <span className="desktop-icon-label" title={item.name}>
                {item.name}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
