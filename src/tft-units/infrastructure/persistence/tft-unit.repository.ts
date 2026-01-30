import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { TftUnit } from '../../domain/tft-unit';
import {
  FilterTftUnitDto,
  SortTftUnitDto,
} from '../../dto/query-tft-unit.dto';

export abstract class TftUnitRepository {
  abstract create(data: TftUnit): Promise<TftUnit>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
    minimal,
  }: {
    filterOptions?: FilterTftUnitDto | null;
    sortOptions?: SortTftUnitDto[] | null;
    paginationOptions: IPaginationOptions;
    minimal?: boolean;
  }): Promise<TftUnit[]>;

  abstract findAll(options?: { minimal?: boolean }): Promise<TftUnit[]>;

  abstract findById(id: TftUnit['id']): Promise<NullableType<TftUnit>>;

  abstract findByApiName(apiName: string): Promise<NullableType<TftUnit>>;

  abstract update(
    id: TftUnit['id'],
    payload: Partial<TftUnit>,
  ): Promise<TftUnit | null>;

  abstract remove(id: TftUnit['id']): Promise<void>;
}

