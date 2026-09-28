import React, { useState, useMemo, useCallback } from 'react';
import GlowCursor from '../components/GlowCursor/GlowCursor';
import Dock from '../components/Dock/Dock';
import TopBar from './TopBar';
import DesktopIcons from './DesktopIcons';
import WindowManager from './WindowManager';
import ContextMenu from './ContextMenu';
import { useSettingsStore, WALLPAPER_PRESETS } from './store/settings';
import { useWindowsStore } from './store/windows';
import { useFsStore, vfs } from './store/fs';
import { DOCK_APPS, APP_REGISTRY } from './apps/registry';
import {
  FolderPlus,
  Palette,
  FolderOpen,
  Edit2,
  Trash2,
  Play,
  Info,
} from 'lucide-react';
import './Desktop.css';

const DESKTOP_PATH = '/home/user/Desktop';

export default function Desktop() {
  const {
    wallpaper,
    accentPrimary,
    accentSecondary,
    cursorGlow,
    dockMagnification,
    animations,
    performanceMode,
  } = useSettingsStore();

  const windows = useWindowsStore((state) => state.windows);
  const focusedWindowId = useWindowsStore((state) => state.focusedWindowId);
  const handleDockClick = useWindowsStore((state) => state.handleDockClick);
  const openApp = useWindowsStore((state) => state.openApp);

  const [contextMenu, setContextMenu] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const activeWallpaper = useMemo(() => {
    return WALLPAPER_PRESETS.find((p) => p.id === wallpaper);
  }, [wallpaper]);

  const showDesktopToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Context menu on empty desktop
  const handleDesktopContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: 'New Folder',
          icon: FolderPlus,
          action: async () => {
            try {
              await vfs.mkdir(`${DESKTOP_PATH}/New Folder`);
            } catch (err) {
              showDesktopToast(err.message);
            }
          },
        },
        {
          label: 'Open Files',
          icon: FolderOpen,
          action: () => {
            openApp('files', APP_REGISTRY.files, { initialPath: DESKTOP_PATH });
          },
        },
        { separator: true },
        {
          label: 'Change Wallpaper',
          icon: Palette,
          action: () => {
            openApp('settings', APP_REGISTRY.settings);
          },
        },
      ],
    });
  };

  // Context menu on desktop icon
  const handleIconContextMenu = (e, item, { onRename }) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: 'Open',
          icon: Play,
          action: () => {
            if (item.type === 'folder') {
              openApp('files', APP_REGISTRY.files, { initialPath: item.path });
            } else {
              showDesktopToast(`Editor coming soon! File: ${item.name}`);
            }
          },
        },
        {
          label: 'Rename',
          icon: Edit2,
          action: () => {
            if (onRename) onRename();
          },
        },
        { separator: true },
        {
          label: 'Delete',
          icon: Trash2,
          danger: true,
          action: async () => {
            try {
              await vfs.remove(item.path);
            } catch (err) {
              showDesktopToast(err.message);
            }
          },
        },
      ],
    });
  };

  // Prepare Dock Items with running and active state
  const dockItems = useMemo(() => {
    return DOCK_APPS.map((app) => {
      const Icon = app.icon;
      const appWindows = windows.filter((w) => w.appId === app.id);
      const isRunning = appWindows.length > 0;
      const isActive = appWindows.some(
        (w) => w.id === focusedWindowId && !w.minimized
      );

      return {
        id: app.id,
        label: app.title,
        icon: <Icon size={24} />,
        running: isRunning,
        active: isActive,
        onClick: () => handleDockClick(app.id, app),
      };
    });
  }, [windows, focusedWindowId, handleDockClick]);

  const isGlowActive = cursorGlow && !performanceMode;
  const isMagnificationActive = dockMagnification && !performanceMode;

  return (
    <GlowCursor
      color={accentPrimary}
      secondaryColor={accentSecondary}
      trailLength={32}
      trailWidth={8}
      glowIntensity={2.2}
      glowSpread={1.4}
      idleTimeout={4000}
      maxDevicePixelRatio={1}
      enabled={isGlowActive}
      className="desktop-shell"
      style={{
        backgroundImage: activeWallpaper?.url ? `url("${activeWallpaper.url}")` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: 'var(--bg-desktop)',
      }}
    >
      <div className="desktop-content-layer">
        {/* Background Click Surface for Deselecting & Desktop Context Menu */}
        <div
          className="desktop-click-surface"
          onContextMenu={handleDesktopContextMenu}
          onClick={() => setContextMenu(null)}
        />

        {/* Top Bar */}
        <TopBar />

        {/* Desktop Icons (/home/user/Desktop) */}
        <DesktopIcons
          onIconContextMenu={handleIconContextMenu}
          onNotify={showDesktopToast}
        />

        {/* Window Manager Layer */}
        <WindowManager />

        {/* Dock Launcher */}
        <Dock
          items={dockItems}
          panelHeight={68}
          baseItemSize={50}
          magnification={isMagnificationActive ? 70 : 50}
          spring={
            animations && !performanceMode
              ? { mass: 0.1, stiffness: 150, damping: 12 }
              : { mass: 0.01, stiffness: 450, damping: 30 }
          }
        />

        {/* Global Context Menu */}
        {contextMenu && (
          <ContextMenu menu={contextMenu} onClose={() => setContextMenu(null)} />
        )}

        {/* Global Toast Notification */}
        {toastMsg && (
          <div className="desktop-toast">
            <Info size={16} color="var(--accent-primary)" />
            <span>{toastMsg}</span>
          </div>
        )}
      </div>
    </GlowCursor>
  );
}
