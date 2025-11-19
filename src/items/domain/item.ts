import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

const idType = String;

export interface VariableMatch {
  match: string;
  type?: string;
  multiplier?: string;
  full_match: string;
  hash?: string;
  value: number | string;
}

export class Item {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: String,
    example: 'Rabadon\'s Deathcap',
    description: 'Tên của item',
  })
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'TFT_Item_RabadonsDeathcap',
    description: 'API name của item',
  })
  apiName?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Rabadon\'s Deathcap',
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
    description: 'Danh sách các item cần để craft item này',
  })
  composition?: string[] | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Các traits liên quan',
  })
  associatedTraits?: string[] | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Các traits không tương thích',
  })
  incompatibleTraits?: string[] | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Tags của item',
  })
  tags?: string[] | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Item có unique không',
  })
  unique?: boolean | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Item có bị disabled không',
  })
  disabled?: boolean | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Effects của item (stats)',
    additionalProperties: true,
  })
  effects?: Record<string, any> | null;

  @ApiPropertyOptional({
    type: [Object],
    description: 'Variable matches cho description',
  })
  variableMatches?: VariableMatch[] | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Item được craft từ item nào',
  })
  from?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @Exclude()
  deletedAt?: Date | null;
}

