import { ApiPropertyOptional } from '@nestjs/swagger';
import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

function parseJsonQueryValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

export class FilterCompositionDto {
  @ApiPropertyOptional({
    type: String,
    example: '18',
    description: 'Filter theo mùa TFT',
  })
  @IsOptional()
  @IsString()
  season_id?: string | null;

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
    type: Boolean,
    description: 'Filter theo composition active (đang hiển thị)',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  active?: boolean | null;

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
  @Transform(
    ({ value }) => {
      const parsed = parseJsonQueryValue(value);
      return parsed && typeof parsed === 'object'
        ? plainToInstance(FilterCompositionDto, parsed)
        : parsed;
    },
    { toClassOnly: true },
  )
  @ValidateNested()
  @Type(() => FilterCompositionDto)
  filters?: FilterCompositionDto | null;

  @ApiPropertyOptional({ type: [SortCompositionDto] })
  @IsOptional()
  @Transform(
    ({ value }) => {
      const parsed = parseJsonQueryValue(value);
      return Array.isArray(parsed)
        ? plainToInstance(SortCompositionDto, parsed)
        : parsed;
    },
    { toClassOnly: true },
  )
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortCompositionDto)
  sort?: SortCompositionDto[] | null;
}
