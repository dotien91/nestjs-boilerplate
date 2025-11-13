import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterItemDto {
  @ApiPropertyOptional()
  apiName?: string | null;

  @ApiPropertyOptional()
  name?: string | null;

  @ApiPropertyOptional()
  set?: string | null;

  @ApiPropertyOptional()
  isActive?: boolean | null;

  @ApiPropertyOptional()
  associatedTraits?: string[] | null;

  @ApiPropertyOptional()
  tags?: string[] | null;

  @ApiPropertyOptional()
  unique?: boolean | null;
}

export class SortItemDto {
  @ApiPropertyOptional()
  field: string;

  @ApiPropertyOptional()
  order: 'ASC' | 'DESC';
}
