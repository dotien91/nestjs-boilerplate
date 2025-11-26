import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTftAugmentDto {
  @ApiProperty({
    type: String,
    example: 'TFT_Augment_ExclusiveCustomization',
    description: 'API name của augment',
  })
  @IsNotEmpty()
  @IsString()
  apiName: string;

  @ApiProperty({
    type: String,
    example: 'Exclusive Customization',
    description: 'Tên của augment',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Exclusive Customization',
    description: 'Tên tiếng Anh',
  })
  @IsOptional()
  @IsString()
  enName?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Mô tả của augment',
  })
  @IsOptional()
  @IsString()
  desc?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Icon path của augment',
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
    description: 'Danh sách các item cần để craft augment này',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  composition?: string[];

  @ApiPropertyOptional({
    type: Object,
    description: 'Effects của augment',
  })
  @IsOptional()
  @IsObject()
  effects?: Record<string, any>;

  @ApiPropertyOptional({
    type: [String],
    description: 'Tags của augment (ví dụ: ["2-1", "3-2"])',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Augment có unique không',
  })
  @IsOptional()
  @IsBoolean()
  unique?: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Augment được craft từ',
  })
  @IsOptional()
  @IsString()
  from?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'ID của augment',
  })
  @IsOptional()
  @IsString()
  augmentId?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Augment có bị disabled không',
  })
  @IsOptional()
  @IsBoolean()
  disabled?: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Type của augment',
  })
  @IsOptional()
  @IsString()
  type?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Texture của augment',
  })
  @IsOptional()
  @IsString()
  texture?: string | null;
}

