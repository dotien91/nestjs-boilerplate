import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ArrayMinSize, IsOptional } from 'class-validator';

export class SearchByUnitsDto {
  @ApiProperty({
    description: 'Danh sách unit identifiers (có thể là championId hoặc championKey)',
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
  searchInAllArrays?: boolean = true;
}

