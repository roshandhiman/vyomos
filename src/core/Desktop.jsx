import React, { useState, useMemo, useCallback, useRef } from 'react';
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
import { useClipboardStore } from './store/clipboard';
import { useWidgetsStore } from './store/widgets';
import DesktopWidget from './widgets/DesktopWidget';
import Launchpad from './apps/launcher/Launchpad';
import { LaunchpadIcon } from './icons/AppIcons';
import useGifsStore from './store/gifs';
import DesktopGif from './gifs/DesktopGif';
import GifPicker from './gifs/GifPicker';
import DesktopSelection from './DesktopSelection';
import AddWebShortcutDialog from './AddWebShortcutDialog';
import {
  FolderPlus,
  Palette,
  FolderOpen,
  Edit2,
  Trash2,
  Copy,
  Scissors,
  Clipboard,
  CopyPlus,
  Play,
  Info,
  Settings,
  LayoutGrid,
  Film,
  Link,
} from 'lucide-react';
import './Desktop.css';

const DESKTOP_PATH = '/home/user/Desktop';

export default function Desktop() {
  const {
    wallpaper,
    accentPrimary,
    accentSecondary,
    cursorGlow,
    dockSize = 52,
    dockMagnification,
    dockMagScale = 70,
    dockPosition = 'bottom',
    dockAutoHide = false,
    dockShowIndicators = true,
    dockStyle = 'glass',
    dockApps,
    setDockApps,
    setDockPosition,
    toggleDockMagnification,
    toggleDockAutoHide,
    animations,
    performanceMode,
  } = useSettingsStore();

  const windows = useWindowsStore((state) => state.windows);
  const focusedWindowId = useWindowsStore((state) => state.focusedWindowId);
  const handleDockClick = useWindowsStore((state) => state.handleDockClick);
  const openApp = useWindowsStore((state) => state.openApp);

  const clipboard = useClipboardStore((state) => state.clipboard);
  const copyItem = useClipboardStore((state) => state.copyItem);
  const cutItem = useClipboardStore((state) => state.cutItem);
  const pasteItem = useClipboardStore((state) => state.pasteItem);
  const duplicateItem = useClipboardStore((state) => state.duplicateItem);

  const desktopWidgets = useWidgetsStore((state) => state.widgets);
  const setWidgetsCenterOpen = useWidgetsStore((state) => state.setWidgetsCenterOpen);

  const [contextMenu, setContextMenu] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [desktopClickCount, setDesktopClickCount] = useState(0);
  const [launchpadOpen, setLaunchpadOpen] = useState(false);

  // GIF system
  const desktopGifs = useGifsStore((s) => s.gifs);
  const addGif = useGifsStore((s) => s.addGif);
  const [gifPickerState, setGifPickerState] = useState(null);
  const [webShortcutOpen, setWebShortcutOpen] = useState(false);

  // Rubber-band selection
  const desktopLayerRef = useRef(null);
  const [selectionRect, setSelectionRect] = useState(null);

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
    const cx = e.clientX;
    const cy = e.clientY;
    setContextMenu({
      x: cx,
      y: cy,
      items: [
        {
          label: 'Applications (Launchpad)...',
          icon: LayoutGrid,
          action: () => {
            setLaunchpadOpen(true);
          },
        },
        {
          label: 'Add Widgets...',
          icon: LayoutGrid,
          action: () => {
            setWidgetsCenterOpen(true);
          },
        },
        {
          label: 'Add GIF to Desktop...',
          icon: Film,
          action: () => {
            setGifPickerState({ x: cx, y: cy });
          },
        },
        { separator: true },
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
          label: 'Change Wallpaper...',
          icon: Palette,
          action: () => {
            openApp('settings', APP_REGISTRY.settings, { initialSection: 'wallpaper' });
          },
        },
        { separator: true },
        {
          label: 'Add Website Shortcut...',
          icon: Link,
          action: () => setWebShortcutOpen(true),
        },
      ],
    });
  };

  // Context menu on dock
  const handleDockContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: 'Dock Settings...',
          icon: Settings,
          action: () => openApp('settings', APP_REGISTRY.settings, { initialSection: 'dock' }),
        },
        { separator: true },
        {
          label: 'Position: Bottom',
          action: () => setDockPosition('bottom'),
        },
        {
          label: 'Position: Left',
          action: () => setDockPosition('left'),
        },
        {
          label: 'Position: Right',
          action: () => setDockPosition('right'),
        },
        { separator: true },
        {
          label: dockMagnification ? 'Turn Magnification Off' : 'Turn Magnification On',
          action: () => toggleDockMagnification(),
        },
        {
          label: dockAutoHide ? 'Turn Auto-Hide Off' : 'Turn Auto-Hide On',
          action: () => toggleDockAutoHide(),
        },
      ],
    });
  };

  // Context menu on desktop icon
  const handleIconContextMenu = (e, item, { onRename }) => {
    e.preventDefault();
    e.stopPropagation();
    const DESKTOP_PATH = '/home/user/Desktop';
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
              const ext = item.name.split('.').pop()?.toLowerCase() || '';
              const textExts = ['txt','md','log','json','js','jsx','ts','tsx','css','html','py','sh','yaml','yml','csv'];
              if (textExts.includes(ext)) {
                openApp('editor', APP_REGISTRY.editor, {
                  filePath: item.path,
                  fileName: item.name,
                  fileContent: item.content ?? '',
                });
              } else {
                openApp('files', APP_REGISTRY.files, { initialPath: item.path.split('/').slice(0,-1).join('/') });
              }
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
          label: 'Copy',
          icon: Copy,
          action: () => {
            copyItem(item.path, item.name);
            showDesktopToast(`Copied "${item.name}"`);
          },
        },
        {
          label: 'Cut',
          icon: Scissors,
          action: () => {
            cutItem(item.path, item.name);
            showDesktopToast(`Cut "${item.name}"`);
          },
        },
        {
          label: 'Paste',
          icon: Clipboard,
          disabled: !clipboard,
          action: async () => {
            if (!clipboard) return;
            try {
              const pasted = await pasteItem(DESKTOP_PATH);
              showDesktopToast(`Pasted "${pasted?.name || 'item'}"`);
            } catch (err) {
              showDesktopToast(err.message);
            }
          },
        },
        {
          label: 'Duplicate',
          icon: CopyPlus,
          action: async () => {
            try {
              const dup = await duplicateItem(item.path);
              showDesktopToast(`Duplicated "${dup?.name || item.name}"`);
            } catch (err) {
              showDesktopToast(err.message);
            }
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
    const list = [];
    (dockApps || []).forEach((appId) => {
      const app = APP_REGISTRY[appId];
      if (!app) return;
      const Icon = app.icon;
      const appWindows = windows.filter((w) => w.appId === app.id);
      const isRunning = appWindows.length > 0;
      const isActive = appWindows.some(
        (w) => w.id === focusedWindowId && !w.minimized
      );

      list.push({
        id: app.id,
        label: app.title,
        icon: <Icon size={dockSize} />,
        running: isRunning,
        active: isActive,
        onClick: () => handleDockClick(app.id, app),
      });

      // Insert Launchpad right after Files
      if (app.id === 'files') {
        list.push({
          id: 'launchpad',
          label: 'Launchpad',
          icon: <LaunchpadIcon size={dockSize} />,
          running: false,
          active: launchpadOpen,
          onClick: () => setLaunchpadOpen((p) => !p),
        });
      }
    });
    return list;
  }, [windows, focusedWindowId, handleDockClick, dockSize, launchpadOpen]);

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
      <div
        className="desktop-content-layer"
        ref={desktopLayerRef}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('application/x-devos-dock-app')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }
        }}
        onDrop={async (e) => {
          const appId = e.dataTransfer.getData('application/x-devos-dock-app');
          if (appId) {
            e.preventDefault();
            const app = APP_REGISTRY[appId];
            if (app) {
              try {
                await vfs.writeFile(`${DESKTOP_PATH}/${app.title}.app`, JSON.stringify({ appId }));
                showDesktopToast(`Added ${app.title} to Desktop`);
              } catch (err) {
                showDesktopToast(err.message);
              }
            }
          }
        }}
      >
        {/* Background Click Surface — marked so DesktopSelection knows it's the bare desktop */}
        <div
          className="desktop-click-surface"
          data-desktop-surface="true"
          onContextMenu={handleDesktopContextMenu}
          onClick={() => {
            setContextMenu(null);
            setDesktopClickCount((c) => c + 1);
          }}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes('application/x-devos-dock-app')) {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }
          }}
          onDrop={async (e) => {
            const appId = e.dataTransfer.getData('application/x-devos-dock-app');
            if (appId) {
              e.preventDefault();
              const app = APP_REGISTRY[appId];
              if (app) {
                try {
                  await vfs.writeFile(`${DESKTOP_PATH}/${app.title}.app`, JSON.stringify({ appId }));
                  showDesktopToast(`Added ${app.title} to Desktop`);
                } catch (err) {
                  showDesktopToast(err.message);
                }
              }
            }
          }}
        />

        {/* Top Bar */}
        <TopBar />


        {/* Desktop GIFs Layer — behind EVERYTHING, renders before icons/widgets/windows */}
        {desktopGifs.map((g) => (
          <DesktopGif key={g.id} gif={g} />
        ))}

        {/* Desktop Icons (/home/user/Desktop) */}
        <DesktopIcons
          onIconContextMenu={handleIconContextMenu}
          onNotify={showDesktopToast}
          onDesktopClick={desktopClickCount}
          selectionRect={selectionRect}
        />

        {/* Rubber-band selection rectangle */}
        <DesktopSelection
          containerRef={desktopLayerRef}
          onSelect={setSelectionRect}
          onClear={() => setSelectionRect(null)}
        />

        {/* Desktop Widgets Layer */}
        {desktopWidgets.map((w) => (
          <DesktopWidget key={w.id} widget={w} />
        ))}

        {/* Window Manager Layer */}
        <WindowManager />

        {/* Customizable Dock Launcher */}
        <Dock
          items={dockItems}
          baseItemSize={dockSize}
          magnification={isMagnificationActive ? dockMagScale : dockSize}
          position={dockPosition}
          autoHide={dockAutoHide}
          showIndicators={dockShowIndicators}
          dockStyle={dockStyle}
          onContextMenu={handleDockContextMenu}
          onAppDrop={(appId) => {
            // An app from the desktop was dropped onto the dock — add it
            const currentApps = dockApps || [];
            if (!currentApps.includes(appId)) {
              setDockApps([...currentApps, appId]);
              showDesktopToast(`Added ${APP_REGISTRY[appId]?.title || appId} to Dock`);
            }
          }}
          onAppDragOut={(appId) => {
            // A dock app was dragged out — remove it from dock
            const currentApps = dockApps || [];
            setDockApps(currentApps.filter((id) => id !== appId));
            showDesktopToast(`Removed ${APP_REGISTRY[appId]?.title || appId} from Dock`);
          }}
          spring={
            animations && !performanceMode
              ? { mass: 0.1, stiffness: 160, damping: 14 }
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

        {/* Launchpad Fullscreen Overlay */}
        <Launchpad isOpen={launchpadOpen} onClose={() => setLaunchpadOpen(false)} />

        {/* GIF Picker Modal */}
        <GifPicker
          open={gifPickerState !== null}
          dropX={gifPickerState?.x ?? 200}
          dropY={gifPickerState?.y ?? 200}
          onSelect={(src, x, y) => addGif(src, x, y)}
          onClose={() => setGifPickerState(null)}
        />

        {/* Web Shortcut Dialog */}
        <AddWebShortcutDialog
          open={webShortcutOpen}
          onClose={() => setWebShortcutOpen(false)}
          onConfirm={async (url, siteName) => {
            setWebShortcutOpen(false);
            try {
              const filename = `${siteName}.url`;
              await vfs.writeFile(`${DESKTOP_PATH}/${filename}`, JSON.stringify({ url, name: siteName }));
              showDesktopToast(`Shortcut "${siteName}" added to Desktop`);
            } catch (err) {
              showDesktopToast(err.message);
            }
          }}
        />
      </div>
    </GlowCursor>
  );
}
