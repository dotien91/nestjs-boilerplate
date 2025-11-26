import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const idType = String;

export interface TraitEffect {
  maxUnits?: number;
  minUnits?: number;
  style?: number;
  variables?: Record<string, any>;
  variableMatches?: Array<{
    match: string;
    type?: string;
    multiplier?: string;
    full_match: string;
    hash?: string;
    value: number | string | null;
  }>;
}

export interface TraitUnit {
  unit: string;
  unit_cost?: number;
}

export class TftTrait {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: String,
    example: 'TFT16_Freljord',
    description: 'API name của trait',
  })
  apiName: string;

  @ApiProperty({
    type: String,
    example: 'Freljord',
    description: 'Tên của trait',
  })
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Freljord',
    description: 'Tên tiếng Anh',
  })
  enName?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Mô tả của trait',
  })
  desc?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Icon path của trait',
  })
  icon?: string | null;

  @ApiPropertyOptional({
    type: [Object],
    description: 'Effects của trait theo số lượng units',
  })
  effects?: TraitEffect[];

  @ApiPropertyOptional({
    type: [Object],
    description: 'Danh sách units có trait này',
  })
  units?: TraitUnit[];

  @ApiPropertyOptional({
    type: Object,
    description: 'Unit properties',
  })
  unitProperties?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}

