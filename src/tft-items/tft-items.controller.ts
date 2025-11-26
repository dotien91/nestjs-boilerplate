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
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { TftItemsService } from './tft-items.service';
import { CreateTftItemDto } from './dto/create-tft-item.dto';
import { UpdateTftItemDto } from './dto/update-tft-item.dto';
import { TftItem } from './domain/tft-item';
import { QueryTftItemDto } from './dto/query-tft-item.dto';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { NullableType } from '../utils/types/nullable.type';

@ApiTags('TFT Items')
@Controller({
  path: 'tft-items',
  version: '1',
})
export class TftItemsController {
  constructor(private readonly tftItemsService: TftItemsService) {}

  @ApiOperation({ summary: 'Tạo TFT item mới' })
  @ApiCreatedResponse({
    type: TftItem,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTftItemDto: CreateTftItemDto): Promise<TftItem> {
    return this.tftItemsService.create(createTftItemDto);
  }

  @ApiOperation({ summary: 'Lấy danh sách TFT items với phân trang' })
  @ApiOkResponse({
    type: InfinityPaginationResponse(TftItem),
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryTftItemDto,
  ): Promise<InfinityPaginationResponseDto<TftItem>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.tftItemsService.findManyWithPagination({
        filterOptions: query?.filters,
        sortOptions: query?.sort,
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @ApiOperation({ summary: 'Lấy TFT item theo ID' })
  @ApiOkResponse({
    type: TftItem,
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(@Param('id') id: TftItem['id']): Promise<NullableType<TftItem>> {
    return this.tftItemsService.findById(id);
  }

  @ApiOperation({ summary: 'Lấy TFT item theo API name' })
  @ApiOkResponse({
    type: TftItem,
  })
  @Get('api-name/:apiName')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'apiName',
    type: String,
    required: true,
    example: 'TFT_Item_RabadonsDeathcap',
  })
  findByApiName(
    @Param('apiName') apiName: string,
  ): Promise<NullableType<TftItem>> {
    return this.tftItemsService.findByApiName(apiName);
  }

  @ApiOperation({ summary: 'Cập nhật TFT item' })
  @ApiOkResponse({
    type: TftItem,
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Param('id') id: TftItem['id'],
    @Body() updateTftItemDto: UpdateTftItemDto,
  ): Promise<TftItem | null> {
    return this.tftItemsService.update(id, updateTftItemDto);
  }

  @ApiOperation({ summary: 'Xóa TFT item' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: TftItem['id']): Promise<void> {
    return this.tftItemsService.remove(id);
  }
}

