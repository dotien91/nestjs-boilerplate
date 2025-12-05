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
import { Composition } from './domain/composition';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { TftUnitsService } from '../tft-units/tft-units.service';
// Champions module removed

@Injectable()
export class CompositionsService {
  constructor(
    private readonly compositionsRepository: CompositionRepository,
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
    });

    return composition;
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

