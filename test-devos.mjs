// Comprehensive test suite for DevOS Phase 1 stores and logic
import { useFsStore, vfs, normalizePath, splitPath, getUniqueName } from './src/core/store/fs.js';
import { useWindowsStore } from './src/core/store/windows.js';
import { useSettingsStore, ACCENT_PRESETS, WALLPAPER_PRESETS } from './src/core/store/settings.js';
import { APP_REGISTRY, DOCK_APPS } from './src/core/apps/registry.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('--- 1. Testing Virtual File System (VFS) ---');
  // Init
  await useFsStore.getState().initFs();
  assert(useFsStore.getState().isReady === true, 'VFS initialized');

  // Verify default seeds
  const homeChildren = await vfs.list('/home/user');
  const homeFolderNames = homeChildren.map((c) => c.name);
  assert(homeFolderNames.includes('Desktop'), 'Contains /home/user/Desktop');
  assert(homeFolderNames.includes('Documents'), 'Contains /home/user/Documents');
  assert(homeFolderNames.includes('Downloads'), 'Contains /home/user/Downloads');
  assert(homeFolderNames.includes('Projects'), 'Contains /home/user/Projects');
  assert(homeFolderNames.includes('Pictures'), 'Contains /home/user/Pictures');

  // Verify welcome.txt in Documents
  const welcomeContent = await vfs.readFile('/home/user/Documents/welcome.txt');
  assert(welcomeContent.includes('Welcome to Vyom OS!'), 'welcome.txt content readable');

  // Test mkdir with collision auto-suffix
  const folder1 = await vfs.mkdir('/home/user/Desktop/TestFolder');
  assert(folder1.name === 'TestFolder', 'Created folder1 with exact name');
  const folder2 = await vfs.mkdir('/home/user/Desktop/TestFolder');
  assert(folder2.name === 'TestFolder 2', 'Created folder2 with auto-suffix TestFolder 2');
  const folder3 = await vfs.mkdir('/home/user/Desktop/TestFolder');
  assert(folder3.name === 'TestFolder 3', 'Created folder3 with auto-suffix TestFolder 3');

  // Test writeFile and readFile
  const testFile = await vfs.writeFile('/home/user/Desktop/test.txt', 'DevOS File Test');
  assert(testFile.name === 'test.txt' && testFile.size === 15, 'Created test.txt');
  const readContent = await vfs.readFile('/home/user/Desktop/test.txt');
  assert(readContent === 'DevOS File Test', 'Read test.txt content matches');

  // Test rename
  const renamed = await vfs.rename('/home/user/Desktop/test.txt', 'renamed_test.txt');
  assert(renamed.name === 'renamed_test.txt', 'File renamed to renamed_test.txt');
  const existsOld = await vfs.exists('/home/user/Desktop/test.txt');
  const existsNew = await vfs.exists('/home/user/Desktop/renamed_test.txt');
  assert(!existsOld && existsNew, 'Old path non-existent and new path exists');

  // Test move
  const moved = await vfs.move('/home/user/Desktop/renamed_test.txt', '/home/user/Documents');
  assert(moved === true, 'Moved file to /home/user/Documents');
  const inDocs = await vfs.exists('/home/user/Documents/renamed_test.txt');
  assert(inDocs === true, 'File exists in /home/user/Documents');

  // Test recursive remove
  await vfs.writeFile('/home/user/Desktop/TestFolder/subfile.txt', 'sub content');
  assert(await vfs.exists('/home/user/Desktop/TestFolder/subfile.txt') === true, 'Subfile created');
  await vfs.remove('/home/user/Desktop/TestFolder');
  assert(await vfs.exists('/home/user/Desktop/TestFolder') === false, 'Folder removed');
  assert(await vfs.exists('/home/user/Desktop/TestFolder/subfile.txt') === false, 'Subfile recursively removed');

  console.log('\n--- 2. Testing Windows Manager Store ---');
  const winStore = useWindowsStore.getState();

  // Test open Files
  const winFilesId = winStore.openApp('files', APP_REGISTRY.files);
  let winState = useWindowsStore.getState();
  assert(winState.windows.length === 1, 'Files window opened');
  assert(winState.focusedWindowId === winFilesId, 'Files window focused');

  // Test singleInstance app (Settings)
  const settingsId1 = winStore.openApp('settings', APP_REGISTRY.settings);
  winState = useWindowsStore.getState();
  assert(winState.windows.length === 2, 'Settings window opened');
  assert(winState.focusedWindowId === settingsId1, 'Settings window focused');

  // Opening Settings again should focus existing, not create duplicate
  const settingsId2 = winStore.openApp('settings', APP_REGISTRY.settings);
  winState = useWindowsStore.getState();
  assert(winState.windows.length === 2, 'SingleInstance enforced: no duplicate Settings window');
  assert(settingsId1 === settingsId2, 'Same window ID returned');

  // Test dock click behavior
  // Currently settings is focused -> click dock should minimize
  winStore.handleDockClick('settings', APP_REGISTRY.settings);
  winState = useWindowsStore.getState();
  let settingsWin = winState.windows.find((w) => w.id === settingsId1);
  assert(settingsWin.minimized === true, 'Dock click on focused app minimizes it');

  // Click dock again on minimized app -> should restore & focus
  winStore.handleDockClick('settings', APP_REGISTRY.settings);
  winState = useWindowsStore.getState();
  settingsWin = winState.windows.find((w) => w.id === settingsId1);
  assert(settingsWin.minimized === false, 'Dock click on minimized app restores it');
  assert(winState.focusedWindowId === settingsId1, 'Restored app is focused');

  // Test Maximize toggle
  winStore.toggleMaximize(winFilesId);
  winState = useWindowsStore.getState();
  let filesWin = winState.windows.find((w) => w.id === winFilesId);
  assert(filesWin.maximized === true, 'Files window maximized');

  winStore.toggleMaximize(winFilesId);
  winState = useWindowsStore.getState();
  filesWin = winState.windows.find((w) => w.id === winFilesId);
  assert(filesWin.maximized === false, 'Files window un-maximized to original bounds');

  // Test close window
  winStore.closeWindow(winFilesId);
  winState = useWindowsStore.getState();
  assert(winState.windows.length === 1, 'Files window closed');

  console.log('\n--- 3. Testing Settings Store ---');
  const setStore = useSettingsStore.getState();
  assert(WALLPAPER_PRESETS.length === 4, '4 Wallpaper presets available');
  assert(ACCENT_PRESETS.length === 4, '4 Accent color presets available');

  // Test wallpaper switch
  setStore.setWallpaper('aurora');
  assert(useSettingsStore.getState().wallpaper === 'aurora', 'Wallpaper set to aurora');

  // Test accent switch
  setStore.setAccent('rose-pink');
  assert(useSettingsStore.getState().accentId === 'rose-pink', 'Accent set to rose-pink');

  // Test performance mode master switch
  setStore.setPerformanceMode(true);
  const perfState = useSettingsStore.getState();
  assert(perfState.performanceMode === true, 'Performance mode enabled');
  assert(perfState.cursorGlow === false, 'Performance mode disables cursor glow');
  assert(perfState.dockMagnification === false, 'Performance mode disables dock magnification');
  assert(perfState.animations === false, 'Performance mode disables animations');

  console.log('\n--- 4. Testing App Registry & Dock Apps ---');
  assert(DOCK_APPS.length === 6, '6 Apps registered in dock');
  const dockIds = DOCK_APPS.map((a) => a.id);
  assert(
    JSON.stringify(dockIds) === JSON.stringify(['files', 'editor', 'terminal', 'browser', 'games', 'settings']),
    'Dock apps order: files, editor, terminal, browser, games, settings'
  );

  console.log(`\n========================================`);
  console.log(`Total tests: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
