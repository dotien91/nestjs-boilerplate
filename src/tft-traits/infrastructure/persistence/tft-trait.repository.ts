import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { TftTrait } from '../../domain/tft-trait';
import {
  FilterTftTraitDto,
  SortTftTraitDto,
} from '../../dto/query-tft-trait.dto';

export abstract class TftTraitRepository {
  abstract create(data: TftTrait): Promise<TftTrait>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTftTraitDto | null;
    sortOptions?: SortTftTraitDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<TftTrait[]>;

  abstract findById(id: TftTrait['id']): Promise<NullableType<TftTrait>>;

  abstract findByApiName(apiName: string): Promise<NullableType<TftTrait>>;

  abstract update(
    id: TftTrait['id'],
    payload: Partial<TftTrait>,
  ): Promise<TftTrait | null>;

  abstract remove(id: TftTrait['id']): Promise<void>;
}

