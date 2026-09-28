import React, { useState, useEffect, useRef } from 'react';
import { vfs } from '../../store/fs';
import './TerminalApp.css';

const INITIAL_TEXT = `WELCOME user`;

export default function TerminalApp() {
  const [history, setHistory] = useState([
    { id: 1, type: 'output', content: INITIAL_TEXT }
  ]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('/home/user');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

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

  const handleCommand = async (cmdString) => {
    const trimmed = cmdString.trim();
    if (!trimmed) return;

    print(`${cwd} $ ${trimmed}`, 'command');
    setCmdHistory((prev) => [trimmed, ...prev]);
    setHistoryIdx(-1);

    const [cmd, ...args] = trimmed.split(' ').filter(Boolean);

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
        break;
      case 'clear':
        setHistory([]);
        break;
      case 'pwd':
        print(cwd);
        break;
      case 'whoami':
        print('user');
        break;
      case 'date':
        print(new Date().toString());
        break;
      case 'echo':
        print(args.join(' '));
        break;
      case 'ls':
        try {
          const target = args[0] || cwd;
          let searchPath = target;
          if (target.startsWith('/')) {
             // Absolute
          } else if (target === '..') {
             searchPath = cwd.split('/').slice(0, -1).join('/') || '/';
          } else {
             searchPath = cwd === '/' ? `/${target}` : `${cwd}/${target}`;
          }
          const items = await vfs.list(searchPath);
          if (items.length === 0) {
             // empty
          } else {
            const out = items.map(i => i.type === 'folder' ? `${i.name}/` : `${i.name}`).join('  ');
            print(out);
          }
        } catch (e) {
          print(`ls: cannot access '${args[0]}': No such file or directory`);
        }
        break;
      case 'cd':
        try {
          const target = args[0] || '/home/user';
          let searchPath = target;
          if (target.startsWith('/')) {
             // Absolute
          } else if (target === '..') {
             searchPath = cwd.split('/').slice(0, -1).join('/') || '/';
          } else {
             searchPath = cwd === '/' ? `/${target}` : `${cwd}/${target}`;
          }
          // Verify it's a directory
          await vfs.list(searchPath); 
          setCwd(searchPath);
        } catch (e) {
          print(`cd: ${args[0]}: No such file or directory`);
        }
        break;
      default:
        print(`Command not found: ${cmd}`);
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
    <div className="basic-term-root" onClick={() => inputRef.current?.focus()}>
      <div className="basic-term-output">
        {history.map((line) => (
          <div key={line.id} className={`basic-line basic-line--${line.type}`}>
            {line.content}
          </div>
        ))}
        
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
            autoFocus
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
