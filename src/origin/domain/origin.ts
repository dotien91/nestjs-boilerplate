import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from '../../files/domain/file';

const idType = String;

// Enum cho loại origin
export enum OriginType {
  ORIGIN = 'origin', // Tộc (Vệ Binh, Phù Thuỷ, etc.)
  CLASS = 'class', // Hệ (Sát Thủ, Đấu Sĩ, etc.)
}

export class Origin {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: String,
    example: 'Vệ Binh',
    description: 'Tên hiển thị của origin',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'guardian',
    description: 'Key duy nhất của origin',
  })
  key: string;

  @ApiProperty({
    enum: OriginType,
    example: OriginType.ORIGIN,
    description: 'Loại origin: origin (tộc) hoặc class (hệ)',
  })
  type: OriginType;

  @ApiPropertyOptional({
    type: String,
    example:
      'Vệ Binh nhận giáp và kháng phép tăng lên. Khi có kẻ địch gần, họ nhận thêm giáp và kháng phép.',
    description: 'Mô tả hiệu ứng của origin',
  })
  description?: string | null;

  @ApiPropertyOptional({
    type: [Object],
    example: [
      { count: 2, effect: '+40 Armor' },
      { count: 4, effect: '+100 Armor' },
      { count: 6, effect: '+200 Armor' },
    ],
    description: 'Các mốc kích hoạt origin',
  })
  tiers?: { count: number; effect: string }[] | null;

  @ApiPropertyOptional({
    type: () => FileType,
    description: 'Icon của origin',
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
    description: 'Origin có đang active trong meta không',
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    type: [String],
    example: ['6904cf6d31b5cf113d6665ae', '6904cf6d31b5cf113d6665af'],
    description: 'Danh sách ID của champions có origin này',
  })
  champions?: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
