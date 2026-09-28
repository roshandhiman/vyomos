import React, { useState, useEffect, useRef } from 'react';
import { vfs } from '../../store/fs';

export default function Vim({ filepath, cwd, onExit }) {
  const [mode, setMode] = useState('NORMAL'); // NORMAL, INSERT, COMMAND
  const [content, setContent] = useState('');
  const [cmdBuf, setCmdBuf] = useState('');
  const [status, setStatus] = useState(`"${filepath || 'No Name'}"`);
  
  const textareaRef = useRef(null);

  useEffect(() => {
    if (filepath) {
      vfs.readFile(filepath)
        .then(data => setContent(data))
        .catch(() => setStatus(`"${filepath}" [New File]`));
    }
  }, [filepath]);

  useEffect(() => {
    if (mode === 'INSERT' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [mode]);

  const handleGlobalKeyDown = async (e) => {
    if (mode === 'NORMAL') {
      if (e.key === 'i') {
        e.preventDefault();
        setMode('INSERT');
        setStatus('-- INSERT --');
      } else if (e.key === ':') {
        e.preventDefault();
        setMode('COMMAND');
        setCmdBuf(':');
      }
    } else if (mode === 'INSERT') {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMode('NORMAL');
        setStatus('');
      }
    } else if (mode === 'COMMAND') {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMode('NORMAL');
        setCmdBuf('');
        setStatus('');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = cmdBuf.slice(1);
        if (cmd === 'w' || cmd === 'wq') {
          if (!filepath) {
            setStatus('E32: No file name');
            setMode('NORMAL');
            setCmdBuf('');
            return;
          }
          try {
            await vfs.writeFile(filepath, content);
            setStatus(`"${filepath}" written`);
            if (cmd === 'wq') onExit();
          } catch (err) {
            setStatus(err.message);
          }
        } else if (cmd === 'q' || cmd === 'q!') {
          onExit();
        } else {
          setStatus(`E492: Not an editor command: ${cmd}`);
        }
        setMode('NORMAL');
        setCmdBuf('');
      } else if (e.key === 'Backspace') {
        if (cmdBuf.length === 1) {
          setMode('NORMAL');
          setCmdBuf('');
        } else {
          setCmdBuf(prev => prev.slice(0, -1));
        }
      } else if (e.key.length === 1) {
        setCmdBuf(prev => prev + e.key);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [mode, cmdBuf, content, filepath]);

  return (
    <div 
      style={{ 
        position: 'absolute', inset: 0, backgroundColor: '#000', color: '#ccc', 
        fontFamily: 'monospace', fontSize: '14px', zIndex: 50, display: 'flex', flexDirection: 'column' 
      }}
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        readOnly={mode !== 'INSERT'}
        style={{
          flex: 1, backgroundColor: 'transparent', color: 'inherit', border: 'none',
          outline: 'none', resize: 'none', padding: '4px', fontFamily: 'inherit', fontSize: 'inherit'
        }}
      />
      <div style={{ height: '20px', backgroundColor: '#222', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
        {mode === 'COMMAND' ? cmdBuf : status}
      </div>
    </div>
  );
}
