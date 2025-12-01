import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class FilterTftUnitDto {
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

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  cost?: number | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  role?: string | null;
}

export class SortTftUnitDto {
  @ApiPropertyOptional()
  @IsString()
  orderBy: string;

  @ApiPropertyOptional()
  @IsString()
  order: string;
}

export class QueryTftUnitDto {
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

  // Flat format: name=Longshot
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

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  cost?: number | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  role?: string | null;

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
