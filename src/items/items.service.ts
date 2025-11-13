import { Injectable } from '@nestjs/common';
import { ItemRepository } from './infrastructure/persistence/item.repository';
import { Item } from './domain/item';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { FilterItemDto, SortItemDto } from './dto/query-item.dto';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { infinityPagination } from '../utils/infinity-pagination';

@Injectable()
export class ItemsService {
  constructor(private readonly itemRepository: ItemRepository) {}

  async create(createItemDto: CreateItemDto): Promise<Item> {
    return this.itemRepository.create(createItemDto);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterItemDto | null;
    sortOptions?: SortItemDto[] | null;
    paginationOptions: IPaginationOptions;
  }) {
    const items = await this.itemRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });

    return infinityPagination(items, paginationOptions);
  }

  async findById(id: Item['id']): Promise<Item | null> {
    return this.itemRepository.findById(id);
  }

  async findByApiName(apiName: string): Promise<Item | null> {
    return this.itemRepository.findByApiName(apiName);
  }

  async findBySet(set: string): Promise<Item[]> {
    return this.itemRepository.findBySet(set);
  }

  async findByAssociatedTraits(traits: string[]): Promise<Item[]> {
    return this.itemRepository.findByAssociatedTraits(traits);
  }

  async update(id: Item['id'], updateItemDto: UpdateItemDto): Promise<Item | null> {
    return this.itemRepository.update(id, updateItemDto);
  }

  async remove(id: Item['id']): Promise<void> {
    return this.itemRepository.remove(id);
  }

  // Utility methods
  async findBasicItems(): Promise<Item[]> {
    return this.itemRepository.findManyWithPagination({
      filterOptions: { composition: [] },
      sortOptions: null,
      paginationOptions: { page: 1, limit: 1000 },
    });
  }

  async findCompletedItems(): Promise<Item[]> {
    return this.itemRepository.findManyWithPagination({
      filterOptions: {
        composition: { $exists: true, $ne: [] }
      },
      sortOptions: null,
      paginationOptions: { page: 1, limit: 1000 },
    });
  }

  async findUniqueItems(): Promise<Item[]> {
    return this.itemRepository.findManyWithPagination({
      filterOptions: { unique: true },
      sortOptions: null,
      paginationOptions: { page: 1, limit: 1000 },
    });
  }
}
