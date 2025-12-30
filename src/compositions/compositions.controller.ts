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
import { SearchByUnitsDto } from './dto/search-by-units.dto';
import { ParseMobalyticsHtmlDto } from './dto/parse-mobalytics-html.dto';
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
    console.log('[CompositionsController] POST /compositions - Request body:', JSON.stringify({
      name: createCompositionDto.name,
      unitsCount: createCompositionDto.units?.length || 0,
      earlyGameCount: createCompositionDto.earlyGame?.length || 0,
      midGameCount: createCompositionDto.midGame?.length || 0,
      benchCount: createCompositionDto.bench?.length || 0,
      units: createCompositionDto.units?.map(u => ({ championId: u.championId, name: u.name })),
    }, null, 2));
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
        queryParams['filters[tier]'] ||
        queryParams['filters[isLateGame]'] ||
        queryParams['filters[units]'] ||
        queryParams['filters[searchInAllArrays]']
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
        if (queryParams['filters[tier]']) {
          filters.tier = queryParams['filters[tier]'];
        }
        if (queryParams['filters[isLateGame]']) {
          filters.isLateGame =
            queryParams['filters[isLateGame]'] === 'true' ||
            queryParams['filters[isLateGame]'] === true;
        }
        if (queryParams['filters[units]']) {
          // Handle array: can be comma-separated string or array
          const unitsParam = queryParams['filters[units]'];
          if (Array.isArray(unitsParam)) {
            filters.units = unitsParam;
          } else if (typeof unitsParam === 'string') {
            filters.units = unitsParam.split(',').map(u => u.trim()).filter(u => u);
          }
        }
        if (queryParams['filters[searchInAllArrays]']) {
          filters.searchInAllArrays =
            queryParams['filters[searchInAllArrays]'] === 'true' ||
            queryParams['filters[searchInAllArrays]'] === true;
        }
      }
      // Check for flat format: name, compId, difficulty, tier, isLateGame, units
      else if (
        queryParams['name'] ||
        queryParams['compId'] ||
        queryParams['difficulty'] ||
        queryParams['tier'] ||
        queryParams['isLateGame'] ||
        queryParams['units'] ||
        queryParams['searchInAllArrays']
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
        if (queryParams['tier']) {
          filters.tier = queryParams['tier'];
        }
        if (queryParams['isLateGame']) {
          filters.isLateGame =
            queryParams['isLateGame'] === 'true' ||
            queryParams['isLateGame'] === true;
        }
        if (queryParams['units']) {
          // Handle array: can be comma-separated string or array
          const unitsParam = queryParams['units'];
          if (Array.isArray(unitsParam)) {
            filters.units = unitsParam;
          } else if (typeof unitsParam === 'string') {
            filters.units = unitsParam.split(',').map(u => u.trim()).filter(u => u);
          }
        }
        if (queryParams['searchInAllArrays']) {
          filters.searchInAllArrays =
            queryParams['searchInAllArrays'] === 'true' ||
            queryParams['searchInAllArrays'] === true;
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

  @ApiOperation({
    summary: 'Tìm compositions chứa các units được chỉ định',
    description: 'Tìm tất cả compositions có chứa TẤT CẢ các units trong danh sách. Units có thể là championId hoặc championKey.',
  })
  @ApiOkResponse({
    type: [Composition],
    description: 'Danh sách compositions chứa các units',
  })
  @Post('search-by-units')
  @HttpCode(HttpStatus.OK)
  async searchByUnits(
    @Body() searchByUnitsDto: SearchByUnitsDto,
  ): Promise<Composition[]> {
    return this.compositionsService.findCompositionsByUnits(
      searchByUnitsDto.units,
      searchByUnitsDto.searchInAllArrays ?? true,
    );
  }

  @ApiOperation({
    summary: 'Parse HTML từ Mobalytics thành composition',
    description: 'Nhận HTML string từ trang Mobalytics và parse thành composition object. Trả về CreateCompositionDto có thể dùng để tạo composition.',
  })
  @ApiOkResponse({
    type: CreateCompositionDto,
    description: 'Composition object được parse từ HTML',
  })
  @Post('parse-mobalytics-html')
  @HttpCode(HttpStatus.OK)
  parseMobalyticsHTML(
    @Body() parseMobalyticsHtmlDto: ParseMobalyticsHtmlDto,
  ): CreateCompositionDto {
    return this.compositionsService.parseMobalyticsHTML(
      parseMobalyticsHtmlDto.html,
    );
  }
}

