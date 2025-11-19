import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VariableMatchDto {
  @ApiProperty()
  match: string;

  @ApiPropertyOptional()
  type?: string;

  @ApiPropertyOptional()
  multiplier?: string;

  @ApiProperty()
  full_match: string;

  @ApiPropertyOptional()
  hash?: string;

  @ApiProperty()
  value: number | string;
}

export class ItemDto {
  @ApiProperty({
    type: String,
  })
  id: string | number;

  @ApiProperty({
    type: String,
    example: 'Rabadon\'s Deathcap',
  })
  name: string;

  @ApiPropertyOptional({
    type: String,
  })
  apiName?: string | null;

  @ApiPropertyOptional({
    type: String,
  })
  enName?: string | null;

  @ApiPropertyOptional({
    type: String,
  })
  desc?: string | null;

  @ApiPropertyOptional({
    type: String,
  })
  icon?: string | null;

  @ApiPropertyOptional({
    type: [String],
  })
  composition?: string[] | null;

  @ApiPropertyOptional({
    type: [String],
  })
  associatedTraits?: string[] | null;

  @ApiPropertyOptional({
    type: [String],
  })
  incompatibleTraits?: string[] | null;

  @ApiPropertyOptional({
    type: [String],
  })
  tags?: string[] | null;

  @ApiPropertyOptional({
    type: Boolean,
  })
  unique?: boolean | null;

  @ApiPropertyOptional({
    type: Boolean,
  })
  disabled?: boolean | null;

  @ApiPropertyOptional({
    type: Object,
  })
  effects?: Record<string, any> | null;

  @ApiPropertyOptional({
    type: [VariableMatchDto],
  })
  variableMatches?: VariableMatchDto[] | null;

  @ApiPropertyOptional({
    type: String,
  })
  from?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

