import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const idType = String;

export interface AbilityVariable {
  name: string;
  value: number | number[];
}

export interface Ability {
  desc?: string | null;
  icon?: string | null;
  name?: string | null;
  variables?: AbilityVariable[];
  tooltipElements?: any[];
  calculations?: Record<string, any>;
}

export interface UnitStats {
  armor?: number | null;
  attackSpeed?: number | null;
  critChance?: number | null;
  critMultiplier?: number | null;
  damage?: number | null;
  hp?: number | null;
  initialMana?: number | null;
  magicResist?: number | null;
  mana?: number | null;
  range?: number | null;
}

export class TftUnit {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: String,
    example: 'TFT16_Tristana',
    description: 'API name của unit',
  })
  apiName: string;

  @ApiProperty({
    type: String,
    example: 'Tristana',
    description: 'Tên của unit',
  })
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Tristana',
    description: 'Tên tiếng Anh',
  })
  enName?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'TFT16_Tristana',
    description: 'Character name',
  })
  characterName?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Cost của unit',
  })
  cost?: number | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Icon path của unit',
  })
  icon?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Square icon path',
  })
  squareIcon?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Tile icon path',
  })
  tileIcon?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Role của unit',
  })
  role?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Tier của unit (S, A, B, C, D)',
    example: 'A',
  })
  tier?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Có cần unlock hay không',
    example: false,
  })
  needUnlock?: boolean;

  @ApiPropertyOptional({
    type: Object,
    description: 'Ability của unit',
  })
  ability?: Ability | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Stats của unit',
  })
  stats?: UnitStats | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Danh sách traits của unit',
  })
  traits?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['item-uuid-101', 'item-uuid-202'],
    description: 'Danh sách popular items của unit',
  })
  popularItems?: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}

