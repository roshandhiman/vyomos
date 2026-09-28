import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';

const LOCAL_STORAGE_KEY = 'devos_vfs_tree_v2';
const IDB_KEY = 'devos_vfs_tree_v2';

const SEED_TIMESTAMP = Date.now();

const DEFAULT_SEEDS = {
  root: {
    id: 'root',
    name: '',
    type: 'folder',
    parentId: null,
    createdAt: SEED_TIMESTAMP,
    modifiedAt: SEED_TIMESTAMP,
  },
  home: {
    id: 'home',
    name: 'home',
    type: 'folder',
    parentId: 'root',
    createdAt: SEED_TIMESTAMP,
    modifiedAt: SEED_TIMESTAMP,
  },
  user: {
    id: 'user',
    name: 'user',
    type: 'folder',
    parentId: 'home',
    createdAt: SEED_TIMESTAMP,
    modifiedAt: SEED_TIMESTAMP,
  },
  desktop: {
    id: 'desktop',
    name: 'Desktop',
    type: 'folder',
    parentId: 'user',
    createdAt: SEED_TIMESTAMP,
    modifiedAt: SEED_TIMESTAMP,
  },
  documents: {
    id: 'documents',
    name: 'Documents',
    type: 'folder',
    parentId: 'user',
    createdAt: SEED_TIMESTAMP,
    modifiedAt: SEED_TIMESTAMP,
  },
  downloads: {
    id: 'downloads',
    name: 'Downloads',
    type: 'folder',
    parentId: 'user',
    createdAt: SEED_TIMESTAMP,
    modifiedAt: SEED_TIMESTAMP,
  },
  projects: {
    id: 'projects',
    name: 'Projects',
    type: 'folder',
    parentId: 'user',
    createdAt: SEED_TIMESTAMP,
    modifiedAt: SEED_TIMESTAMP,
  },
  pictures: {
    id: 'pictures',
    name: 'Pictures',
    type: 'folder',
    parentId: 'user',
    createdAt: SEED_TIMESTAMP,
    modifiedAt: SEED_TIMESTAMP,
  },
  welcome_doc: {
    id: 'welcome_doc',
    name: 'welcome.txt',
    type: 'file',
    parentId: 'documents',
    content: `Welcome to Vyom OS!
===================================
A lightweight browser-based developer operating system.

Core Features:
- Reactive Desktop Shell with Wallpaper & Top Bar
- WebGL GlowCursor with custom GLSL shaders
- Magnifying Physics Dock
- Custom Window Manager with multi-touch & pointer drag
- Virtual File System with persistent storage

Enjoy building with Vyom OS!`,
    size: 304,
    createdAt: SEED_TIMESTAMP,
    modifiedAt: SEED_TIMESTAMP,
  },
  desktop_note: {
    id: 'desktop_note',
    name: 'Getting Started.txt',
    type: 'file',
    parentId: 'desktop',
    content: `Vyom OS Desktop Quick Tips:
- Double click folders to open in Files
- Right click desktop for context menu
- Check Settings in dock to customize theme & wallpaper`,
    size: 156,
    createdAt: SEED_TIMESTAMP,
    modifiedAt: SEED_TIMESTAMP,
  },
  sample_project: {
    id: 'sample_project',
    name: 'hello-world',
    type: 'folder',
    parentId: 'projects',
    createdAt: SEED_TIMESTAMP,
    modifiedAt: SEED_TIMESTAMP,
  },
  project_index: {
    id: 'project_index',
    name: 'index.js',
    type: 'file',
    parentId: 'sample_project',
    content: `// Sample Vyom OS Project\nconsole.log("Hello from Vyom OS!");\n`,
    size: 64,
    createdAt: SEED_TIMESTAMP,
    modifiedAt: SEED_TIMESTAMP,
  },
  project_readme: {
    id: 'project_readme',
    name: 'README.md',
    type: 'file',
    parentId: 'sample_project',
    content: `# Hello World\n\nA sample Node.js project running in Vyom OS VFS.\n`,
    size: 67,
    createdAt: SEED_TIMESTAMP,
    modifiedAt: SEED_TIMESTAMP,
  },
};

// Synchronously load from localStorage immediately upon module execution
const loadSynchronousNodes = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && parsed.root && parsed.desktop) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read VFS from localStorage', e);
    }
  }
  return { ...DEFAULT_SEEDS };
};

// Synchronously save to localStorage immediately, and async to IndexedDB
const saveVfsNodes = (nodes) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nodes));
    } catch (e) {
      console.error('Failed to save VFS to localStorage', e);
    }
  }

  if (typeof indexedDB !== 'undefined') {
    idbSet(IDB_KEY, nodes).catch((err) => {
      // ignore
    });
  }
};

export const normalizePath = (rawPath) => {
  if (!rawPath || rawPath === '/') return '/';
  const clean = rawPath.replace(/\/+/g, '/').replace(/\/+$/, '');
  return clean.startsWith('/') ? clean : `/${clean}`;
};

export const splitPath = (normPath) => {
  if (normPath === '/') return { parentPath: '/', name: '' };
  const lastSlash = normPath.lastIndexOf('/');
  const parentPath = lastSlash === 0 ? '/' : normPath.slice(0, lastSlash);
  const name = normPath.slice(lastSlash + 1);
  return { parentPath, name };
};

// Generates collision-free names: "New Folder", "New Folder 2", "New Folder 3"
export const getUniqueName = (baseName, existingNames) => {
  if (!existingNames.includes(baseName)) return baseName;

  const dotIndex = baseName.lastIndexOf('.');
  const hasExt = dotIndex > 0;
  const rawBase = hasExt ? baseName.slice(0, dotIndex) : baseName;
  const ext = hasExt ? baseName.slice(dotIndex) : '';

  let counter = 2;
  while (true) {
    const candidate = `${rawBase} ${counter}${ext}`;
    if (!existingNames.includes(candidate)) {
      return candidate;
    }
    counter++;
  }
};

const initialNodes = loadSynchronousNodes();

export const useFsStore = create((set, get) => ({
  nodes: initialNodes,
  isReady: true,
  revision: 0,

  initFs: async () => {
    // If localStorage already had nodes, ensure it's saved to IndexedDB as well
    const current = get().nodes;
    if (current && current.desktop) {
      saveVfsNodes(current);
      set({ isReady: true });
      return;
    }

    try {
      if (typeof indexedDB !== 'undefined') {
        const saved = await idbGet(IDB_KEY);
        if (saved && typeof saved === 'object' && saved.root) {
          saveVfsNodes(saved);
          set({ nodes: saved, isReady: true });
          return;
        }
      }
    } catch (err) {
      // fallback
    }

    saveVfsNodes(DEFAULT_SEEDS);
    set({ nodes: { ...DEFAULT_SEEDS }, isReady: true });
  },

  // Path resolution helper
  findNodeByPath: (rawPath) => {
    const path = normalizePath(rawPath);
    const { nodes } = get();

    if (path === '/') return nodes.root || null;

    const segments = path.split('/').filter(Boolean);
    let current = nodes.root;

    for (const segment of segments) {
      if (!current) return null;
      const child = Object.values(nodes).find(
        (n) => n.parentId === current.id && n.name.toLowerCase() === segment.toLowerCase()
      );
      if (!child) return null;
      current = child;
    }

    return current || null;
  },

  getPathForNodeId: (nodeId) => {
    const { nodes } = get();
    const node = nodes[nodeId];
    if (!node) return '/';
    if (node.id === 'root') return '/';

    const segments = [];
    let curr = node;
    while (curr && curr.id !== 'root') {
      segments.unshift(curr.name);
      curr = nodes[curr.parentId];
    }
    return `/${segments.join('/')}`;
  },

  // Public VFS API (All return Promises)
  list: async (rawPath) => {
    const node = get().findNodeByPath(rawPath);
    if (!node || node.type !== 'folder') return [];

    const { nodes } = get();
    return Object.values(nodes)
      .filter((n) => n.parentId === node.id)
      .map((n) => ({
        ...n,
        path: `${rawPath === '/' ? '' : normalizePath(rawPath)}/${n.name}`,
      }))
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  },

  stat: async (rawPath) => {
    return get().findNodeByPath(rawPath);
  },

  exists: async (rawPath) => {
    return !!get().findNodeByPath(rawPath);
  },

  mkdir: async (rawPath) => {
    const normalized = normalizePath(rawPath);
    const { parentPath, name } = splitPath(normalized);
    const parentNode = get().findNodeByPath(parentPath);
    if (!parentNode || parentNode.type !== 'folder') {
      throw new Error(`Parent directory "${parentPath}" not found or not a folder`);
    }

    const { nodes, revision } = get();
    const siblings = Object.values(nodes).filter((n) => n.parentId === parentNode.id);
    const uniqueName = getUniqueName(
      name || 'New Folder',
      siblings.map((s) => s.name)
    );

    const id = `dir_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();
    const newNode = {
      id,
      name: uniqueName,
      type: 'folder',
      parentId: parentNode.id,
      createdAt: now,
      modifiedAt: now,
    };

    const nextNodes = { ...nodes, [id]: newNode };
    saveVfsNodes(nextNodes); // Immediate sync to localStorage!
    set({ nodes: nextNodes, revision: revision + 1 });

    return newNode;
  },

  writeFile: async (rawPath, content = '') => {
    const normalized = normalizePath(rawPath);
    const { parentPath, name } = splitPath(normalized);
    const parentNode = get().findNodeByPath(parentPath);
    if (!parentNode || parentNode.type !== 'folder') {
      throw new Error(`Parent directory "${parentPath}" not found`);
    }

    const { nodes, revision } = get();
    const existing = Object.values(nodes).find(
      (n) => n.parentId === parentNode.id && n.name.toLowerCase() === name.toLowerCase()
    );

    const now = Date.now();
    const size = new Blob([content]).size;

    let updatedNodes;
    let targetNode;

    if (existing) {
      targetNode = {
        ...existing,
        content,
        size,
        modifiedAt: now,
      };
      updatedNodes = { ...nodes, [existing.id]: targetNode };
    } else {
      const id = `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      targetNode = {
        id,
        name,
        type: 'file',
        parentId: parentNode.id,
        content,
        size,
        createdAt: now,
        modifiedAt: now,
      };
      updatedNodes = { ...nodes, [id]: targetNode };
    }

    saveVfsNodes(updatedNodes); // Immediate sync to localStorage!
    set({ nodes: updatedNodes, revision: revision + 1 });
    return targetNode;
  },

  readFile: async (rawPath) => {
    const node = get().findNodeByPath(rawPath);
    if (!node) throw new Error(`File "${rawPath}" not found`);
    if (node.type !== 'file') throw new Error(`"${rawPath}" is a directory`);
    return node.content || '';
  },

  rename: async (rawPath, newName) => {
    if (!newName || !newName.trim()) return null;
    const node = get().findNodeByPath(rawPath);
    if (!node || node.id === 'root') throw new Error(`Cannot rename "${rawPath}"`);

    const { nodes, revision } = get();
    const trimmed = newName.trim();
    const siblings = Object.values(nodes).filter(
      (n) => n.parentId === node.parentId && n.id !== node.id
    );

    if (siblings.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`An item named "${trimmed}" already exists in this folder`);
    }

    const updatedNode = {
      ...node,
      name: trimmed,
      modifiedAt: Date.now(),
    };

    const nextNodes = { ...nodes, [node.id]: updatedNode };
    saveVfsNodes(nextNodes); // Immediate sync to localStorage!
    set({ nodes: nextNodes, revision: revision + 1 });

    return updatedNode;
  },

  remove: async (rawPath) => {
    const node = get().findNodeByPath(rawPath);
    if (!node || node.id === 'root') return false;

    const { nodes, revision } = get();

    // Recursively collect all ids to remove
    const idsToRemove = new Set([node.id]);
    const collectDescendants = (parentId) => {
      for (const n of Object.values(nodes)) {
        if (n.parentId === parentId) {
          idsToRemove.add(n.id);
          if (n.type === 'folder') {
            collectDescendants(n.id);
          }
        }
      }
    };

    if (node.type === 'folder') {
      collectDescendants(node.id);
    }

    const nextNodes = { ...nodes };
    idsToRemove.forEach((id) => delete nextNodes[id]);

    saveVfsNodes(nextNodes); // Immediate sync to localStorage!
    set({ nodes: nextNodes, revision: revision + 1 });

    return true;
  },

  move: async (fromPath, toFolderPath) => {
    const sourceNode = get().findNodeByPath(fromPath);
    const targetFolder = get().findNodeByPath(toFolderPath);

    if (!sourceNode || sourceNode.id === 'root') return false;
    if (!targetFolder || targetFolder.type !== 'folder') return false;

    // Prevent moving folder into itself or its descendants
    if (sourceNode.type === 'folder') {
      let check = targetFolder;
      while (check && check.id !== 'root') {
        if (check.id === sourceNode.id) return false;
        check = get().nodes[check.parentId];
      }
    }

    const { nodes, revision } = get();
    const siblings = Object.values(nodes).filter((n) => n.parentId === targetFolder.id);
    const uniqueName = getUniqueName(
      sourceNode.name,
      siblings.map((s) => s.name)
    );

    const updatedNode = {
      ...sourceNode,
      name: uniqueName,
      parentId: targetFolder.id,
      modifiedAt: Date.now(),
    };

    const nextNodes = { ...nodes, [sourceNode.id]: updatedNode };
    saveVfsNodes(nextNodes); // Immediate sync to localStorage!
    set({ nodes: nextNodes, revision: revision + 1 });

    return true;
  },
}));

// Export async path-based vfs object for convenient direct use:
export const vfs = {
  list: (path) => useFsStore.getState().list(path),
  stat: (path) => useFsStore.getState().stat(path),
  mkdir: (path) => useFsStore.getState().mkdir(path),
  writeFile: (path, content) => useFsStore.getState().writeFile(path, content),
  readFile: (path) => useFsStore.getState().readFile(path),
  rename: (path, newName) => useFsStore.getState().rename(path, newName),
  remove: (path) => useFsStore.getState().remove(path),
  move: (from, toFolder) => useFsStore.getState().move(from, toFolder),
  exists: (path) => useFsStore.getState().exists(path),
};
