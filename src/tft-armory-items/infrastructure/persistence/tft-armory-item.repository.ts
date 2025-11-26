import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { TftArmoryItem } from '../../domain/tft-armory-item';
import {
  FilterTftArmoryItemDto,
  SortTftArmoryItemDto,
} from '../../dto/query-tft-armory-item.dto';

export abstract class TftArmoryItemRepository {
  abstract create(data: TftArmoryItem): Promise<TftArmoryItem>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTftArmoryItemDto | null;
    sortOptions?: SortTftArmoryItemDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<TftArmoryItem[]>;

  abstract findById(
    id: TftArmoryItem['id'],
  ): Promise<NullableType<TftArmoryItem>>;

  abstract findByApiName(
    apiName: string,
  ): Promise<NullableType<TftArmoryItem>>;

  abstract update(
    id: TftArmoryItem['id'],
    payload: Partial<TftArmoryItem>,
  ): Promise<TftArmoryItem | null>;

  abstract remove(id: TftArmoryItem['id']): Promise<void>;
}

