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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TftAugmentsService } from './tft-augments.service';
import { CreateTftAugmentDto } from './dto/create-tft-augment.dto';
import { UpdateTftAugmentDto } from './dto/update-tft-augment.dto';
import { TftAugment } from './domain/tft-augment';
import { QueryTftAugmentDto, FilterTftAugmentDto, SortTftAugmentDto } from './dto/query-tft-augment.dto';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { NullableType } from '../utils/types/nullable.type';

@ApiTags('TFT Augments')
@Controller({
  path: 'tft-augments',
  version: '1',
})
export class TftAugmentsController {
  constructor(private readonly tftAugmentsService: TftAugmentsService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Tạo TFT augment mới' })
  @ApiCreatedResponse({
    type: TftAugment,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTftAugmentDto: CreateTftAugmentDto): Promise<TftAugment> {
    return this.tftAugmentsService.create(createTftAugmentDto);
  }

  @ApiOperation({ summary: 'Lấy danh sách TFT augments với phân trang' })
  @ApiOkResponse({
    type: InfinityPaginationResponse(TftAugment),
  })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(0) // Cache đến khi server restart
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryTftAugmentDto,
  ): Promise<InfinityPaginationResponseDto<TftAugment>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    // Build filters từ flat properties - chỉ giữ field có giá trị
    let filters: FilterTftAugmentDto | undefined = undefined;
    const filterObj: Partial<FilterTftAugmentDto> = {};
    
    if (query?.name) filterObj.name = query.name;
    if (query?.apiName) filterObj.apiName = query.apiName;
    if (query?.trait) filterObj.trait = query.trait;
    if (query?.stage) filterObj.stage = query.stage;
    if (query?.unique !== undefined && query?.unique !== null) filterObj.unique = query.unique;
    
    if (Object.keys(filterObj).length > 0) {
      filters = filterObj as FilterTftAugmentDto;
    }

    // Build sort từ flat properties
    let sort: SortTftAugmentDto[] | undefined = undefined;
    if (query?.orderBy && query?.order) {
      sort = [
        {
          orderBy: query.orderBy,
          order: query.order,
        },
      ];
    }

    return infinityPagination(
      await this.tftAugmentsService.findManyWithPagination({
        filterOptions: filters,
        sortOptions: sort,
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @ApiOperation({ summary: 'Lấy TFT augment theo ID' })
  @ApiOkResponse({
    type: TftAugment,
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(@Param('id') id: TftAugment['id']): Promise<NullableType<TftAugment>> {
    return this.tftAugmentsService.findById(id);
  }

  @ApiOperation({ summary: 'Lấy TFT augment theo API name' })
  @ApiOkResponse({
    type: TftAugment,
  })
  @Get('api-name/:apiName')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'apiName',
    type: String,
    required: true,
    example: 'TFT_Augment_ExclusiveCustomization',
  })
  findByApiName(
    @Param('apiName') apiName: string,
  ): Promise<NullableType<TftAugment>> {
    return this.tftAugmentsService.findByApiName(apiName);
  }

  @ApiOperation({ summary: 'Lấy TFT augments theo stage' })
  @ApiOkResponse({
    type: [TftAugment],
  })
  @Get('stage/:stage')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'stage',
    type: String,
    required: true,
    example: '2-1',
  })
  async findByStage(
    @Param('stage') stage: string,
  ): Promise<TftAugment[]> {
    return this.tftAugmentsService.findManyWithPagination({
      filterOptions: { stage },
      sortOptions: null,
      paginationOptions: { page: 1, limit: 100 },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Cập nhật TFT augment' })
  @ApiOkResponse({
    type: TftAugment,
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Param('id') id: TftAugment['id'],
    @Body() updateTftAugmentDto: UpdateTftAugmentDto,
  ): Promise<TftAugment | null> {
    return this.tftAugmentsService.update(id, updateTftAugmentDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Xóa TFT augment' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: TftAugment['id']): Promise<void> {
    return this.tftAugmentsService.remove(id);
  }
}

