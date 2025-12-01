import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ItemStatusEnum } from '../items-status.enum';

export class FilterItemDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  apiName?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  tag?: string | null;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => (value === 'true' || value === true))
  unique?: boolean | null;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => (value === 'true' || value === true))
  disabled?: boolean | null;

  @ApiPropertyOptional({
    type: String,
    enum: ItemStatusEnum,
    description: 'Lọc theo trạng thái: active hoặc disabled',
  })
  @IsOptional()
  @IsEnum(ItemStatusEnum)
  status?: ItemStatusEnum | null;
}

export class SortItemDto {
  @ApiPropertyOptional()
  @IsString()
  orderBy: string;

  @ApiPropertyOptional()
  @IsString()
  order: string;
}

export class QueryItemDto {
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;

  // Flat format: name=ItemName
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  apiName?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  tag?: string | null;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  unique?: boolean | null;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  disabled?: boolean | null;

  @ApiPropertyOptional({
    type: String,
    enum: ItemStatusEnum,
    description: 'Lọc theo trạng thái: active hoặc disabled',
  })
  @IsOptional()
  @IsEnum(ItemStatusEnum)
  status?: ItemStatusEnum | null;

  // Flat format: orderBy=name&order=asc
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  orderBy?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  order?: string | null;
}

