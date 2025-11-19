import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Icons')
@Controller({
  path: 'icons',
  version: '1',
})
export class IconsController {
  private readonly iconsPath = path.join(process.cwd(), 'src/asset/icons');

  @ApiOperation({ summary: 'Lấy icon SVG' })
  @ApiParam({
    name: 'iconName',
    type: String,
    description: 'Tên icon (ví dụ: AP, AS, AD)',
    example: 'AP',
  })
  @Get(':iconName')
  getIcon(@Param('iconName') iconName: string, @Res() res: Response) {
    // Sanitize icon name để tránh path traversal
    const sanitizedName = iconName.replace(/[^a-zA-Z0-9_-]/g, '');
    
    // Thêm .svg extension nếu chưa có
    const fileName = sanitizedName.endsWith('.svg') 
      ? sanitizedName 
      : `${sanitizedName}.svg`;
    
    const filePath = path.join(this.iconsPath, fileName);

    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Icon ${iconName} not found`);
    }

    // Set content type và send file
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache 1 year
    return res.sendFile(filePath);
  }

  @ApiOperation({ summary: 'Lấy danh sách tất cả icons có sẵn' })
  @Get()
  listIcons() {
    try {
      const files = fs.readdirSync(this.iconsPath);
      const icons = files
        .filter(file => file.endsWith('.svg'))
        .map(file => file.replace('.svg', ''))
        .sort();

      return {
        icons,
        count: icons.length,
      };
    } catch (error) {
      return {
        icons: [],
        count: 0,
        error: 'Icons directory not found',
      };
    }
  }
}

