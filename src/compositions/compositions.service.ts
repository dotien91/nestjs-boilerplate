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
// Champions module removed

@Injectable()
export class CompositionsService {
  constructor(
    private readonly compositionsRepository: CompositionRepository,
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

    // Champion validation removed

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
    const compositions = await this.compositionsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });

    return compositions;
  }

  async findById(
    id: Composition['id'],
  ): Promise<NullableType<Composition>> {
    const composition = await this.compositionsRepository.findById(id);

    if (!composition) {
      return null;
    }

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

    return composition;
  }

  async remove(id: Composition['id']): Promise<void> {
    await this.compositionsRepository.remove(id);
  }

}

