import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  Req,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { OriginsService } from './origins.service';
import { CreateOriginDto } from './dto/create-origin.dto';
import { UpdateOriginDto } from './dto/update-origin.dto';
import { Origin, OriginType } from './domain/origin';
import { QueryOriginDto, FilterOriginDto } from './dto/query-origin.dto';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';

@ApiTags('Origins')
@Controller({
  path: 'origins',
  version: '1',
})
export class OriginsController {
  constructor(private readonly originsService: OriginsService) {}

  @ApiOperation({ summary: 'Tạo origin mới (tộc/hệ)' })
  @ApiCreatedResponse({
    type: Origin,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createOriginDto: CreateOriginDto): Promise<Origin> {
    return this.originsService.create(createOriginDto);
  }

  @ApiOperation({ summary: 'Lấy danh sách origins với phân trang' })
  @ApiOkResponse({
    type: InfinityPaginationResponse(Origin),
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryOriginDto,
    @Req() request: any,
  ): Promise<InfinityPaginationResponseDto<Origin>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }
    // Debug: Log raw query để kiểm tra
    console.log('🔍 Raw query params:', JSON.stringify(request.query, null, 2));
    console.log('🔍 Parsed query:', JSON.stringify(query, null, 2));

    // Parse nested query parameters filters[type], filters[set], etc.
    let filters: FilterOriginDto | undefined = query?.filters ?? undefined;

    if (!filters) {
      const queryParams = request.query;

      // Check for nested format: filters[type], filters[set], etc.
      if (
        queryParams['filters[type]'] ||
        queryParams['filters[name]'] ||
        queryParams['filters[key]'] ||
        queryParams['filters[set]']
      ) {
        filters = {};
        if (queryParams['filters[type]']) {
          filters.type = queryParams['filters[type]'] as OriginType;
        }
        if (queryParams['filters[name]']) {
          filters.name = queryParams['filters[name]'];
        }
        if (queryParams['filters[key]']) {
          filters.key = queryParams['filters[key]'];
        }
        if (queryParams['filters[set]']) {
          filters.set = queryParams['filters[set]'];
        }
      }
      // Check for flat format: type, set, name, key (Swagger sends these as top-level params)
      else if (
        queryParams['type'] ||
        queryParams['name'] ||
        queryParams['key'] ||
        queryParams['set']
      ) {
        filters = {};
        if (queryParams['type']) {
          filters.type = queryParams['type'] as OriginType;
        }
        if (queryParams['name']) {
          filters.name = queryParams['name'];
        }
        if (queryParams['key']) {
          filters.key = queryParams['key'];
        }
        if (queryParams['set']) {
          filters.set = queryParams['set'];
        }
      }
      // Check if filters is sent as JSON string or object
      else if (queryParams['filters']) {
        try {
          const filtersStr = queryParams['filters'];
          if (typeof filtersStr === 'string') {
            filters = JSON.parse(filtersStr) as FilterOriginDto;
          } else if (typeof filtersStr === 'object') {
            filters = filtersStr as FilterOriginDto;
          }
        } catch (e) {
          console.error('Error parsing filters:', e);
        }
      }
    }

    // Debug: Log filters để kiểm tra
    console.log('🔍 Filters received:', JSON.stringify(filters, null, 2));

    return infinityPagination(
      await this.originsService.findManyWithPagination({
        filterOptions: filters,
        sortOptions: query?.sort,
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @ApiOperation({
    summary: 'Lấy origin theo ID',
  })
  @ApiOkResponse({
    type: Origin,
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(@Param('id') id: Origin['id']) {
    return this.originsService.findById(id);
  }

  @ApiOperation({
    summary: 'Lấy origin theo key',
  })
  @ApiOkResponse({
    type: Origin,
  })
  @Get('key/:key')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'key',
    type: String,
    required: true,
    example: 'guardian',
  })
  findByKey(@Param('key') key: Origin['key']) {
    return this.originsService.findByKey(key);
  }

  @ApiOperation({
    summary: 'Lấy origin với thông tin champions (champions module removed)',
  })
  @ApiOkResponse({
    description: 'Origin (champions field chỉ là array of IDs)',
  })
  @Get(':id/champions')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  async getOriginWithChampions(@Param('id') id: Origin['id']) {
    return this.originsService.getOriginWithChampions(id);
  }

  @ApiOperation({ summary: 'Cập nhật origin' })
  @ApiOkResponse({
    type: Origin,
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Param('id') id: Origin['id'],
    @Body() updateOriginDto: UpdateOriginDto,
  ): Promise<Origin | null> {
    return this.originsService.update(id, updateOriginDto);
  }

  @ApiOperation({ summary: 'Xóa origin' })
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: Origin['id']): Promise<void> {
    return this.originsService.remove(id);
  }
}
