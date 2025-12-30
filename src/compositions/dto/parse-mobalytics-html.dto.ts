import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ParseMobalyticsHtmlDto {
  @ApiProperty({
    type: String,
    description: 'HTML string từ trang Mobalytics để parse thành composition',
    example: '<html>...</html>',
  })
  @IsNotEmpty()
  @IsString()
  html: string;
}

