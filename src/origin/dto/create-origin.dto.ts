import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { FileDto } from '../../files/dto/file.dto';

class OriginEffectDto {
  @ApiProperty({
    type: Number,
    example: 2,
    description: 'Số units tối thiểu để kích hoạt',
  })
  @IsNotEmpty()
  @IsNumber()
  minUnits: number;

  @ApiProperty({
    type: Number,
    example: 2,
    description: 'Số units tối đa cho mốc này',
  })
  @IsNotEmpty()
  @IsNumber()
  maxUnits: number;

  @ApiProperty({
    type: String,
    example: 'bronze',
    description: 'Style của mốc (bronze, silver, gold)',
  })
  @IsNotEmpty()
  @IsString()
  style: string;

  @ApiProperty({
    type: String,
    example: '',
    description: 'Hiệu ứng khi kích hoạt',
  })
  @IsString()
  effect: string;
}

export class CreateOriginDto {
  @ApiProperty({
    type: String,
    example: 'TFT16_Quickstriker',
    description: 'API name của origin (unique identifier)',
  })
  @IsNotEmpty()
  @IsString()
  apiName: string;

  @ApiProperty({
    type: String,
    example: 'Quickstriker',
    description: 'Tên hiển thị của origin',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    example: 'TFT16_Quickstriker',
    description: 'Trait identifier',
  })
  @IsNotEmpty()
  @IsString()
  trait: string;

  @ApiProperty({
    type: String,
    example: 'Quickstriker',
    description: 'Tên trait',
  })
  @IsNotEmpty()
  @IsString()
  trait_name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Your team gains 15% Attack Speed...',
    description: 'Mô tả hiệu ứng của origin (có thể chứa HTML)',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    type: [OriginEffectDto],
    example: [
      { minUnits: 2, maxUnits: 2, style: 'bronze', effect: '' },
      { minUnits: 3, maxUnits: 3, style: 'silver', effect: '' },
    ],
    description: 'Các mốc kích hoạt origin',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OriginEffectDto)
  effects?: OriginEffectDto[] | null;

  @ApiPropertyOptional({
    type: String,
    example: 'quickstriker',
    description: 'Tên file ảnh của origin',
  })
  @IsOptional()
  @IsString()
  img_name?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'quickstriker',
    description: 'Tên ảnh trait',
  })
  @IsOptional()
  @IsString()
  trait_img?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Mô tả đã được fix chưa',
  })
  @IsOptional()
  @IsBoolean()
  description_fixed?: boolean;

  @ApiPropertyOptional({
    type: () => FileDto,
    description: 'Icon của origin (FileType object)',
  })
  @IsOptional()
  @Type(() => FileDto)
  icon?: FileDto | null;

  @ApiPropertyOptional({
    type: [String],
    example: ['6904cf6d31b5cf113d6665ae', '6904cf6d31b5cf113d6665af'],
    description: 'Danh sách ID của champions có origin này',
  })
  @IsOptional()
  @IsArray()
  champions?: string[];
}
