import { ApiProperty } from '@nestjs/swagger';

const idType = String;

export class TftAugmentOdd {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: Number,
    example: 0.05,
    description: 'Xác suất xuất hiện',
  })
  odds: number;

  @ApiProperty({
    type: [String],
    example: ['Tier1', 'Tier1', 'Tier2'],
    description: 'Danh sách các tier augment',
  })
  augments: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}

