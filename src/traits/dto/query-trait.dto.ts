import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TraitType } from '../domain/trait';

export class FilterTraitDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  key?: string | null;

  @ApiPropertyOptional({ enum: TraitType })
  @IsOptional()
  @IsEnum(TraitType)
  type?: TraitType | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  set?: string | null;
}

export class SortTraitDto {
  @ApiPropertyOptional()
  @IsString()
  orderBy: string;

  @ApiPropertyOptional()
  @IsString()
  order: string;
}

export class QueryTraitDto {
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

  @ApiPropertyOptional({ type: FilterTraitDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterTraitDto)
  filters?: FilterTraitDto | null;

  @ApiPropertyOptional({ type: [SortTraitDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SortTraitDto)
  sort?: SortTraitDto[] | null;
}
