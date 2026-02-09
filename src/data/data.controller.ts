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
  // dist/asset khi chạy build (server), src/asset khi chạy từ source (dev)
  private readonly assetPath = path.join(__dirname, '..', 'asset');

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
    res.sendFile(filePath);
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
    summary: 'Lấy dữ liệu Units theo ngôn ngữ',
    description: 'Trả về dữ liệu Units từ TFTSet16 file theo ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @Get('units/:locale')
  async getUnitsData(@Param('locale') locale: string, @Res() res: Response) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const units = this.getTftSet16Section(locale, 'units');

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(units);
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Items theo ngôn ngữ',
    description: 'Trả về dữ liệu Items từ TFTSet16 file theo ngôn ngữ',
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

    const items = this.getTftSet16Section(locale, 'items');

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(items);
  }

  /**
   * Helper method to extract a specific section from TFTSet16 JSON file
   */
  private getTftSet16Section(locale: string, section: string): any {
    const fileName = `TFTSet16_latest_${locale}.json`;
    const filePath = path.join(this.assetPath, fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(
        `Data file for locale '${locale}' not found`,
      );
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    // Map section names (some use snake_case in API, camelCase in JSON)
    const sectionMap: Record<string, string> = {
      'armory-items': 'armory_items',
      'augment-odds': 'augmentOdds',
      'augment-categories': 'augmentCategories',
      'extra-translations': 'extraTranslations',
    };

    const jsonKey = sectionMap[section] || section;

    if (!(jsonKey in jsonData)) {
      throw new NotFoundException(
        `Section '${section}' not found in data file for locale '${locale}'`,
      );
    }

    return jsonData[jsonKey];
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Augments theo ngôn ngữ',
    description: 'Trả về dữ liệu Augments từ TFTSet16 file theo ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @Get('augments/:locale')
  async getAugmentsData(@Param('locale') locale: string, @Res() res: Response) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const augments = this.getTftSet16Section(locale, 'augments');

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(augments);
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Traits theo ngôn ngữ',
    description: 'Trả về dữ liệu Traits từ TFTSet16 file theo ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @Get('traits/:locale')
  async getTraitsData(@Param('locale') locale: string, @Res() res: Response) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const traits = this.getTftSet16Section(locale, 'traits');

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(traits);
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Armory Items theo ngôn ngữ',
    description: 'Trả về dữ liệu Armory Items từ TFTSet16 file theo ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @Get('armory-items/:locale')
  async getArmoryItemsData(
    @Param('locale') locale: string,
    @Res() res: Response,
  ) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const armoryItems = this.getTftSet16Section(locale, 'armory-items');

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(armoryItems);
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Augment Odds theo ngôn ngữ',
    description: 'Trả về dữ liệu Augment Odds từ TFTSet16 file theo ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @Get('augment-odds/:locale')
  async getAugmentOddsData(
    @Param('locale') locale: string,
    @Res() res: Response,
  ) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const augmentOdds = this.getTftSet16Section(locale, 'augment-odds');

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(augmentOdds);
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Roles theo ngôn ngữ',
    description: 'Trả về dữ liệu Roles từ TFTSet16 file theo ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @Get('roles/:locale')
  async getRolesData(@Param('locale') locale: string, @Res() res: Response) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const roles = this.getTftSet16Section(locale, 'roles');

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(roles);
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Portals theo ngôn ngữ',
    description: 'Trả về dữ liệu Portals từ TFTSet16 file theo ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @Get('portals/:locale')
  async getPortalsData(@Param('locale') locale: string, @Res() res: Response) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const portals = this.getTftSet16Section(locale, 'portals');

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(portals);
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Encounters theo ngôn ngữ',
    description: 'Trả về dữ liệu Encounters từ TFTSet16 file theo ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @Get('encounters/:locale')
  async getEncountersData(
    @Param('locale') locale: string,
    @Res() res: Response,
  ) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const encounters = this.getTftSet16Section(locale, 'encounters');

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(encounters);
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Augment Categories theo ngôn ngữ',
    description:
      'Trả về dữ liệu Augment Categories từ TFTSet16 file theo ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @Get('augment-categories/:locale')
  async getAugmentCategoriesData(
    @Param('locale') locale: string,
    @Res() res: Response,
  ) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const augmentCategories = this.getTftSet16Section(
      locale,
      'augment-categories',
    );

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(augmentCategories);
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Extra Translations theo ngôn ngữ',
    description:
      'Trả về dữ liệu Extra Translations từ TFTSet16 file theo ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @Get('extra-translations/:locale')
  async getExtraTranslationsData(
    @Param('locale') locale: string,
    @Res() res: Response,
  ) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const extraTranslations = this.getTftSet16Section(
      locale,
      'extra-translations',
    );

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(extraTranslations);
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Zaps theo ngôn ngữ',
    description: 'Trả về dữ liệu Zaps từ TFTSet16 file theo ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @Get('zaps/:locale')
  async getZapsData(@Param('locale') locale: string, @Res() res: Response) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const zaps = this.getTftSet16Section(locale, 'zaps');

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(zaps);
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

    res.sendFile(filePath);
  }
}

