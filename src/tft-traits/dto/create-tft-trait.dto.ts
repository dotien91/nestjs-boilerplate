import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export interface TraitEffectDto {
  maxUnits?: number;
  minUnits?: number;
  style?: number;
  variables?: Record<string, any>;
  variableMatches?: Array<{
    match: string;
    type?: string;
    multiplier?: string;
    full_match: string;
    hash?: string;
    value: number | string | null;
  }>;
}

export interface TraitUnitDto {
  unit: string;
  unit_cost?: number;
}

export class CreateTftTraitDto {
  @ApiProperty({
    type: String,
    example: 'TFT16_Freljord',
    description: 'API name của trait',
  })
  @IsNotEmpty()
  @IsString()
  apiName: string;

  @ApiProperty({
    type: String,
    example: 'Freljord',
    description: 'Tên của trait',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Freljord',
    description: 'Tên tiếng Anh',
  })
  @IsOptional()
  @IsString()
  enName?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Mô tả của trait',
  })
  @IsOptional()
  @IsString()
  desc?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Icon path của trait',
  })
  @IsOptional()
  @IsString()
  icon?: string | null;

  @ApiPropertyOptional({
    type: [Object],
    description: 'Effects của trait theo số lượng units',
  })
  @IsOptional()
  @IsArray()
  effects?: TraitEffectDto[];

  @ApiPropertyOptional({
    type: [Object],
    description: 'Danh sách units có trait này',
  })
  @IsOptional()
  @IsArray()
  units?: TraitUnitDto[];

  @ApiPropertyOptional({
    type: Object,
    description: 'Unit properties',
  })
  @IsOptional()
  @IsObject()
  unitProperties?: Record<string, any>;

  @ApiPropertyOptional({
    type: String,
    enum: ['origin', 'class'],
    example: 'origin',
    description: 'Loại trait: origin (Tộc) hoặc class (Hệ)',
  })
  @IsOptional()
  @IsString()
  type?: 'origin' | 'class' | null;
}

