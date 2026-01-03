import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateScreenTrackingDto {
  @ApiProperty({
    type: String,
    example: 'home',
    description: 'Tên màn hình (ví dụ: home, compositions, units)',
  })
  @IsNotEmpty()
  @IsString()
  screenName: string;
}

