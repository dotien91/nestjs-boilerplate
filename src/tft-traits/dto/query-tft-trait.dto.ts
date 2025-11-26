import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class FilterTftTraitDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  apiName?: string | null;
}

export class SortTftTraitDto {
  @ApiPropertyOptional()
  @IsString()
  orderBy: string;

  @ApiPropertyOptional()
  @IsString()
  order: string;
}

export class QueryTftTraitDto {
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

  @ApiPropertyOptional({ type: FilterTftTraitDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterTftTraitDto)
  filters?: FilterTftTraitDto | null;

  @ApiPropertyOptional({ type: [SortTftTraitDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SortTftTraitDto)
  sort?: SortTftTraitDto[] | null;
}

