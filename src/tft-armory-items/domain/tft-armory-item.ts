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

export class TftArmoryItem {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: String,
    example: 'TFT_Assist_Gold_30',
    description: 'API name của armory item',
  })
  apiName: string;

  @ApiProperty({
    type: String,
    example: '30 gold',
    description: 'Tên của armory item',
  })
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: '30 gold',
    description: 'Tên tiếng Anh',
  })
  enName?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Mô tả của armory item',
  })
  desc?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Icon path của armory item',
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
    description: 'Effects của armory item',
  })
  effects?: Record<string, any>;

  @ApiPropertyOptional({
    type: [String],
    description: 'Tags của armory item',
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

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}

