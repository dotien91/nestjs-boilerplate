import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { FileDto } from '../../files/dto/file.dto';
import { TraitDto } from './trait.dto';

export class CreateChampionDto {
  @ApiProperty({
    type: String,
    example: 'Ahri',
    description: 'Tên của champion',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    example: 'ahri',
    description: 'Key duy nhất của champion',
  })
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiProperty({
    type: Number,
    example: 3,
    description: 'Chi phí mua champion (1-5 vàng)',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  cost: number;

  @ApiPropertyOptional({
    type: String,
    example:
      'Ahri fires an orb that deals magic damage to enemies it passes through.',
    description: 'Mô tả kỹ năng của champion',
  })
  @IsOptional()
  @IsString()
  abilityDescription?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Orb of Deception',
    description: 'Tên kỹ năng',
  })
  @IsOptional()
  @IsString()
  abilityName?: string | null;

  @ApiProperty({
    type: [TraitDto],
    description: 'Danh sách các trait của champion',
    example: [
      { name: 'Invoker', key: 'invoker' },
      { name: 'Scholar', key: 'scholar' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TraitDto)
  traits: TraitDto[];

  @ApiPropertyOptional({
    type: Number,
    example: 650,
    description: 'HP cơ bản',
  })
  @IsOptional()
  @IsNumber()
  health?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 50,
    description: 'Giáp cơ bản',
  })
  @IsOptional()
  @IsNumber()
  armor?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 50,
    description: 'Kháng phép cơ bản',
  })
  @IsOptional()
  @IsNumber()
  magicResist?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 45,
    description: 'Sát thương đánh thường',
  })
  @IsOptional()
  @IsNumber()
  attackDamage?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 0.75,
    description: 'Tốc độ đánh',
  })
  @IsOptional()
  @IsNumber()
  attackSpeed?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 4,
    description: 'Tầm đánh (số ô)',
  })
  @IsOptional()
  @IsNumber()
  attackRange?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 0,
    description: 'Mana khởi đầu',
  })
  @IsOptional()
  @IsNumber()
  startingMana?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 80,
    description: 'Mana tối đa để cast skill',
  })
  @IsOptional()
  @IsNumber()
  maxMana?: number | null;

  @ApiPropertyOptional({
    type: () => FileDto,
    description: 'Hình ảnh của champion',
  })
  @IsOptional()
  @Type(() => FileDto)
  image?: FileDto | null;

  @ApiPropertyOptional({
    type: String,
    example: 'set13',
    description: 'Set TFT hiện tại',
  })
  @IsOptional()
  @IsString()
  set?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Champion có đang active trong meta không',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
