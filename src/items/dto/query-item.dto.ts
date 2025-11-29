import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
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

  @ApiPropertyOptional({ type: FilterItemDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterItemDto)
  filters?: FilterItemDto | null;

  @ApiPropertyOptional({ type: [SortItemDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SortItemDto)
  sort?: SortItemDto[] | null;
}

