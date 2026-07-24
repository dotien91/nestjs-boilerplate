import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { TftSeasonSnapshotsService } from '../tft-season-snapshots/tft-season-snapshots.service';

const DEFAULT_SEASON_ID = '16';

const ApiSeasonIdQuery = () =>
  ApiQuery({
    name: 'season_id',
    type: String,
    required: false,
    example: '16',
    description: `ID mùa TFT. Mặc định là ${DEFAULT_SEASON_ID}`,
  });

@ApiTags('Data')
@Controller({
  path: 'data',
  version: '1',
})
export class DataController {
  // dist/asset khi chạy build (server), src/asset khi chạy từ source (dev)
  private readonly assetPath = path.join(__dirname, '..', 'asset');

  constructor(
    private readonly snapshotsService: TftSeasonSnapshotsService,
  ) {}

  @ApiOperation({
    summary: 'Lấy dữ liệu TFT theo mùa và ngôn ngữ',
    description:
      'Trả về file JSON chứa dữ liệu TFT (units, items, traits, augments, ...) theo season_id và ngôn ngữ được chỉ định',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @ApiSeasonIdQuery()
  @Get(['tft/:locale', 'tft-set16/:locale'])
  async getTftData(
    @Param('locale') locale: string,
    @Query('season_id') seasonId: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    // Validate locale format
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const normalizedSeasonId = this.normalizeSeasonId(seasonId);
    const snapshot = await this.snapshotsService.find(
      normalizedSeasonId,
      locale,
    );
    if (snapshot) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.json(snapshot.data);
      return;
    }

    const fileName = `TFTSet${normalizedSeasonId}_latest_${locale}.json`;
    const filePath = path.join(this.assetPath, fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(
        `Data file for season '${normalizedSeasonId}' and locale '${locale}' not found`,
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
  @ApiSeasonIdQuery()
  @Get('tft-set16/locales')
  getAvailableLocales(@Query('season_id') seasonId?: string) {
    try {
      const normalizedSeasonId = this.normalizeSeasonId(seasonId);
      const filePrefix = `TFTSet${normalizedSeasonId}_latest_`;
      const files = fs.readdirSync(this.assetPath);
      const locales = files
        .filter(
          (file) =>
            file.startsWith(filePrefix) && file.endsWith('.json'),
        )
        .map((file) => {
          // Extract locale from filename: TFTSet{season}_latest_en_us.json -> en_us
          const match = file.match(
            new RegExp(`^TFTSet${normalizedSeasonId}_latest_(.+)\\.json$`),
          );
          return match ? match[1] : null;
        })
        .filter((locale) => locale !== null)
        .sort();

      return {
        locales,
        count: locales.length,
        season_id: normalizedSeasonId,
        message: `Available locales for TFT Set ${normalizedSeasonId} data`,
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
    description: 'Trả về dữ liệu Units theo mùa và ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @ApiSeasonIdQuery()
  @Get('units/:locale')
  async getUnitsData(
    @Param('locale') locale: string,
    @Query('season_id') seasonId: string | undefined,
    @Res() res: Response,
  ) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const units = await this.getTftSection(locale, 'units', seasonId);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(units);
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Items theo ngôn ngữ',
    description: 'Trả về dữ liệu Items theo mùa và ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @ApiSeasonIdQuery()
  @Get('items/:locale')
  async getItemsData(
    @Param('locale') locale: string,
    @Query('season_id') seasonId: string | undefined,
    @Res() res: Response,
  ) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const items = await this.getTftSection(locale, 'items', seasonId);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(items);
  }

  /**
   * Helper method to extract a specific section from a TFT season JSON file
   */
  private async getTftSection(
    locale: string,
    section: string,
    seasonId?: string,
  ): Promise<any> {
    const normalizedSeasonId = this.normalizeSeasonId(seasonId);
    const snapshot = await this.snapshotsService.find(
      normalizedSeasonId,
      locale,
    );
    if (snapshot) {
      const snapshotData = snapshot.data as Record<string, unknown>;
      if (!(section in snapshotData)) {
        throw new NotFoundException(
          `Section '${section}' not found in snapshot for season '${normalizedSeasonId}' and locale '${locale}'`,
        );
      }
      return snapshotData[section];
    }

    const fileName = `TFTSet${normalizedSeasonId}_latest_${locale}.json`;
    const filePath = path.join(this.assetPath, fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(
        `Data file for season '${normalizedSeasonId}' and locale '${locale}' not found`,
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

  private normalizeSeasonId(seasonId?: string): string {
    const value = (seasonId || DEFAULT_SEASON_ID).trim();
    const normalizedValue = value.replace(/^set/i, '');

    if (!/^\d+$/.test(normalizedValue)) {
      throw new BadRequestException(
        "Invalid season_id. Expected a number such as '16' or 'set16'",
      );
    }

    return normalizedValue;
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Augments theo ngôn ngữ',
    description: 'Trả về dữ liệu Augments theo mùa và ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @ApiSeasonIdQuery()
  @Get('augments/:locale')
  async getAugmentsData(
    @Param('locale') locale: string,
    @Query('season_id') seasonId: string | undefined,
    @Res() res: Response,
  ) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const augments = await this.getTftSection(locale, 'augments', seasonId);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(augments);
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Traits theo ngôn ngữ',
    description: 'Trả về dữ liệu Traits theo mùa và ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @ApiSeasonIdQuery()
  @Get('traits/:locale')
  async getTraitsData(
    @Param('locale') locale: string,
    @Query('season_id') seasonId: string | undefined,
    @Res() res: Response,
  ) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const traits = await this.getTftSection(locale, 'traits', seasonId);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(traits);
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Armory Items theo ngôn ngữ',
    description: 'Trả về dữ liệu Armory Items theo mùa và ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @ApiSeasonIdQuery()
  @Get('armory-items/:locale')
  async getArmoryItemsData(
    @Param('locale') locale: string,
    @Query('season_id') seasonId: string | undefined,
    @Res() res: Response,
  ) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const armoryItems = await this.getTftSection(
      locale,
      'armory-items',
      seasonId,
    );

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(armoryItems);
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Augment Odds theo ngôn ngữ',
    description: 'Trả về dữ liệu Augment Odds theo mùa và ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @ApiSeasonIdQuery()
  @Get('augment-odds/:locale')
  async getAugmentOddsData(
    @Param('locale') locale: string,
    @Query('season_id') seasonId: string | undefined,
    @Res() res: Response,
  ) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const augmentOdds = await this.getTftSection(
      locale,
      'augment-odds',
      seasonId,
    );

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(augmentOdds);
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Roles theo ngôn ngữ',
    description: 'Trả về dữ liệu Roles theo mùa và ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @ApiSeasonIdQuery()
  @Get('roles/:locale')
  async getRolesData(
    @Param('locale') locale: string,
    @Query('season_id') seasonId: string | undefined,
    @Res() res: Response,
  ) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const roles = await this.getTftSection(locale, 'roles', seasonId);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(roles);
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Portals theo ngôn ngữ',
    description: 'Trả về dữ liệu Portals theo mùa và ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @ApiSeasonIdQuery()
  @Get('portals/:locale')
  async getPortalsData(
    @Param('locale') locale: string,
    @Query('season_id') seasonId: string | undefined,
    @Res() res: Response,
  ) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const portals = await this.getTftSection(locale, 'portals', seasonId);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(portals);
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Encounters theo ngôn ngữ',
    description: 'Trả về dữ liệu Encounters theo mùa và ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @ApiSeasonIdQuery()
  @Get('encounters/:locale')
  async getEncountersData(
    @Param('locale') locale: string,
    @Query('season_id') seasonId: string | undefined,
    @Res() res: Response,
  ) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const encounters = await this.getTftSection(
      locale,
      'encounters',
      seasonId,
    );

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(encounters);
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Augment Categories theo ngôn ngữ',
    description:
      'Trả về dữ liệu Augment Categories theo mùa và ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @ApiSeasonIdQuery()
  @Get('augment-categories/:locale')
  async getAugmentCategoriesData(
    @Param('locale') locale: string,
    @Query('season_id') seasonId: string | undefined,
    @Res() res: Response,
  ) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const augmentCategories = await this.getTftSection(
      locale,
      'augment-categories',
      seasonId,
    );

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(augmentCategories);
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Extra Translations theo ngôn ngữ',
    description:
      'Trả về dữ liệu Extra Translations theo mùa và ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @ApiSeasonIdQuery()
  @Get('extra-translations/:locale')
  async getExtraTranslationsData(
    @Param('locale') locale: string,
    @Query('season_id') seasonId: string | undefined,
    @Res() res: Response,
  ) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const extraTranslations = await this.getTftSection(
      locale,
      'extra-translations',
      seasonId,
    );

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.json(extraTranslations);
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu Zaps theo ngôn ngữ',
    description: 'Trả về dữ liệu Zaps theo mùa và ngôn ngữ',
  })
  @ApiParam({
    name: 'locale',
    type: String,
    description: 'Mã ngôn ngữ (en_us, vi_vn, ...)',
    example: 'en_us',
    required: true,
  })
  @ApiSeasonIdQuery()
  @Get('zaps/:locale')
  async getZapsData(
    @Param('locale') locale: string,
    @Query('season_id') seasonId: string | undefined,
    @Res() res: Response,
  ) {
    if (!/^[a-z]{2}_[a-z]{2}$/.test(locale)) {
      throw new BadRequestException(
        'Invalid locale format. Expected format: xx_xx (e.g., en_us, vi_vn)',
      );
    }

    const zaps = await this.getTftSection(locale, 'zaps', seasonId);

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
