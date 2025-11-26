import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class FilterTftAugmentDto {
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
  trait?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  stage?: string | null; // Filter by stage tag like "2-1", "3-2"

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  unique?: boolean | null;
}

export class SortTftAugmentDto {
  @ApiPropertyOptional()
  @IsString()
  orderBy: string;

  @ApiPropertyOptional()
  @IsString()
  order: string;
}

export class QueryTftAugmentDto {
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

  @ApiPropertyOptional({ type: FilterTftAugmentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterTftAugmentDto)
  filters?: FilterTftAugmentDto | null;

  @ApiPropertyOptional({ type: [SortTftAugmentDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SortTftAugmentDto)
  sort?: SortTftAugmentDto[] | null;
}

