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

export class TftAugment {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: String,
    example: 'TFT_Augment_ExclusiveCustomization',
    description: 'API name của augment',
  })
  apiName: string;

  @ApiProperty({
    type: String,
    example: 'Exclusive Customization',
    description: 'Tên của augment',
  })
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Exclusive Customization',
    description: 'Tên tiếng Anh',
  })
  enName?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Mô tả của augment',
  })
  desc?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Icon path của augment',
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
    description: 'Danh sách các item cần để craft augment này',
  })
  composition?: string[];

  @ApiPropertyOptional({
    type: Object,
    description: 'Effects của augment',
  })
  effects?: Record<string, any>;

  @ApiPropertyOptional({
    type: [String],
    description: 'Tags của augment (ví dụ: ["2-1", "3-2"])',
  })
  tags?: string[];

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Augment có unique không',
  })
  unique?: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Augment được craft từ',
  })
  from?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'ID của augment',
  })
  augmentId?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Augment có bị disabled không',
  })
  disabled?: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Type của augment',
  })
  type?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Texture của augment',
  })
  texture?: string | null;

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

