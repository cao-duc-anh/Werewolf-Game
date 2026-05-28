import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ROLES, GAME_PRESETS, shuffleRoles } from '../utils';
import { 
  Users, Play, Shield, Eye, Flame, Skull, 
  HelpCircle, ChevronRight, CheckCircle2, History,
  Moon, Sun, Plus, Minus, ArrowLeft, RefreshCw, AlertTriangle, Settings, Layers
} from 'lucide-react';

// =============================================================================
// COMPONENT CON: BẢNG CHỌN CẤU HÌNH BỘ BÀI (Đã tối ưu hóa theo chế độ phòng)
// =============================================================================
function RoleConfigPanel({
  roomMode,
  selectedPreset, onPresetSelect,
  customRoles, onCustomChange,
  totalCards
}) {
  const currentPreset = GAME_PRESETS.find(p => p.id === selectedPreset);

  return (
    <div className="bg-[#0b0e14] bg-opacity-80 border border-[#272935] rounded-xl p-4 text-left space-y-3 shadow-lg">
      <span className="text-[10px] uppercase tracking-widest text-[#8e44ad] font-bold block">
        Cấu Hình Bộ Bài ({roomMode === 'custom' ? 'Tùy Chỉnh' : 'Mặc Định'})
      </span>

      {/* CHẾ ĐỘ MẶC ĐỊNH: Chỉ cho phép chọn bộ bài mẫu có sẵn */}
      {roomMode === 'preset' && (
        <div className="space-y-2">
          <select
            value={selectedPreset}
            onChange={(e) => onPresetSelect(e.target.value)}
            className="gothic-select text-xs py-2"
          >
            {GAME_PRESETS.map(p => (
              <option key={p.id} value={p.id}>{p.name} — {p.playerCount} người</option>
            ))}
          </select>
          {currentPreset && (
            <p className="text-[10px] text-gray-400 leading-relaxed m-0 px-1 pt-1">
              {currentPreset.description}
            </p>
          )}
        </div>
      )}

      {/* CHẾ ĐỘ CUSTOM: Chỉ hiện danh sách tăng giảm số lượng bài */}
      {roomMode === 'custom' && (
        <div className="scroll-diary space-y-2 max-h-[260px] overflow-y-auto pr-1">
          {Object.entries(ROLES).map(([roleId, role]) => (
            <div
              key={roleId}
              className="flex items-center justify-between bg-[#121622] bg-opacity-50 border border-[#1f2430] p-2.5 rounded-xl transition-all hover:bg-opacity-80 hover:border-gray-800"
            >
              <div>
                <div className="text-xs font-bold text-gray-200">{role.name}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                  {role.team === 'werewolves' ? '🔴 Sói' : role.team === 'neutral' ? '🟡 Phe 3' : '🟢 Dân'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onCustomChange(roleId, -1)}
                  className="w-6 h-6 rounded-full bg-[#1b2132] hover:bg-[#8e44ad] hover:text-white transition-all flex items-center justify-center text-gray-400"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-bold text-sm w-4 text-center">{customRoles[roleId]}</span>
                <button
                  onClick={() => onCustomChange(roleId, 1)}
                  className="w-6 h-6 rounded-full bg-[#1b2132] hover:bg-[#8e44ad] hover:text-white transition-all flex items-center justify-center text-gray-400"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Thống kê số lượng lá bài tổng */}
      <div className="flex items-center justify-between pt-1 border-t border-[#121622]">
        <div className="flex items-center gap-2 text-[10px] font-semibold text-[#8e44ad]">
          <span>🃏 Tổng cộng: {totalCards} lá bài</span>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded bg-[#1b2132] text-gray-400 uppercase tracking-wider font-bold">
          {roomMode === 'custom' ? '🛠️ Mode Custom' : '📋 Mode Preset'}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENT CHÍNH: HOST DASHBOARD
// =============================================================================
export default function HostDashboard({ onBackToRoleSelect }) {
  const [step, setStep] = useState('setup'); // 'setup', 'lobby', 'play'
  const [roomCode, setRoomCode] = useState('');
  const [roomMode, setRoomMode] = useState('preset'); // 'preset' hoặc 'custom'

  // --- Cấu hình bộ bài ---
  const [customRoles, setCustomRoles] = useState({
    werewolf: 2, cursed_wolf: 0, wolf_cub: 0, seer: 1, bodyguard: 1,
    witch: 0, hunter: 0, cupid: 0, serial_killer: 0,
    villager: 4, tanner: 0
  });
  const [selectedPreset, setSelectedPreset] = useState('standard_8');

  const [playersList, setPlayersList] = useState([]);
  const [gameRoom, setGameRoom] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastWinner, setLastWinner] = useState(null);

  // --- Gameplay state ---
  const [viewMode, setViewMode] = useState('wizard');
  const [currentDay, setCurrentDay] = useState(0);
  const [currentNightStep, setCurrentNightStep] = useState(0);
  const [nightWizardSteps, setNightWizardSteps] = useState([]);
  const [gameLogs, setGameLogs] = useState([]);
  const [nightSelections, setNightSelections] = useState({
    protectedPlayer: null, werewolfTarget: null, witchHealUsed: false,
    witchKillTarget: null, seerTarget: null, cupidTargets: [], serialKillerTarget: null,
    curseActivatedTonight: false // Đăng ký thêm hành động nguyền rủa trong đêm
  });
  const [witchPotions, setWitchPotions] = useState({ hasHeal: true, hasPoison: true });
  const [cursedWolfConfig, setCursedWolfConfig] = useState({ hasCurse: true }); // Quản lý bình nguyền (1 lần duy nhất)
  const [lovers, setLovers] = useState([]);

  // Lắng nghe realtime từ phòng
  useEffect(() => {
    if (!roomCode || step === 'setup') return;
    fetchPlayers();
    const subscription = supabase
      .channel(`host_players_${roomCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomCode}` }, () => { fetchPlayers(); })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [roomCode, step]);

  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from('players').select('*').eq('room_id', roomCode).order('joined_at', { ascending: true });
    if (!error) setPlayersList(data || []);
  };

  // Lấy danh sách bài chuẩn chỉ dựa theo Chế độ phòng đã chọn
  const getSelectedRolesList = () => {
    if (roomMode === 'preset') {
      const preset = GAME_PRESETS.find(p => p.id === selectedPreset);
      return preset ? preset.roles : [];
    }
    
    // Nếu là Custom, bóc tách chính xác từng lá bài được tăng giảm
    const list = [];
    Object.entries(customRoles).forEach(([roleId, count]) => {
      for (let i = 0; i < count; i++) list.push(roleId);
    });
    return list;
  };

  const handleCustomCountChange = (roleId, delta) => {
    setCustomRoles(prev => ({ ...prev, [roleId]: Math.max(0, prev[roleId] + delta) }));
  };

  // TẠO PHÒNG — Nhận tham số loại chế độ phòng để thiết lập logic khóa cứng
  const handleCreateRoom = async (mode) => {
    setIsLoading(true);
    setErrorMsg('');
    setRoomMode(mode);

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert({ 
          id: code, 
          status: 'waiting', 
          current_day: 0, 
          config: { roomMode: mode }, // Lưu kèm vào config database để đồng bộ nếu cần
          logs: [], 
          winner: null 
        })
        .select().single();
      
      if (error) throw error;
      setRoomCode(code);
      setGameRoom(data);
      setStep('lobby');
    } catch (e) {
      console.error(e);
      setErrorMsg('Lỗi tạo phòng. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  // BẮT ĐẦU GAME & CHIA BÀI THEO ĐÚNG LOGIC PHÒNG
  const handleStartGame = async () => {
    let rolesConfig = getSelectedRolesList();
    if (playersList.length === 0) {
      setErrorMsg('Phòng chưa có ai tham gia.');
      return;
    }
    if (rolesConfig.length < 4) {
      setErrorMsg('Cấu hình bộ bài phải có ít nhất 4 vai trò mới có thể bắt đầu.');
      return;
    }

    // Xử lý lệch người ở chế độ Mặc định (Preset). 
    if (playersList.length < rolesConfig.length) {
      const targetCount = playersList.length;
      const wolfRoles = ['werewolf', 'wolf_cub', 'cursed_wolf'];
      const wolfPool = rolesConfig.filter(r => wolfRoles.includes(r));
      const nonWolfRoles = rolesConfig.filter(r => !wolfRoles.includes(r));
      const wolfCount = Math.max(1, Math.floor(targetCount / 4));
      const selectedWolves = shuffleRoles(wolfPool).slice(0, wolfCount);
      const selectedOthers = shuffleRoles(nonWolfRoles).slice(0, targetCount - selectedWolves.length);
      let trimmed = [...selectedWolves, ...selectedOthers];
      while (trimmed.length < targetCount) trimmed.push('villager');
      rolesConfig = trimmed;
    }

    if (playersList.length > rolesConfig.length) {
      setErrorMsg(`Số người hiện tại (${playersList.length}) đang nhiều hơn số lá bài cấu hình (${rolesConfig.length}).`);
      return;
    }

    setIsLoading(true);
    try {
      const shuffled = shuffleRoles(rolesConfig);
      await Promise.all(playersList.map((player, index) =>
        supabase.from('players').update({ role: shuffled[index], is_alive: true }).eq('id', player.id)
      ));
      const { data: updatedRoom, error } = await supabase
        .from('rooms').update({ status: 'night_phase', current_day: 0 }).eq('id', roomCode).select().single();
      if (error) throw error;
      setGameRoom(updatedRoom);
      setCurrentDay(0);
      generateNightWizardSteps(rolesConfig, 0);
      setStep('play');
    } catch (e) {
      console.error('Lỗi chia bài:', e);
      setErrorMsg('Đã xảy ra lỗi khi chia bài.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNightWizardSteps = (activeRoleIds, dayNum) => {
    const uniqueRoles = [...new Set(activeRoleIds)];
    const steps = uniqueRoles
      .map(id => ROLES[id])
      .filter(role => role && role.priority < 100)
      .sort((a, b) => a.priority - b.priority)
      .filter(role => {
        if (role.id === 'cupid' && dayNum > 0) return false;
        if (role.id === 'wolf_cub') return false;
        return true;
      });
    setNightWizardSteps(steps);
    setCurrentNightStep(0);
    setNightSelections({
      protectedPlayer: null, werewolfTarget: null, witchHealUsed: false,
      witchKillTarget: null, seerTarget: null,
      cupidTargets: dayNum === 0 ? [] : nightSelections.cupidTargets,
      serialKillerTarget: null,
      curseActivatedTonight: false
    });
  };

  const handleToggleAlive = async (playerId, currentStatus) => {
    try {
      await supabase.from('players').update({ is_alive: !currentStatus }).eq('id', playerId);
      fetchPlayers();
    } catch (e) { console.error(e); }
  };

  const handleWizardNext = () => {
    if (currentNightStep < nightWizardSteps.length - 1) {
      setCurrentNightStep(prev => prev + 1);
    } else {
      handleEndNight();
    }
  };

  const handleEndNight = async () => {
    setIsLoading(true);
    let deadTonight = [];
    let logString = `Đêm ${currentDay + 1}: `;

    if (currentDay === 0 && nightSelections.cupidTargets.length === 2) {
      const l1 = playersList.find(p => p.id === nightSelections.cupidTargets[0]);
      const l2 = playersList.find(p => p.id === nightSelections.cupidTargets[1]);
      if (l1 && l2) logString += `Cupid đã se duyên cho [${l1.name}] và [${l2.name}]. `;
    }

    let werewolfVictim = nightSelections.werewolfTarget;
    let isSavedByBodyguard = werewolfVictim && werewolfVictim === nightSelections.protectedPlayer;
    let isSavedByWitch = werewolfVictim && nightSelections.witchHealUsed && witchPotions.hasHeal;
    let isCursedSuccess = werewolfVictim && nightSelections.curseActivatedTonight && cursedWolfConfig.hasCurse && !isSavedByBodyguard;

    if (werewolfVictim) {
      if (isSavedByBodyguard) {
        logString += `Lũ Sói cắn [${playersList.find(p => p.id === werewolfVictim)?.name}]. Nhưng đã được Bảo Vệ bảo vệ thành công! `;
      } else if (isCursedSuccess) {
        // LOGIC SÓI NGUYỀN KÍCH HOẠT: Thay đổi vai trò người chơi thành Ma Sói trên Database trực tiếp
        const cursedPlayer = playersList.find(p => p.id === werewolfVictim);
        logString += `Sói Nguyền đã yểm bùa nạn nhân bị cắn đêm nay! [${cursedPlayer?.name}] không chết mà đã biến thành Ma Sói mới 🐺. `;
        
        await supabase.from('players').update({ role: 'werewolf' }).eq('id', werewolfVictim);
        setCursedWolfConfig({ hasCurse: false }); // Vô hiệu hóa quyền năng cho ván sau
        
        // Nếu phù thủy lỡ cứu người này, bình cứu coi như bị mất tác dụng nhưng bình thuốc của phù thủy vẫn bị trừ (tùy thuộc độ khắc nghiệt)
        if (isSavedByWitch) {
          setWitchPotions(prev => ({ ...prev, hasHeal: false }));
        }
      } else {
        logString += `Lũ Sói cắn [${playersList.find(p => p.id === werewolfVictim)?.name}]. `;
        if (isSavedByWitch) {
          logString += `Nhưng Phù Thủy đã dùng bình thuốc cứu sống! `;
          setWitchPotions(prev => ({ ...prev, hasHeal: false }));
        } else {
          deadTonight.push(werewolfVictim);
        }
      }
    }

    if (nightSelections.serialKillerTarget) {
      logString += `Sát Thủ đâm lén [${playersList.find(p => p.id === nightSelections.serialKillerTarget)?.name}]. `;
      deadTonight.push(nightSelections.serialKillerTarget);
    }

    if (nightSelections.witchKillTarget && witchPotions.hasPoison) {
      logString += `Phù Thủy đã đầu độc [${playersList.find(p => p.id === nightSelections.witchKillTarget)?.name}]. `;
      deadTonight.push(nightSelections.witchKillTarget);
      setWitchPotions(prev => ({ ...prev, hasPoison: false }));
    }

    if (nightSelections.seerTarget) {
      const t = playersList.find(p => p.id === nightSelections.seerTarget);
      logString += `Tiên Tri soi [${t?.name}] thấy Phe ${['werewolf','wolf_cub','cursed_wolf'].includes(t?.role) ? 'Sói 😈' : 'Dân 😇'}. `;
    }

    deadTonight = [...new Set(deadTonight)];

    if (lovers.length === 2) {
      const [l1, l2] = lovers;
      if (deadTonight.includes(l1) && !deadTonight.includes(l2)) {
        deadTonight.push(l2);
        logString += `[${playersList.find(p => p.id === l2)?.name}] đã tự sát chết theo người yêu. `;
      } else if (deadTonight.includes(l2) && !deadTonight.includes(l1)) {
        deadTonight.push(l1);
        logString += `[${playersList.find(p => p.id === l1)?.name}] đã tự sát chết theo người yêu. `;
      }
    }

    deadTonight = [...new Set(deadTonight)];

    if (deadTonight.length > 0) {
      await Promise.all(deadTonight.map(id => supabase.from('players').update({ is_alive: false }).eq('id', id)));
      logString += `Kết quả sáng ra: [${deadTonight.map(id => playersList.find(p => p.id === id)?.name).join(', ')}] đã qua đời.`;
    } else {
      logString += `Đêm qua trôi qua yên bình, không ai qua đời cả.`;
    }

    const newLogs = [...gameLogs, logString];
    setGameLogs(newLogs);

    try {
      const nextDay = currentDay + 1;
      const { data: updatedRoom, error } = await supabase
        .from('rooms').update({ status: 'day_phase', current_day: nextDay, logs: newLogs }).eq('id', roomCode).select().single();
      if (error) throw error;
      setGameRoom(updatedRoom);
      setCurrentDay(nextDay);
      setViewMode('reference');
      fetchPlayers();
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleStartNextNight = async () => {
    setIsLoading(true);
    try {
      const { data: updatedRoom, error } = await supabase
        .from('rooms').update({ status: 'night_phase' }).eq('id', roomCode).select().single();
      if (error) throw error;
      setGameRoom(updatedRoom);
      generateNightWizardSteps(getSelectedRolesList(), currentDay);
      setViewMode('wizard');
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleEndGame = async (winnerTeam) => {
    if (!window.confirm(`Bạn có chắc chắn muốn kết thúc game và công bố chiến thắng cho Phe ${
      winnerTeam === 'villagers' ? 'DÂN LÀNG 😇' : winnerTeam === 'werewolves' ? 'MA SÓI 😈' : 'SÁT THỦ 🔪'
    }?`)) return;

    setIsLoading(true);
    try {
      await supabase.from('rooms')
        .update({ status: 'waiting', winner: winnerTeam, current_day: 0, logs: [] })
        .eq('id', roomCode);
      await supabase.from('players')
        .update({ role: null, is_alive: true })
        .eq('room_id', roomCode);

      // Reset hoàn toàn ván đấu
      setCurrentDay(0);
      setGameLogs([]);
      setNightWizardSteps([]);
      setWitchPotions({ hasHeal: true, hasPoison: true });
      setCursedWolfConfig({ hasCurse: true });
      setLovers([]);
      setNightSelections({
        protectedPlayer: null, werewolfTarget: null, witchHealUsed: false,
        witchKillTarget: null, seerTarget: null, cupidTargets: [], serialKillerTarget: null,
        curseActivatedTonight: false
      });
      setLastWinner(winnerTeam);
      fetchPlayers();
      setStep('lobby');
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleResetSetup = async () => {
    const msg = step === 'play'
      ? 'Hủy phòng giữa chừng? Tất cả người chơi sẽ bị đá ra và ván đấu kết thúc ngay!'
      : 'Xóa phòng này? Tất cả người chơi đang ở trong sẽ bị đá ra ngoài.';

    if (!window.confirm(msg)) return;

    setIsLoading(true);
    try {
      if (roomCode) {
        // Bước 1: cập nhật status = 'disbanded' TRƯỚC
        // → PlayerClient nhận realtime event và tự kick về màn hình join
        await supabase.from('rooms')
          .update({ status: 'disbanded' })
          .eq('id', roomCode);

        // Bước 2: xóa toàn bộ người chơi
        await supabase.from('players')
          .delete()
          .eq('room_id', roomCode);

        // Bước 3: xóa phòng
        await supabase.from('rooms')
          .delete()
          .eq('id', roomCode);
      }

      setRoomCode('');
      setPlayersList([]);
      setLastWinner(null);
      setGameRoom(null);
      setStep('setup');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-start max-w-4xl w-full mx-auto px-4 py-6 relative z-10">

      {/* STEP 1: SETUP */}
      {step === 'setup' && (
        <div className="glass-panel animate-fade-in space-y-6 max-w-md mx-auto w-full text-center">
          <div className="text-left">
            <button
              onClick={onBackToRoleSelect}
              className="flex items-center text-xs text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
            </button>
          </div>

          <div>
            <h2 className="gothic-title">TẠO PHÒNG QUẢN TRÒ</h2>
            <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto leading-relaxed">
              Chọn một trong hai phương thức thiết lập phòng chơi dưới đây để bắt đầu ván Ma Sói.
            </p>
          </div>

          {errorMsg && (
            <div className="text-xs text-red-500 bg-red-950 bg-opacity-30 border border-red-900 border-opacity-40 rounded-lg p-3">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 pt-2">
            <button
              onClick={() => handleCreateRoom('preset')}
              disabled={isLoading}
              className="setup-card preset w-full group"
            >
              <div className="p-2.5 rounded-lg bg-[#161a26] group-hover:bg-[#221533] text-gray-400 group-hover:text-[#8e44ad] transition-colors">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white group-hover:text-[#9b59b6]">Tạo Phòng Mặc Định</div>
                <div className="text-[11px] text-gray-500 mt-0.5">Sử dụng các bộ bài cấu hình sẵn (8, 12, 15 người...) gọn gàng, nhanh chóng.</div>
              </div>
            </button>

            <button
              onClick={() => handleCreateRoom('custom')}
              disabled={isLoading}
              className="setup-card custom w-full group"
            >
              <div className="p-2.5 rounded-lg bg-[#161a26] group-hover:bg-[#331e10] text-gray-400 group-hover:text-[#e67e22] transition-colors">
                <Settings className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white group-hover:text-[#f39c12]">Tạo Phòng Tùy Chỉnh (Custom)</div>
                <div className="text-[11px] text-gray-500 mt-0.5">Tự do tăng/giảm số lượng từng chức năng bí mật. Hoàn hảo cho số lượng người chơi lẻ.</div>
              </div>
            </button>
          </div>

          {isLoading && (
            <div className="flex justify-center pt-2">
              <span className="w-5 h-5 border-2 border-[#8e44ad] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* STEP 2: LOBBY */}
      {step === 'lobby' && (() => {
        const totalCards = getSelectedRolesList().length;
        const joined = playersList.length;
        const isExact = joined === totalCards;
        const progressPercent = Math.min(100, Math.round((joined / Math.max(totalCards, 1)) * 100));

        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            {lastWinner && (
              <div className={`md:col-span-3 border rounded-xl p-3 text-center text-sm font-bold flex items-center justify-center gap-3 ${
                lastWinner === 'villagers' ? 'border-green-800 bg-green-950 bg-opacity-20 text-green-400'
                : lastWinner === 'werewolves' ? 'border-red-800 bg-red-950 bg-opacity-20 text-red-400'
                : 'border-yellow-800 bg-yellow-950 bg-opacity-20 text-yellow-400'
              }`}>
                <span>🏆 Ván trước:{' '}
                  {lastWinner === 'villagers' ? 'Phe Dân Làng 😇 chiến thắng!'
                   : lastWinner === 'werewolves' ? 'Phe Ma Sói 😈 chiến thắng!'
                   : 'Sát Thủ 🔪 chiến thắng!'}
                  {' '}— Cấu hình bài và bắt đầu ván mới!
                </span>
                <button onClick={() => setLastWinner(null)} className="text-xs opacity-40 hover:opacity-100 ml-1">✕</button>
              </div>
            )}

            <div className="glass-panel text-center flex flex-col space-y-4 md:col-span-1">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#f1c40f]">
                  Quản Trò — Phòng {roomMode === 'custom' ? 'Custom' : 'Preset'}
                </span>
                <h1 className="text-4xl tracking-widest font-bold font-serif text-[#8e44ad] my-1" style={{ fontFamily: 'var(--font-gothic)' }}>
                  {roomCode}
                </h1>
                <p className="text-xs text-gray-500">Người chơi quét QR hoặc nhập mã để tham gia.</p>
              </div>

              <div className="w-44 h-44 mx-auto border border-[#8e44ad] border-opacity-40 rounded-xl p-2.5 bg-black bg-opacity-40 flex items-center justify-center shadow-[0_0_30px_rgba(142,68,173,0.25)] backdrop-blur-sm transition-all hover:shadow-[0_0_40px_rgba(142,68,173,0.4)]">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=8e44ad&bgcolor=0d0f14&data=${encodeURIComponent(window.location.origin + '?room=' + roomCode)}`}
                  alt={`Mã QR phòng ${roomCode}`}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>

              <RoleConfigPanel
                roomMode={roomMode}
                selectedPreset={selectedPreset}
                onPresetSelect={setSelectedPreset}
                customRoles={customRoles}
                onCustomChange={handleCustomCountChange}
                totalCards={totalCards}
              />

              <button
                onClick={handleResetSetup}
                className="text-xs text-gray-500 hover:text-red-400 border border-[#272935] rounded-full py-2 transition-all"
              >
                Hủy & Xóa Phòng
              </button>
            </div>

            <div className="glass-panel flex flex-col justify-between md:col-span-2 space-y-4">
              <div>
                <div className="flex justify-between items-center border-b border-[#272935] pb-3 mb-2">
                  <h4 className="font-bold text-gray-200 tracking-wide font-serif m-0" style={{ fontFamily: 'var(--font-gothic)' }}>
                    DANH SÁCH THÀNH VIÊN
                  </h4>
                  <span className="text-xs text-green-500 flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" /> Realtime
                  </span>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-300">👥 {joined} / {totalCards} người đã vào</span>
                    <span className={`font-bold ${isExact ? 'text-green-400' : joined > totalCards ? 'text-red-400' : 'text-[#f1c40f]'}`}>
                      {isExact ? '✅ Đủ người!' : joined > totalCards ? `⚠️ Thừa ${joined - totalCards}` : `⏳ Thiếu ${totalCards - joined}`}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#1b2132] rounded-full overflow-hidden shadow-inner border border-white border-opacity-5">
                    <div className={`h-full rounded-full transition-all duration-700 ${isExact ? '' : 'progress-shimmer'}`}
                      style={{
                        width: `${progressPercent}%`,
                        background: isExact ? 'linear-gradient(90deg,#27ae60,#2ecc71)' : joined > totalCards ? 'linear-gradient(90deg,#c0392b,#e74c3c)' : undefined
                      }}
                    />
                  </div>
                </div>

                <div className="scroll-diary grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
                  {playersList.map((player, idx) => (
                    <div key={player.id} className="player-card-tile transition-all hover:translate-y-0">
                      <div className="w-7 h-7 rounded-full bg-[#1b2132] border border-[#8e44ad] border-opacity-40 flex items-center justify-center font-bold text-xs text-[#8e44ad]">
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-gray-200 text-sm">{player.name}</span>
                    </div>
                  ))}
                  {playersList.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-xs text-gray-500 bg-[#0c0f17] border border-dashed border-[#272935] rounded-xl">
                      Đang đợi người chơi quét QR hoặc nhập mã vào phòng...
                    </div>
                  )}
                </div>
              </div>

              {errorMsg && (
                <div className="text-xs text-red-500 bg-red-950 bg-opacity-30 border border-red-900 border-opacity-40 rounded-lg p-3 text-center">
                  ⚠️ {errorMsg}
                </div>
              )}

              {!isExact && joined > 0 && (
                <div className={`text-xs border rounded-lg p-3 text-center ${
                  joined > totalCards
                    ? 'text-red-400 bg-red-950 bg-opacity-20 border-red-900 border-opacity-40'
                    : 'text-[#f1c40f] bg-yellow-950 bg-opacity-20 border-yellow-900 border-opacity-40'
                }`}>
                  {joined > totalCards
                    ? `⚠️ Số người (${joined}) vượt quá số lá bài cấu hình (${totalCards}). Hãy cấu hình lại bộ bài để cân bằng ván chơi.`
                    : roomMode === 'custom'
                    ? `💡 Chế độ Custom: Hãy điều chỉnh danh sách bài bên trái thành đúng ${joined} lá để chia chuẩn xác nhất.`
                    : `💡 Chế độ Mặc định: Hệ thống sẽ tự động cắt tỉa bớt bài để khớp với ${joined} người.`
                  }
                </div>
              )}

              <button
                onClick={handleStartGame}
                disabled={isLoading || playersList.length === 0}
                className={`w-full flex justify-center py-4 rounded-xl font-bold text-sm tracking-wider transition-all ${
                  isExact ? 'btn-premium'
                  : playersList.length === 0 ? 'btn-premium opacity-30 cursor-not-allowed'
                  : 'bg-[#1b2132] border border-[#8e44ad] border-opacity-40 text-gray-300 hover:border-opacity-100 hover:text-white'
                }`}
              >
                {isLoading
                  ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : isExact ? <><Play className="w-5 h-5" /> Bắt Đầu & Chia Bài Bí Mật</>
                  : playersList.length === 0 ? <><Users className="w-5 h-5" /> Đợi ít nhất 1 người vào...</>
                  : <><Play className="w-5 h-5" /> Chia Bài Cho {joined} Người</>
                }
              </button>
            </div>
          </div>
        );
      })()}

      {/* STEP 3: PLAYING */}
      {step === 'play' && gameRoom && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-panel flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <span className="text-xs text-[#f1c40f] uppercase tracking-wider font-bold" style={{ fontFamily: 'var(--font-gothic)' }}>
                ĐIỀU PHỐI VIÊN PHÒNG {roomCode} ({roomMode === 'custom' ? 'CUSTOM' : 'PRESET'})
              </span>
              <h2 className="text-2xl font-serif text-white tracking-widest font-bold my-1" style={{ fontFamily: 'var(--font-gothic)' }}>
                {gameRoom.status === 'night_phase' ? `🌙 ĐÊM THỨ ${currentDay + 1}` : `☀️ NGÀY THỨ ${currentDay}`}
              </h2>
            </div>
            <div className="flex bg-[#11141e] border border-[#272935] p-1.5 rounded-full">
              <button onClick={() => setViewMode('wizard')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${viewMode === 'wizard' ? 'bg-[#8e44ad] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
                🔮 Guided Kịch Bản
              </button>
              <button onClick={() => setViewMode('reference')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${viewMode === 'reference' ? 'bg-[#8e44ad] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
                📋 Bảng Ghi Nhớ
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">

              {/* WIZARD BAN ĐÊM */}
              {viewMode === 'wizard' && gameRoom.status === 'night_phase' && (
                <div className="spellbook-panel animate-fade-in space-y-6">
                  {nightWizardSteps.length > 0 ? (
                    <>
                      <div className="border-b border-[#272935] border-opacity-50 pb-4 flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🌙</span>
                          <div>
                            <span className="text-[10px] uppercase tracking-widest text-[#f1c40f] font-bold">Bước {currentNightStep + 1} / {nightWizardSteps.length}</span>
                            <h3 className="text-xl font-bold font-serif text-white m-0 tracking-wide" style={{ fontFamily: 'var(--font-gothic)' }}>
                              {nightWizardSteps[currentNightStep].name} thức giấc...
                            </h3>
                          </div>
                        </div>
                      </div>

                      <div className="bg-black bg-opacity-35 border border-[#f1c40f] border-opacity-20 p-4 rounded-xl relative z-10">
                        <span className="text-[10px] uppercase font-bold text-[#f1c40f] tracking-widest block mb-1.5">GỢI Ý LỜI THOẠI QUẢN TRÒ:</span>
                        <p className="text-xs italic text-gray-300 leading-relaxed m-0 font-medium">
                          "Mọi người nhắm mắt lại. {nightWizardSteps[currentNightStep].name} hãy mở mắt ra và thực hiện chức năng của mình..."
                        </p>
                      </div>

                      <div className="space-y-4 relative z-10">
                        <label className="block text-xs uppercase tracking-widest text-gray-400 font-bold">
                          {nightWizardSteps[currentNightStep].actionText?.replace('[target]', playersList.find(p => p.id === nightSelections.werewolfTarget)?.name || 'nạn nhân')}
                        </label>

                        {/* CUPID */}
                        {nightWizardSteps[currentNightStep].id === 'cupid' && (
                          <div className="grid grid-cols-2 gap-3">
                            {playersList.map(player => {
                              const isSelected = nightSelections.cupidTargets.includes(player.id);
                              return (
                                <button key={player.id}
                                  onClick={() => setNightSelections(prev => {
                                    let targets = [...prev.cupidTargets];
                                    if (targets.includes(player.id)) targets = targets.filter(id => id !== player.id);
                                    else if (targets.length < 2) targets.push(player.id);
                                    setLovers(targets);
                                    return { ...prev, cupidTargets: targets };
                                  })}
                                  className={`target-btn ${isSelected ? 'active-neutral border-[#e74c3c] bg-[#e74c3c] bg-opacity-10 text-white shadow-[0_0_15px_rgba(231,76,60,0.2)]' : ''}`}>
                                  <span className="font-semibold text-sm">{player.name}</span>
                                  {isSelected && <span className="text-sm">❤️</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* BODYGUARD */}
                        {nightWizardSteps[currentNightStep].id === 'bodyguard' && (
                          <div className="grid grid-cols-2 gap-3">
                            {playersList.filter(p => p.is_alive).map(player => (
                              <button key={player.id}
                                onClick={() => setNightSelections(prev => ({ ...prev, protectedPlayer: player.id }))}
                                className={`target-btn ${nightSelections.protectedPlayer === player.id ? 'active-bodyguard' : ''}`}>
                                <span className="font-semibold text-sm">🛡️ {player.name}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* WEREWOLF */}
                        {nightWizardSteps[currentNightStep].id === 'werewolf' && (
                          <div className="grid grid-cols-2 gap-3">
                            {playersList.filter(p => p.is_alive).map(player => (
                              <button key={player.id}
                                onClick={() => setNightSelections(prev => ({ ...prev, werewolfTarget: player.id }))}
                                className={`target-btn ${nightSelections.werewolfTarget === player.id ? 'active-werewolf' : ''}`}>
                                <span className="font-semibold text-sm">🐺 {player.name}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* CURSED WOLF (SÓI NGUYỀN) */}
                        {nightWizardSteps[currentNightStep].id === 'cursed_wolf' && (
                          <div className="space-y-4">
                            {/* Cho phép Sói nguyền chọn mục tiêu cắn chung với đàn hoặc xem mục tiêu đàn đã cắn */}
                            <div className="bg-[#121622] bg-opacity-50 p-4 rounded-xl border border-[#272935] space-y-3 shadow-md">
                              <div className="text-xs font-bold text-gray-300">
                                MỤC TIÊU ĐÀN SÓI CẮN: <span className="text-[#c0392b] font-extrabold ml-1 uppercase tracking-wider">
                                  {playersList.find(p => p.id === nightSelections.werewolfTarget)?.name || 'Chưa chọn nạn nhân'}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 pt-2.5 border-t border-[#1b2132]">
                                <div className="text-[11px] text-gray-400 leading-relaxed flex-1">
                                  {cursedWolfConfig.hasCurse 
                                    ? "Quyền năng nguyền rủa chưa sử dụng. Bạn có muốn biến nạn nhân trên thành Sói đêm nay?" 
                                    : "❌ Bạn đã sử dụng quyền năng nguyền rủa ở ván trước rồi."
                                  }
                                </div>
                                <button
                                  disabled={!cursedWolfConfig.hasCurse || !nightSelections.werewolfTarget}
                                  onClick={() => setNightSelections(prev => ({ ...prev, curseActivatedTonight: !prev.curseActivatedTonight }))}
                                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${nightSelections.curseActivatedTonight ? 'bg-red-600 border-red-600 text-white shadow-[0_0_15px_rgba(231,76,60,0.5)]' : 'border-[#272935] text-gray-400 disabled:opacity-20'}`}>
                                  {nightSelections.curseActivatedTonight ? '🔮 ĐANG NGUYỀN RỦ' : '🔮 Kích hoạt Nguyền'}
                                </button>
                              </div>
                            </div>

                            <span className="text-xs font-bold text-gray-400 block uppercase tracking-widest">Hỗ trợ chọn nạn nhân cùng Đàn Sói (Nếu cần):</span>
                            <div className="grid grid-cols-2 gap-3">
                              {playersList.filter(p => p.is_alive).map(player => (
                                <button key={player.id}
                                  onClick={() => setNightSelections(prev => ({ ...prev, werewolfTarget: player.id }))}
                                  className={`target-btn ${nightSelections.werewolfTarget === player.id ? 'active-werewolf' : ''}`}>
                                  <span className="font-semibold text-sm">🐺 {player.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* SERIAL KILLER */}
                        {nightWizardSteps[currentNightStep].id === 'serial_killer' && (
                          <div className="grid grid-cols-2 gap-3">
                            {playersList.filter(p => p.is_alive).map(player => (
                              <button key={player.id}
                                onClick={() => setNightSelections(prev => ({ ...prev, serialKillerTarget: player.id }))}
                                className={`target-btn ${nightSelections.serialKillerTarget === player.id ? 'active-werewolf' : ''}`}>
                                <span className="font-semibold text-sm">🔪 {player.name}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* WITCH */}
                        {nightWizardSteps[currentNightStep].id === 'witch' && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-[#121622] bg-opacity-50 p-4 rounded-xl border border-[#272935] shadow-md">
                              <div className="text-xs font-bold text-gray-300 flex-1">
                                SÓI CẮN: <span className="text-[#c0392b] font-extrabold ml-1 uppercase tracking-wider">
                                  {playersList.find(p => p.id === nightSelections.werewolfTarget)?.name || 'Không có ai'}
                                </span>
                              </div>
                              <button
                                disabled={!witchPotions.hasHeal || !nightSelections.werewolfTarget || nightSelections.curseActivatedTonight}
                                onClick={() => setNightSelections(prev => ({ ...prev, witchHealUsed: !prev.witchHealUsed }))}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${nightSelections.witchHealUsed ? 'bg-green-600 border-green-600 text-white shadow-[0_0_10px_rgba(46,204,113,0.3)]' : 'border-[#272935] text-gray-400 disabled:opacity-20'}`}>
                                {nightSelections.curseActivatedTonight ? '🔮 Đã bị nguyền rủa' : witchPotions.hasHeal ? '🧪 Dùng bình Cứu' : '❌ Hết bình Cứu'}
                              </button>
                            </div>
                            <div className="space-y-2">
                              <span className="text-xs font-bold text-gray-400 block uppercase tracking-widest">BÌNH ĐỘC (TÙY CHỌN):</span>
                              <div className="grid grid-cols-2 gap-3">
                                {playersList.filter(p => p.is_alive).map(player => (
                                  <button key={player.id}
                                    disabled={!witchPotions.hasPoison}
                                    onClick={() => setNightSelections(prev => ({ ...prev, witchKillTarget: prev.witchKillTarget === player.id ? null : player.id }))}
                                    className={`target-btn ${nightSelections.witchKillTarget === player.id ? 'active-seer' : ''}`}>
                                    <span className="font-semibold text-sm">☠️ {player.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* SEER */}
                        {nightWizardSteps[currentNightStep].id === 'seer' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              {playersList.filter(p => p.is_alive).map(player => (
                                <button key={player.id}
                                  onClick={() => setNightSelections(prev => ({ ...prev, seerTarget: player.id }))}
                                  className={`target-btn ${nightSelections.seerTarget === player.id ? 'active-seer' : ''}`}>
                                  <span className="font-semibold text-sm">👁️ {player.name}</span>
                                </button>
                              ))}
                            </div>
                            {nightSelections.seerTarget && (
                              <div className="bg-black bg-opacity-40 border border-[#8e44ad] border-opacity-40 p-4 rounded-xl text-center animate-pulse shadow-[0_0_20px_rgba(142,68,173,0.15)]">
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Kết quả soi bản mệnh:</span>
                                <div className="text-lg font-bold text-white mt-1">
                                  {playersList.find(p => p.id === nightSelections.seerTarget)?.name} là{' '}
                                  {['werewolf', 'wolf_cub', 'cursed_wolf'].includes(playersList.find(p => p.id === nightSelections.seerTarget)?.role)
                                    ? <span className="text-[#e74c3c] font-black uppercase tracking-wider">MA SÓI 😈</span>
                                    : <span className="text-green-400 font-black uppercase tracking-wider">DÂN LÀNG/CHỨC NĂNG 😇</span>
                                  }
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <button onClick={handleWizardNext} className="w-full btn-premium flex justify-center py-3 rounded-lg relative z-10 shadow-md">
                        {currentNightStep === nightWizardSteps.length - 1
                          ? <>Kết Thúc Đêm & Sáng Hôm Sau <Sun className="w-5 h-5" /></>
                          : <>Gọi Vai Trò Tiếp Theo <ChevronRight className="w-5 h-5" /></>
                        }
                      </button>
                    </>
                  ) : (
                    <div className="p-8 text-center text-gray-400">Không tìm thấy vai trò ban đêm...</div>
                  )}
                </div>
              )}

              {/* BAN NGÀY */}
              {viewMode === 'wizard' && gameRoom.status === 'day_phase' && (
                <div className="glass-panel text-center animate-fade-in py-10 space-y-6">
                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-[#15101a] border border-[#f1c40f] rounded-full">
                    <Sun className="w-10 h-10 text-[#f1c40f] animate-spin" style={{ animationDuration: '30s' }} />
                  </div>
                  <h3 className="text-3xl font-serif tracking-widest text-[#f1c40f]" style={{ fontFamily: 'var(--font-gothic)' }}>BÌNH MINH LÊN</h3>
                  <div className="max-w-md mx-auto bg-[#11141e] border border-[#272935] p-5 rounded-xl text-left space-y-4">
                    <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400 border-b border-[#272935] pb-2">Nhật ký đêm qua:</h4>
                    <p className="text-sm leading-relaxed text-gray-300 italic m-0">"{gameLogs[gameLogs.length - 1] || 'Mọi người thức giấc an bình.'}"</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto pt-4">
                    <button onClick={() => setViewMode('reference')} className="btn-secondary rounded-xl flex-1 flex justify-center">📋 Treo Cổ / Bỏ Phiếu</button>
                    <button onClick={handleStartNextNight} className="btn-premium rounded-xl flex-1 flex justify-center">Đêm Tiếp Theo <Moon className="w-5 h-5" /></button>
                  </div>
                </div>
              )}

              {/* BẢNG GHI NHỚ */}
              {viewMode === 'reference' && (
                <div className="glass-panel animate-fade-in space-y-4">
                  <div className="border-b border-[#272935] pb-3 mb-2 flex justify-between items-center">
                    <h3 className="text-lg font-bold font-serif text-white m-0" style={{ fontFamily: 'var(--font-gothic)' }}>📋 BẢNG GHI NHỚ</h3>
                    <button onClick={fetchPlayers} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5" /> Đồng bộ
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 font-medium">Bấm 🟢/🔴 để cập nhật trạng thái Sống/Chết sau khi biểu quyết treo cổ.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {playersList.map(player => (
                      <div key={player.id}
                        className={`scoreboard-card ${player.is_alive ? 'alive' : 'dead'}`}>
                        <div className="text-left">
                          <div className="font-bold text-sm text-white flex items-center gap-2">
                            {player.name}
                            {lovers.includes(player.id) && <span className="text-xs">❤️</span>}
                            {!player.is_alive && <span className="text-xs">💀</span>}
                          </div>
                          <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mt-1">
                            Bài:{' '}
                            <span className={ROLES[player.role]?.team === 'werewolves' ? 'text-[#c0392b] font-bold' : ROLES[player.role]?.team === 'neutral' ? 'text-[#f1c40f] font-bold' : 'text-purple-400 font-bold'}>
                              {ROLES[player.role]?.name}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => handleToggleAlive(player.id, player.is_alive)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${player.is_alive ? 'border-green-800 text-green-500 hover:bg-green-950 hover:bg-opacity-20' : 'border-red-800 text-red-500 hover:bg-red-950 hover:bg-opacity-20'}`}>
                          {player.is_alive ? '🟢 SỐNG' : '🔴 CHẾT'}
                        </button>
                      </div>
                    ))}
                  </div>
                  {gameRoom.status === 'day_phase' && (
                    <div className="border-t border-[#272935] pt-4 text-center">
                      <button onClick={handleStartNextNight} className="btn-premium rounded-xl px-8">
                        Bắt Đầu Đêm Tiếp Theo <Moon className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CỘT PHẢI: KẾT THÚC GAME + NHẬT KÝ */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-panel space-y-4">
                <h4 className="font-serif text-sm font-bold text-gray-200 tracking-wider m-0" style={{ fontFamily: 'var(--font-gothic)' }}>⚔️ KẾT THÚC GAME</h4>
                <div className="flex flex-col gap-2.5">
                  <button onClick={() => handleEndGame('villagers')} className="w-full bg-[#1b2a22] border border-green-900 text-green-400 rounded-lg py-2.5 text-xs font-bold hover:bg-green-900 hover:text-white transition-all">😇 Phe Dân Làng Thắng</button>
                  <button onClick={() => handleEndGame('werewolves')} className="w-full bg-[#2c1d1d] border border-red-900 text-red-400 rounded-lg py-2.5 text-xs font-bold hover:bg-red-900 hover:text-white transition-all">🐺 Phe Ma Sói Thắng</button>
                  <button onClick={() => handleEndGame('neutral')} className="w-full bg-[#272418] border border-yellow-900 text-yellow-500 rounded-lg py-2.5 text-xs font-bold hover:bg-yellow-900 hover:text-white transition-all">🔪 Sát Thủ / Thứ Ba Thắng</button>
                </div>
              </div>

              <div className="glass-panel space-y-4">
                <h4 className="font-serif text-sm font-bold text-[#8e44ad] tracking-widest m-0 flex items-center gap-1.5 uppercase" style={{ fontFamily: 'var(--font-gothic)' }}>
                  <History className="w-4 h-4" /> NHẬT KÝ
                </h4>
                <div className="scroll-diary max-h-[220px] overflow-y-auto divide-y divide-[#272935] divide-opacity-30 pr-1 space-y-3">
                  {gameLogs.map((log, index) => (
                    <div key={index} className="pt-2 text-[11px] text-gray-400 leading-relaxed hover:text-white transition-colors">{log}</div>
                  ))}
                  {gameLogs.length === 0 && <div className="text-center text-xs text-gray-500 py-10">Chưa có nhật ký ván đấu...</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}