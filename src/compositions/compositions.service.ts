import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { CreateCompositionDto } from './dto/create-composition.dto';
import { UpdateCompositionDto } from './dto/update-composition.dto';
import { NullableType } from '../utils/types/nullable.type';
import {
  FilterCompositionDto,
  SortCompositionDto,
} from './dto/query-composition.dto';
import { CompositionRepository } from './infrastructure/persistence/composition.repository';
import { Composition } from './domain/composition';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UnitDto } from './dto/create-composition.dto';
import { CarryItemDto } from './dto/create-composition.dto';
import { TftItemsService } from '../tft-items/tft-items.service';
import { TftUnitsService } from '../tft-units/tft-units.service';
import { SearchByUnitsDto, SearchCompositionDtoV2 } from './dto/search-by-units.dto'; // Import DTO for search V2

@Injectable()
export class CompositionsService {
  constructor(
    private readonly compositionsRepository: CompositionRepository,
    private readonly tftItemsService: TftItemsService,
    private readonly tftUnitsService: TftUnitsService,
  ) {}

  async create(
    createCompositionDto: CreateCompositionDto,
  ): Promise<Composition> {
    // Tự động tạo compId nếu không có
    let compId = createCompositionDto.compId;
    if (!compId || compId.trim() === '') {
      // Tạo compId từ name: chuyển thành slug và thêm timestamp
      const nameSlug = createCompositionDto.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
        .replace(/[^a-z0-9\s-]/g, '') // Xóa ký tự đặc biệt
        .replace(/\s+/g, '-') // Thay space bằng dấu gạch ngang
        .replace(/-+/g, '-') // Xóa nhiều dấu gạch ngang liên tiếp
        .trim();
      const timestamp = Date.now().toString(36); // Base36 timestamp
      compId = `comp-${nameSlug}-${timestamp}`;
    }

    // Kiểm tra compId đã tồn tại chưa
    if (compId) {
      const compositionObject =
        await this.compositionsRepository.findByCompId(compId);
      if (compositionObject) {
        // Nếu trùng, thêm random suffix
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        compId = `${compId}-${randomSuffix}`;
      }
    }

    const composition = await this.compositionsRepository.create({
      compId: compId,
      name: createCompositionDto.name,
      plan: createCompositionDto.plan,
      difficulty: createCompositionDto.difficulty,
      metaDescription: createCompositionDto.metaDescription,
      isLateGame: createCompositionDto.isLateGame ?? false,
      tier: createCompositionDto.tier,
      active: createCompositionDto.active ?? false,
      isOp: createCompositionDto.isOp ?? false,
      boardSize: createCompositionDto.boardSize || { rows: 4, cols: 7 }, // Mặc định 4x7
      units: createCompositionDto.units,
      earlyGame: createCompositionDto.earlyGame,
      midGame: createCompositionDto.midGame,
      bench: createCompositionDto.bench,
      carryItems: createCompositionDto.carryItems,
      notes: createCompositionDto.notes ?? [],
      carouselPriority: createCompositionDto.carouselPriority,
      augments: createCompositionDto.augments ?? [],
      coreChampion: createCompositionDto.coreChampion,
      teamCode: createCompositionDto.teamCode,
      order: createCompositionDto.order,
    });

    return composition;
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterCompositionDto | null;
    sortOptions?: SortCompositionDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Composition[]> {
    return this.compositionsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(
    id: Composition['id'],
  ): Promise<NullableType<Composition>> {
    return this.compositionsRepository.findById(id);
  }

  async findByCompId(
    compId: string,
  ): Promise<NullableType<Composition>> {
    if (!compId) {
      return null;
    }
    return this.compositionsRepository.findByCompId(compId);
  }
  

  async findByName(
    name: string,
  ): Promise<NullableType<Composition>> {
    if (!name) {
      return null;
    }
    return this.compositionsRepository.findOne(name);
  }

  async update(
    id: Composition['id'],
    updateCompositionDto: UpdateCompositionDto,
  ): Promise<Composition | null> {
    // Kiểm tra compId có bị trùng không (nếu update compId)
    if (updateCompositionDto.compId) {
      const compositionObject =
        await this.compositionsRepository.findByCompId(
          updateCompositionDto.compId,
        );

      if (compositionObject && compositionObject.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            compId: 'compositionCompIdAlreadyExists',
          },
        });
      }
    }

    return this.compositionsRepository.update(id, updateCompositionDto);
  }

  async remove(id: Composition['id']): Promise<void> {
    await this.compositionsRepository.remove(id);
  }

  async removeByNameNotIn(names: string[]): Promise<number> {
    if (!names || names.length === 0) {
      return 0;
    }
    return this.compositionsRepository.removeByNameNotIn(names);
  }

  async deactivateByNameNotIn(names: string[]): Promise<number> {
    if (!names || names.length === 0) {
      return 0;
    }
    // Gọi xuống tầng Repository để xử lý Database
    return this.compositionsRepository.deactivateByNameNotIn(names);
  }

  /**
   * Search V1 (Legacy) - Only by Units
   */
  async findCompositionsByUnits(
    unitIdentifiers: string[],
    searchInAllArrays: boolean = true,
  ): Promise<Composition[]> {
    return this.compositionsRepository.findCompositionsByUnits(
      unitIdentifiers,
      searchInAllArrays,
    );
  }

  /**
   * Search V2 (New) - Search by Units + Items + Augments
   */
  async searchCompositions(dto: SearchCompositionDtoV2): Promise<Composition[]> {
    return this.compositionsRepository.search({
      units: dto.units || [],
      items: dto.items || [],
      augments: dto.augments || [],
      searchInAllArrays: dto.searchInAllArrays ?? true,
    });
  }

  /**
   * Tính độ tương đồng giữa 2 chuỗi (Levenshtein distance ratio)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(
      longer.toLowerCase(),
      shorter.toLowerCase(),
    );
    return (longer.length - distance) / longer.length;
  }

  /**
   * Tính Levenshtein distance giữa 2 chuỗi
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Normalize string: bỏ dấu nháy đơn ('), khoảng trắng (space), lowercase, trim
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/'/g, '') // Bỏ dấu nháy đơn
      .replace(/\s+/g, '') // Bỏ tất cả khoảng trắng
      .replace(/[^a-z0-9]/g, ''); // Xóa tất cả ký tự đặc biệt còn lại, chỉ giữ chữ và số
  }

  /**
   * Load items từ file TFTSet16_latest_en_us.json
   */
  private loadItemsFromJsonFile(): Array<{ name: string; en_name?: string; apiName: string }> {
    try {
      const jsonPath = path.join(process.cwd(), 'src', 'asset', 'TFTSet16_latest_en_us.json');
      if (!fs.existsSync(jsonPath)) {
        console.log(`[loadItemsFromJsonFile] File not found: ${jsonPath}`);
        return [];
      }

      const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      const items = jsonData.items || [];
      
      console.log(`[loadItemsFromJsonFile] Loaded ${items.length} items from JSON file`);
      return items.map((item: any) => ({
        name: item.name || '',
        en_name: item.en_name || null,
        apiName: item.apiName || '',
      }));
    } catch (error: any) {
      console.error(`[loadItemsFromJsonFile] Error loading JSON file:`, error.message);
      return [];
    }
  }

  /**
   * Load augments từ file TFTSet16_latest_en_us.json
   */
  private loadAugmentsFromJsonFile(): Array<{ name: string; en_name?: string; apiName: string; icon?: string }> {
    try {
      const jsonPath = path.join(process.cwd(), 'src', 'asset', 'TFTSet16_latest_en_us.json');
      if (!fs.existsSync(jsonPath)) {
        console.log(`[loadAugmentsFromJsonFile] File not found: ${jsonPath}`);
        return [];
      }

      const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      const augments = jsonData.augments || [];
      
      console.log(`[loadAugmentsFromJsonFile] Loaded ${augments.length} augments from JSON file`);
      return augments.map((augment: any) => ({
        name: augment.name || '',
        en_name: augment.en_name || null,
        apiName: augment.apiName || '',
        icon: augment.icon || null,
      }));
    } catch (error: any) {
      console.error(`[loadAugmentsFromJsonFile] Error loading JSON file:`, error.message);
      return [];
    }
  }

  /**
   * Convert augment name sang apiName bằng cách tìm trong JSON file
   */
  private convertAugmentNameToApiName(
    augmentName: string,
    jsonAugments?: Array<{ name: string; en_name?: string; apiName: string; icon?: string }>,
  ): string {
    if (!augmentName) return augmentName;

    const normalizedInput = augmentName.toLowerCase().replace(/[_-]/g, '').trim();

    console.log(`[convertAugmentNameToApiName] Input: "${augmentName}" -> Normalized: "${normalizedInput}"`);

    if (jsonAugments && jsonAugments.length > 0) {
      // --- VÒNG LẶP 1: TÌM KIẾM CHÍNH XÁC (EXACT MATCH) ---
      for (const augment of jsonAugments) {
        const apiNameLow = augment.apiName.toLowerCase().replace(/[_-]/g, '');
        const enNameLow = (augment.en_name || '').toLowerCase().replace(/[_-]/g, '');
        const nameLow = augment.name.toLowerCase().replace(/[_-]/g, '');
        const iconLow = (augment.icon || '').toLowerCase();

        if (
          apiNameLow.includes(normalizedInput) || 
          enNameLow === normalizedInput || 
          nameLow === normalizedInput ||
          iconLow.includes(normalizedInput)
        ) {
          console.log(`====== data find dc`);
          console.log(`[convertAugmentNameToApiName] Found exact match: "${augmentName}" -> "${augment.apiName}"`);
          return augment.apiName;
        }
      }

      // --- VÒNG LẶP 2: FUZZY MATCHING (Nếu vòng 1 không ra) ---
      let bestMatch: { apiName: string; similarity: number } | null = null;
      const threshold = 0.6;

      for (const augment of jsonAugments) {
        const enNameClean = (augment.en_name || '').toLowerCase().replace(/[!?.@#$%^&*]/g, '');
        const iconFileName = (augment.icon || '').toLowerCase().split('/').pop() || '';

        const simEnName = this.calculateSimilarity(normalizedInput, enNameClean);
        const simIcon = this.calculateSimilarity(normalizedInput, iconFileName);
        
        const highestSim = Math.max(simEnName, simIcon);

        if (highestSim >= threshold) {
          if (!bestMatch || highestSim > bestMatch.similarity) {
            bestMatch = { apiName: augment.apiName, similarity: highestSim };
          }
        }
      }

      if (bestMatch) {
        console.log(`====== data find dc`);
        console.log(`[convertAugmentNameToApiName] Found fuzzy match: "${augmentName}" -> "${bestMatch.apiName}" (similarity: ${(bestMatch.similarity * 100).toFixed(2)}%)`);
        return bestMatch.apiName;
      }
    }

    // 3. Fallback: Nếu không tìm thấy, tự tạo theo pattern chuẩn Riot
    const parts = augmentName.toLowerCase().split(/[_-]+/);
    const camelCase = parts
      .map((part) => {
        if (/^(i|ii|iii|iv|v)$/.test(part)) return part.toUpperCase();
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join('');

    const resultApiName = `TFT_Augment_${camelCase}`;
    console.log(`[convertAugmentNameToApiName] Fallback pattern: "${augmentName}" -> "${resultApiName}"`);
    return resultApiName;
  }

  /**
   * Convert item name sang apiName bằng cách tìm trong tft-items
   */
  private async convertItemNameToApiName(
    itemName: string,
    itemsMap: Map<string, string>,
    itemsList: Array<{ name: string; enName?: string | null; apiName: string }>,
    jsonItems?: Array<{ name: string; en_name?: string; apiName: string }>,
  ): Promise<string> {
    if (!itemName) return itemName;

    const specialItemMapping: Record<string, string> = {
      'guardbreaker': 'TFT_Item_PowerGauntlet',
      'Guardbreaker': 'TFT_Item_PowerGauntlet',
      'Guard Breaker': 'TFT_Item_PowerGauntlet',
    };
    
    const normalizedItemName = itemName.toLowerCase().trim();
    if (specialItemMapping[normalizedItemName] || specialItemMapping[itemName]) {
      const apiName = specialItemMapping[normalizedItemName] || specialItemMapping[itemName];
      return apiName;
    }

    const normalizedInput = this.normalizeString(itemName);

    // 1. Tìm exact match trong map
    if (itemsMap.has(normalizedInput)) {
      const apiName = itemsMap.get(normalizedInput)!;
      return apiName;
    }

    // 2. Tìm trong itemsList
    for (const item of itemsList) {
      const nameNormalized = this.normalizeString(item.name);
      if (nameNormalized === normalizedInput) {
        return item.apiName;
      }
      if (item.enName) {
        const enNameNormalized = this.normalizeString(item.enName);
        if (enNameNormalized === normalizedInput) {
          return item.apiName;
        }
      }
    }

    // 2.5. Tìm trong file JSON
    if (jsonItems && jsonItems.length > 0) {
      for (const item of jsonItems) {
        const nameNormalized = this.normalizeString(item.name);
        if (nameNormalized === normalizedInput) {
          return item.apiName;
        }
        if (item.en_name) {
          const enNameNormalized = this.normalizeString(item.en_name);
          if (enNameNormalized === normalizedInput) {
            return item.apiName;
          }
        }
      }
    }

    // 4. Tìm trong itemsList với fuzzy matching
    let bestMatch: { apiName: string; similarity: number; source: string } | null = null;
    const threshold = 0.75;

    for (const item of itemsList) {
      const nameNormalized = this.normalizeString(item.name);
      const similarity = this.calculateSimilarity(normalizedInput, nameNormalized);

      if (similarity >= threshold) {
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = { apiName: item.apiName, similarity: similarity, source: `name: "${item.name}"` };
        }
      }

      if (item.enName) {
        const enNameNormalized = this.normalizeString(item.enName);
        const similarity2 = this.calculateSimilarity(normalizedInput, enNameNormalized);

        if (similarity2 >= threshold) {
          if (!bestMatch || similarity2 > bestMatch.similarity) {
            bestMatch = { apiName: item.apiName, similarity: similarity2, source: `enName: "${item.enName}"` };
          }
        }
      }
    }

    // 4.5. Tìm trong file JSON với fuzzy matching
    if (!bestMatch && jsonItems && jsonItems.length > 0) {
      for (const item of jsonItems) {
        const nameNormalized = this.normalizeString(item.name);
        const similarity = this.calculateSimilarity(normalizedInput, nameNormalized);

        if (similarity >= threshold) {
          if (!bestMatch || similarity > bestMatch.similarity) {
            bestMatch = { apiName: item.apiName, similarity: similarity, source: `JSON name: "${item.name}"` };
          }
        }

        if (item.en_name) {
          const enNameNormalized = this.normalizeString(item.en_name);
          const similarity2 = this.calculateSimilarity(normalizedInput, enNameNormalized);

          if (similarity2 >= threshold) {
            if (!bestMatch || similarity2 > bestMatch.similarity) {
              bestMatch = { apiName: item.apiName, similarity: similarity2, source: `JSON en_name: "${item.en_name}"` };
            }
          }
        }
      }
    }

    if (bestMatch) {
      return bestMatch.apiName;
    }

    // 5. Thử convert pattern
    const originalParts = itemName.toLowerCase().trim().split(/[-_\s]+/);
    const camelCase = originalParts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    const possibleApiName = `TFT_Item_${camelCase}`;

    const possibleApiNameNormalized = this.normalizeString(possibleApiName);
    if (itemsMap.has(possibleApiNameNormalized)) {
      return itemsMap.get(possibleApiNameNormalized)!;
    }

    // 6. Tìm partial match
    for (const [key, apiName] of itemsMap.entries()) {
      const keyNormalized = this.normalizeString(key);
      if (
        keyNormalized.includes(normalizedInput) ||
        normalizedInput.includes(keyNormalized)
      ) {
        return apiName;
      }
    }

    return itemName;
  }

  /**
   * Parse HTML từ Mobalytics và trả về CreateCompositionDto
   */
  async parseMobalyticsHTML(htmlString: string): Promise<CreateCompositionDto> {
    const $ = cheerio.load(htmlString);

    const { data: allItems } = await this.tftItemsService.findManyWithPagination({
      filterOptions: null,
      sortOptions: null,
      paginationOptions: { page: 1, limit: 1000 },
    });

    const jsonItems = this.loadItemsFromJsonFile();
    const jsonAugments = this.loadAugmentsFromJsonFile();

    const itemsMap = new Map<string, string>();
    allItems.forEach((item) => {
      const nameNormalized = this.normalizeString(item.name);
      itemsMap.set(nameNormalized, item.apiName);

      const apiNameNormalized = this.normalizeString(item.apiName);
      itemsMap.set(apiNameNormalized, item.apiName);

      if (item.enName) {
        const enNameNormalized = this.normalizeString(item.enName);
        itemsMap.set(enNameNormalized, item.apiName);
      }
    });

    // 1. Lấy thông tin cơ bản
    const compName = $('.m-vt6jeq span').first().text().trim() || '';
    const tier = $('.m-jmopu0').first().attr('alt')?.toUpperCase() || 'S';
    const plan = $('.m-ttncf1:nth-child(2)').first().text().trim() || 'Fast 8';
    const difficulty = $('.m-1w3013t').first().text().trim() || 'Medium';
    const description = $('.m-yg89s3 p').first().text().trim() || '';

    // 1.5. Lấy Teamcode
    let teamcode: string | undefined = undefined;
    const copyButton = $('button:contains("Copy"), button:contains("Copy Code"), [data-clipboard-text]').first();
    if (copyButton.length > 0) {
      const clipboardText = copyButton.attr('data-clipboard-text');
      if (clipboardText) {
        teamcode = clipboardText.trim();
      } else {
        const dataCode = copyButton.attr('data-code') || copyButton.attr('data-teamcode');
        if (dataCode) teamcode = dataCode.trim();
      }
    }
    
    if (!teamcode) {
      const codeInput = $('input[type="text"][value*="TFT"], textarea[value*="TFT"]').first();
      if (codeInput.length > 0) {
        teamcode = codeInput.attr('value') || codeInput.val()?.toString().trim() || undefined;
      }
    }

    // 2. Lấy danh sách tướng (Units)
    const unitElements = $('.m-1pjvpo5');
    const unitsMap = new Map<string, UnitDto>();

    unitElements.each((_, el) => {
      const $el = $(el);
      const name = $el.find('.m-fdk2wo').first().text().trim();
      if (!name) return;

      const itemNames: string[] = [];
      $el.find('.m-19fbyqx img').each((_, img) => {
        const itemName = $(img).attr('alt');
        if (itemName) itemNames.push(itemName);
      });

      const needUnlock = $el.find('.m-vbsdhx').length > 0;
      const image = $el.find('img[src*="champions/icons"], .m-1mzzpt2 img').first().attr('src') || null;
      const championId = name.toLowerCase().replace(/\s/g, '-');
      
      let championKey: string;
      const hasAmpersand = name.includes('&') || name.includes('-&-');
      
      if (hasAmpersand) {
        let firstPart = name.includes('-&-') ? name.split('-&-')[0].trim() : name.split('&')[0].trim();
        const cleanedFirstPart = firstPart.replace(/[^a-zA-Z0-9]/g, '');
        championKey = `TFT16_${cleanedFirstPart}`;
      } else {
        const cleanedName = name.replace(/[^a-zA-Z0-9]/g, '');
        championKey = `TFT16_${cleanedName}`;
      }

      unitsMap.set(name, {
        championId: championId,
        championKey: championKey,
        name: name,
        cost: 0,
        star: 2,
        carry: itemNames.length > 0,
        need3Star: false,
        needUnlock: needUnlock,
        image: image || undefined,
        items: itemNames.length > 0 ? itemNames : undefined,
        traits: [],
        position: { row: 0, col: 0 },
      });
    });

    // 3. Xử lý Formation
    const rows = $('.m-c4qvow .m-i9rwau');
    rows.each((rowIndex, rowElement) => {
      const $row = $(rowElement);
      const slots = $row.find('.m-bjn8wh');
      slots.each((colIndex, slot) => {
        const $slot = $(slot);
        const img = $slot.find('image').first();
        if (img.length > 0) {
          const imgUrl = img.attr('href');
          for (const unit of unitsMap.values()) {
            if (imgUrl && imgUrl.includes(unit.name.toLowerCase().replace(/\s/g, ''))) {
              unit.position = { row: rowIndex, col: colIndex };
            }
          }
        }
      });
    });

    // 4. Tổng hợp Carry Items
    const carryItems: CarryItemDto[] = Array.from(unitsMap.values())
      .filter((u) => u.items && u.items.length > 0)
      .map((u) => ({
        championId: u.championId,
        championKey: u.championKey,
        championName: u.name,
        role: 'Carry',
        image: u.image,
        items: u.items || [],
      }));

    // 5. Lấy Carousel Priority
    const carouselPriorityItems: string[] = [];
    $('.m-1bx4po4 .m-17j8r88').each((_, img) => {
      const alt = $(img).attr('alt');
      if (alt) carouselPriorityItems.push(alt);
    });
    const carouselPriority = carouselPriorityItems.length > 0 ? carouselPriorityItems.length : undefined;

    // 6. Lấy Core Champion
    const coreChampionImg = $('.m-164p6p3 .m-14iqx8t img').first();
    const coreChampionName = coreChampionImg.attr('alt') || coreChampionImg.attr('title') || undefined;
    let finalCoreChampion: UnitDto | undefined = undefined;
    
    if (coreChampionName) {
      for (const unit of unitsMap.values()) {
        if (unit.name.toLowerCase() === coreChampionName.toLowerCase() ||
            coreChampionName.toLowerCase().includes(unit.name.toLowerCase())) {
          finalCoreChampion = unit;
          break;
        }
      }
    }
    
    if (!finalCoreChampion && carryItems.length > 0) {
      const carryChampionName = carryItems[0].championName;
      for (const unit of unitsMap.values()) {
        if (unit.name === carryChampionName) {
          finalCoreChampion = unit;
          break;
        }
      }
    }

    // 7. Lấy Augments
    const augments: Array<{ name: string; tier: number }> = [];
    $('.m-1cggxe8').each((_, row) => {
      const $row = $(row);
      const tierText = $row.find('.m-1xb5jtj span').first().text().trim();
      const tierNumber = parseInt(tierText.replace(/[^0-9]/g, '')) || 0;

      $row.find('img.m-13ul2l1').each((_, img) => {
        const augmentName = $(img).attr('alt');
        if (augmentName) {
          const apiName = this.convertAugmentNameToApiName(augmentName, jsonAugments);
          augments.push({
            name: apiName,
            tier: tierNumber,
          });
        }
      });
    });

    // 8. Tìm cost
    const unitsWithCost = await Promise.all(
      Array.from(unitsMap.values()).map(async (unit) => {
        let cost = 0;
        try {
          let tftUnit = await this.tftUnitsService.findByApiName(unit.championKey);
          if (!tftUnit) {
            const nameVariations = [
              unit.name,
              `TFT16_${unit.name.replace(/\s/g, '')}`,
              `TFT_${unit.name.replace(/\s/g, '')}`,
            ];
            for (const variation of nameVariations) {
              tftUnit = await this.tftUnitsService.findByApiName(variation);
              if (tftUnit) break;
            }
          }
          if (tftUnit && tftUnit.cost !== null) cost = tftUnit.cost || 0;
        } catch (error) {
          console.log(`[parseMobalyticsHTML] Error finding cost for unit "${unit.name}":`, error);
        }
        return { ...unit, cost: cost };
      }),
    );

    // 9. Convert items trong units
    const unitsWithApiNames = await Promise.all(
      unitsWithCost.map(async (unit) => {
        if (unit.items && unit.items.length > 0) {
          const convertedItems = await Promise.all(
            unit.items.map((itemName) =>
              this.convertItemNameToApiName(itemName, itemsMap, allItems, jsonItems),
            ),
          );
          return { ...unit, items: convertedItems };
        }
        return unit;
      }),
    );

    // 10. Convert items trong coreChampion
    let finalCoreChampionWithApiNames: UnitDto | undefined = undefined;
    if (finalCoreChampion) {
      if (finalCoreChampion.items && finalCoreChampion.items.length > 0) {
        const convertedItems = await Promise.all(
          finalCoreChampion.items.map((itemName) =>
            this.convertItemNameToApiName(itemName, itemsMap, allItems, jsonItems),
          ),
        );
        finalCoreChampionWithApiNames = { ...finalCoreChampion, items: convertedItems };
      } else {
        finalCoreChampionWithApiNames = finalCoreChampion;
      }
    }

    // 11. Convert items trong carryItems
    const carryItemsWithApiNames = await Promise.all(
      carryItems.map(async (carry) => {
        if (carry.items && carry.items.length > 0) {
          const convertedItems = await Promise.all(
            carry.items.map((itemName) =>
              this.convertItemNameToApiName(itemName, itemsMap, allItems, jsonItems),
            ),
          );
          return { ...carry, items: convertedItems };
        }
        return carry;
      }),
    );

    // 12. Tạo compId
    const compIdSlug = compName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    const randomSuffix = Math.random().toString(36).substring(7);
    const compId = `comp-${compIdSlug}-${randomSuffix}`;

    return {
      compId: compId,
      name: compName,
      plan: plan,
      difficulty: difficulty,
      metaDescription: description || undefined,
      isLateGame: plan.includes('9'),
      tier: tier,
      active: true,
      boardSize: { rows: 4, cols: 7 },
      units: unitsWithApiNames,
      carryItems: carryItemsWithApiNames.length > 0 ? carryItemsWithApiNames : undefined,
      notes: [],
      carouselPriority: carouselPriority,
      augments: augments.length > 0 ? augments : undefined,
      coreChampion: finalCoreChampionWithApiNames || undefined,
      teamCode: teamcode || undefined,
    };
  }
}