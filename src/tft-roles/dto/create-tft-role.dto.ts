import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTftRoleDto {
  @ApiProperty({
    type: String,
    example: 'ADCaster',
    description: 'API name của role',
  })
  @IsNotEmpty()
  @IsString()
  apiName: string;

  @ApiProperty({
    type: String,
    example: 'Attack Caster',
    description: 'Tên của role',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Mô tả của role',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Danh sách các item được recommend cho role này',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  items?: string[];
}

