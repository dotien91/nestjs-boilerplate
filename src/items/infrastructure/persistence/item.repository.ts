import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Item } from '../../domain/item';
import {
  FilterItemDto,
  SortItemDto,
} from '../../dto/query-item.dto';

export abstract class ItemRepository {
  abstract create(
    data: Omit<Item, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>,
  ): Promise<Item>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterItemDto | null;
    sortOptions?: SortItemDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Item[]>;

  abstract findById(id: Item['id']): Promise<NullableType<Item>>;

  abstract findByApiName(apiName: Item['apiName']): Promise<NullableType<Item>>;

  abstract update(
    id: Item['id'],
    payload: DeepPartial<Item>,
  ): Promise<Item | null>;

  abstract updateByApiName(
    apiName: Item['apiName'],
    payload: DeepPartial<Item>,
  ): Promise<Item | null>;

  abstract remove(id: Item['id']): Promise<void>;

  abstract bulkCreate(items: Omit<Item, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>[]): Promise<Item[]>;

  abstract findItemsWithoutIcon(): Promise<Item[]>;

  abstract bulkUpdateItemsWithoutIcon(): Promise<number>;

  abstract findAll(): Promise<Item[]>;
}

