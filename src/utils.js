/**
 * ĐỊNH NGHĨA DANH SÁCH VAI TRÒ (ROLES) CHO GAME MA SÓI
 * Mỗi vai trò có:
 * - id: Mã vai trò
 * - name: Tên tiếng Việt
 * - team: Phe phái ('villagers' - Dân, 'werewolves' - Sói, 'neutral' - Phe thứ 3)
 * - priority: Thứ tự gọi ban đêm (Số càng nhỏ thức dậy càng sớm)
 * - description: Mô tả kỹ năng chi tiết bằng tiếng Việt
 * - image: Đường dẫn ảnh thẻ bài Gothic Tarot
 */
export const ROLES = {
  cupid: {
    id: 'cupid',
    name: 'Thần Tình Yêu',
    team: 'villagers',
    priority: 10,
    description: 'Đêm đầu tiên, thức dậy chọn 2 người để ghép đôi. Họ sẽ cùng sống hoặc cùng chết. Nếu một trong hai người chết, người kia sẽ tự sát chết theo.',
    image: '/cards/cupid.png',
    actionText: 'Chọn 2 người chơi để kết đôi (Chỉ thực hiện đêm đầu tiên):'
  },
  bodyguard: {
    id: 'bodyguard',
    name: 'Bảo Vệ',
    team: 'villagers',
    priority: 20,
    description: 'Mỗi đêm thức dậy chọn 1 người để bảo vệ khỏi sự tấn công của Ma Sói. Không thể bảo vệ 1 người trong 2 đêm liên tiếp. Được tự bảo vệ bản thân.',
    image: '/cards/bodyguard.png',
    actionText: 'Chọn 1 người chơi để bảo vệ đêm nay:'
  },
  werewolf: {
    id: 'werewolf',
    name: 'Ma Sói',
    team: 'werewolves',
    priority: 30,
    description: 'Mỗi đêm thức dậy cùng các Ma Sói khác chọn cắn chết 1 người chơi. Phải đồng thuận mục tiêu.',
    image: '/cards/werewolf.png',
    actionText: 'Chọn 1 nạn nhân để cắn chết:'
  },
  cursed_wolf: {
    id: 'cursed_wolf',
    name: 'Sói Nguyền',
    team: 'werewolves',
    priority: 30, // Đồng hành thức dậy cùng đàn sói
    description: 'Thuộc phe Ma Sói và thức dậy cùng đàn Sói mỗi đêm. Bản thân có năng lực nguyền rủa: Có 1 lần duy nhất trong trò chơi biến nạn nhân bị cắn đêm đó thành Ma Sói đồng bọn thay vì bị chết.',
    image: '/cards/cursed_wolf.png',
    actionText: 'Lưu ý: Bạn thức dậy cùng Ma Sói. Bạn muốn kích hoạt quyền NGUYỀN RỦA nạn nhân đêm nay không?'
  },
  wolf_cub: {
    id: 'wolf_cub',
    name: 'Sói Con',
    team: 'werewolves',
    priority: 35,
    description: 'Thuộc phe Ma Sói. Nếu Sói Con bị treo cổ ban ngày, đêm tiếp theo đàn Sói sẽ thức dậy cắn chết 2 người liên tiếp.',
    image: '/cards/wolf_cub.png',
    actionText: 'Lưu ý: Sói Con là đồng bọn của Ma Sói.'
  },
  serial_killer: {
    id: 'serial_killer',
    name: 'Sát Thủ',
    team: 'neutral',
    priority: 40,
    description: 'Phe thứ 3 đơn độc. Mỗi đêm thức dậy chọn giết 1 người chơi. Mục tiêu là trở thành người sống sót cuối cùng trong trò chơi.',
    image: '/cards/serial_killer.png',
    actionText: 'Chọn 1 người chơi để sát hại đêm nay:'
  },
  witch: {
    id: 'witch',
    name: 'Phù Thủy',
    team: 'villagers',
    priority: 50,
    description: 'Sở hữu 2 bình thuốc thần thánh: 1 bình cứu mạng (cứu người bị Sói cắn) và 1 bình độc (giết 1 người). Mỗi bình chỉ được sử dụng 1 lần duy nhất trong cả game.',
    image: '/cards/witch.png',
    actionText: 'Đêm qua nạn nhân bị cắn là [target]. Bạn muốn cứu hay đầu độc ai?'
  },
  seer: {
    id: 'seer',
    name: 'Tiên Tri',
    team: 'villagers',
    priority: 60,
    description: 'Mỗi đêm thức dậy chọn soi vai trò bí mật của 1 người chơi. Quản trò sẽ cho biết người đó thuộc Phe Dân Làng/Chức Năng hay Phe Ma Sói.',
    image: '/cards/seer.png',
    actionText: 'Chọn 1 người để soi vai trò bí mật:'
  },
  hunter: {
    id: 'hunter',
    name: 'Thợ Săn',
    team: 'villagers',
    priority: 70, // Không hoạt động đêm, chỉ kích hoạt khi chết
    description: 'Không thức dậy ban đêm. Khi bị chết (dù ban đêm hay bị treo cổ ban ngày), lập tức được quyền bắn chết thêm 1 người chơi khác theo chỉ định.',
    image: '/cards/hunter.png',
    actionText: 'Chọn mục tiêu bắn chết khi bạn hi sinh:'
  },
  villager: {
    id: 'villager',
    name: 'Dân Làng',
    team: 'villagers',
    priority: 100, // Không hoạt động ban đêm
    description: 'Không có chức năng đặc biệt vào ban đêm. Ban ngày sử dụng lập luận, quan sát để cùng dân làng tìm ra và treo cổ lũ Ma Sói.',
    image: '/cards/villager.png',
    actionText: 'Ngủ say qua đêm.'
  },
  tanner: {
    id: 'tanner',
    name: 'Kẻ Chán Đời',
    team: 'neutral',
    priority: 110, // Không hoạt động ban đêm
    description: 'Chán ghét cuộc sống ngôi làng. Bạn chỉ giành chiến thắng duy nhất nếu bị cả làng biểu quyết treo cổ trên giàn giáo vào ban ngày.',
    image: '/cards/tanner.png',
    actionText: 'Ngủ say qua đêm.'
  }
};

/**
 * CẤU HÌNH CÁC BỘ BÀI MẪU TIÊU CHUẨN (GAME PRESETS)
 */
export const GAME_PRESETS = [
  {
    id: 'standard_8',
    name: 'Làng Quê Thanh Bình (8 Người)',
    playerCount: 8,
    roles: ['werewolf', 'werewolf', 'seer', 'bodyguard', 'villager', 'villager', 'villager', 'villager'],
    description: 'Bộ bài cơ bản cân bằng, luật chơi đơn giản, thích hợp để nhập môn hoặc nhóm nhỏ chơi nhanh.'
  },
  {
    id: 'standard_10',
    name: 'Đêm Trăng Máu (10 Người)',
    playerCount: 10,
    roles: ['werewolf', 'werewolf', 'seer', 'bodyguard', 'witch', 'cupid', 'villager', 'villager', 'villager', 'villager'],
    description: 'Bộ bài kịch tính với sự xuất hiện của Cupid ghép đôi và Phù Thủy nắm giữ sinh tử ngôi làng.'
  },
  {
    id: 'standard_12',
    name: 'Hỗn Loạn Đêm Trăng (12 Người)',
    playerCount: 12,
    roles: ['werewolf', 'werewolf', 'wolf_cub', 'seer', 'bodyguard', 'witch', 'hunter', 'serial_killer', 'villager', 'villager', 'villager', 'villager'],
    description: 'Chế độ đỉnh cao chuyên nghiệp. Phe Sói mạnh hơn với Sói Con, xuất hiện Sát Thủ đơn độc cạnh tranh khốc liệt.'
  }
];

/**
 * HÀM TRỘN VÀ CHIA VAI TRÒ NGẪU NHIÊN (FISHER-YATES SHUFFLE)
 */
export function shuffleRoles(roleIds) {
  const arr = [...roleIds];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
