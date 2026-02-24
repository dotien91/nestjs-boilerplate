import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { TftAugment } from '../../domain/tft-augment';
import {
  FilterTftAugmentDto,
  SortTftAugmentDto,
} from '../../dto/query-tft-augment.dto';

export abstract class TftAugmentRepository {
  abstract create(data: TftAugment): Promise<TftAugment>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTftAugmentDto | null;
    sortOptions?: SortTftAugmentDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<{ data: TftAugment[]; totalCount: number }>;

  abstract findById(id: TftAugment['id']): Promise<NullableType<TftAugment>>;

  abstract findByApiName(apiName: string): Promise<NullableType<TftAugment>>;

  abstract update(
    id: TftAugment['id'],
    payload: Partial<TftAugment>,
  ): Promise<TftAugment | null>;

  abstract remove(id: TftAugment['id']): Promise<void>;
}

