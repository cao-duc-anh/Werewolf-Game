-- SCRIPT THIẾT LẬP DATABASE SUPABASE REALTIME CHO GAME MA SÓI OFFLINE
-- Hướng dẫn sử dụng:
-- 1. Truy cập vào trang quản trị Supabase của bạn (https://supabase.com).
-- 2. Chọn dự án của bạn -> Ở thanh công cụ bên trái, chọn "SQL Editor".
-- 3. Click "New query" -> Copy toàn bộ nội dung file này và Paste vào ô nhập liệu.
-- 4. Bấm nút "Run" để khởi tạo database.

-- =========================================================================
-- BƯỚC 1: XÓA CÁC BẢNG CŨ NẾU ĐÃ TỒN TẠI (ĐỂ TRÁNH LỖI KHI SETUP LẠI)
-- =========================================================================
drop table if exists players cascade;
drop table if exists rooms cascade;

-- =========================================================================
-- BƯỚC 2: TẠO BẢNG ROOMS (LƯU TRỮ TRẠNG THÁI PHÒNG CHƠI)
-- =========================================================================
create table rooms (
    id text primary key, -- Mã phòng (Ví dụ: WOLF, ABCD,...)
    status text not null default 'waiting', -- Trạng thái: waiting, playing, day_phase, night_phase, finished
    current_day integer not null default 0, -- Số ngày hiện tại trong game (0 = Đêm đầu tiên)
    phase_detail text, -- Thông tin chi tiết phase hiện tại (Ví dụ: "Cupid đang chọn", "Sói đang cắn"...)
    config jsonb not null default '{}'::jsonb, -- Cấu hình vai trò sẽ dùng trong game
    logs jsonb not null default '[]'::jsonb, -- Nhật ký hành động từng đêm (để làm Game Log)
    winner text, -- Phe chiến thắng: 'villagers' (Dân), 'werewolves' (Sói), 'tanner' (Kẻ chán đời)...
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- BƯỚC 3: TẠO BẢNG PLAYERS (LƯU TRỮ DANH SÁCH NGƯỜI CHƠI)
-- =========================================================================
create table players (
    id uuid primary key default gen_random_uuid(),
    room_id text references rooms(id) on delete cascade not null, -- Liên kết với bảng rooms
    name text not null, -- Tên hiển thị của người chơi
    role text, -- Vai trò bí mật (Dân, Sói, Phù thủy...) được chia sau khi bắt đầu
    is_alive boolean not null default true, -- Trạng thái sống/chết
    is_host boolean not null default false, -- Xác định thiết bị Quản trò
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- BƯỚC 4: TẮT RLS (ROW LEVEL SECURITY) ĐỂ ĐƠN GIẢN HÓA KẾT NỐI
-- Vì game offline không chứa thông tin nhạy cảm, việc tắt RLS giúp ứng dụng
-- kết nối trực tiếp đến database mượt mà mà không cần hệ thống phân quyền phức tạp.
-- =========================================================================
alter table rooms disable row level security;
alter table players disable row level security;

-- =========================================================================
-- BƯỚC 5: KÍCH HOẠT TÍNH NĂNG ĐỒNG BỘ REALTIME QUA WEBSOCKETS
-- Đây là bước quan trọng nhất giúp điện thoại người chơi nhận vai bài ngay lập tức
-- khi Quản trò ấn bắt đầu game trên máy chủ.
-- =========================================================================
-- 1. Tạo publication nếu chưa tồn tại
do $$
begin
    if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
        create publication supabase_realtime;
    end if;
end $$;

-- 2. Thêm các bảng vào hệ thống Realtime
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
