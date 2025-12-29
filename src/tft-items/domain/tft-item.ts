import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const idType = String;

export interface VariableMatch {
  match: string;
  type?: string;
  multiplier?: string;
  full_match: string;
  hash?: string;
  value: number | string;
}

export class TftItem {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: String,
    example: 'TFT_Item_RabadonsDeathcap',
    description: 'API name của item',
  })
  apiName: string;

  @ApiProperty({
    type: String,
    example: "Rabadon's Deathcap",
    description: 'Tên của item',
  })
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: "Rabadon's Deathcap",
    description: 'Tên tiếng Anh',
  })
  enName?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Mô tả của item',
  })
  desc?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Icon path của item',
  })
  icon?: string | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Danh sách các trait liên quan',
  })
  associatedTraits?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Danh sách các trait không tương thích',
  })
  incompatibleTraits?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Danh sách các item cần để craft item này',
  })
  composition?: string[];

  @ApiPropertyOptional({
    type: Object,
    description: 'Effects của item',
  })
  effects?: Record<string, any>;

  @ApiPropertyOptional({
    type: [String],
    description: 'Tags của item',
  })
  tags?: string[];

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Item có unique không',
  })
  unique?: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Item được craft từ',
  })
  from?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'ID của item',
  })
  itemId?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Item có bị disabled không',
  })
  disabled?: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Type của item',
  })
  type?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Texture của item',
  })
  texture?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'S',
    description: 'Tier của item (S, A, B, C, D)',
    enum: ['S', 'A', 'B', 'C', 'D'],
  })
  tier?: string | null;

  @ApiPropertyOptional({
    type: [Object],
    description: 'Variable matches trong description',
  })
  variableMatches?: VariableMatch[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}

