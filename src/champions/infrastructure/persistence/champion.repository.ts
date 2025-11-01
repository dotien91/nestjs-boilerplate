import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Champion } from '../../domain/champion';
import {
  FilterChampionDto,
  SortChampionDto,
} from '../../dto/query-champion.dto';

export abstract class ChampionRepository {
  abstract create(
    data: Omit<Champion, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>,
  ): Promise<Champion>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterChampionDto | null;
    sortOptions?: SortChampionDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Champion[]>;

  abstract findById(id: Champion['id']): Promise<NullableType<Champion>>;

  abstract findByKey(key: Champion['key']): Promise<NullableType<Champion>>;

  abstract findByCost(cost: Champion['cost']): Promise<Champion[]>;

  abstract update(
    id: Champion['id'],
    payload: DeepPartial<Champion>,
  ): Promise<Champion | null>;

  abstract remove(id: Champion['id']): Promise<void>;
}
