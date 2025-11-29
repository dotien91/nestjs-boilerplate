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
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './domain/item';
import { QueryItemDto } from './dto/query-item.dto';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { NullableType } from '../utils/types/nullable.type';

@ApiTags('Items')
@Controller({
  path: 'items',
  version: '1',
})
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @ApiOperation({ summary: 'Tạo item mới' })
  @ApiCreatedResponse({
    type: Item,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createItemDto: CreateItemDto): Promise<Item> {
    return this.itemsService.create(createItemDto);
  }

  @ApiOperation({ summary: 'Lấy danh sách items với phân trang' })
  @ApiOkResponse({
    type: InfinityPaginationResponse(Item),
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryItemDto,
  ): Promise<InfinityPaginationResponseDto<Item>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.itemsService.findManyWithPagination({
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

  @ApiOperation({ summary: 'Import items từ JSON file' })
  @ApiOkResponse({
    description: 'Import items từ file Items_en_us.json',
    schema: {
      type: 'object',
      properties: {
        imported: { type: 'number' },
        skipped: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @Post('import')
  @HttpCode(HttpStatus.OK)
  async importFromJson(): Promise<{ imported: number; skipped: number; errors: string[] }> {
    return this.itemsService.importFromJson();
  }

  @ApiOperation({ summary: 'Import items từ JSON file (GET method for easy testing)' })
  @ApiOkResponse({
    description: 'Import items từ file Items_en_us.json',
    schema: {
      type: 'object',
      properties: {
        imported: { type: 'number' },
        skipped: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @Get('import')
  @HttpCode(HttpStatus.OK)
  async importFromJsonGet(): Promise<{ imported: number; skipped: number; errors: string[] }> {
    return this.itemsService.importFromJson();
  }

  @ApiOperation({ summary: 'Lấy item theo API name' })
  @ApiOkResponse({
    type: Item,
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
    @Param('apiName') apiName: Item['apiName'],
  ): Promise<NullableType<Item>> {
    return this.itemsService.findByApiName(apiName);
  }

  @ApiOperation({ summary: 'Lấy item theo ID' })
  @ApiOkResponse({
    type: Item,
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(@Param('id') id: Item['id']): Promise<NullableType<Item>> {
    return this.itemsService.findById(id);
  }

  @ApiOperation({ summary: 'Cập nhật item theo ID' })
  @ApiOkResponse({
    type: Item,
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Param('id') id: Item['id'],
    @Body() updateItemDto: UpdateItemDto,
  ): Promise<Item | null> {
    return this.itemsService.update(id, updateItemDto);
  }

  @ApiOperation({ summary: 'Cập nhật item theo API name' })
  @ApiOkResponse({
    type: Item,
  })
  @Patch('api-name/:apiName')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'apiName',
    type: String,
    required: true,
    example: 'TFT_Item_RabadonsDeathcap',
  })
  updateByApiName(
    @Param('apiName') apiName: Item['apiName'],
    @Body() updateItemDto: UpdateItemDto,
  ): Promise<Item | null> {
    return this.itemsService.updateByApiName(apiName, updateItemDto);
  }

  @ApiOperation({ summary: 'Xóa item' })
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: Item['id']): Promise<void> {
    return this.itemsService.remove(id);
  }

  @ApiOperation({ summary: 'Update tất cả items không có icon/avatar URL, set disabled: false' })
  @ApiOkResponse({
    description: 'Update items không có icon',
    schema: {
      type: 'object',
      properties: {
        updated: { type: 'number', description: 'Số lượng items đã được update' },
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/Item' },
          description: 'Danh sách items không có icon',
        },
      },
    },
  })
  @Post('update-items-without-icon')
  @HttpCode(HttpStatus.OK)
  async updateItemsWithoutIcon(): Promise<{ updated: number; items: Item[] }> {
    return this.itemsService.updateItemsWithoutIcon();
  }

  @ApiOperation({ summary: 'Xóa các items có tên trong danh sách TFT Set 16' })
  @ApiOkResponse({
    description: 'Xóa items theo danh sách tên',
    schema: {
      type: 'object',
      properties: {
        deleted: { type: 'number', description: 'Số lượng items đã xóa' },
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/Item' },
          description: 'Danh sách items đã xóa',
        },
        errors: {
          type: 'array',
          items: { type: 'string' },
          description: 'Danh sách lỗi nếu có',
        },
      },
    },
  })
  @Delete('cleanup/by-name-list')
  @HttpCode(HttpStatus.OK)
  async deleteItemsByNameList(): Promise<{
    deleted: number;
    items: Item[];
    errors: string[];
  }> {
    return this.itemsService.deleteItemsByNameList();
  }
}

