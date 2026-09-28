<div align="center">



**A browser-based desktop operating system experience built with React**

[![Live Demo](https://img.shields.io/badge/Live-Demo-007AFF?style=for-the-badge&logo=vercel&logoColor=white)](https://vyom-os-woad.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## ✨ Overview

Vyom OS is a fully featured, macOS-inspired desktop environment that runs entirely in your browser. No downloads, no installations — just open and use it. It features a real virtual file system, draggable/resizable windows, a working browser with proxy support, live wallpapers, and a beautiful first-time setup wizard.

---

## 🖥️ Features

### 🪟 Window Management
- Drag, resize, minimize, maximize, and close windows
- Multi-desktop / virtual desktop support
- Window focus & z-index management
- Smooth spring animations

### 🧩 Built-in Apps
| App | Description |
|-----|-------------|
| 🌐 **Browser** | Full web browser with proxy support, navigation history, and DuckDuckGo search |
| 📁 **Files** | File manager with a real virtual file system (VFS), drag & drop, cut/copy/paste |
| 💻 **Terminal** | Working terminal with commands (`ls`, `cd`, `cat`, `mkdir`, `echo`, `rm`, and more) |
| 📝 **Text Editor** | Code/text editor with syntax highlighting |
| 📷 **Camera** | Live webcam feed with photo capture and CSS filters |
| 🖼️ **Photos** | Photo viewer for your captured snapshots |
| 🌤️ **Weather** | Live weather widget using your location |
| ⏰ **Clock** | Analog/digital clock with world time support |
| ⚙️ **Settings** | Full system settings — themes, wallpapers, dock, cursor, and more |
| 🚀 **Launchpad** | App launcher grid (like macOS Launchpad) |

### 🎨 Customization
- **Dark / Light / Auto** theme modes
- **4 accent color presets** (Blue, Graphite, Emerald, Neon Rose) + custom color picker
- **10 static wallpapers** + **8 cinematic live wallpapers** (MP4 video backgrounds)
- **WebGL glow cursor** — interactive fluid light trail behind the cursor
- Dock size, magnification, position (bottom/left/right), auto-hide, and style
- Performance mode for low-end devices

### 🧭 First-Time Setup Wizard
A beautiful 4-step onboarding experience on first visit:
1. Enter your name
2. Choose theme & accent color
3. Pick a wallpaper (static or live)
4. Enable/disable glow cursor

### 🖥️ Desktop
- Desktop icons (drag & drop, rename, open)
- Right-click context menu
- Rubber-band selection for multiple icons
- Desktop GIF support (add, move, resize animated GIFs)
- Web shortcut files (`.url`) — create browser shortcuts on the desktop
- Widgets: Weather, Clock, Notes, System Stats, Stopwatch, Calendar (add from Widget Center)

---

## 🛠️ Tech Stack

- **React 18** — UI framework
- **Vite 6** — Build tool & dev server
- **Zustand** — State management (with persistence)
- **Lucide React** — Icons
- **WebGL / Canvas** — Glow cursor effect
- **Framer Motion / CSS Transitions** — Animations
- **IndexedDB / localStorage** — Virtual file system persistence
- **Vite Proxy Middleware** — Browser proxy for cross-origin site access

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Run Locally

```bash
# Clone the repository
git clone https://github.com/roshandhiman/vyomos.git
cd vyomos

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
src/
├── core/
│   ├── apps/           # All built-in applications
│   │   ├── browser/    # Web browser with proxy
│   │   ├── camera/     # Webcam app
│   │   ├── editor/     # Text editor
│   │   ├── files/      # File manager
│   │   ├── settings/   # System settings
│   │   ├── terminal/   # Terminal emulator
│   │   └── ...
│   ├── store/          # Zustand state stores (settings, fs, windows, etc.)
│   ├── widgets/        # Desktop widgets
│   ├── gifs/           # Desktop GIF system
│   ├── Desktop.jsx     # Main desktop shell
│   ├── SetupWizard.jsx # First-time onboarding
│   └── LoadingScreen.jsx # Boot loader
├── components/
│   ├── Dock/           # Taskbar/dock
│   └── GlowCursor/     # WebGL cursor effect
├── wlp/                # Static wallpaper images
├── livewlp/            # Live wallpaper videos (MP4)
└── styles/             # Global CSS & themes
```

---

## 🌐 Live Demo

**[vyom-os-woad.vercel.app](https://vyom-os-woad.vercel.app)**

> Tip: Open in a full browser window (not mobile) for the best experience. Click **"Clear site data"** in DevTools to reset and see the setup wizard again.

---

## 📸 Screenshots

> _Desktop with live wallpaper, running apps, and the dock_

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## 📄 License

MIT © [Roshan Dhiman](https://github.com/roshandhiman)

---

<div align="center">
  <sub>Built with ❤️ by Roshan Dhiman</sub>
</div>
