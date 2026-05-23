import React, { useState, useEffect } from 'react';
import HostDashboard from './components/HostDashboard';
import PlayerClient from './components/PlayerClient';
import { Sparkles, Users, UserCheck } from 'lucide-react';

export default function App() {
  const [role, setRole] = useState('select'); // 'select', 'host', 'player'

  // Tự động nhận diện phòng nếu quét QR qua URL Param ?room=XXXX
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setRole('player');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden select-none">
      
      {/* HIỆU ỨNG SƯƠNG MÙ KHÓI PREMIUM NỀN (FOG LAYERS) */}
      <div className="fog-wrapper">
        <div className="fog-layer" />
        <div className="fog-layer-2" />
      </div>

      {/* HEADER CHUNG */}
      <header className="relative z-10 py-6 text-center border-b border-[#1f2430] border-opacity-40 bg-black bg-opacity-20 backdrop-blur-sm">
        <div className="flex justify-center items-center gap-2">
          <span className="text-xl">🌙</span>
          <h1 className="text-xl font-bold tracking-widest font-serif text-white m-0 uppercase" style={{ fontFamily: 'var(--font-gothic)' }}>
            WEREWOLF OFFLINE
          </h1>
          <span className="text-xl">🐺</span>
        </div>
      </header>

      {/* VÙNG HIỂN THỊ NỘI DUNG CHÍNH CHUYỂN ĐỔI CHẾ ĐỘ */}
      <main className="flex-1 flex items-center justify-center relative z-10 w-full">
        {role === 'select' && (
          <div className="max-w-md w-full mx-auto px-4 py-8 animate-fade-in">
            <div className="glass-panel text-center space-y-6">
              <div className="space-y-2">
                <span className="gothic-subtitle text-xs">BOARD GAME NIGHT</span>
                <h2 className="gothic-title">MA SÓI OFFLINE</h2>
                <p className="text-gray-400 text-xs max-w-[280px] mx-auto leading-relaxed">
                  Ứng dụng trợ lý chia bài và điều phối kịch bản giúp cuộc vui Ma Sói offline cùng bạn bè hoàn hảo 100%.
                </p>
              </div>

              {/* HIỆU ỨNG LỬA TRẠI BẬP BÙNG KỊCH TÍNH Ở MENU CHÍNH */}
              <div className="bonfire-container">
                <div className="fire-glow" />
                <div className="fire-flame flame-1" />
                <div className="fire-flame flame-2" />
                <div className="fire-flame flame-3" />
                <div className="wood-logs" />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button 
                  onClick={() => setRole('host')}
                  className="btn-premium flex justify-center py-3.5 rounded-xl text-sm"
                >
                  <UserCheck className="w-5 h-5" /> Tôi Là Quản Trò (Host)
                </button>
                <button 
                  onClick={() => setRole('player')}
                  className="btn-secondary flex justify-center py-3.5 rounded-xl text-sm border-[#8e44ad] border-opacity-35 hover:border-opacity-100"
                >
                  <Users className="w-5 h-5 text-[#8e44ad]" /> Tôi Là Người Chơi (Join)
                </button>
              </div>
            </div>
          </div>
        )}

        {role === 'host' && (
          <HostDashboard onBackToRoleSelect={() => setRole('select')} />
        )}

        {role === 'player' && (
          <PlayerClient onBackToRoleSelect={() => setRole('select')} />
        )}
      </main>

      {/* FOOTER CHUNG */}
      <footer className="relative z-10 py-4 text-center border-t border-[#1f2430] border-opacity-40 bg-black bg-opacity-20 backdrop-blur-sm">
        <p className="text-[10px] text-gray-500 tracking-wider uppercase font-semibold">
          © {new Date().getFullYear()} Werewolf Offline Premium • Thiết kế bởi Antigravity
        </p>
      </footer>

    </div>
  );
}
