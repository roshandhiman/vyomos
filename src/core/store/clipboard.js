import { create } from 'zustand';
import { vfs } from './fs';

export const useClipboardStore = create((set, get) => ({
  clipboard: null, // { action: 'copy' | 'cut', path: string, name: string }

  copyItem: (path, name) => {
    set({ clipboard: { action: 'copy', path, name } });
  },

  cutItem: (path, name) => {
    set({ clipboard: { action: 'cut', path, name } });
  },

  pasteItem: async (targetFolderPath) => {
    const { clipboard } = get();
    if (!clipboard || !clipboard.path) return null;

    try {
      if (clipboard.action === 'cut') {
        const moved = await vfs.move(clipboard.path, targetFolderPath);
        set({ clipboard: null });
        return moved;
      } else {
        const copied = await vfs.copy(clipboard.path, targetFolderPath);
        return copied;
      }
    } catch (err) {
      console.error('Failed to paste item:', err);
      throw err;
    }
  },

  duplicateItem: async (path) => {
    try {
      return await vfs.duplicate(path);
    } catch (err) {
      console.error('Failed to duplicate item:', err);
      throw err;
    }
  },

  clearClipboard: () => {
    set({ clipboard: null });
  },
}));
