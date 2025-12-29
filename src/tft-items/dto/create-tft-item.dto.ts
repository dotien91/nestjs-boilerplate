import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTftItemDto {
  @ApiProperty({
    type: String,
    example: 'TFT_Item_RabadonsDeathcap',
    description: 'API name của item',
  })
  @IsNotEmpty()
  @IsString()
  apiName: string;

  @ApiProperty({
    type: String,
    example: "Rabadon's Deathcap",
    description: 'Tên của item',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: "Rabadon's Deathcap",
    description: 'Tên tiếng Anh',
  })
  @IsOptional()
  @IsString()
  enName?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Mô tả của item',
  })
  @IsOptional()
  @IsString()
  desc?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Icon path của item',
  })
  @IsOptional()
  @IsString()
  icon?: string | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Danh sách các trait liên quan',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  associatedTraits?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Danh sách các trait không tương thích',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  incompatibleTraits?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Danh sách các item cần để craft item này',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  composition?: string[];

  @ApiPropertyOptional({
    type: Object,
    description: 'Effects của item',
  })
  @IsOptional()
  @IsObject()
  effects?: Record<string, any>;

  @ApiPropertyOptional({
    type: [String],
    description: 'Tags của item',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Item có unique không',
  })
  @IsOptional()
  @IsBoolean()
  unique?: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Item được craft từ',
  })
  @IsOptional()
  @IsString()
  from?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'ID của item',
  })
  @IsOptional()
  @IsString()
  itemId?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Item có bị disabled không',
  })
  @IsOptional()
  @IsBoolean()
  disabled?: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Type của item',
  })
  @IsOptional()
  @IsString()
  type?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Texture của item',
  })
  @IsOptional()
  @IsString()
  texture?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'S',
    description: 'Tier của item (S, A, B, C, D)',
    enum: ['S', 'A', 'B', 'C', 'D'],
  })
  @IsOptional()
  @IsString()
  tier?: string | null;
}

