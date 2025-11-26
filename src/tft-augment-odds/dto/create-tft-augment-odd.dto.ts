import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateTftAugmentOddDto {
  @ApiProperty({
    type: Number,
    example: 0.05,
    description: 'Xác suất xuất hiện',
  })
  @IsNotEmpty()
  @IsNumber()
  odds: number;

  @ApiProperty({
    type: [String],
    example: ['Tier1', 'Tier1', 'Tier2'],
    description: 'Danh sách các tier augment',
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  augments: string[];
}

