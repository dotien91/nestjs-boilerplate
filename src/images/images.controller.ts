import {
  Controller,
  Get,
  Param,
  Res,
  HttpStatus,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ImagesService } from './images.service';

@ApiTags('Images')
@Controller({
  path: 'images',
  // Không có version để endpoint không bị ảnh hưởng bởi global prefix
})
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @ApiOperation({
    summary: 'Lấy image TFT theo type và key',
    description:
      'Serve images TFT làm fallback khi MetaTFT CDN không khả dụng. Hỗ trợ champions, championsplashes, traits, augments, items.',
  })
  @ApiParam({
    name: 'type',
    enum: ['champions', 'championsplashes', 'traits', 'augments', 'items'],
    description: 'Loại image',
    example: 'champions',
  })
  @ApiParam({
    name: 'key',
    type: String,
    description: 'Key của image (sẽ được normalize tự động)',
    example: 'tft16_tristana',
  })
  @ApiParam({
    name: 'ext',
    enum: ['png', 'jpg', 'jpeg'],
    description: 'Extension của image',
    example: 'png',
  })
  @ApiQuery({
    name: 'width',
    required: false,
    type: Number,
    description: 'Chiều rộng (px) - tùy chọn resize',
  })
  @ApiQuery({
    name: 'height',
    required: false,
    type: Number,
    description: 'Chiều cao (px) - tùy chọn resize',
  })
  @ApiQuery({
    name: 'size',
    required: false,
    type: Number,
    description: 'Kích thước vuông (px) - áp dụng cho cả width và height',
  })
  @Get(':type/:key.:ext')
  async getImage(
    @Param('type') type: string,
    @Param('key') key: string,
    @Param('ext') ext: string,
    @Res() res: Response,
    @Query('width') width?: number,
    @Query('height') height?: number,
    @Query('size') size?: number,
  ) {
    try {
      const imageData = await this.imagesService.getImage(type, key, ext);

      // Set cache headers
      res.setHeader(
        'Cache-Control',
        'public, max-age=31536000, immutable',
      );
      res.setHeader('Content-Type', imageData.contentType);

      // TODO: Implement resize logic if width/height/size is provided
      // For now, just return the original image
      // if (width || height || size) {
      //   // Use sharp or similar library to resize
      //   // const resized = await sharp(imageData.buffer)
      //   //   .resize(width || size, height || size)
      //   //   .toBuffer();
      //   // return res.send(resized);
      // }

      return res.send(imageData.buffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json({
          error: 'Image not found',
          type,
          key: key.toLowerCase(),
        });
      }
      throw error;
    }
  }
}

