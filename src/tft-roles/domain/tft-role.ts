import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const idType = String;

export class TftRole {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: String,
    example: 'ADCaster',
    description: 'API name của role',
  })
  apiName: string;

  @ApiProperty({
    type: String,
    example: 'Attack Caster',
    description: 'Tên của role',
  })
  name: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Mô tả của role',
  })
  description?: string | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Danh sách các item được recommend cho role này',
  })
  items?: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}

