import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { FileDto } from '../../files/dto/file.dto';
import { TraitType } from '../domain/trait';

class TraitTierDto {
  @ApiProperty({
    type: Number,
    example: 2,
    description: 'Số champions cần để kích hoạt',
  })
  @IsNotEmpty()
  count: number;

  @ApiProperty({
    type: String,
    example: '+40 Armor',
    description: 'Hiệu ứng khi kích hoạt',
  })
  @IsNotEmpty()
  @IsString()
  effect: string;
}

export class CreateTraitDto {
  @ApiProperty({
    type: String,
    example: 'Vệ Binh',
    description: 'Tên hiển thị của trait',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    example: 'guardian',
    description: 'Key duy nhất của trait',
  })
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiProperty({
    enum: TraitType,
    example: TraitType.ORIGIN,
    description: 'Loại trait: origin (tộc) hoặc class (hệ)',
  })
  @IsNotEmpty()
  @IsEnum(TraitType)
  type: TraitType;

  @ApiPropertyOptional({
    type: String,
    example:
      'Vệ Binh nhận giáp và kháng phép tăng lên. Khi có kẻ địch gần, họ nhận thêm giáp và kháng phép.',
    description: 'Mô tả hiệu ứng của trait',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    type: [TraitTierDto],
    example: [
      { count: 2, effect: '+40 Armor' },
      { count: 4, effect: '+100 Armor' },
      { count: 6, effect: '+200 Armor' },
    ],
    description: 'Các mốc kích hoạt trait',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TraitTierDto)
  tiers?: TraitTierDto[] | null;

  @ApiPropertyOptional({
    type: () => FileDto,
    description: 'Icon của trait',
  })
  @IsOptional()
  @Type(() => FileDto)
  icon?: FileDto | null;

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
    description: 'Trait có đang active trong meta không',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
