import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  ArrayMinSize,
  IsOptional,
  IsBoolean,
} from 'class-validator';

// ==========================================
// DTO V1: Cũ (Bắt buộc nhập Units)
// ==========================================
export class SearchByUnitsDto {
  @ApiProperty({
    description: 'Danh sách unit identifiers (championId hoặc championKey)',
    example: ['garen', 'jarvaniv', 'caitlyn'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải có ít nhất 1 unit' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  units: string[];

  @ApiProperty({
    description: 'Tìm trong tất cả các mảng (units, earlyGame, midGame, bench) hoặc chỉ trong units',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  searchInAllArrays?: boolean = true;
}

// ==========================================
// DTO V2: Mới (Search kết hợp Units, Items, Augments)
// ==========================================
export class SearchCompositionDtoV2 {
  @ApiProperty({
    description: 'Danh sách units (championId hoặc championKey)',
    example: ['TFT13_Jinx', 'Vi'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  units?: string[];

  @ApiProperty({
    description: 'Danh sách Items (apiName hoặc tên tiếng Anh)',
    example: ['TFT_Item_InfinityEdge', 'Bloodthirster'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  items?: string[];

  @ApiProperty({
    description: 'Danh sách Augments (apiName hoặc tên tiếng Anh)',
    example: ['TFT_Augment_RichGetRicher', 'Level Up!'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  augments?: string[];

  @ApiProperty({
    description: 'Tìm trong tất cả các mảng (units, earlyGame, midGame, bench) hay chỉ trong units chính',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  searchInAllArrays?: boolean = true;
}