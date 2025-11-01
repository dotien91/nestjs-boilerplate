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
import { OriginType } from '../domain/origin';

class OriginTierDto {
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

export class CreateOriginDto {
  @ApiProperty({
    type: String,
    example: 'Vệ Binh',
    description: 'Tên hiển thị của origin',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    example: 'guardian',
    description: 'Key duy nhất của origin',
  })
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiProperty({
    enum: OriginType,
    example: OriginType.ORIGIN,
    description: 'Loại origin: origin (tộc) hoặc class (hệ)',
  })
  @IsNotEmpty()
  @IsEnum(OriginType)
  type: OriginType;

  @ApiPropertyOptional({
    type: String,
    example:
      'Vệ Binh nhận giáp và kháng phép tăng lên. Khi có kẻ địch gần, họ nhận thêm giáp và kháng phép.',
    description: 'Mô tả hiệu ứng của origin',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    type: [OriginTierDto],
    example: [
      { count: 2, effect: '+40 Armor' },
      { count: 4, effect: '+100 Armor' },
      { count: 6, effect: '+200 Armor' },
    ],
    description: 'Các mốc kích hoạt origin',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OriginTierDto)
  tiers?: OriginTierDto[] | null;

  @ApiPropertyOptional({
    type: () => FileDto,
    description: 'Icon của origin',
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
    description: 'Origin có đang active trong meta không',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: [String],
    example: ['6904cf6d31b5cf113d6665ae', '6904cf6d31b5cf113d6665af'],
    description: 'Danh sách ID của champions có origin này',
  })
  @IsOptional()
  @IsArray()
  champions?: string[];
}
