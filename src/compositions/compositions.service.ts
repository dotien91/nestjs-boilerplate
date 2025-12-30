import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as cheerio from 'cheerio';
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

@Injectable()
export class CompositionsService {
  constructor(
    private readonly compositionsRepository: CompositionRepository,
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
   * Parse HTML từ Mobalytics và trả về CreateCompositionDto
   */
  parseMobalyticsHTML(htmlString: string): CreateCompositionDto {
    const $ = cheerio.load(htmlString);

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

      // Trích xuất items
      const items: string[] = [];
      $el.find('.m-19fbyqx img').each((_, img) => {
        const itemName = $(img).attr('alt');
        if (itemName) items.push(itemName);
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
      const championKey = `TFT16_${name.replace(/\s/g, '')}`;

      unitsMap.set(name, {
        championId: championId,
        championKey: championKey,
        name: name,
        cost: 0, // Cần mapping thêm từ màu border nếu muốn chính xác
        star: 2,
        carry: items.length > 0,
        need3Star: false,
        needUnlock: needUnlock,
        image: image || undefined,
        items: items.length > 0 ? items : undefined,
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
          augments.push({
            name: augmentName,
            tier: tierNumber,
          });
        }
      });
    });

    // 8. Tạo compId
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

    // 9. Kết quả cuối cùng khớp với CreateCompositionDto
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
      units: Array.from(unitsMap.values()),
      carryItems: carryItems.length > 0 ? carryItems : undefined,
      notes: [],
      carouselPriority: carouselPriority,
      augments: augments.length > 0 ? augments : undefined,
      coreChampion: finalCoreChampion || undefined,
    };
  }
}

