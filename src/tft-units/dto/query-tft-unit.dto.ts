import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
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

  @ApiPropertyOptional({ type: FilterTftUnitDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterTftUnitDto)
  filters?: FilterTftUnitDto | null;

  @ApiPropertyOptional({ type: [SortTftUnitDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SortTftUnitDto)
  sort?: SortTftUnitDto[] | null;
}

