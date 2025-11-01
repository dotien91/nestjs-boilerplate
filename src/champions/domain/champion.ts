import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from '../../files/domain/file';

const idType = String;

// Enum cho cost của champion
export enum ChampionCost {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
}

// Enum cho traits (hệ tộc)
export class Trait {
  @ApiProperty({
    type: String,
    example: 'Invoker',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'invoker',
  })
  key: string;
}

export class Champion {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: String,
    example: 'Ahri',
    description: 'Tên của champion',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'ahri',
    description: 'Key duy nhất của champion',
  })
  key: string;

  @ApiProperty({
    enum: ChampionCost,
    example: 3,
    description: 'Chi phí mua champion (1-5 vàng)',
  })
  cost: number;

  @ApiPropertyOptional({
    type: String,
    example:
      'Ahri fires an orb that deals magic damage to enemies it passes through.',
    description: 'Mô tả kỹ năng của champion',
  })
  abilityDescription?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Orb of Deception',
    description: 'Tên kỹ năng',
  })
  abilityName?: string | null;

  @ApiProperty({
    type: () => [Trait],
    description: 'Danh sách các trait (hệ/class) của champion',
    example: [
      { name: 'Invoker', key: 'invoker' },
      { name: 'Scholar', key: 'scholar' },
    ],
  })
  traits: Trait[];

  @ApiPropertyOptional({
    type: Number,
    example: 650,
    description: 'HP cơ bản',
  })
  health?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 50,
    description: 'Giáp cơ bản',
  })
  armor?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 50,
    description: 'Kháng phép cơ bản',
  })
  magicResist?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 45,
    description: 'Sát thương đánh thường',
  })
  attackDamage?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 0.75,
    description: 'Tốc độ đánh',
  })
  attackSpeed?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 4,
    description: 'Tầm đánh (số ô)',
  })
  attackRange?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 0,
    description: 'Mana khởi đầu',
  })
  startingMana?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 80,
    description: 'Mana tối đa để cast skill',
  })
  maxMana?: number | null;

  @ApiPropertyOptional({
    type: () => FileType,
    description: 'Hình ảnh của champion',
  })
  image?: FileType | null;

  @ApiPropertyOptional({
    type: String,
    example: 'set13',
    description: 'Set TFT hiện tại',
  })
  set?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Champion có đang active trong meta không',
  })
  isActive?: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
