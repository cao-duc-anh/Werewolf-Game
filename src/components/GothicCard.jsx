import React, { useState } from 'react';
import {
  Shield, Eye, Flame, Skull, Heart,
  Frown, Home, Crosshair, Users, Sparkles
} from 'lucide-react';
import { ROLES } from '../utils';

// Ánh xạ các icon từ Lucide cho từng vai trò trong trường hợp dùng CSS Fallback
const ROLE_ICONS = {
  cupid: Heart,
  bodyguard: Shield,
  werewolf: Skull,
  cursed_wolf: Flame, // Sói Nguyền sở hữu ngọn lửa nguyền rủa ma mị
  wolf_cub: Sparkles, // Sói con lung linh kỳ dị
  serial_killer: Skull,
  witch: Flame,
  seer: Eye,
  hunter: Crosshair,
  villager: Home,
  tanner: Frown
};

// Ánh xạ màu sắc viền/glow CSS cho từng vai trò
const ROLE_CLASSES = {
  werewolf: 'role-werewolf',
  cursed_wolf: 'role-werewolf', // Thuộc dòng máu Ma Sói
  wolf_cub: 'role-werewolf',
  serial_killer: 'role-werewolf',
  villager: 'role-villager',
  tanner: 'role-villager',
  cupid: 'role-special',
  bodyguard: 'role-special',
  witch: 'role-special',
  seer: 'role-special',
  hunter: 'role-special'
};

export default function GothicCard({ roleId, isFlipped, onFlipChange }) {
  const role = ROLES[roleId];
  const IconComponent = ROLE_ICONS[roleId] || Users;
  const roleClass = ROLE_CLASSES[roleId] || 'role-villager';
  const [imageError, setImageError] = useState(false);

  // Đã bổ sung 'cursed_wolf' vào danh sách sử dụng ảnh thực tế
  const hasRealImage = [
    'cupid', 'bodyguard', 'werewolf', 'cursed_wolf', 
    'witch', 'seer', 'hunter', 'villager'
  ].includes(roleId) && !imageError;

  // Compute class for front face, adding placeholder when image error occurs
  const frontFaceClass = `card-face card-back ${roleClass} ${imageError ? 'placeholder' : ''}`;

  return (
    <div
      className={`card-container ${isFlipped ? 'flipped' : ''}`}
      onMouseDown={() => onFlipChange(true)}
      onMouseUp={() => onFlipChange(false)}
      onMouseLeave={() => onFlipChange(false)}
      onTouchStart={(e) => {
        e.preventDefault();
        onFlipChange(true);
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onFlipChange(false);
      }}
    >
      <div className="card-inner">
        {/* MẶT ÚP BÀI (CARD BACK) */}
        <div className="card-face card-front">
          <div className="card-back-content p-4 flex flex-col justify-between h-full">
            <div className="text-xs text-[#f1c40f] tracking-wider uppercase font-bold" style={{ fontFamily: 'var(--font-gothic)' }}>
              {role.team === 'werewolves' ? '🔴 Phe Ma Sói' : role.team === 'neutral' ? '🟡 Phe Thứ Ba' : '🟢 Phe Dân Làng'}
            </div>
            <h3 className="text-2xl font-bold tracking-wide text-white m-0 font-serif" style={{ fontFamily: 'var(--font-gothic)', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              {role.name}
            </h3>
            <div className="bg-black bg-opacity-70 backdrop-blur-sm p-3 rounded-lg border border-white border-opacity-10 text-left mt-auto">
              <p className="text-[11px] leading-relaxed text-gray-300 m-0 select-none">
                {role.description}
              </p>
            </div>
          </div>
        </div>

        {/* MẶT NGỬA BÀI (CARD FRONT) */}
        <div className={frontFaceClass}>
          {hasRealImage ? (
            // DÙNG ẢNH AI GENERATED PREMIUM
            <div className="relative w-full h-full flex flex-col justify-between">
              <div className="absolute inset-0 z-0">
                <img
                  src={role.image}
                  alt={role.name}
                  className="w-full h-full object-cover rounded-xl opacity-90 border border-opacity-20 border-white"
                  onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80 rounded-xl" />
              </div>

              {/* Tên Vai Trò ở đầu thẻ */}
              <div className="relative z-10 text-left">
                <div className="text-xs text-[#f1c40f] tracking-wider uppercase font-bold" style={{ fontFamily: 'var(--font-gothic)' }}>
                  {role.team === 'werewolves' ? '🔴 Phe Ma Sói' : role.team === 'neutral' ? '🟡 Phe Thứ Ba' : '🟢 Phe Dân Làng'}
                </div>
                <h3 className="text-2xl font-bold tracking-wide text-white m-0 font-serif" style={{ fontFamily: 'var(--font-gothic)', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                  {role.name}
                </h3>
              </div>
            </div>
          ) : (
            // FALLBACK CSS/SVG GOTHIC NGHỆ THUẬT CAO
            <div className="w-full h-full flex flex-col justify-between relative z-10">
              <div className="text-left">
                <div className="text-xs text-[#f1c40f] tracking-wider uppercase font-bold" style={{ fontFamily: 'var(--font-gothic)' }}>
                  {role.team === 'werewolves' ? '🔴 Phe Ma Sói' : role.team === 'neutral' ? '🟡 Phe Thứ Ba' : '🟢 Phe Dân Làng'}
                </div>
                <h3 className="text-2xl font-bold tracking-wide text-white m-0 font-serif" style={{ fontFamily: 'var(--font-gothic)' }}>
                  {role.name}
                </h3>
              </div>

              {/* Icon trung tâm của CSS Fallback */}
              <div className="flex-1 flex flex-col items-center justify-center my-4 relative">
                {/* Glow phía sau icon */}
                <div className={`absolute w-24 h-24 rounded-full opacity-20 filter blur-xl ${
                  role.team === 'werewolves' ? 'bg-[#c0392b]' : role.team === 'neutral' ? 'bg-[#f1c40f]' : 'bg-[#8e44ad]'
                }`} />

                <IconComponent className={`w-16 h-16 relative z-10 ${
                  role.team === 'werewolves' ? 'text-[#e74c3c]' : role.team === 'neutral' ? 'text-[#f1c40f]' : 'text-[#9b59b6]'
                }`} />

                <div className="text-xs text-gray-500 mt-3 font-serif tracking-widest uppercase" style={{ fontFamily: 'var(--font-gothic)' }}>
                  TAROT CARD
                </div>
              </div>

              <div className="bg-black bg-opacity-40 p-3 rounded-lg border border-white border-opacity-5 text-left">
                <p className="text-[11px] leading-relaxed text-gray-400 m-0 select-none">
                  {role.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}