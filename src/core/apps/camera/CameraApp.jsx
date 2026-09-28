import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, RefreshCw, Timer, AlertCircle, Images } from 'lucide-react';
import { vfs } from '../../store/fs';
import { useWindowsStore } from '../../store/windows';
import { APP_REGISTRY } from '../registry';
import './CameraApp.css';

const PICTURES_PATH = '/home/user/Pictures';

const FILTERS = [
  { id: 'normal', name: 'Normal' },
  { id: 'bw', name: 'Mono' },
  { id: 'vintage', name: 'Vintage' },
  { id: 'neon', name: 'Cyber' },
  { id: 'warm', name: 'Warm' },
  { id: 'cool', name: 'Cool' },
];

export default function CameraApp({ minimized = false }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [activeFilter, setActiveFilter] = useState('normal');
  const [timerMode, setTimerMode] = useState(false); // false = instant, true = 3s
  const [countdown, setCountdown] = useState(null);
  const [flashing, setFlashing] = useState(false);
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [streamActive, setStreamActive] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  const openApp = useWindowsStore((state) => state.openApp);

  // Play realistic shutter click using Web Audio API
  const playShutterSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // Audio not permitted or supported
    }
  };

  // Tracks whether the component is still mounted — prevents the async race
  // where getUserMedia resolves AFTER unmount and leaves the LED on.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Stop camera tracks and release hardware (synchronous, safe to call anytime)
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  }, []);

  // Start webcam — race-condition safe
  const startCamera = useCallback(async () => {
    try {
      setPermissionError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });

      // If the component unmounted while getUserMedia was pending, kill the
      // stream immediately — this is what keeps the green LED from staying on.
      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => { t.stop(); t.enabled = false; });
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreamActive(true);
    } catch (err) {
      if (!mountedRef.current) return; // already gone, ignore
      console.warn('Camera access issue:', err);
      setPermissionError(err.message || 'Camera permission denied or camera not found.');
      setStreamActive(false);
    }
  }, []);

  // Single camera lifecycle effect: start/stop based on minimized prop.
  // Cleanup runs on unmount (window close) AND whenever minimized changes to true.
  useEffect(() => {
    if (minimized) {
      stopCamera();
    } else {
      startCamera();
    }
    return () => {
      // This fires when the window is closed (component unmounts).
      // If startCamera is still mid-await, mountedRef.current = false will
      // cause it to stop the stream the moment getUserMedia resolves.
      stopCamera();
    };
  }, [minimized, startCamera, stopCamera]);

  // Extra safety: release camera if the browser tab/page is closed
  useEffect(() => {
    const handleUnload = () => stopCamera();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [stopCamera]);

  // Fetch recent photos from VFS Pictures folder
  const loadRecentPhotos = async () => {
    try {
      const files = await vfs.list(PICTURES_PATH);
      const images = files.filter((f) => f.name.match(/\.(png|jpg|jpeg|webp)$/i));
      setRecentPhotos(images.slice(-3).reverse());
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    loadRecentPhotos();
  }, []);

  // Capture Frame
  const performCapture = async () => {
    setFlashing(true);
    playShutterSound();
    setTimeout(() => setFlashing(false), 350);

    const canvas = document.createElement('canvas');
    const width = 1280;
    const height = 720;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Apply active filter to 2D canvas context
    if (activeFilter === 'bw') ctx.filter = 'grayscale(100%) contrast(120%)';
    else if (activeFilter === 'vintage') ctx.filter = 'sepia(60%) contrast(110%) brightness(90%)';
    else if (activeFilter === 'neon') ctx.filter = 'contrast(140%) saturate(180%) hue-rotate(45deg)';
    else if (activeFilter === 'warm') ctx.filter = 'sepia(30%) saturate(140%)';
    else if (activeFilter === 'cool') ctx.filter = 'contrast(110%) hue-rotate(180deg) saturate(120%)';
    else ctx.filter = 'none';

    if (streamActive && videoRef.current) {
      // Mirror horizontal for selfie view
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, width, height);
    } else {
      // Generate artistic demo photo if no camera stream available
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#0F172A');
      grad.addColorStop(0.5, '#0284C7');
      grad.addColorStop(1, '#38BDF8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Vyom OS Camera Snapshot', width / 2, height / 2 - 20);

      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#E0F2FE';
      ctx.fillText(new Date().toLocaleString(), width / 2, height / 2 + 35);
    }

    const dataUrl = canvas.toDataURL('image/png');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `Photo_${timestamp}.png`;
    const targetPath = `${PICTURES_PATH}/${fileName}`;

    try {
      await vfs.writeFile(targetPath, dataUrl);
      await loadRecentPhotos();
    } catch (err) {
      console.error('Failed to save captured photo', err);
    }
  };

  const handleShutterClick = () => {
    if (timerMode) {
      let count = 3;
      setCountdown(count);
      const timer = setInterval(() => {
        count--;
        if (count <= 0) {
          clearInterval(timer);
          setCountdown(null);
          performCapture();
        } else {
          setCountdown(count);
        }
      }, 1000);
    } else {
      performCapture();
    }
  };

  return (
    <div className="camera-app">
      {/* Viewfinder */}
      <div className="camera-viewfinder-container">
        {streamActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`camera-video camera-filter--${activeFilter}`}
          />
        ) : (
          <div className="camera-fallback">
            <AlertCircle size={44} color="#F59E0B" />
            <div className="camera-fallback-title">Connecting Camera...</div>
            <div className="camera-fallback-desc">
              {permissionError || 'Requesting camera stream from your MacBook...'}
            </div>
            <button
              className="camera-filter-btn camera-filter-btn--active"
              style={{ marginTop: '0.5rem', padding: '0.45rem 1rem' }}
              onClick={startCamera}
            >
              <RefreshCw size={13} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
              Retry Connection
            </button>
          </div>
        )}

        {/* Shutter flash overlay */}
        <div className={`camera-flash-overlay ${flashing ? 'camera-flash-overlay--active' : ''}`} />

        {/* 3s Countdown */}
        {countdown !== null && (
          <div className="camera-countdown-overlay">
            <span>{countdown}</span>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="camera-bottom-bar">
        {/* Filters */}
        <div className="camera-filters-row">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`camera-filter-btn ${activeFilter === f.id ? 'camera-filter-btn--active' : ''}`}
              onClick={() => setActiveFilter(f.id)}
            >
              {f.name}
            </button>
          ))}
        </div>

        {/* Main Action Bar */}
        <div className="camera-actions-row">
          {/* Timer button */}
          <button
            className={`camera-action-btn ${timerMode ? 'camera-action-btn--active' : ''}`}
            onClick={() => setTimerMode((t) => !t)}
            title={timerMode ? '3s Timer (Active)' : 'Instant Shutter'}
          >
            <Timer size={18} />
          </button>

          {/* Shutter trigger button */}
          <button
            className="camera-shutter-outer"
            onClick={handleShutterClick}
            title="Take Photo"
            aria-label="Capture Photo"
          >
            <div className="camera-shutter-inner" />
          </button>

          {/* Photos / Albums Shortcut */}
          <div className="camera-recent-strip">
            {recentPhotos.length > 0 && recentPhotos[0].content ? (
              <img
                src={recentPhotos[0].content}
                alt="Recent"
                className="camera-thumb"
                title="Open in Photos"
                onClick={() => openApp('photos', APP_REGISTRY.photos)}
              />
            ) : (
              <button
                className="camera-action-btn"
                title="Open Photos Album"
                onClick={() => openApp('photos', APP_REGISTRY.photos)}
              >
                <Images size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
