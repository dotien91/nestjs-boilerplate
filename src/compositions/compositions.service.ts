import {
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  Inject,
  forwardRef,
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
import { ChampionRepository } from '../champions/infrastructure/persistence/champion.repository';
import { Champion } from '../champions/domain/champion';

@Injectable()
export class CompositionsService {
  constructor(
    private readonly compositionsRepository: CompositionRepository,
    @Inject(forwardRef(() => ChampionRepository))
    private readonly championRepository: ChampionRepository,
  ) {}

  async create(
    createCompositionDto: CreateCompositionDto,
  ): Promise<Composition> {
    // Kiểm tra compId đã tồn tại chưa
    if (createCompositionDto.compId) {
      const compositionObject =
        await this.compositionsRepository.findByCompId(
          createCompositionDto.compId,
        );
      if (compositionObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            compId: 'compositionCompIdAlreadyExists',
          },
        });
      }
    }

    // Validate tất cả championId
    await this.validateChampionIds(createCompositionDto);

    const composition = await this.compositionsRepository.create({
      compId: createCompositionDto.compId,
      name: createCompositionDto.name,
      plan: createCompositionDto.plan,
      difficulty: createCompositionDto.difficulty,
      metaDescription: createCompositionDto.metaDescription,
      isLateGame: createCompositionDto.isLateGame ?? false,
      boardSize: createCompositionDto.boardSize,
      synergies: createCompositionDto.synergies,
      units: createCompositionDto.units,
      bench: createCompositionDto.bench,
      carryItems: createCompositionDto.carryItems,
      notes: createCompositionDto.notes ?? [],
    });

    // Populate champions
    return await this.populateChampions(composition);
  }

  /**
   * Tìm champion bằng championId string (có thể là ObjectId hoặc string khác)
   */
  private async findChampionByIdString(
    championId: string,
  ): Promise<NullableType<any>> {
    if (!championId) return null;

    // Kiểm tra xem có phải MongoDB ObjectId hợp lệ không (24 ký tự hex)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(championId);

    if (isValidObjectId) {
      // Nếu là ObjectId hợp lệ, dùng findById
      return await this.championRepository.findById(championId);
    } else {
      // Nếu không phải ObjectId, thử tìm bằng key (có thể championId là key)
      return await this.championRepository.findByKey(championId);
    }
  }

  /**
   * Validate tất cả championId trong units, bench, và carryItems
   */
  private async validateChampionIds(
    dto: CreateCompositionDto | UpdateCompositionDto,
  ): Promise<void> {
    const championIds = new Set<string>();

    // Collect championIds từ units
    if (dto.units && dto.units.length > 0) {
      dto.units.forEach((unit) => {
        if (unit.championId) {
          championIds.add(unit.championId);
        }
      });
    }

    // Collect championIds từ bench
    if (dto.bench && dto.bench.length > 0) {
      dto.bench.forEach((unit) => {
        if (unit.championId) {
          championIds.add(unit.championId);
        }
      });
    }

    // Collect championIds từ carryItems
    if (dto.carryItems && dto.carryItems.length > 0) {
      dto.carryItems.forEach((carryItem) => {
        if (carryItem.championId) {
          championIds.add(carryItem.championId);
        }
      });
    }

    // Validate tất cả championIds
    if (championIds.size > 0) {
      const championPromises = Array.from(championIds).map((championId) =>
        this.findChampionByIdString(championId),
      );
      const championResults = await Promise.all(championPromises);
      const invalidChampionIds = Array.from(championIds).filter(
        (_, index) => !championResults[index],
      );

      if (invalidChampionIds.length > 0) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            championIds: `championsNotExist: ${invalidChampionIds.join(', ')}`,
          },
        });
      }
    }
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
    const compositions = await this.compositionsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });

    // Populate champions cho tất cả compositions
    return Promise.all(
      compositions.map((composition) => this.populateChampions(composition)),
    );
  }

  async findById(
    id: Composition['id'],
  ): Promise<NullableType<Composition>> {
    const composition = await this.compositionsRepository.findById(id);

    if (!composition) {
      return null;
    }

    return await this.populateChampions(composition);
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

    return await this.populateChampions(composition);
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

    // Validate tất cả championId nếu có update
    if (
      updateCompositionDto.units ||
      updateCompositionDto.bench ||
      updateCompositionDto.carryItems
    ) {
      await this.validateChampionIds(updateCompositionDto);
    }

    const composition = await this.compositionsRepository.update(
      id,
      updateCompositionDto,
    );

    if (!composition) {
      return null;
    }

    return await this.populateChampions(composition);
  }

  async remove(id: Composition['id']): Promise<void> {
    await this.compositionsRepository.remove(id);
  }

  /**
   * Populate champions cho units, bench, và carryItems trong composition
   */
  private async populateChampions(
    composition: Composition,
  ): Promise<Composition> {
    // Populate champions cho units
    if (composition.units && composition.units.length > 0) {
      const unitPromises = composition.units.map(async (unit) => {
        const champion = await this.findChampionByIdString(unit.championId);
        return {
          ...unit,
          championDetails: champion || undefined,
        };
      });
      composition.units = await Promise.all(unitPromises);
    }

    // Populate champions cho bench
    if (composition.bench && composition.bench.length > 0) {
      const benchPromises = composition.bench.map(async (unit) => {
        const champion = await this.findChampionByIdString(unit.championId);
        return {
          ...unit,
          championDetails: champion || undefined,
        };
      });
      composition.bench = await Promise.all(benchPromises);
    }

    // Populate champions cho carryItems
    if (composition.carryItems && composition.carryItems.length > 0) {
      const carryItemPromises = composition.carryItems.map(async (carryItem) => {
        const champion = await this.findChampionByIdString(carryItem.championId);
        return {
          ...carryItem,
          championDetails: champion || undefined,
        };
      });
      composition.carryItems = await Promise.all(carryItemPromises);
    }

    return composition;
  }
}

