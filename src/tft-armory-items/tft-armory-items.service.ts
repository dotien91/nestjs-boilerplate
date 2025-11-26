import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateTftArmoryItemDto } from './dto/create-tft-armory-item.dto';
import { UpdateTftArmoryItemDto } from './dto/update-tft-armory-item.dto';
import { NullableType } from '../utils/types/nullable.type';
import {
  FilterTftArmoryItemDto,
  SortTftArmoryItemDto,
} from './dto/query-tft-armory-item.dto';
import { TftArmoryItemRepository } from './infrastructure/persistence/tft-armory-item.repository';
import { TftArmoryItem } from './domain/tft-armory-item';
import { IPaginationOptions } from '../utils/types/pagination-options';

@Injectable()
export class TftArmoryItemsService {
  constructor(
    private readonly tftArmoryItemsRepository: TftArmoryItemRepository,
  ) {}

  async create(
    createTftArmoryItemDto: CreateTftArmoryItemDto,
  ): Promise<TftArmoryItem> {
    // Kiểm tra apiName đã tồn tại chưa
    const itemObject = await this.tftArmoryItemsRepository.findByApiName(
      createTftArmoryItemDto.apiName,
    );
    if (itemObject) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          apiName: 'tftArmoryItemApiNameAlreadyExists',
        },
      });
    }

    const item = new TftArmoryItem();
    item.apiName = createTftArmoryItemDto.apiName;
    item.name = createTftArmoryItemDto.name;
    item.enName = createTftArmoryItemDto.enName;
    item.desc = createTftArmoryItemDto.desc;
    item.icon = createTftArmoryItemDto.icon;
    item.associatedTraits = createTftArmoryItemDto.associatedTraits || [];
    item.incompatibleTraits = createTftArmoryItemDto.incompatibleTraits || [];
    item.composition = createTftArmoryItemDto.composition || [];
    item.effects = createTftArmoryItemDto.effects || {};
    item.tags = createTftArmoryItemDto.tags || [];
    item.unique = createTftArmoryItemDto.unique ?? false;
    item.from = createTftArmoryItemDto.from;
    item.itemId = createTftArmoryItemDto.itemId;
    item.createdAt = new Date();
    item.updatedAt = new Date();

    const createdItem = await this.tftArmoryItemsRepository.create(item);

    return createdItem;
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTftArmoryItemDto | null;
    sortOptions?: SortTftArmoryItemDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<TftArmoryItem[]> {
    return this.tftArmoryItemsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(
    id: TftArmoryItem['id'],
  ): Promise<NullableType<TftArmoryItem>> {
    return this.tftArmoryItemsRepository.findById(id);
  }

  async findByApiName(
    apiName: string,
  ): Promise<NullableType<TftArmoryItem>> {
    return this.tftArmoryItemsRepository.findByApiName(apiName);
  }

  async update(
    id: TftArmoryItem['id'],
    updateTftArmoryItemDto: UpdateTftArmoryItemDto,
  ): Promise<TftArmoryItem | null> {
    // Kiểm tra apiName đã tồn tại chưa (nếu có thay đổi)
    if (updateTftArmoryItemDto.apiName) {
      const itemObject = await this.tftArmoryItemsRepository.findByApiName(
        updateTftArmoryItemDto.apiName,
      );
      if (itemObject && String(itemObject.id) !== String(id)) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            apiName: 'tftArmoryItemApiNameAlreadyExists',
          },
        });
      }
    }

    return this.tftArmoryItemsRepository.update(id, updateTftArmoryItemDto);
  }

  async remove(id: TftArmoryItem['id']): Promise<void> {
    await this.tftArmoryItemsRepository.remove(id);
  }
}

