import React, { lazy } from 'react';
import {
  Folder,
  Code2,
  Terminal,
  Globe,
  Gamepad2,
  Settings,
} from 'lucide-react';

export const APP_REGISTRY = {
  files: {
    id: 'files',
    title: 'Files',
    icon: Folder,
    defaultSize: { width: 800, height: 520 },
    singleInstance: false,
    component: lazy(() => import('./files/FilesApp')),
  },
  editor: {
    id: 'editor',
    title: 'Code Editor',
    icon: Code2,
    defaultSize: { width: 820, height: 540 },
    singleInstance: false,
    component: lazy(() => import('./placeholder/ComingSoon')),
  },
  terminal: {
    id: 'terminal',
    title: 'Terminal',
    icon: Terminal,
    defaultSize: { width: 720, height: 460 },
    singleInstance: false,
    component: lazy(() => import('./placeholder/ComingSoon')),
  },
  browser: {
    id: 'browser',
    title: 'Browser',
    icon: Globe,
    defaultSize: { width: 840, height: 580 },
    singleInstance: false,
    component: lazy(() => import('./placeholder/ComingSoon')),
  },
  games: {
    id: 'games',
    title: 'Games',
    icon: Gamepad2,
    defaultSize: { width: 740, height: 500 },
    singleInstance: false,
    component: lazy(() => import('./placeholder/ComingSoon')),
  },
  settings: {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    defaultSize: { width: 660, height: 560 },
    singleInstance: true,
    component: lazy(() => import('./settings/SettingsApp')),
  },
};

export const DOCK_APPS = [
  APP_REGISTRY.files,
  APP_REGISTRY.editor,
  APP_REGISTRY.terminal,
  APP_REGISTRY.browser,
  APP_REGISTRY.games,
  APP_REGISTRY.settings,
];

export const getAppManifest = (appId) => APP_REGISTRY[appId] || null;
