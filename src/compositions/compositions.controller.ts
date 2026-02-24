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
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CompositionsService } from './compositions.service';
import { CreateCompositionDto } from './dto/create-composition.dto';
import { UpdateCompositionDto } from './dto/update-composition.dto';
import { Composition } from './domain/composition';
import {
  QueryCompositionDto,
  FilterCompositionDto,
} from './dto/query-composition.dto';
import { SearchByUnitsDto, SearchCompositionDtoV2 } from './dto/search-by-units.dto';
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
  constructor(private readonly compositionsService: CompositionsService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
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

  @ApiBearerAuth()
  @ApiOperation({
    summary: '[V2] Tìm kiếm nâng cao (Units, Items, Augments)',
    description: 'API V2: Tìm đội hình thỏa mãn chứa Units, Items HOẶC Augments. Logic AND (phải chứa tất cả).',
  })
  @ApiOkResponse({
    type: [Composition],
    description: 'Danh sách compositions thỏa mãn',
  })
  @Post('search-v2') // <--- Endpoint mới
  @HttpCode(HttpStatus.OK)
  async searchV2(
    @Body() searchDto: SearchCompositionDtoV2, // Dùng DTO V2 (Tất cả optional)
  ): Promise<Composition[]> {
    return this.compositionsService.searchCompositions({
      units: searchDto.units,
      items: searchDto.items,
      augments: searchDto.augments,
      searchInAllArrays: searchDto.searchInAllArrays,
    });
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

    // Tự động parse filters từ query params (thay thế khối if-else dài dòng cũ)
    const filters = this.parseFilters(query, request.query);

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

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
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
  async parseMobalyticsHTML(
    @Body() parseMobalyticsHtmlDto: ParseMobalyticsHtmlDto,
  ): Promise<CreateCompositionDto> {
    return this.compositionsService.parseMobalyticsHTML(
      parseMobalyticsHtmlDto.html,
    );
  }

  // --- PRIVATE HELPER METHODS ---

  /**
   * Helper function để parse filters từ query params
   * Hỗ trợ:
   * 1. DTO object (nếu framework đã parse)
   * 2. JSON string ?filters={"name":"X"}
   * 3. Nested param ?filters[name]=X
   * 4. Flat param ?name=X
   */
  private parseFilters(
    dtoQuery: QueryCompositionDto,
    rawQuery: any,
  ): FilterCompositionDto | undefined {
    // 1. Ưu tiên DTO đã parse sẵn
    if (dtoQuery?.filters) return dtoQuery.filters;

    // 2. Check JSON string
    if (rawQuery['filters']) {
      if (typeof rawQuery['filters'] === 'string') {
        try {
          return JSON.parse(rawQuery['filters']);
        } catch {
          // Ignore parse error
        }
      } else if (typeof rawQuery['filters'] === 'object') {
        return rawQuery['filters'];
      }
    }

    // 3. Manual Mapping cho các trường hợp nested và flat
    const allowedKeys: (keyof FilterCompositionDto)[] = [
      'name',
      'compId',
      'difficulty',
      'tier',
      'isLateGame',
      'isOp',
      'active',
      'units',
      'searchInAllArrays',
    ];

    const filters: FilterCompositionDto = {};
    let hasFilter = false;

    for (const key of allowedKeys) {
      // Check format: filters[key] HOẶC format: key (flat)
      const value = rawQuery[`filters[${key}]`] ?? rawQuery[key];

      if (value !== undefined) {
        if (key === 'isLateGame' || key === 'searchInAllArrays' || key === 'isOp' || key === 'active') {
          // Chỉ lọc boolean khi truyền rõ true/false; không truyền hoặc rỗng = trả về hết
          if (value === 'true' || value === true) {
            filters[key] = true;
            hasFilter = true;
          } else if (value === 'false' || value === false) {
            filters[key] = false;
            hasFilter = true;
          }
        } else if (key === 'units') {
          // Xử lý array
          filters[key] = Array.isArray(value)
            ? value
            : typeof value === 'string'
            ? value.split(',').map((u) => u.trim()).filter(Boolean)
            : [];
          hasFilter = true;
        } else {
          // Xử lý string
          filters[key] = value;
          hasFilter = true;
        }
      }
    }

    return hasFilter ? filters : undefined;
  }
}