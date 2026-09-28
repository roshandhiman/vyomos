import React, { useState } from 'react';
import MacOSDock from './mac-os-dock';

// Sample app data with actual macOS-style icons
const sampleApps = [
  { 
    id: 'finder', 
    name: 'Finder', 
    icon: 'https://cdn.21st.dev/assets/mirror/99/9963f31f43cd77b0c28981ba7bac04db749a5749019f554d1afb75225a3e9151.png' 
  },
  { 
    id: 'calculator', 
    name: 'Calculator', 
    icon: 'https://cdn.21st.dev/assets/mirror/96/9639bd0ec3bae0b56bd8812f61c39d72123c6de272922e5bc7f3a24264112953.png' 
  },
  { 
    id: 'terminal', 
    name: 'Terminal', 
    icon: 'https://cdn.21st.dev/assets/mirror/11/11d8587bae8852b8232d1f37e318c4b0fbbd2b0f2b61c71a79dbae327b4fa0c1.webp' 
  },
  { 
    id: 'mail', 
    name: 'Mail', 
    icon: 'https://cdn.21st.dev/assets/mirror/7b/7bb8671183d2a2bbb8a3858b1971cc5699ba0103673b011590d22f0fa309bb87.png' 
  },
  { 
    id: 'notes', 
    name: 'Notes', 
    icon: 'https://cdn.21st.dev/assets/mirror/cb/cbfa4e5db383bbb86683edc2f7d309e9fd7000d07833f6449837be51b77558fa.png' 
  },
  { 
    id: 'safari', 
    name: 'Safari', 
    icon: 'https://cdn.21st.dev/assets/mirror/d5/d558230225bb0dd1897db6c7cf0d03b29506eef8078fe25313c48cd8f72d05ad.png' 
  },
  { 
    id: 'photos', 
    name: 'Photos', 
    icon: 'https://cdn.21st.dev/assets/mirror/45/45c61147b702b2765802969df55878aa5f69e27abe656174339dc661d0f9a31d.png' 
  },
  { 
    id: 'music', 
    name: 'Music', 
    icon: 'https://cdn.21st.dev/assets/mirror/03/035600d3c05ccbfc974888a3319fa721dac7321dd18734a5d0405af1fd259c41.png' 
  },
  { 
    id: 'calendar', 
    name: 'Calendar', 
    icon: 'https://cdn.21st.dev/assets/mirror/e1/e1e93987488d4a904f4b7273213d36319c73d81ca9680b440c144f69af5a7f9a.png' 
  },
];

const DockDemo: React.FC = () => {
  const [openApps, setOpenApps] = useState<string[]>(['finder', 'safari']);

  const handleAppClick = (appId: string) => {
    console.log('App clicked:', appId);
    
    // Toggle app in openApps array
    setOpenApps(prev => 
      prev.includes(appId) 
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    );
  };

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      {/* The Dock Component */}
      <MacOSDock
        apps={sampleApps}
        onAppClick={handleAppClick}
        openApps={openApps}
      />
    </div>
  );
};

export default DockDemo;
