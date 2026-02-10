import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Champions module removed

const idType = String;

export class BoardSize {
  @ApiProperty({
    type: Number,
    example: 4,
    description: 'Số hàng của bàn cờ',
  })
  rows: number;

  @ApiProperty({
    type: Number,
    example: 7,
    description: 'Số cột của bàn cờ',
  })
  cols: number;
}


export class Position {
  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Hàng (row)',
  })
  row: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Cột (col)',
  })
  col: number;
}

export class Unit {
  @ApiProperty({
    type: String,
    example: 'champ-uuid-123',
    description: 'ID của champion',
  })
  championId: string;

  @ApiProperty({
    type: String,
    example: 'garen',
    description: 'Key của champion',
  })
  championKey: string;

  @ApiProperty({
    type: String,
    example: 'Garen',
    description: 'Tên champion',
  })
  name: string;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Cost của champion',
  })
  cost: number;

  @ApiProperty({
    type: Number,
    example: 2,
    description: 'Sao của champion (1, 2, 3)',
  })
  star: number;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Có phải carry không',
  })
  carry?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Unit này có cần unlock không (map từ TFT Unit.needUnlock)',
  })
  needUnlock?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Có cần lên 3 sao không',
  })
  need3Star?: boolean;

  @ApiProperty({
    type: Position,
    description: 'Vị trí trên bàn cờ',
  })
  position: Position;

  @ApiPropertyOptional({
    type: String,
    example: 'https://ddragon.leagueoflegends.com/...',
    description: 'URL ảnh champion',
  })
  image?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['item-uuid-789', 'item-uuid-101'],
    description: 'Danh sách ID items',
  })
  items?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['Demacia', 'Warden'],
    description: 'Danh sách traits của unit (lấy từ TFT Unit)',
  })
  traits?: string[];

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Tier của unit (1, 2, 3, 4, 5)',
  })
  tier?: number;

  @ApiPropertyOptional({
    type: [Object],
    description: 'Thông tin đầy đủ của items (populated)',
  })
  itemsDetails?: Array<{
    id: string | number;
    apiName?: string | null;
    name: string;
    icon?: string | null;
    tag?: string | null;
    unique?: boolean | null;
  }>;

  @ApiPropertyOptional({
    type: Object,
    description: 'Thông tin đầy đủ của champion (populated)',
  })
  championDetails?: any;
}

export class Augment {
  @ApiProperty({
    type: String,
    example: 'levelup',
    description: 'Tên của augment',
  })
  name: string;

  @ApiProperty({
    type: Number,
    example: 3,
    description: 'Tier của augment (1, 2, hoặc 3)',
  })
  tier: number;
}

export class CarryItem {
  @ApiProperty({
    type: String,
    example: 'champ-uuid-789',
    description: 'ID của champion',
  })
  championId: string;

  @ApiProperty({
    type: String,
    example: 'yone',
    description: 'Key của champion',
  })
  championKey: string;

  @ApiProperty({
    type: String,
    example: 'Yone',
    description: 'Tên champion',
  })
  championName: string;

  @ApiProperty({
    type: String,
    example: 'Chủ lực sát thương',
    description: 'Vai trò của champion',
  })
  role: string;

  @ApiPropertyOptional({
    type: String,
    example: 'https://ddragon.leagueoflegends.com/...',
    description: 'URL ảnh champion',
  })
  image?: string;

  @ApiProperty({
    type: [String],
    example: ['item-uuid-202', 'item-uuid-303'],
    description: 'Danh sách ID items (tạm thời dùng string)',
  })
  items: string[];

  @ApiPropertyOptional({
    type: Object,
    description: 'Thông tin đầy đủ của champion (populated)',
  })
  championDetails?: any;
}

export class Composition {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: String,
    example: 'comp-daicogiap-yone',
    description: 'ID của composition',
  })
  compId: string;

  @ApiProperty({
    type: String,
    example: 'Đại Cơ Giáp Yone',
    description: 'Tên của composition',
  })
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Lvl 7/8 Roll',
    description: 'Kế hoạch chơi',
  })
  plan?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Trung bình',
    description: 'Độ khó',
  })
  difficulty?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Roll nhẹ ở cấp 7...',
    description: 'Mô tả meta',
  })
  metaDescription?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Có phải late game không',
  })
  isLateGame?: boolean;

  @ApiPropertyOptional({
    type: String,
    example: 'S',
    description: 'Tier của composition (S, A, B, C, D)',
    enum: ['S', 'A', 'B', 'C', 'D'],
  })
  tier?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Composition có đang active không (true cho compositions mới crawl)',
    default: false,
  })
  active?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Composition có được đánh dấu OP (overpowered) không',
    default: false,
  })
  isOp?: boolean;

  @ApiProperty({
    type: BoardSize,
    description: 'Kích thước bàn cờ',
  })
  boardSize: BoardSize;

  @ApiProperty({
    type: [Unit],
    description: 'Danh sách units trên bàn cờ (end game)',
  })
  units: Unit[];

  @ApiPropertyOptional({
    type: [Unit],
    description: 'Danh sách units đầu game',
  })
  earlyGame?: Unit[];

  @ApiPropertyOptional({
    type: [Unit],
    description: 'Danh sách units giữa game',
  })
  midGame?: Unit[];

  @ApiPropertyOptional({
    type: [Unit],
    description: 'Danh sách units trên bench',
  })
  bench?: Unit[];

  @ApiPropertyOptional({
    type: [CarryItem],
    description: 'Danh sách carry items',
  })
  carryItems?: CarryItem[];

  @ApiPropertyOptional({
    type: [String],
    example: ['Ưu tiên roll tìm Yone 2★...'],
    description: 'Ghi chú',
  })
  notes?: string[];

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Độ ưu tiên trong carousel (số càng nhỏ càng ưu tiên)',
  })
  carouselPriority?: number;

  @ApiPropertyOptional({
    type: [Augment],
    example: [{ name: 'levelup', tier: 3 }, { name: 'slammin', tier: 2 }],
    description: 'Danh sách augments được đề xuất (kèm tier)',
  })
  augments?: Augment[];

  @ApiPropertyOptional({
    type: Unit,
    description: 'Core champion của composition (dạng unit object)',
  })
  coreChampion?: Unit;

  @ApiPropertyOptional({
    type: String,
    example: 'TFT_TeamCode_Example',
    description: 'TeamCode để import composition vào game TFT',
  })
  teamCode?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}

