import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Trait } from '../../domain/trait';
import { FilterTraitDto, SortTraitDto } from '../../dto/query-trait.dto';

export abstract class TraitRepository {
  abstract create(
    data: Omit<Trait, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>,
  ): Promise<Trait>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTraitDto | null;
    sortOptions?: SortTraitDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Trait[]>;

  abstract findById(id: Trait['id']): Promise<NullableType<Trait>>;

  abstract findByKey(key: Trait['key']): Promise<NullableType<Trait>>;

  abstract update(
    id: Trait['id'],
    payload: DeepPartial<Trait>,
  ): Promise<Trait | null>;

  abstract remove(id: Trait['id']): Promise<void>;
}
