import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsObject,
  IsArray,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';

class VariableMatchDto {
  @ApiProperty()
  @IsString()
  match: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsString()
  full_match: string;

  @ApiProperty()
  @IsString()
  hash: string;

  @ApiProperty()
  @Type(() => Number)
  value: number;
}

export class CreateItemDto {
  @ApiProperty({
    example: 'TFT5_Item_LastWhisperRadiant',
  })
  @IsString()
  apiName: string;

  @ApiProperty({
    example: 'Radiant Last Whisper',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Radiant Last Whisper',
  })
  @IsOptional()
  @IsString()
  enName?: string | null;

  @ApiProperty({
    example: 'Damage from attacks and Abilities @ArmorReductionPercent@% <TFTKeyword>Sunder</TFTKeyword> the target for <TFTRadiantItemBonus>the rest of combat.</TFTRadiantItemBonus> This effect does not stack.<br><br><tftitemrules><tftbold>Sunder</tftbold>: Reduce Armor</tftitemrules>',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: {
      AD: 0.45,
      AS: 25,
      ArmorBreakDuration: 50,
      ArmorReductionPercent: 30,
      CritChance: 55
    },
  })
  @IsObject()
  effects: Record<string, any>;

  @ApiProperty({
    example: ['TFT_Item_NeedlesslyLargeRod', 'TFT_Item_NeedlesslyLargeRod'],
  })
  @IsArray()
  @IsString({ each: true })
  composition: string[];

  @ApiProperty({
    example: [],
  })
  @IsArray()
  @IsString({ each: true })
  associatedTraits: string[];

  @ApiProperty({
    example: [],
  })
  @IsArray()
  @IsString({ each: true })
  incompatibleTraits: string[];

  @ApiProperty({
    example: [],
  })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({
    example: false,
  })
  @IsBoolean()
  unique: boolean;

  @ApiProperty({
    example: 'ASSETS/Maps/TFT/Icons/Items/Hexcore/TFT5_Item_LastWhisperRadiant.TFT_Set13.tex',
  })
  @IsString()
  icon: string;

  @ApiPropertyOptional({
    type: [VariableMatchDto],
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
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariableMatchDto)
  variableMatches?: VariableMatchDto[] | null;

  @ApiPropertyOptional({
    example: 'set15',
  })
  @IsOptional()
  @IsString()
  set?: string | null;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
