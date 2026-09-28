import React from 'react';
import { Code2, Terminal, Globe, Gamepad2, Sparkles } from 'lucide-react';
import './ComingSoon.css';

const ICON_MAP = {
  editor: Code2,
  terminal: Terminal,
  browser: Globe,
  games: Gamepad2,
};

export default function ComingSoon({ appId, title, description }) {
  const Icon = ICON_MAP[appId] || Sparkles;

  return (
    <div className="coming-soon-container">
      <div className="coming-soon-card">
        <div className="coming-soon-icon">
          <Icon size={32} />
        </div>
        <span className="coming-soon-badge">Coming Soon</span>
        <h2 className="coming-soon-title">{title || 'Coming Soon'}</h2>
        <p className="coming-soon-desc">
          {description ||
            'This application is currently under active development. Stay tuned for real-time syntax highlighting, web terminals, sandboxed browsing, and more!'}
        </p>
      </div>
    </div>
  );
}
