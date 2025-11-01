import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileDto } from '../../files/dto/file.dto';
import { TraitDto } from './trait.dto';

export class ChampionDto {
  @ApiProperty({
    type: String,
  })
  id: string | number;

  @ApiProperty({
    type: String,
    example: 'Ahri',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'ahri',
  })
  key: string;

  @ApiProperty({
    type: Number,
    example: 3,
  })
  cost: number;

  @ApiPropertyOptional({
    type: String,
  })
  abilityDescription?: string | null;

  @ApiPropertyOptional({
    type: String,
  })
  abilityName?: string | null;

  @ApiProperty({
    type: [TraitDto],
  })
  traits: TraitDto[];

  @ApiPropertyOptional({
    type: Number,
  })
  health?: number | null;

  @ApiPropertyOptional({
    type: Number,
  })
  armor?: number | null;

  @ApiPropertyOptional({
    type: Number,
  })
  magicResist?: number | null;

  @ApiPropertyOptional({
    type: Number,
  })
  attackDamage?: number | null;

  @ApiPropertyOptional({
    type: Number,
  })
  attackSpeed?: number | null;

  @ApiPropertyOptional({
    type: Number,
  })
  attackRange?: number | null;

  @ApiPropertyOptional({
    type: Number,
  })
  startingMana?: number | null;

  @ApiPropertyOptional({
    type: Number,
  })
  maxMana?: number | null;

  @ApiPropertyOptional({
    type: () => FileDto,
  })
  image?: FileDto | null;

  @ApiPropertyOptional({
    type: String,
  })
  set?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
  })
  isActive?: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
