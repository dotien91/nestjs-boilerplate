import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class FilterCompositionDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  compId?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  difficulty?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  tier?: string | null;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isLateGame?: boolean | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Filter theo composition được đánh dấu OP',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isOp?: boolean | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Filter by units (championId or championKey). Compositions must contain ALL specified units.',
    example: ['garen', 'jarvaniv'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  units?: string[] | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Search in all arrays (units, earlyGame, midGame, bench) or only in units array',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  searchInAllArrays?: boolean | null;
}

export class SortCompositionDto {
  @ApiPropertyOptional()
  @IsString()
  orderBy: string;

  @ApiPropertyOptional()
  @IsString()
  order: string;
}

export class QueryCompositionDto {
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

  @ApiPropertyOptional({ type: FilterCompositionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterCompositionDto)
  filters?: FilterCompositionDto | null;

  @ApiPropertyOptional({ type: [SortCompositionDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SortCompositionDto)
  sort?: SortCompositionDto[] | null;
}

