import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Composition } from '../../domain/composition';
import { FilterCompositionDto, SortCompositionDto } from '../../dto/query-composition.dto';

export abstract class CompositionRepository {
  abstract create(
    data: Omit<Composition, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>,
  ): Promise<Composition>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterCompositionDto | null;
    sortOptions?: SortCompositionDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Composition[]>;

  abstract findById(id: Composition['id']): Promise<NullableType<Composition>>;

  abstract findByCompId(compId: string): Promise<NullableType<Composition>>;

  abstract update(
    id: Composition['id'],
    payload: DeepPartial<Composition>,
  ): Promise<Composition | null>;

  abstract remove(id: Composition['id']): Promise<void>;

  abstract removeByNameNotIn(names: string[]): Promise<number>;

  abstract findOne(name: string): Promise<NullableType<Composition>>;

  abstract findCompositionsByUnits(
    unitIdentifiers: string[],
    searchInAllArrays?: boolean,
  ): Promise<Composition[]>;
}

