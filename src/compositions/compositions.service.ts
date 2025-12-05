import {
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateCompositionDto } from './dto/create-composition.dto';
import { UpdateCompositionDto } from './dto/update-composition.dto';
import { NullableType } from '../utils/types/nullable.type';
import {
  FilterCompositionDto,
  SortCompositionDto,
} from './dto/query-composition.dto';
import { CompositionRepository } from './infrastructure/persistence/composition.repository';
import { Composition, Synergy } from './domain/composition';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { TftUnitsService } from '../tft-units/tft-units.service';
import { TftTraitsService } from '../tft-traits/tft-traits.service';
// Champions module removed

@Injectable()
export class CompositionsService {
  constructor(
    private readonly compositionsRepository: CompositionRepository,
    private readonly tftUnitsService: TftUnitsService,
    private readonly tftTraitsService: TftTraitsService,
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

    // Tính toán synergies tự động từ units nếu không được cung cấp
    let synergies = createCompositionDto.synergies;
    if (!synergies || synergies.length === 0) {
      synergies = await this.calculateSynergiesFromUnits(
        createCompositionDto.units,
        createCompositionDto.bench,
      );
    }

    const composition = await this.compositionsRepository.create({
      compId: compId,
      name: createCompositionDto.name,
      plan: createCompositionDto.plan,
      difficulty: createCompositionDto.difficulty,
      metaDescription: createCompositionDto.metaDescription,
      isLateGame: createCompositionDto.isLateGame ?? false,
      tier: createCompositionDto.tier,
      boardSize: createCompositionDto.boardSize || { rows: 4, cols: 7 }, // Mặc định 4x7
      synergies: synergies,
      units: createCompositionDto.units,
      earlyGame: createCompositionDto.earlyGame,
      midGame: createCompositionDto.midGame,
      bench: createCompositionDto.bench,
      carryItems: createCompositionDto.carryItems,
      notes: createCompositionDto.notes ?? [],
    });

    return composition;
  }

  /**
   * Tính toán synergies tự động từ danh sách units
   */
  private async calculateSynergiesFromUnits(
    units: CreateCompositionDto['units'],
    bench?: CreateCompositionDto['bench'],
  ): Promise<Synergy[]> {
    // Lấy tất cả units (trên bàn cờ + bench)
    const allUnits = [...units, ...(bench || [])];

    // Map để đếm số lượng units có mỗi trait
    const traitCountMap = new Map<string, number>();

    // Lấy thông tin chi tiết của từng unit và đếm traits
    for (const unit of allUnits) {
      try {
        const unitDetail = await this.tftUnitsService.findById(unit.championId);
        if (unitDetail && unitDetail.traits) {
          for (const traitApiName of unitDetail.traits) {
            const currentCount = traitCountMap.get(traitApiName) || 0;
            traitCountMap.set(traitApiName, currentCount + 1);
          }
        }
      } catch (error) {
        // Nếu không tìm thấy unit, bỏ qua
        console.warn(`Unit not found: ${unit.championId}`);
      }
    }

    // Lấy thông tin chi tiết của từng trait và tạo synergies
    const synergies: Synergy[] = [];

    for (const [traitApiName, count] of traitCountMap.entries()) {
      try {
        const trait = await this.tftTraitsService.findByApiName(traitApiName);
        if (trait) {
          // Tìm max từ effects (số lượng units tối đa trong effects)
          let max = 0;
          if (trait.effects && trait.effects.length > 0) {
            max = Math.max(
              ...trait.effects.map((effect) => effect.maxUnits || 0),
            );
          }

          // Tạo abbreviation từ name (lấy chữ cái đầu của mỗi từ)
          const abbreviation = trait.name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .substring(0, 3)
            .toUpperCase();

          // Màu mặc định (có thể lấy từ trait nếu có)
          const color = '#facc15'; // Màu vàng mặc định

          synergies.push({
            id: trait.apiName,
            name: trait.name,
            abbreviation: abbreviation,
            count: count,
            max: max || count, // Nếu không có max, dùng count
            color: color,
          });
        }
      } catch (error) {
        // Nếu không tìm thấy trait, tạo synergy với thông tin cơ bản
        const abbreviation = traitApiName
          .split('_')
          .pop()
          ?.substring(0, 3)
          .toUpperCase() || 'UNK';
        
        synergies.push({
          id: traitApiName,
          name: traitApiName,
          abbreviation: abbreviation,
          count: count,
          max: count,
          color: '#facc15',
        });
      }
    }

    // Sắp xếp theo count giảm dần
    synergies.sort((a, b) => b.count - a.count);

    return synergies;
  }

  /**
   * Populate needUnlock cho các units trong composition
   * Dựa theo TFT Unit (tft-units)
   */
  private async populateUnitsNeedUnlock(composition: Composition): Promise<void> {
    const cache = new Map<string, boolean>();

    const fillForUnits = async (units?: Composition['units']) => {
      if (!units || units.length === 0) return;

      for (const unit of units) {
        if (!unit.championId) continue;

        const key = String(unit.championId);

        if (!cache.has(key)) {
          const unitDetail = await this.tftUnitsService.findById(key);
          cache.set(key, unitDetail?.needUnlock === true);
        }

        (unit as any).needUnlock = cache.get(key) ?? false;
      }
    };

    await fillForUnits(composition.units);
    await fillForUnits(composition.earlyGame);
    await fillForUnits(composition.midGame);
    await fillForUnits(composition.bench);
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
    const compositions =
      await this.compositionsRepository.findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
      });

    // Populate needUnlock cho units
    for (const composition of compositions) {
      await this.populateUnitsNeedUnlock(composition);
    }

    return compositions;
  }

  async findById(
    id: Composition['id'],
  ): Promise<NullableType<Composition>> {
    const composition = await this.compositionsRepository.findById(id);

    if (!composition) {
      return null;
    }

    // Populate needUnlock cho units
    await this.populateUnitsNeedUnlock(composition);

    return composition;
  }

  async findByCompId(
    compId: string,
  ): Promise<NullableType<Composition>> {
    if (!compId) {
      return null;
    }
    const composition = await this.compositionsRepository.findByCompId(compId);

    if (!composition) {
      return null;
    }

    // Populate needUnlock cho units
    await this.populateUnitsNeedUnlock(composition);

    return composition;
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

    // Nếu có units mới và không có synergies, tính toán lại synergies
    if (
      (updateCompositionDto.units || updateCompositionDto.bench) &&
      !updateCompositionDto.synergies
    ) {
      // Lấy composition hiện tại để lấy units nếu không có trong update
      const currentComposition = await this.compositionsRepository.findById(id);
      if (currentComposition) {
        const units = updateCompositionDto.units || currentComposition.units;
        const bench = updateCompositionDto.bench !== undefined 
          ? updateCompositionDto.bench 
          : currentComposition.bench;

        const calculatedSynergies = await this.calculateSynergiesFromUnits(
          units,
          bench,
        );
        updateCompositionDto.synergies = calculatedSynergies;
      }
    }

    const composition = await this.compositionsRepository.update(
      id,
      updateCompositionDto,
    );

    if (!composition) {
      return null;
    }

    // Populate needUnlock cho units
    await this.populateUnitsNeedUnlock(composition);

    return composition;
  }

  async remove(id: Composition['id']): Promise<void> {
    await this.compositionsRepository.remove(id);
  }
}

