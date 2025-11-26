import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class FilterTftArmoryItemDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  apiName?: string | null;
}

export class SortTftArmoryItemDto {
  @ApiPropertyOptional()
  @IsString()
  orderBy: string;

  @ApiPropertyOptional()
  @IsString()
  order: string;
}

export class QueryTftArmoryItemDto {
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

  @ApiPropertyOptional({ type: FilterTftArmoryItemDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterTftArmoryItemDto)
  filters?: FilterTftArmoryItemDto | null;

  @ApiPropertyOptional({ type: [SortTftArmoryItemDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SortTftArmoryItemDto)
  sort?: SortTftArmoryItemDto[] | null;
}

