import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from '../../files/domain/file';

const idType = String;

// Enum cho loại origin
export enum OriginType {
  ORIGIN = 'origin', // Tộc (Vệ Binh, Phù Thuỷ, etc.)
  CLASS = 'class', // Hệ (Sát Thủ, Đấu Sĩ, etc.)
}

// Interface cho effect/tier của origin
export interface OriginEffect {
  minUnits: number;
  maxUnits: number;
  style: string; // bronze, silver, gold
  effect: string;
}

export class Origin {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: String,
    example: 'TFT16_Quickstriker',
    description: 'API name của origin (unique identifier)',
  })
  apiName: string;

  @ApiPropertyOptional({
    type: String,
    example: 'quickstriker',
    description: 'Key đơn giản của origin (unique identifier)',
  })
  key?: string | null;

  @ApiProperty({
    type: String,
    example: 'Quickstriker',
    description: 'Tên hiển thị của origin',
  })
  name: string;

  @ApiPropertyOptional({
    enum: OriginType,
    example: OriginType.ORIGIN,
    description: 'Loại origin (origin hoặc class)',
  })
  type?: OriginType | null;

  @ApiPropertyOptional({
    type: [Number],
    example: [2, 4, 6],
    description: 'Danh sách các tier của origin',
  })
  tiers?: number[] | null;

  @ApiPropertyOptional({
    type: String,
    example: 'TFT16',
    description: 'Set của origin (ví dụ: TFT16)',
  })
  set?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Origin có đang active không',
  })
  isActive?: boolean;

  @ApiProperty({
    type: String,
    example: 'TFT16_Quickstriker',
    description: 'Trait identifier',
  })
  trait: string;

  @ApiProperty({
    type: String,
    example: 'Quickstriker',
    description: 'Tên trait',
  })
  trait_name: string;

  @ApiPropertyOptional({
    type: String,
    example:
      'Your team gains 15% Attack Speed. Quickstrikers gain bonus Attack Speed...',
    description: 'Mô tả hiệu ứng của origin (có thể chứa HTML)',
  })
  description?: string | null;

  @ApiPropertyOptional({
    type: [Object],
    example: [
      { minUnits: 2, maxUnits: 2, style: 'bronze', effect: '' },
      { minUnits: 3, maxUnits: 3, style: 'silver', effect: '' },
    ],
    description: 'Các mốc kích hoạt origin với minUnits, maxUnits, style, effect',
  })
  effects?: OriginEffect[] | null;

  @ApiPropertyOptional({
    type: String,
    example: 'quickstriker',
    description: 'Tên file ảnh của origin',
  })
  img_name?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'quickstriker',
    description: 'Tên ảnh trait',
  })
  trait_img?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Mô tả đã được fix chưa',
  })
  description_fixed?: boolean;

  @ApiPropertyOptional({
    type: () => FileType,
    description: 'Icon của origin (FileType object)',
  })
  icon?: FileType | null;

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
