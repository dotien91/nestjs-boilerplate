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

    // Champion validation removed

    const composition = await this.compositionsRepository.create({
      compId: compId,
      name: createCompositionDto.name,
      plan: createCompositionDto.plan,
      difficulty: createCompositionDto.difficulty,
      metaDescription: createCompositionDto.metaDescription,
      isLateGame: createCompositionDto.isLateGame ?? false,
      tier: createCompositionDto.tier,
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

    // Champion validation removed

    return this.compositionsRepository.update(id, updateCompositionDto);
  }

  async remove(id: Composition['id']): Promise<void> {
    await this.compositionsRepository.remove(id);
  }

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
   * Ví dụ: "Kraken's Fury" -> "krakensfury"
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
   * Ví dụ: "upward-mobility" -> "TFT_Augment_UpwardMobility"
   */
  private convertAugmentNameToApiName(
    augmentName: string,
    jsonAugments?: Array<{ name: string; en_name?: string; apiName: string; icon?: string }>,
  ): string {
    if (!augmentName) return augmentName;

    // 1. Normalize input: xóa gạch dưới, gạch nối, khoảng trắng và chuyển về chữ thường
    // "eyeforaneye_i" -> "eyeforaneyei"
    // "levelup" -> "levelup"
    const normalizedInput = augmentName.toLowerCase().replace(/[_-]/g, '').trim();

    console.log(`[convertAugmentNameToApiName] Input: "${augmentName}" -> Normalized: "${normalizedInput}"`);

    if (jsonAugments && jsonAugments.length > 0) {
      // --- VÒNG LẶP 1: TÌM KIẾM CHÍNH XÁC (EXACT MATCH) ---
      for (const augment of jsonAugments) {
        const apiNameLow = augment.apiName.toLowerCase().replace(/[_-]/g, '');
        const enNameLow = (augment.en_name || '').toLowerCase().replace(/[_-]/g, '');
        const nameLow = augment.name.toLowerCase().replace(/[_-]/g, '');
        const iconLow = (augment.icon || '').toLowerCase(); // Lấy đường dẫn icon

        if (
          apiNameLow.includes(normalizedInput) || 
          enNameLow === normalizedInput || 
          nameLow === normalizedInput ||
          // Kiểm tra xem tên có nằm trong đường dẫn icon không (Case: LevelUp)
          iconLow.includes(normalizedInput)
        ) {
          console.log(`====== data find dc`);
          console.log(`[convertAugmentNameToApiName] Found exact match: "${augmentName}" -> "${augment.apiName}"`);
          return augment.apiName;
        }
      }

      // --- VÒNG LẶP 2: FUZZY MATCHING (Nếu vòng 1 không ra) ---
      let bestMatch: { apiName: string; similarity: number } | null = null;
      const threshold = 0.6; // Giảm threshold một chút để linh hoạt hơn

      for (const augment of jsonAugments) {
        // Tính độ tương đồng với cả tên tiếng Anh và đường dẫn icon
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

    // Hardcode mapping cho các trường hợp đặc biệt
    const specialItemMapping: Record<string, string> = {
      'guardbreaker': 'TFT_Item_PowerGauntlet',
      'Guardbreaker': 'TFT_Item_PowerGauntlet',
      'Guard Breaker': 'TFT_Item_PowerGauntlet',
    };
    
    // Kiểm tra hardcode mapping trước (case-insensitive)
    const normalizedItemName = itemName.toLowerCase().trim();
    if (specialItemMapping[normalizedItemName] || specialItemMapping[itemName]) {
      const apiName = specialItemMapping[normalizedItemName] || specialItemMapping[itemName];
      console.log(`====== data find dc`);
      console.log(`[convertItemNameToApiName] Found in hardcode mapping: "${itemName}" -> "${apiName}"`);
      return apiName;
    }

    // Normalize input: xóa ký tự đặc biệt, lowercase
    const normalizedInput = this.normalizeString(itemName);

    console.log(`[convertItemNameToApiName] Input: "${itemName}" -> Normalized: "${normalizedInput}"`);

    // 1. Tìm exact match trong map (sau khi normalize) - nhanh nhất
    if (itemsMap.has(normalizedInput)) {
      const apiName = itemsMap.get(normalizedInput)!;
      console.log(`====== data find dc`);
      console.log(`[convertItemNameToApiName] Found in map: "${itemName}" -> "${apiName}"`);
      return apiName;
    }

    // 2. Tìm trong itemsList với normalized (xóa ký tự đặc biệt) - exact match
    // Ưu tiên check name trước, sau đó check enName
    for (const item of itemsList) {
      // Check name: "Evenshroud" -> normalize -> "evenshroud"
      const nameNormalized = this.normalizeString(item.name);
      if (nameNormalized === normalizedInput) {
        console.log(`====== data find dc`);
        console.log(`[convertItemNameToApiName] Found in itemsList by name: "${itemName}" -> "${item.apiName}" (item.name: "${item.name}")`);
        return item.apiName;
      }

      // Check enName nếu có: "Evenshroud" -> normalize -> "evenshroud"
      if (item.enName) {
        const enNameNormalized = this.normalizeString(item.enName);
        if (enNameNormalized === normalizedInput) {
          console.log(`====== data find dc`);
          console.log(`[convertItemNameToApiName] Found in itemsList by enName: "${itemName}" -> "${item.apiName}" (item.enName: "${item.enName}")`);
          return item.apiName;
        }
      }
    }

    // 2.5. Tìm trong file JSON nếu không tìm thấy trong database
    if (jsonItems && jsonItems.length > 0) {
      for (const item of jsonItems) {
        // Check name
        const nameNormalized = this.normalizeString(item.name);
        if (nameNormalized === normalizedInput) {
          console.log(`====== data find dc`);
          console.log(`[convertItemNameToApiName] Found in JSON file by name: "${itemName}" -> "${item.apiName}" (item.name: "${item.name}")`);
          return item.apiName;
        }

        // Check en_name
        if (item.en_name) {
          const enNameNormalized = this.normalizeString(item.en_name);
          if (enNameNormalized === normalizedInput) {
            console.log(`====== data find dc`);
            console.log(`[convertItemNameToApiName] Found in JSON file by en_name: "${itemName}" -> "${item.apiName}" (item.en_name: "${item.en_name}")`);
            return item.apiName;
          }
        }
      }
    }

    // 4. Tìm trong itemsList với fuzzy matching (>= 75% similarity) - fallback
    let bestMatch: { apiName: string; similarity: number; source: string } | null = null;
    const threshold = 0.75;

    for (const item of itemsList) {
      // Check name với fuzzy matching
      const nameNormalized = this.normalizeString(item.name);
      const similarity = this.calculateSimilarity(
        normalizedInput,
        nameNormalized,
      );

      if (similarity >= threshold) {
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = { apiName: item.apiName, similarity: similarity, source: `name: "${item.name}"` };
        }
      }

      // Check enName nếu có
      if (item.enName) {
        const enNameNormalized = this.normalizeString(item.enName);
        const similarity2 = this.calculateSimilarity(
          normalizedInput,
          enNameNormalized,
        );

        if (similarity2 >= threshold) {
          if (!bestMatch || similarity2 > bestMatch.similarity) {
            bestMatch = { apiName: item.apiName, similarity: similarity2, source: `enName: "${item.enName}"` };
          }
        }
      }
    }

    // 4.5. Tìm trong file JSON với fuzzy matching nếu chưa tìm thấy
    if (!bestMatch && jsonItems && jsonItems.length > 0) {
      for (const item of jsonItems) {
        // Check name với fuzzy matching
        const nameNormalized = this.normalizeString(item.name);
        const similarity = this.calculateSimilarity(
          normalizedInput,
          nameNormalized,
        );

        if (similarity >= threshold) {
          if (!bestMatch || similarity > bestMatch.similarity) {
            bestMatch = { apiName: item.apiName, similarity: similarity, source: `JSON name: "${item.name}"` };
          }
        }

        // Check en_name nếu có
        if (item.en_name) {
          const enNameNormalized = this.normalizeString(item.en_name);
          const similarity2 = this.calculateSimilarity(
            normalizedInput,
            enNameNormalized,
          );

          if (similarity2 >= threshold) {
            if (!bestMatch || similarity2 > bestMatch.similarity) {
              bestMatch = { apiName: item.apiName, similarity: similarity2, source: `JSON en_name: "${item.en_name}"` };
            }
          }
        }
      }
    }

    if (bestMatch) {
      console.log(`====== data find dc`);
      console.log(`[convertItemNameToApiName] Found by fuzzy matching: "${itemName}" -> "${bestMatch.apiName}" (similarity: ${(bestMatch.similarity * 100).toFixed(2)}%, source: ${bestMatch.source})`);
      return bestMatch.apiName;
    }

    // 5. Nếu không tìm thấy, thử convert pattern
    // Ví dụ: "guinsoos-rageblade" -> "TFT_Item_GuinsoosRageblade"
    const originalParts = itemName.toLowerCase().trim().split(/[-_\s]+/);
    const camelCase = originalParts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    const possibleApiName = `TFT_Item_${camelCase}`;

    // Tìm trong map
    const possibleApiNameNormalized = this.normalizeString(possibleApiName);
    if (itemsMap.has(possibleApiNameNormalized)) {
      console.log(`====== data find dc`);
      console.log(`[convertItemNameToApiName] Found by pattern matching: "${itemName}" -> "${itemsMap.get(possibleApiNameNormalized)!}" (pattern: "${possibleApiName}")`);
      return itemsMap.get(possibleApiNameNormalized)!;
    }

    // 6. Tìm partial match (fallback)
    for (const [key, apiName] of itemsMap.entries()) {
      const keyNormalized = this.normalizeString(key);
      if (
        keyNormalized.includes(normalizedInput) ||
        normalizedInput.includes(keyNormalized)
      ) {
        console.log(`====== data find dc`);
        console.log(`[convertItemNameToApiName] Found by partial match: "${itemName}" -> "${apiName}" (key: "${key}")`);
        return apiName;
      }
    }

    // Nếu không tìm thấy, trả về original name
    console.log(`[convertItemNameToApiName] NOT FOUND: "${itemName}" (normalized: "${normalizedInput}") - returning original name`);
    return itemName;
  }

  /**
   * Parse HTML từ Mobalytics và trả về CreateCompositionDto
   */
  async parseMobalyticsHTML(htmlString: string): Promise<CreateCompositionDto> {
    const $ = cheerio.load(htmlString);

    // Load tất cả items từ database để convert item names
    const allItems = await this.tftItemsService.findManyWithPagination({
      filterOptions: null,
      sortOptions: null,
      paginationOptions: { page: 1, limit: 1000 },
    });

    // Load items từ file JSON như fallback
    const jsonItems = this.loadItemsFromJsonFile();

    // Load augments từ file JSON để convert augment names
    const jsonAugments = this.loadAugmentsFromJsonFile();

    // Tạo map để lookup nhanh: key = normalized name (xóa ký tự đặc biệt), value = apiName
    const itemsMap = new Map<string, string>();
    allItems.forEach((item) => {
      // Normalize name: xóa ký tự đặc biệt, lowercase
      const nameNormalized = this.normalizeString(item.name);
      itemsMap.set(nameNormalized, item.apiName);

      // Normalize apiName
      const apiNameNormalized = this.normalizeString(item.apiName);
      itemsMap.set(apiNameNormalized, item.apiName);

      // Thêm enName nếu có
      if (item.enName) {
        const enNameNormalized = this.normalizeString(item.enName);
        itemsMap.set(enNameNormalized, item.apiName);
      }
    });

    console.log(`[parseMobalyticsHTML] Loaded ${allItems.length} items from database`);
    console.log(`[parseMobalyticsHTML] ItemsMap size: ${itemsMap.size}`);
    
    // Log một số ví dụ items trong map để debug
    const sampleItems = Array.from(itemsMap.entries()).slice(0, 10);
    console.log(`[parseMobalyticsHTML] Sample items in map:`, sampleItems);
    
    // Log item "Evenshroud" nếu có
    const evenshroudNormalized = this.normalizeString('Evenshroud');
    if (itemsMap.has(evenshroudNormalized)) {
      console.log(`[parseMobalyticsHTML] Found "Evenshroud" in map: "${evenshroudNormalized}" -> "${itemsMap.get(evenshroudNormalized)}"`);
    } else {
      console.log(`[parseMobalyticsHTML] "Evenshroud" NOT in map (normalized: "${evenshroudNormalized}")`);
      // Tìm trong itemsList
      const evenshroudItem = allItems.find(item => 
        this.normalizeString(item.name) === evenshroudNormalized || 
        (item.enName && this.normalizeString(item.enName) === evenshroudNormalized)
      );
      if (evenshroudItem) {
        console.log(`[parseMobalyticsHTML] Found "Evenshroud" in itemsList: name="${evenshroudItem.name}", enName="${evenshroudItem.enName}", apiName="${evenshroudItem.apiName}"`);
      } else {
        console.log(`[parseMobalyticsHTML] "Evenshroud" NOT found in itemsList either`);
      }
    }

    // 1. Lấy thông tin cơ bản của Composition
    const compName =
      $('.m-vt6jeq span').first().text().trim() || '';
    const tier =
      $('.m-jmopu0').first().attr('alt')?.toUpperCase() || 'S';
    const plan =
      $('.m-ttncf1:nth-child(2)').first().text().trim() || 'Fast 8';
    const difficulty =
      $('.m-1w3013t').first().text().trim() || 'Medium';
    const description =
      $('.m-yg89s3 p').first().text().trim() || '';

    // 2. Lấy danh sách tướng (Units) và trang bị (Items)
    const unitElements = $('.m-1pjvpo5');
    const unitsMap = new Map<string, UnitDto>();

    unitElements.each((_, el) => {
      const $el = $(el);
      const name = $el.find('.m-fdk2wo').first().text().trim();
      if (!name) return;

      // Trích xuất items (sẽ convert sang apiName sau)
      const itemNames: string[] = [];
      $el.find('.m-19fbyqx img').each((_, img) => {
        const itemName = $(img).attr('alt');
        if (itemName) itemNames.push(itemName);
      });

      // Kiểm tra xem có icon "khóa" (cần unlock) không
      const needUnlock = $el.find('.m-vbsdhx').length > 0;

      // Lấy ảnh tướng
      const image =
        $el
          .find('img[src*="champions/icons"], .m-1mzzpt2 img, .m-yyfvx7 img, .m-f0owky img')
          .first()
          .attr('src') || null;

      const championId = name.toLowerCase().replace(/\s/g, '-');
      
      // Hardcode mapping cho các trường hợp đặc biệt
      const specialChampionKeyMapping: Record<string, string> = {
        'Lucian & Senna': 'TFT16_Lucian',
        'Lucian&Senna': 'TFT16_Lucian',
      };
      
      // Kiểm tra mapping trước
      let championKey = specialChampionKeyMapping[name];
      if (!championKey) {
        championKey = `TFT16_${name.replace(/\s/g, '')}`;
      }

      unitsMap.set(name, {
        championId: championId,
        championKey: championKey,
        name: name,
        cost: 0, // Sẽ được update từ database sau
        star: 2,
        carry: itemNames.length > 0,
        need3Star: false,
        needUnlock: needUnlock,
        image: image || undefined,
        items: itemNames.length > 0 ? itemNames : undefined, // Sẽ convert sang apiName sau
        traits: [],
        position: { row: 0, col: 0 }, // Sẽ update ở bước Formation
      });
    });

    // 3. Xử lý Formation (Vị trí trên bàn cờ)
    // Mobalytics dùng 4 hàng, mỗi hàng có class .m-i9rwau
    const rows = $('.m-c4qvow .m-i9rwau');
    rows.each((rowIndex, rowElement) => {
      const $row = $(rowElement);
      const slots = $row.find('.m-bjn8wh');
      slots.each((colIndex, slot) => {
        const $slot = $(slot);
        const img = $slot.find('image').first();
        if (img.length > 0) {
          const imgUrl = img.attr('href');
          // Tìm tướng tương ứng trong map dựa vào URL ảnh hoặc Alt
          for (const unit of unitsMap.values()) {
            if (
              imgUrl &&
              imgUrl.includes(
                unit.name.toLowerCase().replace(/\s/g, ''),
              )
            ) {
              unit.position = { row: rowIndex, col: colIndex };
            }
          }
        }
      });
    });

    // 4. Tổng hợp Carry Items (Những tướng có 3 đồ)
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

    // 5. Lấy Carousel Priority (Trang bị ưu tiên)
    // Mobalytics liệt kê trang bị theo thứ tự ưu tiên từ trái sang phải
    const carouselPriorityItems: string[] = [];
    $('.m-1bx4po4 .m-17j8r88').each((_, img) => {
      const alt = $(img).attr('alt');
      if (alt) {
        carouselPriorityItems.push(alt);
      }
    });
    // Lưu số lượng items ưu tiên (hoặc có thể lưu danh sách items nếu cần)
    const carouselPriority = carouselPriorityItems.length > 0 ? carouselPriorityItems.length : undefined;

    // 6. Lấy Core Champion (Tướng nòng cốt) - dạng Unit object
    // Thường nằm trong phần "Core Champions" của Mobalytics
    const coreChampionImg = $('.m-164p6p3 .m-14iqx8t img').first();
    const coreChampionName = coreChampionImg.attr('alt') || coreChampionImg.attr('title') || undefined;
    
    // Tìm unit object từ unitsMap dựa vào name
    let finalCoreChampion: UnitDto | undefined = undefined;
    
    if (coreChampionName) {
      // Tìm trong unitsMap
      for (const unit of unitsMap.values()) {
        if (unit.name.toLowerCase() === coreChampionName.toLowerCase() ||
            coreChampionName.toLowerCase().includes(unit.name.toLowerCase()) ||
            unit.name.toLowerCase().includes(coreChampionName.toLowerCase())) {
          finalCoreChampion = unit;
          break;
        }
      }
    }
    
    // Fallback: Nếu không tìm thấy, lấy champion đầu tiên trong carryItems hoặc unit có nhiều items nhất
    if (!finalCoreChampion) {
      if (carryItems.length > 0) {
        const carryChampionName = carryItems[0].championName;
        for (const unit of unitsMap.values()) {
          if (unit.name === carryChampionName) {
            finalCoreChampion = unit;
            break;
          }
        }
      }
      
      // Nếu vẫn chưa có, tìm unit có nhiều items nhất
      if (!finalCoreChampion) {
        let maxItems = 0;
        for (const unit of unitsMap.values()) {
          const itemCount = unit.items?.length || 0;
          if (itemCount > maxItems) {
            maxItems = itemCount;
            finalCoreChampion = unit;
          }
        }
      }
    }

    // 7. Lấy Augments (Lõi công nghệ) kèm Tier
    // Tìm tất cả các hàng Augment (mỗi hàng tương ứng với 1 Tier)
    const augments: Array<{ name: string; tier: number }> = [];
    const augmentRows = $('.m-1cggxe8');
    
    augmentRows.each((_, row) => {
      const $row = $(row);
      // Lấy text Tier (ví dụ: "Tier 1", "Tier 2"...)
      const tierText = $row.find('.m-1xb5jtj span').first().text().trim();
      // Chuyển đổi chuỗi "Tier 1" thành số 1
      const tierNumber = parseInt(tierText.replace(/[^0-9]/g, '')) || 0;

      // Lấy tất cả các ảnh lõi trong hàng này
      $row.find('img.m-13ul2l1').each((_, img) => {
        const augmentName = $(img).attr('alt');
        if (augmentName) {
          // Convert augment name sang apiName từ JSON file
          const apiName = this.convertAugmentNameToApiName(augmentName, jsonAugments);
          augments.push({
            name: apiName, // Lưu apiName thay vì original name
            tier: tierNumber,
          });
        }
      });
    });

    // 8. Tìm cost từ database TFT Units cho tất cả units
    // Hardcode mapping cho các trường hợp đặc biệt
    const specialUnitMapping: Record<string, string> = {
      'Lucian&Senna': 'TFT16_Lucian',
    };
    
    const unitsWithCost = await Promise.all(
      Array.from(unitsMap.values()).map(async (unit) => {
        let cost = 0; // Default cost
        
        // Tìm unit trong database bằng championKey hoặc name
        try {
          // Kiểm tra hardcode mapping trước
          let apiNameToSearch = specialUnitMapping[unit.name];
          if (apiNameToSearch) {
            const tftUnit = await this.tftUnitsService.findByApiName(apiNameToSearch);
            if (tftUnit && tftUnit.cost !== null && tftUnit.cost !== undefined) {
              cost = tftUnit.cost;
              return {
                ...unit,
                cost: cost,
              };
            }
          }
          
          // Thử tìm bằng championKey
          let tftUnit = await this.tftUnitsService.findByApiName(unit.championKey);
          
          // Nếu không tìm thấy, thử tìm bằng name
          if (!tftUnit) {
            // Thử các biến thể của name
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
          
          // Nếu vẫn không tìm thấy, thử tìm bằng name trong database
          if (!tftUnit) {
            const allUnits = await this.tftUnitsService.findManyWithPagination({
              filterOptions: null,
              sortOptions: null,
              paginationOptions: { page: 1, limit: 1000 },
            });
            
            const foundUnit = allUnits.find(
              (u) =>
                u.name.toLowerCase() === unit.name.toLowerCase() ||
                (u.enName && u.enName.toLowerCase() === unit.name.toLowerCase()),
            );
            
            if (foundUnit) {
              tftUnit = foundUnit;
            }
          }
          
          if (tftUnit && tftUnit.cost !== null && tftUnit.cost !== undefined) {
            cost = tftUnit.cost;
          }
        } catch (error) {
          console.log(`[parseMobalyticsHTML] Error finding cost for unit "${unit.name}":`, error);
        }
        
        return {
          ...unit,
          cost: cost,
        };
      }),
    );

    // 9. Convert items từ name sang apiName cho tất cả units
    const unitsWithApiNames = await Promise.all(
      unitsWithCost.map(async (unit) => {
        if (unit.items && unit.items.length > 0) {
          const convertedItems = await Promise.all(
            unit.items.map((itemName) =>
              this.convertItemNameToApiName(itemName, itemsMap, allItems, jsonItems),
            ),
          );
          return {
            ...unit,
            items: convertedItems,
          };
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
        finalCoreChampionWithApiNames = {
          ...finalCoreChampion,
          items: convertedItems,
        };
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
          return {
            ...carry,
            items: convertedItems,
          };
        }
        return carry;
      }),
    );

    // 12. Tạo compId
    const compIdSlug = compName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
      .replace(/[^a-z0-9\s-]/g, '') // Xóa ký tự đặc biệt
      .replace(/\s+/g, '-') // Thay space bằng dấu gạch ngang
      .replace(/-+/g, '-') // Xóa nhiều dấu gạch ngang liên tiếp
      .trim();
    const randomSuffix = Math.random().toString(36).substring(7);
    const compId = `comp-${compIdSlug}-${randomSuffix}`;

    // 13. Kết quả cuối cùng khớp với CreateCompositionDto
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
    };
  }
}

