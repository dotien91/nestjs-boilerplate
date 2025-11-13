import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from '../../files/domain/file';

const idType = String;

// Interface cho variable match trong description
export interface VariableMatch {
  match: string;
  type: string;
  full_match: string;
  hash: string;
  value: number;
}

// Interface cho effects của item
export interface ItemEffects {
  [key: string]: any; // Các thuộc tính effects đa dạng
}

export class Item {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: String,
    example: 'TFT5_Item_LastWhisperRadiant',
    description: 'Tên API của item',
  })
  apiName: string;

  @ApiProperty({
    type: String,
    example: 'Radiant Last Whisper',
    description: 'Tên hiển thị của item',
  })
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Radiant Last Whisper',
    description: 'Tên tiếng Anh',
  })
  enName?: string | null;

  @ApiProperty({
    type: String,
    example: 'Damage from attacks and Abilities @ArmorReductionPercent@% <TFTKeyword>Sunder</TFTKeyword> the target for <TFTRadiantItemBonus>the rest of combat.</TFTRadiantItemBonus> This effect does not stack.<br><br><tftitemrules><tftbold>Sunder</tftbold>: Reduce Armor</tftitemrules>',
    description: 'Mô tả chi tiết của item (có thể chứa HTML)',
  })
  description: string;

  @ApiProperty({
    type: Object,
    example: {
      AD: 0.45,
      AS: 25,
      ArmorBreakDuration: 50,
      ArmorReductionPercent: 30,
      CritChance: 55
    },
    description: 'Các hiệu ứng và stats của item',
  })
  effects: ItemEffects;

  @ApiProperty({
    type: [String],
    example: ['TFT_Item_NeedlesslyLargeRod', 'TFT_Item_NeedlesslyLargeRod'],
    description: 'Công thức chế tạo item (danh sách item components)',
  })
  composition: string[];

  @ApiProperty({
    type: [String],
    example: [],
    description: 'Các traits liên quan đến item',
  })
  associatedTraits: string[];

  @ApiProperty({
    type: [String],
    example: [],
    description: 'Các traits không tương thích với item',
  })
  incompatibleTraits: string[];

  @ApiProperty({
    type: [String],
    example: [],
    description: 'Tags của item',
  })
  tags: string[];

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Item có unique không',
  })
  unique: boolean;

  @ApiProperty({
    type: String,
    example: 'ASSETS/Maps/TFT/Icons/Items/Hexcore/TFT5_Item_LastWhisperRadiant.TFT_Set13.tex',
    description: 'Đường dẫn icon của item',
  })
  icon: string;

  @ApiPropertyOptional({
    type: Array,
    description: 'Các biến trong description với giá trị tương ứng',
    example: [
      {
        match: 'ArmorReductionPercent',
        type: 'variable',
        full_match: '@ArmorReductionPercent@',
        hash: '5079c7a2',
        value: 30
      }
    ],
  })
  variableMatches?: VariableMatch[] | null;

  @ApiPropertyOptional({
    type: String,
    example: 'set15',
    description: 'Set TFT của item',
  })
  set?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Item có đang active không',
  })
  isActive?: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
