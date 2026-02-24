import { IPaginationOptions } from './types/pagination-options';
import { InfinityPaginationResponseDto } from './dto/infinity-pagination-response.dto';

export const infinityPagination = <T>(
  data: T[],
  options: IPaginationOptions,
  totalCount?: number,
): InfinityPaginationResponseDto<T> => {
  const total = totalCount ?? 0;
  const hasNext = totalCount !== undefined
    ? options.page * options.limit < totalCount
    : data.length === options.limit;
  return {
    data,
    hasNextPage: hasNext,
    total_count: total,
  };
};
