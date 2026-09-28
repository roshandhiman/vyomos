import React, { useState, useEffect, useRef } from 'react';
import {
  Images,
  Camera,
  Upload,
  Trash2,
  Download,
  Palette,
  X,
  ChevronLeft,
  ChevronRight,
  FolderHeart,
  Sparkles,
} from 'lucide-react';
import { vfs } from '../../store/fs';
import { useSettingsStore, WALLPAPER_PRESETS } from '../../store/settings';
import { useWindowsStore } from '../../store/windows';
import { APP_REGISTRY } from '../registry';
import './PhotosApp.css';

const PICTURES_PATH = '/home/user/Pictures';

export default function PhotosApp() {
  const [photos, setPhotos] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'camera' | 'wallpapers'
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef(null);
  const setWallpaper = useSettingsStore((state) => state.setWallpaper);
  const openApp = useWindowsStore((state) => state.openApp);

  // Load photos from VFS /home/user/Pictures
  const loadPhotos = async () => {
    try {
      setLoading(true);
      const items = await vfs.list(PICTURES_PATH);
      let imgFiles = items.filter((f) => f.name.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i));

      // If completely empty, seed standard wallpapers so user immediately has great photos
      if (imgFiles.length === 0) {
        const seedSamples = [
          { name: 'Aurora.png', url: WALLPAPER_PRESETS[2]?.url },
          { name: 'Deep Space.png', url: WALLPAPER_PRESETS[7]?.url },
          { name: 'Cosmic.png', url: WALLPAPER_PRESETS[3]?.url },
        ].filter((s) => s.url);

        for (const sample of seedSamples) {
          try {
            await vfs.writeFile(`${PICTURES_PATH}/${sample.name}`, sample.url);
          } catch (e) {}
        }
        const updated = await vfs.list(PICTURES_PATH);
        imgFiles = updated.filter((f) => f.name.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i));
      }

      setPhotos(imgFiles);
    } catch (err) {
      console.warn('Could not list photos', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  // Filtered photos based on sidebar category
  const filteredPhotos = photos.filter((p) => {
    if (activeTab === 'camera') return p.name.startsWith('Photo_');
    if (activeTab === 'wallpapers') return !p.name.startsWith('Photo_');
    return true;
  });

  // Handle Photo Import from User Machine
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target.result;
      const targetPath = `${PICTURES_PATH}/${file.name}`;
      try {
        await vfs.writeFile(targetPath, dataUrl);
        await loadPhotos();
      } catch (err) {
        console.error('Failed to import photo', err);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Delete active photo
  const handleDeletePhoto = async (photo) => {
    try {
      await vfs.remove(photo.path);
      setSelectedPhotoIndex(null);
      await loadPhotos();
    } catch (err) {
      console.error('Failed to delete photo', err);
    }
  };

  // Set as desktop wallpaper
  const handleSetWallpaper = (photo) => {
    // If it's a dataUrl or external url, inject into wallpaper
    const foundPreset = WALLPAPER_PRESETS.find(
      (p) => p.name.toLowerCase() === photo.name.toLowerCase().replace(/\.[^/.]+$/, '')
    );
    if (foundPreset) {
      setWallpaper(foundPreset.id);
    } else {
      // Use photo.content directly as wallpaper
      document.querySelector('.desktop-shell')?.setAttribute(
        'style',
        `background-image: url("${photo.content}"); background-size: cover; background-position: center; background-repeat: no-repeat;`
      );
    }
  };

  // Keyboard navigation inside lightbox
  useEffect(() => {
    const handleKey = (e) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === 'ArrowRight') {
        setSelectedPhotoIndex((i) => (i + 1) % filteredPhotos.length);
      } else if (e.key === 'ArrowLeft') {
        setSelectedPhotoIndex((i) => (i - 1 + filteredPhotos.length) % filteredPhotos.length);
      } else if (e.key === 'Escape') {
        setSelectedPhotoIndex(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedPhotoIndex, filteredPhotos.length]);

  const activePhoto = selectedPhotoIndex !== null ? filteredPhotos[selectedPhotoIndex] : null;

  return (
    <div className="photos-app">
      {/* Hidden File Input for photo uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

      {/* Sidebar */}
      <aside className="photos-sidebar">
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.2rem 0.75rem 0.5rem' }}>
          Library
        </div>
        <button
          className={`photos-nav-item ${activeTab === 'all' ? 'photos-nav-item--active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Images size={15} /> All Photos
        </button>
        <button
          className={`photos-nav-item ${activeTab === 'camera' ? 'photos-nav-item--active' : ''}`}
          onClick={() => setActiveTab('camera')}
        >
          <Camera size={15} /> Camera Shots
        </button>
        <button
          className={`photos-nav-item ${activeTab === 'wallpapers' ? 'photos-nav-item--active' : ''}`}
          onClick={() => setActiveTab('wallpapers')}
        >
          <Palette size={15} /> Wallpapers
        </button>
      </aside>

      {/* Main Gallery Area */}
      <main className="photos-main">
        {/* Toolbar */}
        <header className="photos-toolbar">
          <div className="photos-title-row">
            <span className="photos-title">
              {activeTab === 'all' ? 'All Photos' : activeTab === 'camera' ? 'Camera Shots' : 'Wallpapers'}
            </span>
            <span className="photos-count">
              {filteredPhotos.length} {filteredPhotos.length === 1 ? 'photo' : 'photos'}
            </span>
          </div>

          <div className="photos-toolbar-actions">
            <button
              className="photos-btn"
              onClick={() => openApp('camera', APP_REGISTRY.camera)}
              title="Open Camera"
            >
              <Camera size={14} /> Open Camera
            </button>
            <button
              className="photos-btn photos-btn--primary"
              onClick={() => fileInputRef.current?.click()}
              title="Import Image from your Computer"
            >
              <Upload size={14} /> Import Photo
            </button>
          </div>
        </header>

        {/* Gallery Grid */}
        <div className="photos-grid-scroll">
          {filteredPhotos.length === 0 ? (
            <div className="photos-empty">
              <Images size={48} opacity={0.3} />
              <p>No photos in this album yet.</p>
              <button
                className="photos-btn photos-btn--primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} /> Import Photo
              </button>
            </div>
          ) : (
            <div className="photos-grid">
              {filteredPhotos.map((photo, idx) => (
                <div
                  key={photo.id || idx}
                  className="photo-card"
                  onClick={() => setSelectedPhotoIndex(idx)}
                >
                  <img
                    src={photo.content}
                    alt={photo.name}
                    className="photo-card-img"
                    loading="lazy"
                  />
                  <div className="photo-card-overlay">
                    <span className="photo-card-name" title={photo.name}>
                      {photo.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Lightbox / Full Photo Viewer */}
      {activePhoto && (
        <div className="photos-lightbox-overlay" onClick={() => setSelectedPhotoIndex(null)}>
          <div className="photos-lightbox-header" onClick={(e) => e.stopPropagation()}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{activePhoto.name}</span>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <button
                className="photos-btn"
                onClick={() => handleSetWallpaper(activePhoto)}
                title="Set as Desktop Wallpaper"
              >
                <Palette size={13} /> Set Wallpaper
              </button>
              <a
                href={activePhoto.content}
                download={activePhoto.name}
                className="photos-btn"
                title="Download Photo"
              >
                <Download size={13} /> Download
              </a>
              <button
                className="photos-btn"
                style={{ color: '#EF4444' }}
                onClick={() => handleDeletePhoto(activePhoto)}
                title="Delete Photo"
              >
                <Trash2 size={13} /> Delete
              </button>
              <button
                className="photos-btn"
                onClick={() => setSelectedPhotoIndex(null)}
                title="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="photos-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={activePhoto.content}
              alt={activePhoto.name}
              className="photos-lightbox-img"
            />

            {filteredPhotos.length > 1 && (
              <>
                <button
                  className="photos-lightbox-nav photos-lightbox-prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhotoIndex((i) => (i - 1 + filteredPhotos.length) % filteredPhotos.length);
                  }}
                  title="Previous Photo"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className="photos-lightbox-nav photos-lightbox-next"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhotoIndex((i) => (i + 1) % filteredPhotos.length);
                  }}
                  title="Next Photo"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
