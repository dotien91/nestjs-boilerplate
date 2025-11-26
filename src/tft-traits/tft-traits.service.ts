import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateTftTraitDto } from './dto/create-tft-trait.dto';
import { UpdateTftTraitDto } from './dto/update-tft-trait.dto';
import { NullableType } from '../utils/types/nullable.type';
import {
  FilterTftTraitDto,
  SortTftTraitDto,
} from './dto/query-tft-trait.dto';
import { TftTraitRepository } from './infrastructure/persistence/tft-trait.repository';
import { TftTrait } from './domain/tft-trait';
import { IPaginationOptions } from '../utils/types/pagination-options';

@Injectable()
export class TftTraitsService {
  constructor(
    private readonly tftTraitsRepository: TftTraitRepository,
  ) {}

  async create(createTftTraitDto: CreateTftTraitDto): Promise<TftTrait> {
    // Kiểm tra apiName đã tồn tại chưa
    const traitObject = await this.tftTraitsRepository.findByApiName(
      createTftTraitDto.apiName,
    );
    if (traitObject) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          apiName: 'tftTraitApiNameAlreadyExists',
        },
      });
    }

    const trait = new TftTrait();
    trait.apiName = createTftTraitDto.apiName;
    trait.name = createTftTraitDto.name;
    trait.enName = createTftTraitDto.enName;
    trait.desc = createTftTraitDto.desc;
    trait.icon = createTftTraitDto.icon;
    trait.effects = createTftTraitDto.effects || [];
    trait.units = createTftTraitDto.units || [];
    trait.unitProperties = createTftTraitDto.unitProperties || {};
    trait.createdAt = new Date();
    trait.updatedAt = new Date();

    const createdTrait = await this.tftTraitsRepository.create(trait);

    return createdTrait;
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTftTraitDto | null;
    sortOptions?: SortTftTraitDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<TftTrait[]> {
    return this.tftTraitsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(id: TftTrait['id']): Promise<NullableType<TftTrait>> {
    return this.tftTraitsRepository.findById(id);
  }

  async findByApiName(apiName: string): Promise<NullableType<TftTrait>> {
    return this.tftTraitsRepository.findByApiName(apiName);
  }

  async update(
    id: TftTrait['id'],
    updateTftTraitDto: UpdateTftTraitDto,
  ): Promise<TftTrait | null> {
    // Kiểm tra apiName đã tồn tại chưa (nếu có thay đổi)
    if (updateTftTraitDto.apiName) {
      const traitObject = await this.tftTraitsRepository.findByApiName(
        updateTftTraitDto.apiName,
      );
      if (traitObject && String(traitObject.id) !== String(id)) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            apiName: 'tftTraitApiNameAlreadyExists',
          },
        });
      }
    }

    return this.tftTraitsRepository.update(id, updateTftTraitDto);
  }

  async remove(id: TftTrait['id']): Promise<void> {
    await this.tftTraitsRepository.remove(id);
  }
}

