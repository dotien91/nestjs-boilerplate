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
import { TftTraitsService } from './tft-traits.service';
import { CreateTftTraitDto } from './dto/create-tft-trait.dto';
import { UpdateTftTraitDto } from './dto/update-tft-trait.dto';
import { TftTrait } from './domain/tft-trait';
import { QueryTftTraitDto, FilterTftTraitDto, SortTftTraitDto } from './dto/query-tft-trait.dto';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { NullableType } from '../utils/types/nullable.type';

@ApiTags('TFT Traits')
@Controller({
  path: 'tft-traits',
  version: '1',
})
export class TftTraitsController {
  constructor(private readonly tftTraitsService: TftTraitsService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Tạo TFT trait mới' })
  @ApiCreatedResponse({
    type: TftTrait,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTftTraitDto: CreateTftTraitDto): Promise<TftTrait> {
    return this.tftTraitsService.create(createTftTraitDto);
  }

  @ApiOperation({ summary: 'Lấy danh sách TFT traits với phân trang' })
  @ApiOkResponse({
    type: InfinityPaginationResponse(TftTrait),
  })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(0) // Cache đến khi server restart
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryTftTraitDto,
  ): Promise<InfinityPaginationResponseDto<TftTrait>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    // Build filters từ flat properties - chỉ giữ field có giá trị
    let filters: FilterTftTraitDto | undefined = undefined;
    const filterObj: Partial<FilterTftTraitDto> = {};
    
    if (query?.name) filterObj.name = query.name;
    if (query?.apiName) filterObj.apiName = query.apiName;
    if (query?.type) filterObj.type = query.type as 'origin' | 'class';
    
    if (Object.keys(filterObj).length > 0) {
      filters = filterObj as FilterTftTraitDto;
    }

    // Build sort từ flat properties
    let sort: SortTftTraitDto[] | undefined = undefined;
    if (query?.orderBy && query?.order) {
      sort = [
        {
          orderBy: query.orderBy,
          order: query.order,
        },
      ];
    }

    return infinityPagination(
      await this.tftTraitsService.findManyWithPagination({
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

  @ApiOperation({ summary: 'Lấy TFT trait theo ID' })
  @ApiOkResponse({
    type: TftTrait,
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(@Param('id') id: TftTrait['id']): Promise<NullableType<TftTrait>> {
    return this.tftTraitsService.findById(id);
  }

  @ApiOperation({ summary: 'Lấy TFT trait theo API name' })
  @ApiOkResponse({
    type: TftTrait,
  })
  @Get('api-name/:apiName')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'apiName',
    type: String,
    required: true,
    example: 'TFT16_Freljord',
  })
  findByApiName(
    @Param('apiName') apiName: string,
  ): Promise<NullableType<TftTrait>> {
    return this.tftTraitsService.findByApiName(apiName);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Cập nhật TFT trait' })
  @ApiOkResponse({
    type: TftTrait,
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Param('id') id: TftTrait['id'],
    @Body() updateTftTraitDto: UpdateTftTraitDto,
  ): Promise<TftTrait | null> {
    return this.tftTraitsService.update(id, updateTftTraitDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Xóa TFT trait' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: TftTrait['id']): Promise<void> {
    return this.tftTraitsService.remove(id);
  }
}

