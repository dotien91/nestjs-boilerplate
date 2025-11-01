import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TraitDto {
  @ApiProperty({
    type: String,
    example: 'Invoker',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    example: 'invoker',
  })
  @IsNotEmpty()
  @IsString()
  key: string;
}
