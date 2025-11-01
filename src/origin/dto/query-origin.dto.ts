import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { OriginType } from '../domain/origin';

export class FilterOriginDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  key?: string | null;

  @ApiPropertyOptional({ enum: OriginType })
  @IsOptional()
  @IsEnum(OriginType)
  type?: OriginType | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  set?: string | null;
}

export class SortOriginDto {
  @ApiPropertyOptional()
  @IsString()
  orderBy: string;

  @ApiPropertyOptional()
  @IsString()
  order: string;
}

export class QueryOriginDto {
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

  @ApiPropertyOptional({ type: FilterOriginDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterOriginDto)
  filters?: FilterOriginDto | null;

  @ApiPropertyOptional({ type: [SortOriginDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SortOriginDto)
  sort?: SortOriginDto[] | null;
}
