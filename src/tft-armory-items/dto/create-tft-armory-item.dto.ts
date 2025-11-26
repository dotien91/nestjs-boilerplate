import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTftArmoryItemDto {
  @ApiProperty({
    type: String,
    example: 'TFT_Assist_Gold_30',
    description: 'API name của armory item',
  })
  @IsNotEmpty()
  @IsString()
  apiName: string;

  @ApiProperty({
    type: String,
    example: '30 gold',
    description: 'Tên của armory item',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: '30 gold',
    description: 'Tên tiếng Anh',
  })
  @IsOptional()
  @IsString()
  enName?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Mô tả của armory item',
  })
  @IsOptional()
  @IsString()
  desc?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Icon path của armory item',
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
    description: 'Effects của armory item',
  })
  @IsOptional()
  @IsObject()
  effects?: Record<string, any>;

  @ApiPropertyOptional({
    type: [String],
    description: 'Tags của armory item',
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
}

