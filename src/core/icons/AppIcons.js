import React from 'react';

const e = React.createElement;

// Reusable squircle gradient container
const IconContainer = ({ children, bgGradient, shadow = '0 6px 16px rgba(0,0,0,0.3)', size = 48, className = '' }) =>
  e(
    'div',
    {
      className: `app-icon-squircle ${className}`,
      style: {
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        background: bgGradient,
        boxShadow: shadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        userSelect: 'none',
      },
    },
    // Top gloss sheen
    e('div', {
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '42%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 100%)',
        pointerEvents: 'none',
        borderRadius: `${Math.round(size * 0.22)}px ${Math.round(size * 0.22)}px 0 0`,
      },
    }),
    children
  );

// 1. Files / Finder Icon (Mac-style Finder smiling face / azure folder)
export const FilesIcon = ({ size = 48 }) =>
  e(
    IconContainer,
    { size, bgGradient: 'linear-gradient(145deg, #38BDF8 0%, #0284C7 50%, #0369A1 100%)' },
    e(
      'svg',
      { width: size * 0.65, height: size * 0.65, viewBox: '0 0 32 32', fill: 'none' },
      e('path', {
        d: 'M6 8C6 6.89543 6.89543 6 8 6H24C25.1046 6 26 6.89543 26 8V24C26 25.1046 25.1046 26 24 26H8C6.89543 26 6 25.1046 6 24V8Z',
        fill: '#E0F2FE',
      }),
      e('path', {
        d: 'M16 6H24C25.1046 6 26 6.89543 26 8V24C26 25.1046 25.1046 26 24 26H16V6Z',
        fill: '#BAE6FD',
      }),
      e('circle', { cx: 11.5, cy: 13, r: 1.5, fill: '#0369A1' }),
      e('circle', { cx: 20.5, cy: 13, r: 1.5, fill: '#0369A1' }),
      e('path', {
        d: 'M16 8V18C16 19.5 14.5 20.5 13 20',
        stroke: '#0284C7',
        strokeWidth: 1.75,
        strokeLinecap: 'round',
      }),
      e('path', {
        d: 'M10 21C11.5 23 20.5 23 22 21',
        stroke: '#0369A1',
        strokeWidth: 1.75,
        strokeLinecap: 'round',
      })
    )
  );

// 2. Code Editor Icon (VS Code style folded ribbon & glowing brackets)
export const EditorIcon = ({ size = 48 }) =>
  e(
    IconContainer,
    { size, bgGradient: 'linear-gradient(145deg, #1E293B 0%, #0F172A 100%)' },
    e(
      'svg',
      { width: size * 0.68, height: size * 0.68, viewBox: '0 0 32 32', fill: 'none' },
      e(
        'defs',
        null,
        e(
          'linearGradient',
          { id: 'codeGrad1', x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
          e('stop', { offset: '0%', stopColor: '#38BDF8' }),
          e('stop', { offset: '100%', stopColor: '#2563EB' })
        )
      ),
      e('rect', { x: 4, y: 6, width: 24, height: 20, rx: 4, fill: '#0F172A', stroke: '#334155', strokeWidth: 1 }),
      e('line', { x1: 4, y1: 11, x2: 28, y2: 11, stroke: '#334155', strokeWidth: 1 }),
      e('circle', { cx: 7.5, cy: 8.5, r: 1, fill: '#EF4444' }),
      e('circle', { cx: 10.5, cy: 8.5, r: 1, fill: '#FBBF24' }),
      e('circle', { cx: 13.5, cy: 8.5, r: 1, fill: '#10B981' }),
      e('path', {
        d: 'M11 16L7.5 19L11 22',
        stroke: 'url(#codeGrad1)',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }),
      e('path', {
        d: 'M21 16L24.5 19L21 22',
        stroke: 'url(#codeGrad1)',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }),
      e('path', {
        d: 'M17.5 14.5L14.5 23.5',
        stroke: '#F8FAFC',
        strokeWidth: 2,
        strokeLinecap: 'round',
      })
    )
  );

// 3. Terminal Icon (Apple Terminal style with dark shell & glowing prompt)
export const TerminalIcon = ({ size = 48 }) =>
  e(
    IconContainer,
    { size, bgGradient: 'linear-gradient(145deg, #18181B 0%, #09090B 100%)' },
    e(
      'svg',
      { width: size * 0.68, height: size * 0.68, viewBox: '0 0 32 32', fill: 'none' },
      e('rect', { x: 3, y: 4, width: 26, height: 24, rx: 4, fill: '#121214', stroke: '#27272A', strokeWidth: 1 }),
      e('circle', { cx: 7, cy: 8, r: 1.25, fill: '#EF4444', opacity: 0.8 }),
      e('circle', { cx: 11, cy: 8, r: 1.25, fill: '#F59E0B', opacity: 0.8 }),
      e('circle', { cx: 15, cy: 8, r: 1.25, fill: '#10B981', opacity: 0.8 }),
      e('line', { x1: 3, y1: 12, x2: 29, y2: 12, stroke: '#27272A', strokeWidth: 0.75 }),
      e('path', {
        d: 'M7 16L12 19.5L7 23',
        stroke: '#4ADE80',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }),
      e('line', { x1: 14, y1: 23, x2: 21, y2: 23, stroke: '#F8FAFC', strokeWidth: 2.2, strokeLinecap: 'round' })
    )
  );

// 4. Browser Icon (Safari style blue compass)
export const BrowserIcon = ({ size = 48 }) =>
  e(
    IconContainer,
    { size, bgGradient: 'linear-gradient(145deg, #E0F2FE 0%, #BAE6FD 100%)' },
    e(
      'svg',
      { width: size * 0.76, height: size * 0.76, viewBox: '0 0 36 36', fill: 'none' },
      e(
        'defs',
        null,
        e(
          'radialGradient',
          { id: 'compassBg', cx: '50%', cy: '50%', r: '50%' },
          e('stop', { offset: '0%', stopColor: '#38BDF8' }),
          e('stop', { offset: '60%', stopColor: '#0284C7' }),
          e('stop', { offset: '100%', stopColor: '#0369A1' })
        )
      ),
      e('circle', { cx: 18, cy: 18, r: 16, fill: 'url(#compassBg)', stroke: '#FFFFFF', strokeWidth: 1.5 }),
      e('circle', {
        cx: 18,
        cy: 18,
        r: 12,
        stroke: 'rgba(255,255,255,0.4)',
        strokeWidth: 0.75,
        strokeDasharray: '1.5 2.5',
      }),
      e('line', { x1: 18, y1: 4, x2: 18, y2: 7, stroke: '#FFFFFF', strokeWidth: 1.5, strokeLinecap: 'round' }),
      e('line', { x1: 18, y1: 29, x2: 18, y2: 32, stroke: '#FFFFFF', strokeWidth: 1.5, strokeLinecap: 'round' }),
      e('line', { x1: 4, y1: 18, x2: 7, y2: 18, stroke: '#FFFFFF', strokeWidth: 1.5, strokeLinecap: 'round' }),
      e('line', { x1: 29, y1: 18, x2: 32, y2: 18, stroke: '#FFFFFF', strokeWidth: 1.5, strokeLinecap: 'round' }),
      e('polygon', { points: '18,18 27,9 20.5,15.5', fill: '#EF4444' }),
      e('polygon', { points: '18,18 9,27 15.5,20.5', fill: '#F8FAFC' }),
      e('circle', { cx: 18, cy: 18, r: 2.5, fill: '#FFFFFF' }),
      e('circle', { cx: 18, cy: 18, r: 1.25, fill: '#0284C7' })
    )
  );

// 5. Games Icon (Arcade gamepad)
export const GamesIcon = ({ size = 48 }) =>
  e(
    IconContainer,
    { size, bgGradient: 'linear-gradient(145deg, #818CF8 0%, #4F46E5 50%, #3730A3 100%)' },
    e(
      'svg',
      { width: size * 0.68, height: size * 0.68, viewBox: '0 0 32 32', fill: 'none' },
      e('path', {
        d: 'M8.5 10C5.5 10 3 13 3 17.5C3 22 5 24.5 8 24.5C10 24.5 11.5 22.5 13 21H19C20.5 22.5 22 24.5 24 24.5C27 24.5 29 22 29 17.5C29 13 26.5 10 23.5 10H8.5Z',
        fill: '#1E1B4B',
        stroke: 'rgba(255,255,255,0.25)',
        strokeWidth: 1,
      }),
      e('path', {
        d: 'M9 13V19M6 16H12',
        stroke: '#E2E8F0',
        strokeWidth: 2.2,
        strokeLinecap: 'round',
      }),
      e('circle', { cx: 23, cy: 13.5, r: 1.25, fill: '#FBBF24' }),
      e('circle', { cx: 20.5, cy: 16, r: 1.25, fill: '#38BDF8' }),
      e('circle', { cx: 25.5, cy: 16, r: 1.25, fill: '#EF4444' }),
      e('circle', { cx: 23, cy: 18.5, r: 1.25, fill: '#34D399' }),
      e('circle', { cx: 12, cy: 19.5, r: 1.5, fill: '#475569' }),
      e('circle', { cx: 20, cy: 19.5, r: 1.5, fill: '#475569' })
    )
  );

// 6. Settings Icon (Realistic multi-gear metallic)
export const SettingsIcon = ({ size = 48 }) =>
  e(
    IconContainer,
    { size, bgGradient: 'linear-gradient(145deg, #71717A 0%, #3F3F46 50%, #27272A 100%)' },
    e(
      'svg',
      { width: size * 0.7, height: size * 0.7, viewBox: '0 0 32 32', fill: 'none' },
      e(
        'defs',
        null,
        e(
          'radialGradient',
          { id: 'gearMetal', cx: '50%', cy: '50%', r: '50%' },
          e('stop', { offset: '0%', stopColor: '#F4F4F5' }),
          e('stop', { offset: '60%', stopColor: '#D4D4D8' }),
          e('stop', { offset: '100%', stopColor: '#A1A1AA' })
        )
      ),
      e('path', {
        fillRule: 'evenodd',
        clipRule: 'evenodd',
        d: 'M13.5 3H18.5L19.2 6.1C19.9 6.4 20.6 6.8 21.2 7.3L24.2 6L27.7 9.5L26.4 12.5C26.9 13.1 27.3 13.8 27.6 14.5L30.7 15.2V20.2L27.6 20.9C27.3 21.6 26.9 22.3 26.4 22.9L27.7 25.9L24.2 29.4L21.2 28.1C20.6 28.6 19.9 29 19.2 29.3L18.5 32.4H13.5L12.8 29.3C12.1 29 11.4 28.6 10.8 28.1L7.8 29.4L4.3 25.9L5.6 22.9C5.1 22.3 4.7 21.6 4.4 20.9L1.3 20.2V15.2L4.4 14.5C4.7 13.8 5.1 13.1 5.6 12.5L4.3 9.5L7.8 6L10.8 7.3C11.4 6.8 12.1 6.4 12.8 6.1L13.5 3ZM16 21C18.7614 21 21 18.7614 21 16C21 13.2386 18.7614 11 16 11C13.2386 11 11 13.2386 11 16C11 18.7614 13.2386 21 16 21Z',
        fill: 'url(#gearMetal)',
      }),
      e('circle', { cx: 16, cy: 16, r: 3.2, fill: '#27272A' }),
      e('circle', { cx: 16, cy: 16, r: 1.5, fill: '#52525B' })
    )
  );

// Desktop Document / File Icons
export const MacDocTextIcon = ({ size = 36 }) =>
  e(
    'svg',
    { width: size, height: size, viewBox: '0 0 32 36', fill: 'none', style: { filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.35))' } },
    e('path', {
      d: 'M4 4C4 2.89543 4.89543 2 6 2H19L27 10V32C27 33.1046 26.1046 34 25 34H6C4.89543 34 4 33.1046 4 32V4Z',
      fill: '#FFFFFF',
      stroke: '#CBD5E1',
      strokeWidth: 1,
    }),
    e('path', { d: 'M19 2V10H27', fill: '#E2E8F0', stroke: '#CBD5E1', strokeWidth: 1 }),
    e('line', { x1: 8, y1: 14, x2: 23, y2: 14, stroke: '#94A3B8', strokeWidth: 1.75, strokeLinecap: 'round' }),
    e('line', { x1: 8, y1: 18.5, x2: 23, y2: 18.5, stroke: '#94A3B8', strokeWidth: 1.75, strokeLinecap: 'round' }),
    e('line', { x1: 8, y1: 23, x2: 20, y2: 23, stroke: '#94A3B8', strokeWidth: 1.75, strokeLinecap: 'round' }),
    e('line', { x1: 8, y1: 27.5, x2: 16, y2: 27.5, stroke: '#38BDF8', strokeWidth: 1.75, strokeLinecap: 'round' })
  );

export const MacDocCodeIcon = ({ size = 36, label = 'JS' }) =>
  e(
    'svg',
    { width: size, height: size, viewBox: '0 0 32 36', fill: 'none', style: { filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.35))' } },
    e('path', {
      d: 'M4 4C4 2.89543 4.89543 2 6 2H19L27 10V32C27 33.1046 26.1046 34 25 34H6C4.89543 34 4 33.1046 4 32V4Z',
      fill: '#0F172A',
      stroke: '#334155',
      strokeWidth: 1,
    }),
    e('path', { d: 'M19 2V10H27', fill: '#1E293B', stroke: '#334155', strokeWidth: 1 }),
    e('path', {
      d: 'M11 18L8 21L11 24',
      stroke: '#38BDF8',
      strokeWidth: 1.75,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
    e('path', {
      d: 'M20 18L23 21L20 24',
      stroke: '#38BDF8',
      strokeWidth: 1.75,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
    e('path', { d: 'M17 16L14 26', stroke: '#F8FAFC', strokeWidth: 1.5, strokeLinecap: 'round' }),
    e('rect', { x: 7, y: 27, width: 17, height: 5, rx: 1.5, fill: '#F59E0B' }),
    e('text', { x: 15.5, y: 31, fill: '#000', fontSize: 4, fontWeight: 'bold', textAnchor: 'middle', fontFamily: 'sans-serif' }, label)
  );

export const MacDocImageIcon = ({ size = 36 }) =>
  e(
    'svg',
    { width: size, height: size, viewBox: '0 0 32 36', fill: 'none', style: { filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.35))' } },
    e('path', {
      d: 'M4 4C4 2.89543 4.89543 2 6 2H19L27 10V32C27 33.1046 26.1046 34 25 34H6C4.89543 34 4 33.1046 4 32V4Z',
      fill: '#F8FAFC',
      stroke: '#CBD5E1',
      strokeWidth: 1,
    }),
    e('path', { d: 'M19 2V10H27', fill: '#E2E8F0', stroke: '#CBD5E1', strokeWidth: 1 }),
    e('rect', { x: 7, y: 14, width: 17, height: 14, rx: 2, fill: '#0284C7' }),
    e('circle', { cx: 11, cy: 18, r: 2, fill: '#FBBF24' }),
    e('polygon', { points: '7,26 13,19 18,24 21,21 24,26', fill: '#38BDF8' })
  );
