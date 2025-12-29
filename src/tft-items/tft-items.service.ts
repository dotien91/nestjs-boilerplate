import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateTftItemDto } from './dto/create-tft-item.dto';
import { UpdateTftItemDto } from './dto/update-tft-item.dto';
import { NullableType } from '../utils/types/nullable.type';
import {
  FilterTftItemDto,
  SortTftItemDto,
} from './dto/query-tft-item.dto';
import { TftItemRepository } from './infrastructure/persistence/tft-item.repository';
import { TftItem } from './domain/tft-item';
import { IPaginationOptions } from '../utils/types/pagination-options';

@Injectable()
export class TftItemsService {
  constructor(
    private readonly tftItemsRepository: TftItemRepository,
  ) {}

  async create(createTftItemDto: CreateTftItemDto): Promise<TftItem> {
    // Kiểm tra apiName đã tồn tại chưa
    const itemObject = await this.tftItemsRepository.findByApiName(
      createTftItemDto.apiName,
    );
    if (itemObject) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          apiName: 'tftItemApiNameAlreadyExists',
        },
      });
    }

    const item = new TftItem();
    item.apiName = createTftItemDto.apiName;
    item.name = createTftItemDto.name;
    item.enName = createTftItemDto.enName;
    item.desc = createTftItemDto.desc;
    item.icon = createTftItemDto.icon;
    item.associatedTraits = createTftItemDto.associatedTraits || [];
    item.incompatibleTraits = createTftItemDto.incompatibleTraits || [];
    item.composition = createTftItemDto.composition || [];
    item.effects = createTftItemDto.effects || {};
    item.tags = createTftItemDto.tags || [];
    item.unique = createTftItemDto.unique ?? false;
    item.from = createTftItemDto.from;
    item.itemId = createTftItemDto.itemId;
    item.disabled = createTftItemDto.disabled ?? false;
    item.type = createTftItemDto.type;
    item.texture = createTftItemDto.texture;
    item.tier = createTftItemDto.tier;
    item.createdAt = new Date();
    item.updatedAt = new Date();

    const createdItem = await this.tftItemsRepository.create(item);

    return createdItem;
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTftItemDto | null;
    sortOptions?: SortTftItemDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<TftItem[]> {
    return this.tftItemsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(id: TftItem['id']): Promise<NullableType<TftItem>> {
    return this.tftItemsRepository.findById(id);
  }

  async findByIds(ids: TftItem['id'][]): Promise<TftItem[]> {
    return this.tftItemsRepository.findByIds(ids);
  }

  async findByApiName(apiName: string): Promise<NullableType<TftItem>> {
    return this.tftItemsRepository.findByApiName(apiName);
  }

  async update(
    id: TftItem['id'],
    updateTftItemDto: UpdateTftItemDto,
  ): Promise<TftItem | null> {
    // Kiểm tra apiName đã tồn tại chưa (nếu có thay đổi)
    if (updateTftItemDto.apiName) {
      const itemObject = await this.tftItemsRepository.findByApiName(
        updateTftItemDto.apiName,
      );
      if (itemObject && String(itemObject.id) !== String(id)) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            apiName: 'tftItemApiNameAlreadyExists',
          },
        });
      }
    }

    return this.tftItemsRepository.update(id, updateTftItemDto);
  }

  async remove(id: TftItem['id']): Promise<void> {
    await this.tftItemsRepository.remove(id);
  }
}

