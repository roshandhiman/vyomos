import React, { useState, useEffect, useRef } from 'react';
import { Folder, FileText, FileCode, Image as ImageIcon, File as FileIcon } from 'lucide-react';
import { FcFolder } from 'react-icons/fc';
import { useFsStore, vfs } from './store/fs';
import { useWindowsStore } from './store/windows';
import { APP_REGISTRY } from './apps/registry';
import './DesktopIcons.css';

const DESKTOP_PATH = '/home/user/Desktop';

const getDesktopIcon = (fileName, isFolder) => {
  if (isFolder) {
    return <FcFolder size={36} />;
  }
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'json':
      return <FileCode size={34} color="#67E8F9" />;
    case 'md':
    case 'txt':
      return <FileText size={34} color="#94A3B8" />;
    case 'png':
    case 'jpg':
    case 'svg':
      return <ImageIcon size={34} color="#A78BFA" />;
    default:
      return <FileIcon size={34} color="#94A3B8" />;
  }
};

export default function DesktopIcons({ onIconContextMenu, onNotify }) {
  const revision = useFsStore((state) => state.revision);
  const openApp = useWindowsStore((state) => state.openApp);

  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

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

  // Keyboard actions on desktop icons
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (!selectedId) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const item = items.find((i) => i.id === selectedId);
        if (item) {
          vfs.remove(item.path);
          setSelectedId(null);
        }
      } else if (e.key === 'F2') {
        const item = items.find((i) => i.id === selectedId);
        if (item) {
          setRenamingId(item.id);
          setRenameValue(item.name);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedId]);

  const handleItemClick = (e, item) => {
    e.stopPropagation();
    setSelectedId(item.id);
    if (renamingId && renamingId !== item.id) {
      setRenamingId(null);
    }
  };

  const handleItemDoubleClick = (e, item) => {
    e.stopPropagation();
    if (item.type === 'folder') {
      openApp('files', APP_REGISTRY.files, { initialPath: item.path });
    } else {
      if (onNotify) {
        onNotify(`Editor coming soon! File: ${item.name}`);
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
    <div className="desktop-icons-container">
      {items.map((item) => {
        const isSelected = selectedId === item.id;
        const isRenaming = renamingId === item.id;

        return (
          <div
            key={item.id}
            className={`desktop-icon-item ${isSelected ? 'desktop-icon-item--selected' : ''}`}
            onClick={(e) => handleItemClick(e, item)}
            onDoubleClick={(e) => handleItemDoubleClick(e, item)}
            onContextMenu={(e) => handleContextMenu(e, item)}
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
