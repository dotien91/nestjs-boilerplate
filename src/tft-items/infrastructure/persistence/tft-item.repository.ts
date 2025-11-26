import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { TftItem } from '../../domain/tft-item';
import { FilterTftItemDto, SortTftItemDto } from '../../dto/query-tft-item.dto';

export abstract class TftItemRepository {
  abstract create(data: TftItem): Promise<TftItem>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTftItemDto | null;
    sortOptions?: SortTftItemDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<TftItem[]>;

  abstract findById(id: TftItem['id']): Promise<NullableType<TftItem>>;

  abstract findByApiName(apiName: string): Promise<NullableType<TftItem>>;

  abstract update(
    id: TftItem['id'],
    payload: Partial<TftItem>,
  ): Promise<TftItem | null>;

  abstract remove(id: TftItem['id']): Promise<void>;
}

