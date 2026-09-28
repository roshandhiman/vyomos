import React, { useState, useRef } from 'react';
import { X, GripHorizontal, Cloud, Clock, Calendar, StickyNote, Cpu, Timer } from 'lucide-react';
import { useWidgetsStore } from '../store/widgets';
import {
  WeatherWidgetContent,
  ClockWidgetContent,
  CalendarWidgetContent,
  StickyNotesWidgetContent,
  SystemStatsWidgetContent,
  StopwatchWidgetContent,
} from './WidgetComponents';
import './DesktopWidget.css';

const WIDGET_META = {
  weather: { title: 'Weather', icon: Cloud, component: WeatherWidgetContent },
  clock: { title: 'Clock', icon: Clock, component: ClockWidgetContent },
  stopwatch: { title: 'Stopwatch', icon: Timer, component: StopwatchWidgetContent },
  calendar: { title: 'Calendar', icon: Calendar, component: CalendarWidgetContent },
  notes: { title: 'Notes', icon: StickyNote, component: StickyNotesWidgetContent },
  stats: { title: 'System', icon: Cpu, component: SystemStatsWidgetContent },
};

export default function DesktopWidget({ widget }) {
  const { id, type, x, y } = widget;
  const removeWidget = useWidgetsStore((state) => state.removeWidget);
  const updateWidgetPos = useWidgetsStore((state) => state.updateWidgetPos);

  const [dragState, setDragState] = useState(null); // { startX, startY, initX, initY, curX, curY }
  const widgetRef = useRef(null);

  const meta = WIDGET_META[type] || {
    title: 'Widget',
    icon: GripHorizontal,
    component: () => <div>Unknown widget</div>,
  };

  const ContentComponent = meta.component;
  const Icon = meta.icon;

  const handlePointerDown = (e) => {
    // Only drag with left mouse button, and ignore form inputs/buttons
    if (e.button !== 0) return;
    if (e.target.closest('button, input, textarea, a')) return;

    e.stopPropagation();
    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch (err) {}

    setDragState({
      startX: e.clientX,
      startY: e.clientY,
      initX: x,
      initY: y,
      curX: x,
      curY: y,
      hasMoved: false,
    });
  };

  const handlePointerMove = (e) => {
    if (!dragState) return;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    if (!dragState.hasMoved && Math.hypot(dx, dy) < 3) return;

    const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;

    const clampedX = Math.max(10, Math.min(viewportW - 300, dragState.initX + dx));
    const clampedY = Math.max(34, Math.min(viewportH - 120, dragState.initY + dy));

    setDragState((prev) => ({
      ...prev,
      curX: clampedX,
      curY: clampedY,
      hasMoved: true,
    }));

    if (widgetRef.current) {
      widgetRef.current.style.transform = `translate3d(${clampedX - x}px, ${clampedY - y}px, 0)`;
    }
  };

  const handlePointerUp = (e) => {
    if (!dragState) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}

    if (widgetRef.current) {
      widgetRef.current.style.transform = '';
    }

    if (dragState.hasMoved) {
      updateWidgetPos(id, dragState.curX, dragState.curY);
    }

    setDragState(null);
  };

  const currentX = dragState?.hasMoved ? dragState.curX : x;
  const currentY = dragState?.hasMoved ? dragState.curY : y;

  return (
    <div
      ref={widgetRef}
      className={`desktop-widget-wrapper ${dragState?.hasMoved ? 'desktop-widget-wrapper--dragging' : ''}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="desktop-widget-header">
        <div className="desktop-widget-tag">
          <Icon size={13} color="var(--accent-primary)" />
          <span>{meta.title}</span>
        </div>
        <button
          className="desktop-widget-remove-btn"
          onClick={(e) => {
            e.stopPropagation();
            removeWidget(id);
          }}
          title="Remove from Desktop"
          aria-label="Remove Widget"
        >
          <X size={12} />
        </button>
      </div>

      <div className="desktop-widget-body">
        <ContentComponent />
      </div>
    </div>
  );
}
