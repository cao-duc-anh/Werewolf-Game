import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import GothicCard from './GothicCard';
import { Users, Moon, ArrowLeft, LogIn, CheckCircle2 } from 'lucide-react';

export default function PlayerClient({ onBackToRoleSelect }) {
  const [step, setStep] = useState('join'); // 'join', 'lobby', 'reveal', 'sleep'
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState(null);
  
  const [playersList, setPlayersList] = useState([]);
  const [myRole, setMyRole] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Khôi phục trạng thái từ localStorage nếu có lỡ F5 trình duyệt
  useEffect(() => {
    const savedRoom = localStorage.getItem('ww_player_room');
    const savedName = localStorage.getItem('ww_player_name');
    const savedId = localStorage.getItem('ww_player_id');

    if (savedRoom && savedName && savedId) {
      setRoomCode(savedRoom);
      setPlayerName(savedName);
      setPlayerId(savedId);
      setStep('lobby');
    }
  }, []);

  // Lắng nghe thay đổi trạng thái của phòng chơi và danh sách người chơi (Realtime Supabase)
  useEffect(() => {
    if (!roomCode || step === 'join') return;

    // 1. Fetch danh sách người chơi ban đầu
    fetchPlayers();

    // 2. Subscribe thay đổi realtime của bảng `players` cho phòng này
    const playerSubscription = supabase
      .channel(`room_players_${roomCode}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'players', 
          filter: `room_id=eq.${roomCode}` 
        },
        (payload) => {
          fetchPlayers();
        }
      )
      .subscribe();

    // 3. Subscribe thay đổi realtime của bảng `rooms` (để nhận lệnh Bắt đầu / Chia bài)
    const roomSubscription = supabase
      .channel(`room_status_${roomCode}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'rooms', 
          filter: `id=eq.${roomCode}` 
        },
        (payload) => {
          const roomData = payload.new;
          if (roomData.status === 'playing' || roomData.status === 'night_phase' || roomData.status === 'day_phase') {
            // Game đã bắt đầu, lấy vai trò
            fetchMyRoleAndProceed();
          } else if (roomData.status === 'finished' || roomData.status === 'waiting') {
            // Game kết thúc, reset về lobby
            setStep('lobby');
            setMyRole(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playerSubscription);
      supabase.removeChannel(roomSubscription);
    };
  }, [roomCode, step]);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomCode)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setPlayersList(data || []);
      
      // Nếu tôi có trong danh sách và đã được chia vai trò
      if (playerId) {
        const me = data.find(p => p.id === playerId);
        if (me && me.role) {
          setMyRole(me.role);
        }
      }
    } catch (e) {
      console.error("Lỗi lấy danh sách người chơi:", e);
    }
  };

  const fetchMyRoleAndProceed = async () => {
    if (!playerId) return;
    try {
      const { data, error } = await supabase
        .from('players')
        .select('role')
        .eq('id', playerId)
        .single();

      if (error) throw error;
      if (data && data.role) {
        setMyRole(data.role);
        setStep('reveal');
        
        // Kích hoạt rung điện thoại (nếu trình duyệt trên mobile hỗ trợ)
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    } catch (e) {
      console.error("Lỗi lấy vai trò:", e);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!roomCode.trim() || !playerName.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ mã phòng và tên của bạn.');
      return;
    }

    const formattedCode = roomCode.trim().toUpperCase();
    setIsLoading(true);
    setErrorMsg('');

    try {
      // 1. Kiểm tra phòng tồn tại
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', formattedCode)
        .single();

      if (roomError || !room) {
        setErrorMsg('Phòng không tồn tại. Vui lòng kiểm tra lại mã phòng.');
        setIsLoading(false);
        return;
      }

      if (room.status !== 'waiting') {
        setErrorMsg('Phòng này đã bắt đầu chơi. Bạn không thể tham gia lúc này.');
        setIsLoading(false);
        return;
      }

      // 2. Kiểm tra trùng tên trong phòng
      const { data: existingPlayers } = await supabase
        .from('players')
        .select('name')
        .eq('room_id', formattedCode);

      const nameExists = existingPlayers?.some(p => p.name.toLowerCase() === playerName.trim().toLowerCase());
      if (nameExists) {
        setErrorMsg('Tên này đã được sử dụng trong phòng. Vui lòng chọn tên khác.');
        setIsLoading(false);
        return;
      }

      // 3. Thêm người chơi mới
      const { data: newPlayer, error: joinError } = await supabase
        .from('players')
        .insert({
          room_id: formattedCode,
          name: playerName.trim(),
          is_alive: true,
          is_host: false
        })
        .select()
        .single();

      if (joinError) throw joinError;

      // 4. Lưu vào state & localStorage
      setPlayerId(newPlayer.id);
      setRoomCode(formattedCode);
      localStorage.setItem('ww_player_room', formattedCode);
      localStorage.setItem('ww_player_name', playerName.trim());
      localStorage.setItem('ww_player_id', newPlayer.id);
      
      setStep('lobby');
    } catch (e) {
      console.error("Lỗi tham gia phòng:", e);
      setErrorMsg('Đã xảy ra lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (window.confirm('Bạn có chắc chắn muốn rời khỏi phòng?')) {
      if (playerId) {
        await supabase.from('players').delete().eq('id', playerId);
      }
      localStorage.clear();
      setRoomCode('');
      setPlayerName('');
      setPlayerId(null);
      setStep('join');
    }
  };

  const handleConfirmRole = () => {
    setStep('sleep');
  };

  return (
    <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto px-4 py-8 relative z-10">
      
      {/* =========================================================================
         BƯỚC 1: ĐĂNG NHẬP / JOIN ROOM
         ========================================================================= */}
      {step === 'join' && (
        <div className="glass-panel text-center animate-fade-in">
          <button 
            onClick={onBackToRoleSelect}
            className="flex items-center text-xs text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại chọn vai trò
          </button>
          
          <h2 className="gothic-title">GIA NHẬP</h2>
          <p className="text-gray-400 text-sm mb-6">Nhập mã phòng từ Quản Trò để nhận thẻ bài vai trò bí ẩn của bạn.</p>

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label className="block text-left text-xs uppercase tracking-wider text-gray-400 mb-1 font-semibold">
                Mã Phòng (4 ký tự)
              </label>
              <input 
                type="text" 
                maxLength={4}
                placeholder="Ví dụ: WOLF"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full bg-[#161a24] border border-[#272935] focus:border-[#8e44ad] text-white text-center text-lg font-bold rounded-lg px-4 py-3 outline-none transition-all uppercase placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-left text-xs uppercase tracking-wider text-gray-400 mb-1 font-semibold">
                Tên Của Bạn
              </label>
              <input 
                type="text" 
                maxLength={15}
                placeholder="Ví dụ: Cao Dũng"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-[#161a24] border border-[#272935] focus:border-[#8e44ad] text-white text-center rounded-lg px-4 py-3 outline-none transition-all placeholder-gray-600"
              />
            </div>

            {errorMsg && (
              <div className="text-xs text-red-500 bg-red-950 bg-opacity-30 border border-red-900 border-opacity-40 rounded-lg p-3">
                ⚠️ {errorMsg}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full btn-premium flex justify-center py-3 rounded-lg"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" /> Vào Phòng Chờ
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* =========================================================================
         BƯỚC 2: SẢNH CHỜ REALTIME (LOBBY)
         ========================================================================= */}
      {step === 'lobby' && (
        <div className="glass-panel text-center animate-fade-in space-y-6">
          <div className="flex justify-between items-center border-b border-[#272935] pb-4">
            <div className="text-left">
              <span className="text-[10px] uppercase tracking-widest text-[#f1c40f]">Phòng Chơi</span>
              <h3 className="text-xl font-bold tracking-widest text-white m-0 font-serif" style={{ fontFamily: 'var(--font-gothic)' }}>
                {roomCode}
              </h3>
            </div>
            <button 
              onClick={handleLeaveRoom}
              className="text-xs text-red-400 hover:text-red-300 border border-red-950 hover:bg-red-950 hover:bg-opacity-30 rounded-full px-3 py-1.5 transition-all"
            >
              Rời Phòng
            </button>
          </div>

          <div className="py-4">
            <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-[#15101a] border border-[#8e44ad] border-opacity-30 rounded-full">
              <Users className="w-8 h-8 text-[#8e44ad] animate-pulse" />
            </div>
            <h4 className="text-sm font-semibold tracking-wider uppercase text-gray-300">
              Đang Chờ Quản Trò...
            </h4>
            <p className="text-xs text-gray-500 max-w-[250px] mx-auto mt-1">
              Trò chơi sẽ bắt đầu khi Quản Trò tiến hành chia vai bài. Hãy giữ nguyên màn hình này.
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-400 font-semibold mb-2">
              <span>ĐỒNG BỌN TRONG PHÒNG ({playersList.length})</span>
              <span className="text-[#8e44ad] animate-pulse">● Realtime</span>
            </div>
            
            <div className="bg-[#121620] border border-[#272935] rounded-lg max-h-[180px] overflow-y-auto divide-y divide-[#1b1f2b]">
              {playersList.map((player) => (
                <div 
                  key={player.id} 
                  className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                    player.id === playerId ? 'bg-[#8e44ad] bg-opacity-10' : ''
                  }`}
                >
                  <span className="font-semibold text-gray-200">
                    {player.name} {player.id === playerId && <span className="text-[10px] text-[#8e44ad] ml-1 bg-[#8e44ad] bg-opacity-25 px-1.5 py-0.5 rounded">(Bạn)</span>}
                  </span>
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" /> Sẵn sàng
                  </span>
                </div>
              ))}
              {playersList.length === 0 && (
                <div className="p-4 text-xs text-gray-500">Chưa có ai vào phòng...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         BƯỚC 3: LẬT BÀI 3D XEM VAI TRÒ BÍ MẬT (REVEAL)
         ========================================================================= */}
      {step === 'reveal' && myRole && (
        <div className="text-center animate-fade-in space-y-6">
          <div className="text-center">
            <span className="text-xs uppercase tracking-widest text-[#f1c40f]" style={{ fontFamily: 'var(--font-gothic)' }}>
              BÀI ĐÃ CHIA BẢN MỆNH
            </span>
            <h2 className="gothic-title">VAI TRÒ BÍ MẬT</h2>
          </div>

          <div className="py-2">
            <GothicCard 
              roleId={myRole} 
              isFlipped={isFlipped} 
              onFlipChange={setIsFlipped} 
            />
          </div>

          <div className="max-w-[280px] mx-auto text-xs text-gray-400 leading-relaxed bg-[#0d0f14] bg-opacity-50 border border-[#272935] p-4 rounded-xl">
            {isFlipped ? (
              <span className="text-yellow-400 font-semibold">⚠️ Hãy giữ bí mật thẻ bài này khỏi mắt người bên cạnh!</span>
            ) : (
              <span>👆 <strong>ẤN và GIỮ</strong> ngón tay trên thẻ bài để lật xem. Buông tay lập tức thẻ sẽ úp lại bảo mật.</span>
            )}
          </div>

          <button 
            onClick={handleConfirmRole}
            className="btn-premium rounded-full mx-auto"
          >
            <CheckCircle2 className="w-5 h-5" /> Tôi Đã Hiểu Vai Trò
          </button>
        </div>
      )}

      {/* =========================================================================
         BƯỚC 4: CHẾ ĐỘ NGỦ SAY TĨNH LẶNG (SLEEP)
         ========================================================================= */}
      {step === 'sleep' && (
        <div className="glass-panel text-center animate-fade-in py-10 space-y-6">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-[#07080a] border border-[#f1c40f] border-opacity-20 rounded-full">
            {/* Hiệu ứng trăng khuyết phát sáng nhẹ */}
            <div className="absolute w-20 h-20 rounded-full border border-[#f1c40f] border-opacity-10 animate-ping" />
            <Moon className="w-10 h-10 text-[#f1c40f] animate-pulse" />
          </div>

          <h3 className="text-2xl font-serif text-gray-200 tracking-wider font-bold" style={{ fontFamily: 'var(--font-gothic)' }}>
            ĐÊM ĐÃ BUÔNG XUỐNG
          </h3>
          
          <div className="space-y-2 max-w-[280px] mx-auto">
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest text-[#8e44ad]">
              Ngôi Làng Đang Ngủ
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Bạn đã xác nhận vai trò. Bây giờ hãy úp điện thoại xuống, nhắm mắt lại và tập trung lắng nghe hướng dẫn của Quản Trò.
            </p>
          </div>

          <div className="border-t border-[#272935] pt-4 max-w-[280px] mx-auto">
            <button 
              onClick={() => setStep('reveal')}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-wider font-semibold"
            >
              Xem lại vai trò bí mật
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
