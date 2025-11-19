import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Origin } from '../../domain/origin';
import { FilterOriginDto, SortOriginDto } from '../../dto/query-origin.dto';

export abstract class OriginRepository {
  abstract create(
    data: Omit<Origin, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>,
  ): Promise<Origin>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterOriginDto | null;
    sortOptions?: SortOriginDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Origin[]>;

  abstract findById(id: Origin['id']): Promise<NullableType<Origin>>;

  abstract findByApiName(apiName: string): Promise<NullableType<Origin>>;

  abstract findByKey(key: string): Promise<NullableType<Origin>>;

  abstract update(
    id: Origin['id'],
    payload: DeepPartial<Origin>,
  ): Promise<Origin | null>;

  abstract remove(id: Origin['id']): Promise<void>;
}
