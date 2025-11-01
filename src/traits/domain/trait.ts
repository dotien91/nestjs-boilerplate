import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from '../../files/domain/file';

const idType = String;

// Enum cho loại trait
export enum TraitType {
  ORIGIN = 'origin', // Tộc (Vệ Binh, Phù Thuỷ, etc.)
  CLASS = 'class', // Hệ (Sát Thủ, Đấu Sĩ, etc.)
}

export class Trait {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: String,
    example: 'Vệ Binh',
    description: 'Tên hiển thị của trait',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'guardian',
    description: 'Key duy nhất của trait',
  })
  key: string;

  @ApiProperty({
    enum: TraitType,
    example: TraitType.ORIGIN,
    description: 'Loại trait: origin (tộc) hoặc class (hệ)',
  })
  type: TraitType;

  @ApiPropertyOptional({
    type: String,
    example:
      'Vệ Binh nhận giáp và kháng phép tăng lên. Khi có kẻ địch gần, họ nhận thêm giáp và kháng phép.',
    description: 'Mô tả hiệu ứng của trait',
  })
  description?: string | null;

  @ApiPropertyOptional({
    type: [Object],
    example: [
      { count: 2, effect: '+40 Armor' },
      { count: 4, effect: '+100 Armor' },
      { count: 6, effect: '+200 Armor' },
    ],
    description: 'Các mốc kích hoạt trait',
  })
  tiers?: { count: number; effect: string }[] | null;

  @ApiPropertyOptional({
    type: () => FileType,
    description: 'Icon của trait',
  })
  icon?: FileType | null;

  @ApiPropertyOptional({
    type: String,
    example: 'set13',
    description: 'Set TFT hiện tại',
  })
  set?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Trait có đang active trong meta không',
  })
  isActive?: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
