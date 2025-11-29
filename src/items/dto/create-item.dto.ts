import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ItemStatusEnum } from '../items-status.enum';
import { VariableMatchDto } from './item.dto';

export class CreateItemDto {
  @ApiProperty({
    type: String,
    example: 'Rabadon\'s Deathcap',
    description: 'Tên của item',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'TFT_Item_RabadonsDeathcap',
    description: 'API name của item',
  })
  @IsOptional()
  @IsString()
  apiName?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Rabadon\'s Deathcap',
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
    description: 'Danh sách các item cần để craft item này',
  })
  @IsOptional()
  @IsArray()
  composition?: string[] | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Các traits liên quan',
  })
  @IsOptional()
  @IsArray()
  associatedTraits?: string[] | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Các traits không tương thích',
  })
  @IsOptional()
  @IsArray()
  incompatibleTraits?: string[] | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Tags của item',
  })
  @IsOptional()
  @IsArray()
  tags?: string[] | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Item có unique không',
  })
  @IsOptional()
  @IsBoolean()
  unique?: boolean | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Item có bị disabled không',
  })
  @IsOptional()
  @IsBoolean()
  disabled?: boolean | null;

  @ApiPropertyOptional({
    type: String,
    enum: ItemStatusEnum,
    example: ItemStatusEnum.ACTIVE,
    description: 'Trạng thái của item: active hoặc disabled',
  })
  @IsOptional()
  @IsEnum(ItemStatusEnum)
  status?: ItemStatusEnum | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Effects của item (stats)',
  })
  @IsOptional()
  @IsObject()
  effects?: Record<string, any> | null;

  @ApiPropertyOptional({
    type: [VariableMatchDto],
    description: 'Variable matches cho description',
  })
  @IsOptional()
  @IsArray()
  variableMatches?: VariableMatchDto[] | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Item được craft từ item nào',
  })
  @IsOptional()
  @IsString()
  from?: string | null;
}

