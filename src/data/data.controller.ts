import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Data')
@Controller({
  path: 'data',
  version: '1',
})
export class DataController {
  private readonly assetPath = path.join(process.cwd(), 'src', 'asset');

  @ApiOperation({
    summary: 'Lấy dữ liệu TFT Set 16 theo ngôn ngữ',
    description:
      'Trả về file JSON chứa dữ liệu TFT Set 16 (units, items, traits, augments, ...) theo ngôn ngữ được chỉ định',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @Get('tft-set16/:locale')
  async getTftSet16Data(@Param('locale') locale: string, @Res() res: Response) {
    // Validate locale format
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const fileName = `TFTSet16_latest_${locale}.json`;
    const filePath = path.join(this.assetPath, fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(
        `Data file for locale '${locale}' not found`,
      );
    }

    // Set headers for JSON response
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1 hour
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    // Stream file to response
    return res.sendFile(filePath);
  }

  @ApiOperation({
    summary: 'Lấy danh sách các ngôn ngữ có sẵn',
    description: 'Trả về danh sách các locale có file JSON data',
  })
  @Get('tft-set16/locales')
  getAvailableLocales() {
    try {
      const files = fs.readdirSync(this.assetPath);
      const locales = files
        .filter(
          (file) =>
            file.startsWith('TFTSet16_latest_') && file.endsWith('.json'),
        )
        .map((file) => {
          // Extract locale from filename: TFTSet16_latest_en_us.json -> en_us
          const match = file.match(/TFTSet16_latest_(.+)\.json$/);
          return match ? match[1] : null;
        })
        .filter((locale) => locale !== null)
        .sort();

      return {
        locales,
        count: locales.length,
        message: 'Available locales for TFT Set 16 data',
      };
    } catch (error) {
      return {
        locales: [],
        count: 0,
        error: 'Could not read asset directory',
      };
    }
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Items theo ngôn ngữ',
    description: 'Trả về file JSON chứa dữ liệu Items theo ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @Get('items/:locale')
  async getItemsData(@Param('locale') locale: string, @Res() res: Response) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const fileName = `Items_${locale}.json`;
    const filePath = path.join(this.assetPath, fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(
        `Items data file for locale '${locale}' not found`,
      );
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    return res.sendFile(filePath);
  }

  @ApiOperation({
    summary: 'Lấy file JSON theo tên file',
    description:
      'Lấy bất kỳ file JSON nào trong asset folder (chỉ cho phép file JSON)',
  })
  @ApiParam({
    name: 'filename',
    type: String,
    description: 'Tên file JSON (ví dụ: TFTSet16_latest_en_us.json)',
    example: 'TFTSet16_latest_en_us.json',
  })
  @Get('file/:filename')
  async getJsonFile(@Param('filename') filename: string, @Res() res: Response) {
    // Security: Only allow JSON files
    if (!filename.endsWith('.json')) {
      throw new BadRequestException('Only JSON files are allowed');
    }

    // Security: Prevent path traversal
    if (
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      throw new BadRequestException('Invalid filename');
    }

    const filePath = path.join(this.assetPath, filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`File '${filename}' not found`);
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    return res.sendFile(filePath);
  }
}

