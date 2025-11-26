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

export class Synergy {
  @ApiProperty({
    type: String,
    example: 'armor',
    description: 'ID của synergy',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'Đại Cơ Giáp',
    description: 'Tên của synergy',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'ĐC',
    description: 'Viết tắt của synergy',
  })
  abbreviation: string;

  @ApiProperty({
    type: Number,
    example: 7,
    description: 'Số lượng hiện tại',
  })
  count: number;

  @ApiProperty({
    type: Number,
    example: 7,
    description: 'Số lượng tối đa',
  })
  max: number;

  @ApiProperty({
    type: String,
    example: '#facc15',
    description: 'Màu sắc của synergy',
  })
  color: string;
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
    description: 'Danh sách ID items (tạm thời dùng string)',
  })
  items?: string[];

  @ApiPropertyOptional({
    type: Object,
    description: 'Thông tin đầy đủ của champion (populated)',
  })
  championDetails?: any;
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

  @ApiProperty({
    type: BoardSize,
    description: 'Kích thước bàn cờ',
  })
  boardSize: BoardSize;

  @ApiProperty({
    type: [Synergy],
    description: 'Danh sách synergies',
  })
  synergies: Synergy[];

  @ApiProperty({
    type: [Unit],
    description: 'Danh sách units trên bàn cờ',
  })
  units: Unit[];

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

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}

