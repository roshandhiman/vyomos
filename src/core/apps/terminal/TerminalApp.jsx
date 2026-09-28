import React, { useState, useEffect, useRef } from 'react';
import { vfs } from '../../store/fs';
import { Settings, X } from 'lucide-react';
import CMatrix from './CMatrix';
import Vim from './Vim';
import './TerminalApp.css';

const gifModules = import.meta.glob('../../../gifs/*.gif', { eager: true, import: 'default' });
const availableGifs = Object.entries(gifModules).map(([path, url]) => ({
  name: path.split('/').pop(),
  url
}));

const DEFAULT_SETTINGS = {
  opacity: 0.95,
  bgColor: '#1e1e1e',
  fgColor: '#d4d4d4',
  fontSize: 13,
  activeGifs: [],
  installedPackages: [],
};

// ── Draggable GIF Component ──
function TerminalGif({ gif, onUpdate, onRemove }) {
  const [pos, setPos] = useState({ x: gif.x || 10, y: gif.y || 10 });
  const [size, setSize] = useState({ w: gif.w || 100, h: gif.h || 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0, initW: 0, initH: 0 });

  const handleMouseDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: pos.x,
      initY: pos.y,
    };
  };

  const handleResizeDown = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initW: size.w,
      initH: size.h,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPos({ x: dragRef.current.initX + dx, y: dragRef.current.initY + dy });
      } else if (isResizing) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setSize({ 
          w: Math.max(50, dragRef.current.initW + dx), 
          h: Math.max(50, dragRef.current.initH + dy) 
        });
      }
    };
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onUpdate({ ...gif, x: pos.x, y: pos.y, w: size.w, h: size.h });
      }
      if (isResizing) {
        setIsResizing(false);
        onUpdate({ ...gif, x: pos.x, y: pos.y, w: size.w, h: size.h });
      }
    };
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, pos, size, gif, onUpdate]);

  return (
    <div
      className="terminal-gif-container"
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: 5,
      }}
      onMouseDown={handleMouseDown}
    >
      <img 
        src={gif.url} 
        alt="Terminal GIF" 
        style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} 
      />
      <div className="gif-controls">
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(gif.id); }}
          style={{
            position: 'absolute', top: -5, right: -5,
            background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none',
            borderRadius: '50%', width: 16, height: 16, fontSize: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          ×
        </button>
        <div 
          className="terminal-gif-resize" 
          onMouseDown={handleResizeDown} 
        />
      </div>
    </div>
  );
}

const getUsername = () => localStorage.getItem('devos-username') || 'user';

export default function TerminalApp() {
  const [history, setHistory] = useState([
    { id: 1, type: 'output', content: `WELCOME ${getUsername()}` }
  ]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState(`/home/${getUsername()}`);
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Settings State
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('devos-term-settings');
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [selectedGif, setSelectedGif] = useState('');
  
  const [runningApp, setRunningApp] = useState(null); // { name: 'cmatrix'|'vim', args: [] }

  useEffect(() => {
    localStorage.setItem('devos-term-settings', JSON.stringify(settings));
  }, [settings]);

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'auto' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const print = (text, type = 'output') => {
    setHistory((prev) => [...prev, { id: Date.now() + Math.random(), type, content: text }]);
  };

  const getAbsPath = (target) => {
    if (!target) return cwd;
    if (target.startsWith('/')) return target;
    if (target === '..') return cwd.split('/').slice(0, -1).join('/') || '/';
    return cwd === '/' ? `/${target}` : `${cwd}/${target}`;
  };

  const handleCommand = async (cmdString) => {
    const trimmed = cmdString.trim();
    if (!trimmed) return;

    print(`${cwd} $ ${trimmed}`, 'command');
    setCmdHistory((prev) => [trimmed, ...prev]);
    setHistoryIdx(-1);

    const [cmd, ...args] = trimmed.split(' ').filter(Boolean);

    // Custom installed commands
    if (settings.installedPackages?.includes('cmatrix') && cmd === 'cmatrix') {
      setRunningApp({ name: 'cmatrix', args });
      return;
    }

    if (settings.installedPackages?.includes('neofetch') && cmd === 'neofetch') {
      const art = `
    \\\\  //    \x1b[36mOS:\x1b[0m Vyom OS (Web)
     \\\\//     \x1b[36mHost:\x1b[0m Browser
      ||      \x1b[36mKernel:\x1b[0m 1.0.0-react
      ||      \x1b[36mPackages:\x1b[0m ${(settings.installedPackages || []).length} (apt)
      ||      \x1b[36mShell:\x1b[0m vsh 1.0
              \x1b[36mTerminal:\x1b[0m VyomTerm
      `;
      print(art);
      return;
    }

    if (settings.installedPackages?.includes('cowsay') && cmd === 'cowsay') {
      const text = args.join(' ') || 'Moo!';
      const border = '-'.repeat(text.length + 2);
      const cow = `
 ${border}
< ${text} >
 ${border}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
      `;
      print(cow);
      return;
    }

    // Built-in commands
    switch (cmd.toLowerCase()) {
      case 'help':
        print('Available commands:');
        print('  help     - Show this message');
        print('  clear    - Clear terminal output');
        print('  ls       - List directory contents');
        print('  cd       - Change directory');
        print('  pwd      - Print working directory');
        print('  echo     - Print text');
        print('  date     - Show current date/time');
        print('  whoami   - Print current user');
        print('  mkdir    - Create a directory');
        print('  touch    - Create an empty file');
        print('  rm       - Remove a file or directory');
        print('  cat      - Read a file');
        print('  apt      - Package manager (try: apt install neofetch)');
        break;
      case 'apt':
        if (args[0] === 'install') {
          const pkg = args[1];
          if (!pkg) { 
            print('apt: missing package name', 'error'); 
            break; 
          }
          const available = ['cmatrix', 'neofetch', 'cowsay', 'vim'];
          if (!available.includes(pkg)) {
            print(`E: Unable to locate package ${pkg}`, 'error');
            break;
          }
          if (settings.installedPackages?.includes(pkg)) {
            print(`Reading package lists... Done`);
            print(`Building dependency tree... Done`);
            print(`${pkg} is already the newest version (1.0.0).`);
            print(`0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.`);
            break;
          }
          print(`Reading package lists... Done`);
          print(`Building dependency tree... Done`);
          print(`The following NEW packages will be installed:`);
          print(`  ${pkg}`);
          print(`0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.`);
          print(`Get:1 http://vyomos.archive.org ${pkg} [1.0.0]`);
          print(`Unpacking ${pkg} (1.0.0) ...`);
          print(`Setting up ${pkg} (1.0.0) ...`);
          setSettings({ ...settings, installedPackages: [...(settings.installedPackages || []), pkg] });
        } else if (args[0] === 'list') {
          print('Available packages: cmatrix, neofetch, cowsay, vim');
          print(`Installed: ${(settings.installedPackages || []).join(', ')}`);
        } else {
          print('Usage: apt install <package>');
        }
        break;
      case 'vim':
        if (settings.installedPackages?.includes('vim')) {
          setRunningApp({ name: 'vim', args });
        } else {
          print('Command not found: vim. Try: apt install vim', 'error');
        }
        break;
      case 'clear':
        setHistory([]);
        break;
      case 'pwd':
        print(cwd);
        break;
      case 'whoami':
        print(getUsername());
        break;
      case 'date':
        print(new Date().toString());
        break;
      case 'echo':
        print(args.join(' '));
        break;
      case 'ls':
        try {
          const searchPath = getAbsPath(args[0]);
          const items = await vfs.list(searchPath);
          if (items.length > 0) {
            const out = items.map(i => i.type === 'folder' ? `${i.name}/` : `${i.name}`).join('  ');
            print(out);
          }
        } catch (e) {
          print(`ls: cannot access '${args[0] || cwd}': No such file or directory`, 'error');
        }
        break;
      case 'cd':
        try {
          const searchPath = getAbsPath(args[0] || `/home/${getUsername()}`);
          await vfs.list(searchPath); 
          setCwd(searchPath);
        } catch (e) {
          print(`cd: ${args[0]}: No such file or directory`, 'error');
        }
        break;
      case 'mkdir':
        if (!args[0]) { print('mkdir: missing operand', 'error'); break; }
        try {
          await vfs.mkdir(getAbsPath(args[0]));
        } catch (e) {
          print(`mkdir: cannot create directory '${args[0]}': ${e.message}`, 'error');
        }
        break;
      case 'touch':
        if (!args[0]) { print('touch: missing file operand', 'error'); break; }
        try {
          await vfs.writeFile(getAbsPath(args[0]), '');
        } catch (e) {
          print(`touch: cannot touch '${args[0]}': ${e.message}`, 'error');
        }
        break;
      case 'rm':
        if (!args[0]) { print('rm: missing operand', 'error'); break; }
        try {
          await vfs.remove(getAbsPath(args[0]));
        } catch (e) {
          print(`rm: cannot remove '${args[0]}': ${e.message}`, 'error');
        }
        break;
      case 'cat':
        if (!args[0]) { print('cat: missing file operand', 'error'); break; }
        try {
          const content = await vfs.readFile(getAbsPath(args[0]));
          print(content);
        } catch (e) {
          print(`cat: ${args[0]}: No such file or directory`, 'error');
        }
        break;
      default:
        const available = ['cmatrix', 'neofetch', 'cowsay', 'vim'];
        if (available.includes(cmd) && !settings.installedPackages?.includes(cmd)) {
          print(`Command '${cmd}' not found, but can be installed with:\napt install ${cmd}`);
        } else {
          print(`vsh: ${cmd}: command not found`, 'error');
        }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0 && historyIdx < cmdHistory.length - 1) {
        const nextIdx = historyIdx + 1;
        setHistoryIdx(nextIdx);
        setInput(cmdHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInput(cmdHistory[nextIdx]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInput('');
      }
    }
  };

  return (
    <div 
      className="basic-term-root" 
      style={{
        backgroundColor: `${settings.bgColor}${Math.round(settings.opacity * 255).toString(16).padStart(2, '0')}`,
        color: settings.fgColor,
        fontSize: `${settings.fontSize}px`
      }}
      onClick={() => {
        if (!showSettings) inputRef.current?.focus();
      }}
    >
      {/* Running Sub-Apps (CMatrix, Vim) */}
      {runningApp?.name === 'cmatrix' && <CMatrix onExit={() => setRunningApp(null)} />}
      {runningApp?.name === 'vim' && (
        <Vim 
          filepath={runningApp.args[0] ? getAbsPath(runningApp.args[0]) : null} 
          cwd={cwd} 
          onExit={() => setRunningApp(null)} 
        />
      )}

      {/* Draggable GIFs */}
      {(settings.activeGifs || []).map(gif => (
        <TerminalGif 
          key={gif.id} 
          gif={gif} 
          onUpdate={(updated) => {
            setSettings({
              ...settings,
              activeGifs: settings.activeGifs.map(g => g.id === updated.id ? updated : g)
            });
          }}
          onRemove={(id) => {
            setSettings({
              ...settings,
              activeGifs: settings.activeGifs.filter(g => g.id !== id)
            });
          }}
        />
      ))}

      {/* Terminal Output */}
      <div className="basic-term-output">
        {history.map((line) => {
          if (line.type === 'html') {
            return (
              <div key={line.id} className="basic-line" dangerouslySetInnerHTML={{ __html: line.content }} />
            );
          }
          return (
            <div key={line.id} className={`basic-line basic-line--${line.type}`}>
              {line.content}
            </div>
          );
        })}
        
        {/* Active Input Line */}
        <div className="basic-input-line">
          <span className="basic-prompt">{cwd} $</span>
          <input
            ref={inputRef}
            className="basic-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoFocus={!showSettings}
            style={{ color: settings.fgColor, fontSize: `${settings.fontSize}px` }}
          />
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Settings Button */}
      <button 
        className="term-settings-btn" 
        onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
      >
        <Settings size={14} />
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <div className="term-settings-panel" onClick={(e) => e.stopPropagation()}>
          <div className="term-settings-header">
            <span>Terminal Preferences</span>
            <button className="term-settings-close" onClick={() => setShowSettings(false)}>
              <X size={14} />
            </button>
          </div>
          <div className="term-settings-body">
            
            <div className="term-settings-row">
              <label>Background Opacity ({Math.round(settings.opacity * 100)}%)</label>
              <input 
                type="range" min="0.1" max="1" step="0.05" 
                value={settings.opacity} 
                onChange={(e) => setSettings({...settings, opacity: parseFloat(e.target.value)})}
              />
            </div>
            
            <div className="term-settings-row">
              <label>Background Color</label>
              <input 
                type="color" 
                value={settings.bgColor} 
                onChange={(e) => setSettings({...settings, bgColor: e.target.value})}
              />
            </div>

            <div className="term-settings-row">
              <label>Text Color</label>
              <input 
                type="color" 
                value={settings.fgColor} 
                onChange={(e) => setSettings({...settings, fgColor: e.target.value})}
              />
            </div>

            <div className="term-settings-row">
              <label>Font Size ({settings.fontSize}px)</label>
              <input 
                type="range" min="10" max="24" step="1" 
                value={settings.fontSize} 
                onChange={(e) => setSettings({...settings, fontSize: parseInt(e.target.value)})}
              />
            </div>

            <div className="term-settings-row term-settings-divider">
              <label>Add Floating GIF</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <select 
                  value={selectedGif} 
                  onChange={(e) => setSelectedGif(e.target.value)}
                  className="term-settings-textinput"
                  style={{ flex: 1 }}
                >
                  <option value="">Select a GIF...</option>
                  {availableGifs.map((g) => (
                    <option key={g.name} value={g.url}>{g.name}</option>
                  ))}
                </select>
                <button 
                  style={{
                    background: 'var(--accent-primary)', border: 'none', 
                    color: '#fff', borderRadius: 4, padding: '0 10px', cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (selectedGif) {
                      setSettings({
                        ...settings,
                        activeGifs: [
                          ...(settings.activeGifs || []), 
                          { id: Date.now(), url: selectedGif, x: 20, y: 20, w: 100, h: 100 }
                        ]
                      });
                      setSelectedGif('');
                    }
                  }}
                >
                  Add
                </button>
              </div>
              {selectedGif && (
                <img src={selectedGif} alt="Preview" className="term-settings-preview" />
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
