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

  abstract findByApiName(apiName: string): Promise<NullableType<Item>>;

  abstract findBySet(set: string): Promise<Item[]>;

  abstract findByAssociatedTraits(traits: string[]): Promise<Item[]>;

  abstract update(
    id: Item['id'],
    payload: DeepPartial<Item>,
  ): Promise<Item | null>;

  abstract remove(id: Item['id']): Promise<void>;
}
