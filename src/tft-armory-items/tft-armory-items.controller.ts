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
import { TftArmoryItemsService } from './tft-armory-items.service';
import { CreateTftArmoryItemDto } from './dto/create-tft-armory-item.dto';
import { UpdateTftArmoryItemDto } from './dto/update-tft-armory-item.dto';
import { TftArmoryItem } from './domain/tft-armory-item';
import { QueryTftArmoryItemDto, FilterTftArmoryItemDto, SortTftArmoryItemDto } from './dto/query-tft-armory-item.dto';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { NullableType } from '../utils/types/nullable.type';

@ApiTags('TFT Armory Items')
@Controller({
  path: 'tft-armory-items',
  version: '1',
})
export class TftArmoryItemsController {
  constructor(
    private readonly tftArmoryItemsService: TftArmoryItemsService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Tạo TFT armory item mới' })
  @ApiCreatedResponse({
    type: TftArmoryItem,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createTftArmoryItemDto: CreateTftArmoryItemDto,
  ): Promise<TftArmoryItem> {
    return this.tftArmoryItemsService.create(createTftArmoryItemDto);
  }

  @ApiOperation({ summary: 'Lấy danh sách TFT armory items với phân trang' })
  @ApiOkResponse({
    type: InfinityPaginationResponse(TftArmoryItem),
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryTftArmoryItemDto,
  ): Promise<InfinityPaginationResponseDto<TftArmoryItem>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    // Build filters từ flat properties - chỉ giữ field có giá trị
    let filters: FilterTftArmoryItemDto | undefined = undefined;
    const filterObj: Partial<FilterTftArmoryItemDto> = {};
    
    if (query?.name) filterObj.name = query.name;
    if (query?.apiName) filterObj.apiName = query.apiName;
    
    if (Object.keys(filterObj).length > 0) {
      filters = filterObj as FilterTftArmoryItemDto;
    }

    // Build sort từ flat properties
    let sort: SortTftArmoryItemDto[] | undefined = undefined;
    if (query?.orderBy && query?.order) {
      sort = [
        {
          orderBy: query.orderBy,
          order: query.order,
        },
      ];
    }

    return infinityPagination(
      await this.tftArmoryItemsService.findManyWithPagination({
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

  @ApiOperation({ summary: 'Lấy TFT armory item theo ID' })
  @ApiOkResponse({
    type: TftArmoryItem,
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(
    @Param('id') id: TftArmoryItem['id'],
  ): Promise<NullableType<TftArmoryItem>> {
    return this.tftArmoryItemsService.findById(id);
  }

  @ApiOperation({ summary: 'Lấy TFT armory item theo API name' })
  @ApiOkResponse({
    type: TftArmoryItem,
  })
  @Get('api-name/:apiName')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'apiName',
    type: String,
    required: true,
    example: 'TFT_Assist_Gold_30',
  })
  findByApiName(
    @Param('apiName') apiName: string,
  ): Promise<NullableType<TftArmoryItem>> {
    return this.tftArmoryItemsService.findByApiName(apiName);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Cập nhật TFT armory item' })
  @ApiOkResponse({
    type: TftArmoryItem,
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Param('id') id: TftArmoryItem['id'],
    @Body() updateTftArmoryItemDto: UpdateTftArmoryItemDto,
  ): Promise<TftArmoryItem | null> {
    return this.tftArmoryItemsService.update(id, updateTftArmoryItemDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Xóa TFT armory item' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: TftArmoryItem['id']): Promise<void> {
    return this.tftArmoryItemsService.remove(id);
  }
}

