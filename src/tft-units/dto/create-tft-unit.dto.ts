import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export interface AbilityVariableDto {
  name: string;
  value: number | number[];
}

export interface AbilityDto {
  desc?: string | null;
  icon?: string | null;
  name?: string | null;
  variables?: AbilityVariableDto[];
  tooltipElements?: any[];
  calculations?: Record<string, any>;
}

export interface UnitStatsDto {
  armor?: number | null;
  attackSpeed?: number | null;
  critChance?: number | null;
  critMultiplier?: number | null;
  damage?: number | null;
  hp?: number | null;
  initialMana?: number | null;
  magicResist?: number | null;
  mana?: number | null;
  range?: number | null;
}

export class CreateTftUnitDto {
  @ApiProperty({
    type: String,
    example: 'TFT16_Tristana',
    description: 'API name của unit',
  })
  @IsNotEmpty()
  @IsString()
  apiName: string;

  @ApiProperty({
    type: String,
    example: 'Tristana',
    description: 'Tên của unit',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Tristana',
    description: 'Tên tiếng Anh',
  })
  @IsOptional()
  @IsString()
  enName?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'TFT16_Tristana',
    description: 'Character name',
  })
  @IsOptional()
  @IsString()
  characterName?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Cost của unit',
  })
  @IsOptional()
  @IsNumber()
  cost?: number | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Icon path của unit',
  })
  @IsOptional()
  @IsString()
  icon?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Square icon path',
  })
  @IsOptional()
  @IsString()
  squareIcon?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Tile icon path',
  })
  @IsOptional()
  @IsString()
  tileIcon?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Role của unit',
  })
  @IsOptional()
  @IsString()
  role?: string | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Ability của unit',
  })
  @IsOptional()
  @IsObject()
  ability?: AbilityDto | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Stats của unit',
  })
  @IsOptional()
  @IsObject()
  stats?: UnitStatsDto | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Danh sách traits của unit',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  traits?: string[];
}

