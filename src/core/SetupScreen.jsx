import React, { useState } from 'react';
import './SetupScreen.css';

export default function SetupScreen({ onComplete }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      localStorage.setItem('devos-username', trimmed);
      onComplete(trimmed);
    }
  };

  return (
    <div className="setup-root">
      <div className="setup-box">
        <h1 className="setup-title">Welcome to Vyom OS</h1>
        <p className="setup-subtitle">Let's get started by setting up your profile.</p>
        <form onSubmit={handleSubmit} className="setup-form">
          <input
            type="text"
            className="setup-input"
            placeholder="Enter your name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={32}
            spellCheck={false}
          />
          <button type="submit" className="setup-button" disabled={!name.trim()}>
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
