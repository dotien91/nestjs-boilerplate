import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class BoardSizeDto {
  @ApiProperty({
    type: Number,
    example: 4,
    description: 'Số hàng của bàn cờ',
  })
  @IsNotEmpty()
  @IsNumber()
  rows: number;

  @ApiProperty({
    type: Number,
    example: 7,
    description: 'Số cột của bàn cờ',
  })
  @IsNotEmpty()
  @IsNumber()
  cols: number;
}

class SynergyDto {
  @ApiProperty({
    type: String,
    example: 'armor',
    description: 'ID của synergy',
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    type: String,
    example: 'Đại Cơ Giáp',
    description: 'Tên của synergy',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    example: 'ĐC',
    description: 'Viết tắt của synergy',
  })
  @IsNotEmpty()
  @IsString()
  abbreviation: string;

  @ApiProperty({
    type: Number,
    example: 7,
    description: 'Số lượng hiện tại',
  })
  @IsNotEmpty()
  @IsNumber()
  count: number;

  @ApiProperty({
    type: Number,
    example: 7,
    description: 'Số lượng tối đa',
  })
  @IsNotEmpty()
  @IsNumber()
  max: number;

  @ApiProperty({
    type: String,
    example: '#facc15',
    description: 'Màu sắc của synergy',
  })
  @IsNotEmpty()
  @IsString()
  color: string;
}

class PositionDto {
  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Hàng (row)',
  })
  @IsNotEmpty()
  @IsNumber()
  row: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Cột (col)',
  })
  @IsNotEmpty()
  @IsNumber()
  col: number;
}

class UnitDto {
  @ApiProperty({
    type: String,
    example: 'champ-uuid-123',
    description: 'ID của champion',
  })
  @IsNotEmpty()
  @IsString()
  championId: string;

  @ApiProperty({
    type: String,
    example: 'garen',
    description: 'Key của champion',
  })
  @IsNotEmpty()
  @IsString()
  championKey: string;

  @ApiProperty({
    type: String,
    example: 'Garen',
    description: 'Tên champion',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Cost của champion',
  })
  @IsNotEmpty()
  @IsNumber()
  cost: number;

  @ApiProperty({
    type: Number,
    example: 2,
    description: 'Sao của champion (1, 2, 3)',
  })
  @IsNotEmpty()
  @IsNumber()
  star: number;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Có phải carry không',
  })
  @IsOptional()
  @IsBoolean()
  carry?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Có cần lên 3 sao không',
  })
  @IsOptional()
  @IsBoolean()
  need3Star?: boolean;

  @ApiProperty({
    type: PositionDto,
    description: 'Vị trí trên bàn cờ',
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PositionDto)
  position: PositionDto;

  @ApiPropertyOptional({
    type: String,
    example: 'https://ddragon.leagueoflegends.com/...',
    description: 'URL ảnh champion',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['item-uuid-789', 'item-uuid-101'],
    description: 'Danh sách ID items (tạm thời dùng string)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  items?: string[];
}

class CarryItemDto {
  @ApiProperty({
    type: String,
    example: 'champ-uuid-789',
    description: 'ID của champion',
  })
  @IsNotEmpty()
  @IsString()
  championId: string;

  @ApiProperty({
    type: String,
    example: 'yone',
    description: 'Key của champion',
  })
  @IsNotEmpty()
  @IsString()
  championKey: string;

  @ApiProperty({
    type: String,
    example: 'Yone',
    description: 'Tên champion',
  })
  @IsNotEmpty()
  @IsString()
  championName: string;

  @ApiProperty({
    type: String,
    example: 'Chủ lực sát thương',
    description: 'Vai trò của champion',
  })
  @IsNotEmpty()
  @IsString()
  role: string;

  @ApiPropertyOptional({
    type: String,
    example: 'https://ddragon.leagueoflegends.com/...',
    description: 'URL ảnh champion',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({
    type: [String],
    example: ['item-uuid-202', 'item-uuid-303'],
    description: 'Danh sách ID items (tạm thời dùng string)',
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  items: string[];
}

export class CreateCompositionDto {
  @ApiProperty({
    type: String,
    example: 'comp-daicogiap-yone',
    description: 'ID của composition (unique) - tự động tạo nếu không có',
  })
  @IsOptional()
  @IsString()
  compId?: string;

  @ApiProperty({
    type: String,
    example: 'Đại Cơ Giáp Yone',
    description: 'Tên của composition',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Lvl 7/8 Roll',
    description: 'Kế hoạch chơi',
  })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Trung bình',
    description: 'Độ khó',
  })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Roll nhẹ ở cấp 7...',
    description: 'Mô tả meta',
  })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Có phải late game không',
  })
  @IsOptional()
  @IsBoolean()
  isLateGame?: boolean;

  @ApiPropertyOptional({
    type: String,
    example: 'S',
    description: 'Tier của composition (S, A, B, C, D)',
    enum: ['S', 'A', 'B', 'C', 'D'],
  })
  @IsOptional()
  @IsString()
  tier?: string;

  @ApiProperty({
    type: BoardSizeDto,
    description: 'Kích thước bàn cờ',
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => BoardSizeDto)
  boardSize: BoardSizeDto;

  @ApiProperty({
    type: [SynergyDto],
    description: 'Danh sách synergies',
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SynergyDto)
  synergies: SynergyDto[];

  @ApiProperty({
    type: [UnitDto],
    description: 'Danh sách units trên bàn cờ',
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UnitDto)
  units: UnitDto[];

  @ApiPropertyOptional({
    type: [UnitDto],
    description: 'Danh sách units trên bench',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UnitDto)
  bench?: UnitDto[];

  @ApiPropertyOptional({
    type: [CarryItemDto],
    description: 'Danh sách carry items',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CarryItemDto)
  carryItems?: CarryItemDto[];

  @ApiPropertyOptional({
    type: [String],
    example: ['Ưu tiên roll tìm Yone 2★...'],
    description: 'Ghi chú',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notes?: string[];
}

