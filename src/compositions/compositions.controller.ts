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
import { CompositionsService } from './compositions.service';
import { CreateCompositionDto } from './dto/create-composition.dto';
import { UpdateCompositionDto } from './dto/update-composition.dto';
import { Composition } from './domain/composition';
import {
  QueryCompositionDto,
  FilterCompositionDto,
} from './dto/query-composition.dto';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';

@ApiTags('Compositions')
@Controller({
  path: 'compositions',
  version: '1',
})
export class CompositionsController {
  constructor(
    private readonly compositionsService: CompositionsService,
  ) {}

  @ApiOperation({ summary: 'Tạo composition mới' })
  @ApiCreatedResponse({
    type: Composition,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createCompositionDto: CreateCompositionDto,
  ): Promise<Composition> {
    return this.compositionsService.create(createCompositionDto);
  }

  @ApiOperation({ summary: 'Lấy danh sách compositions với phân trang' })
  @ApiOkResponse({
    type: InfinityPaginationResponse(Composition),
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryCompositionDto,
    @Req() request: any,
  ): Promise<InfinityPaginationResponseDto<Composition>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    // Parse nested query parameters filters[name], filters[difficulty], etc.
    let filters: FilterCompositionDto | undefined = query?.filters ?? undefined;

    if (!filters) {
      const queryParams = request.query;

      // Check for nested format: filters[name], filters[difficulty], etc.
      if (
        queryParams['filters[name]'] ||
        queryParams['filters[compId]'] ||
        queryParams['filters[difficulty]'] ||
        queryParams['filters[isLateGame]']
      ) {
        filters = {};
        if (queryParams['filters[name]']) {
          filters.name = queryParams['filters[name]'];
        }
        if (queryParams['filters[compId]']) {
          filters.compId = queryParams['filters[compId]'];
        }
        if (queryParams['filters[difficulty]']) {
          filters.difficulty = queryParams['filters[difficulty]'];
        }
        if (queryParams['filters[isLateGame]']) {
          filters.isLateGame =
            queryParams['filters[isLateGame]'] === 'true' ||
            queryParams['filters[isLateGame]'] === true;
        }
      }
      // Check for flat format: name, compId, difficulty, isLateGame
      else if (
        queryParams['name'] ||
        queryParams['compId'] ||
        queryParams['difficulty'] ||
        queryParams['isLateGame']
      ) {
        filters = {};
        if (queryParams['name']) {
          filters.name = queryParams['name'];
        }
        if (queryParams['compId']) {
          filters.compId = queryParams['compId'];
        }
        if (queryParams['difficulty']) {
          filters.difficulty = queryParams['difficulty'];
        }
        if (queryParams['isLateGame']) {
          filters.isLateGame =
            queryParams['isLateGame'] === 'true' ||
            queryParams['isLateGame'] === true;
        }
      }
      // Check if filters is sent as JSON string or object
      else if (queryParams['filters']) {
        try {
          const filtersStr = queryParams['filters'];
          if (typeof filtersStr === 'string') {
            filters = JSON.parse(filtersStr) as FilterCompositionDto;
          } else if (typeof filtersStr === 'object') {
            filters = filtersStr as FilterCompositionDto;
          }
        } catch (e) {
          console.error('Error parsing filters:', e);
        }
      }
    }

    return infinityPagination(
      await this.compositionsService.findManyWithPagination({
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
    summary: 'Lấy composition theo ID',
  })
  @ApiOkResponse({
    type: Composition,
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(@Param('id') id: Composition['id']) {
    return this.compositionsService.findById(id);
  }

  @ApiOperation({
    summary: 'Lấy composition theo compId',
  })
  @ApiOkResponse({
    type: Composition,
  })
  @Get('compId/:compId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'compId',
    type: String,
    required: true,
    example: 'comp-daicogiap-yone',
  })
  findByCompId(@Param('compId') compId: string) {
    return this.compositionsService.findByCompId(compId);
  }

  @ApiOperation({ summary: 'Cập nhật composition' })
  @ApiOkResponse({
    type: Composition,
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Param('id') id: Composition['id'],
    @Body() updateCompositionDto: UpdateCompositionDto,
  ): Promise<Composition | null> {
    return this.compositionsService.update(id, updateCompositionDto);
  }

  @ApiOperation({ summary: 'Xóa composition' })
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: Composition['id']): Promise<void> {
    return this.compositionsService.remove(id);
  }
}

