import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from '../../files/domain/file';
import { Origin } from '../../origin/domain/origin';

const idType = String;

// Enum cho cost của champion
export enum ChampionCost {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
}

// Interface cho ability variable (có thể là array [1⭐, 2⭐, 3⭐] hoặc giá trị đơn)
export interface AbilityVariable {
  name: string;
  value: number | [number, number, number]; // Giá trị đơn hoặc array [1⭐, 2⭐, 3⭐]
}

// Interface cho Set 15 mechanics
export interface Set15Mechanic {
  Primary?: string | null;
  Secondary?: string | null;
  Weight?: number | null;
  MaxLevel?: number | null;
  MinLevel?: number | null;
  MaxStage?: number | null;
  MinStage?: number | null;
  IsPVEAllowed?: boolean | null;
  IsChampion?: boolean | null;
  IsCommon?: boolean | null;
  AllowMultiple?: boolean | null;
  IsTrait?: boolean | null;
  IsWeird?: boolean | null;
  IsDuo?: boolean | null;
  TraitLevel?: number | null;
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

  @ApiPropertyOptional({
    type: String,
    example: 'TFT15_Ahri',
    description: 'Tên API của champion',
  })
  apiName?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'TFT15_Ahri',
    description: 'Tên character',
  })
  characterName?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Ahri',
    description: 'Tên tiếng Anh',
  })
  enName?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '{d5823aeb}',
    description: 'ID vai trò của champion',
  })
  role?: string | null;

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
    type: Number,
    example: 0.25,
    description: 'Tỷ lệ chí mạng',
  })
  critChance?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1.4,
    description: 'Hệ số chí mạng',
  })
  critMultiplier?: number | null;

  @ApiPropertyOptional({
    type: String,
    example: 'ASSETS/Characters/TFT15_Ahri/HUD/Icons2D/TFT15_Ahri_Passive.TFT_Set15.tex',
    description: 'Icon của kỹ năng',
  })
  abilityIcon?: string | null;

  @ApiPropertyOptional({
    type: Array,
    description: 'Các biến kỹ năng (có thể thay đổi theo star level)',
    example: [
      { name: 'Damage', value: [460, 690, 1275] },
      { name: 'Duration', value: 3 },
    ],
  })
  abilityVariables?: AbilityVariable[] | null;

  @ApiPropertyOptional({
    type: () => FileType,
    description: 'Hình ảnh của champion',
  })
  image?: FileType | null;

  @ApiPropertyOptional({
    type: String,
    example: 'ASSETS/Characters/TFT15_Ahri/Skins/Base/Images/TFT15_Ahri.TFT_Set15.tex',
    description: 'Icon chính của champion',
  })
  icon?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'ASSETS/Characters/TFT15_Ahri/Skins/Base/Images/TFT15_Ahri_Mobile.TFT_Set15.tex',
    description: 'Icon vuông (mobile)',
  })
  squareIcon?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'ASSETS/Characters/TFT15_Ahri/HUD/TFT15_Ahri_Square.TFT_Set15.tex',
    description: 'Icon tile',
  })
  tileIcon?: string | null;

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

  @ApiPropertyOptional({
    type: () => [Origin],
    description: 'Danh sách các origin của champion',
  })
  origins?: Origin[] | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Set 15 mechanics (Primary/Secondary)',
    example: {
      Primary: 'SecretTechnique',
      Secondary: null,
      Weight: 10,
      IsPVEAllowed: true,
    },
  })
  set15Mechanic?: Set15Mechanic | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Set 15 hero mechanics',
  })
  set15MechanicHero?: Set15Mechanic | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
