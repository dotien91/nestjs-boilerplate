import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class FilterChampionDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  key?: string | null;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? Number(value) : null))
  cost?: number | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  set?: string | null;
}

export class SortChampionDto {
  @ApiPropertyOptional()
  @IsString()
  orderBy: string;

  @ApiPropertyOptional()
  @IsString()
  order: string;
}

export class QueryChampionDto {
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

  @ApiPropertyOptional({ type: FilterChampionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterChampionDto)
  filters?: FilterChampionDto | null;

  @ApiPropertyOptional({ type: [SortChampionDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SortChampionDto)
  sort?: SortChampionDto[] | null;
}
