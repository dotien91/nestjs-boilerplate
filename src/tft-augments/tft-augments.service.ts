import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateTftAugmentDto } from './dto/create-tft-augment.dto';
import { UpdateTftAugmentDto } from './dto/update-tft-augment.dto';
import { NullableType } from '../utils/types/nullable.type';
import {
  FilterTftAugmentDto,
  SortTftAugmentDto,
} from './dto/query-tft-augment.dto';
import { TftAugmentRepository } from './infrastructure/persistence/tft-augment.repository';
import { TftAugment } from './domain/tft-augment';
import { IPaginationOptions } from '../utils/types/pagination-options';

@Injectable()
export class TftAugmentsService {
  constructor(
    private readonly tftAugmentsRepository: TftAugmentRepository,
  ) {}

  async create(createTftAugmentDto: CreateTftAugmentDto): Promise<TftAugment> {
    // Kiểm tra apiName đã tồn tại chưa
    const augmentObject = await this.tftAugmentsRepository.findByApiName(
      createTftAugmentDto.apiName,
    );
    if (augmentObject) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          apiName: 'tftAugmentApiNameAlreadyExists',
        },
      });
    }

    const augment = new TftAugment();
    augment.apiName = createTftAugmentDto.apiName;
    augment.name = createTftAugmentDto.name;
    augment.enName = createTftAugmentDto.enName;
    augment.desc = createTftAugmentDto.desc;
    augment.icon = createTftAugmentDto.icon;
    augment.associatedTraits = createTftAugmentDto.associatedTraits || [];
    augment.incompatibleTraits = createTftAugmentDto.incompatibleTraits || [];
    augment.composition = createTftAugmentDto.composition || [];
    augment.effects = createTftAugmentDto.effects || {};
    augment.tags = createTftAugmentDto.tags || [];
    augment.unique = createTftAugmentDto.unique ?? false;
    augment.from = createTftAugmentDto.from;
    augment.augmentId = createTftAugmentDto.augmentId;
    augment.disabled = createTftAugmentDto.disabled ?? false;
    augment.type = createTftAugmentDto.type;
    augment.texture = createTftAugmentDto.texture;
    augment.createdAt = new Date();
    augment.updatedAt = new Date();

    const createdAugment = await this.tftAugmentsRepository.create(augment);

    return createdAugment;
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTftAugmentDto | null;
    sortOptions?: SortTftAugmentDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<TftAugment[]> {
    return this.tftAugmentsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(id: TftAugment['id']): Promise<NullableType<TftAugment>> {
    return this.tftAugmentsRepository.findById(id);
  }

  async findByApiName(apiName: string): Promise<NullableType<TftAugment>> {
    return this.tftAugmentsRepository.findByApiName(apiName);
  }

  async update(
    id: TftAugment['id'],
    updateTftAugmentDto: UpdateTftAugmentDto,
  ): Promise<TftAugment | null> {
    // Kiểm tra apiName đã tồn tại chưa (nếu có thay đổi)
    if (updateTftAugmentDto.apiName) {
      const augmentObject = await this.tftAugmentsRepository.findByApiName(
        updateTftAugmentDto.apiName,
      );
      if (augmentObject && String(augmentObject.id) !== String(id)) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            apiName: 'tftAugmentApiNameAlreadyExists',
          },
        });
      }
    }

    return this.tftAugmentsRepository.update(id, updateTftAugmentDto);
  }

  async remove(id: TftAugment['id']): Promise<void> {
    await this.tftAugmentsRepository.remove(id);
  }
}

