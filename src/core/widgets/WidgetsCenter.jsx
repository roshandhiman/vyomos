import React, { useEffect, useRef, useCallback } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { useWidgetsStore } from '../store/widgets';
import {
  WeatherWidgetContent,
  ClockWidgetContent,
  CalendarWidgetContent,
  StickyNotesWidgetContent,
  SystemStatsWidgetContent,
  StopwatchWidgetContent,
} from './WidgetComponents';
import './WidgetsCenter.css';

function WidgetCardWrapper({ type, title, children }) {
  const isWidgetOnDesktop = useWidgetsStore((state) => state.isWidgetOnDesktop);
  const toggleWidgetOnDesktop = useWidgetsStore((state) => state.toggleWidgetOnDesktop);
  const onDesktop = isWidgetOnDesktop(type);

  return (
    <div className={`widget-card widget-${type}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        <button
          onClick={() => toggleWidgetOnDesktop(type)}
          style={{
            background: onDesktop ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 255, 255, 0.08)',
            color: onDesktop ? '#34C759' : 'var(--text-main)',
            border: `1px solid ${onDesktop ? 'rgba(52, 199, 89, 0.35)' : 'var(--border-medium)'}`,
            borderRadius: '12px',
            fontSize: '0.7rem',
            fontWeight: 600,
            padding: '0.2rem 0.55rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            transition: 'all 0.15s ease',
          }}
          title={onDesktop ? 'Remove from Desktop' : 'Pin to Desktop'}
        >
          {onDesktop ? <Check size={11} strokeWidth={2.5} /> : <Plus size={11} />}
          {onDesktop ? 'On Desktop' : 'Pin to Desktop'}
        </button>
      </div>
      {children}
    </div>
  );
}

export default function WidgetsCenter({ onClose }) {
  const backdropRef = useRef(null);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === backdropRef.current) onClose?.();
    },
    [onClose]
  );

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="widgets-backdrop" ref={backdropRef} onClick={handleBackdropClick}>
      <aside className="widgets-center-panel" role="complementary" aria-label="Widgets Center">
        {/* Header */}
        <div className="widgets-header">
          <div className="widgets-header-left">
            <span className="widgets-title">Widgets</span>
            <span className="widgets-subtitle">{dateStr}</span>
          </div>
          <button className="widgets-close-btn" onClick={onClose} aria-label="Close Widgets">
            <X size={13} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="widgets-scroll-area">
          <WidgetCardWrapper type="weather" title="Weather">
            <WeatherWidgetContent />
          </WidgetCardWrapper>

          <WidgetCardWrapper type="clock" title="Clock & World Time">
            <ClockWidgetContent />
          </WidgetCardWrapper>

          <WidgetCardWrapper type="stopwatch" title="Stopwatch">
            <StopwatchWidgetContent />
          </WidgetCardWrapper>

          <WidgetCardWrapper type="calendar" title="Calendar">
            <CalendarWidgetContent />
          </WidgetCardWrapper>

          <WidgetCardWrapper type="notes" title="Quick Notes">
            <StickyNotesWidgetContent />
          </WidgetCardWrapper>

          <WidgetCardWrapper type="stats" title="System Monitor">
            <SystemStatsWidgetContent />
          </WidgetCardWrapper>
        </div>
      </aside>
    </div>
  );
}
