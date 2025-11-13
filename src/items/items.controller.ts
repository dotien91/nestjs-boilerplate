import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemDto } from './dto/item.dto';
import { FilterItemDto, SortItemDto } from './dto/query-item.dto';
import { InfinityPaginationResultType } from '../utils/types/infinity-pagination-result.type';
import { infinityPagination } from '../utils/infinity-pagination';

@ApiTags('Items')
@Controller({
  path: 'items',
  version: '1',
})
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new item' })
  @ApiResponse({
    status: 201,
    description: 'Item created successfully',
    type: ItemDto,
  })
  create(@Body(ValidationPipe) createItemDto: CreateItemDto): Promise<ItemDto> {
    return this.itemsService.create(createItemDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all items with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Items retrieved successfully',
    schema: {
      allOf: [
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/ItemDto' },
            },
            hasNextPage: { type: 'boolean' },
          },
        },
      ],
    },
  })
  async findManyWithPagination(
    @Query() filter: FilterItemDto,
    @Query('sort') sort: SortItemDto[],
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ): Promise<InfinityPaginationResultType<ItemDto>> {
    return this.itemsService.findManyWithPagination({
      filterOptions: filter,
      sortOptions: sort,
      paginationOptions: {
        page,
        limit,
      },
    });
  }

  @Get('basic')
  @ApiOperation({ summary: 'Get all basic items (no composition)' })
  @ApiResponse({
    status: 200,
    description: 'Basic items retrieved successfully',
    type: [ItemDto],
  })
  findBasicItems(): Promise<ItemDto[]> {
    return this.itemsService.findBasicItems();
  }

  @Get('completed')
  @ApiOperation({ summary: 'Get all completed items (with composition)' })
  @ApiResponse({
    status: 200,
    description: 'Completed items retrieved successfully',
    type: [ItemDto],
  })
  findCompletedItems(): Promise<ItemDto[]> {
    return this.itemsService.findCompletedItems();
  }

  @Get('unique')
  @ApiOperation({ summary: 'Get all unique items' })
  @ApiResponse({
    status: 200,
    description: 'Unique items retrieved successfully',
    type: [ItemDto],
  })
  findUniqueItems(): Promise<ItemDto[]> {
    return this.itemsService.findUniqueItems();
  }

  @Get('set/:set')
  @ApiOperation({ summary: 'Get items by set' })
  @ApiResponse({
    status: 200,
    description: 'Items retrieved successfully',
    type: [ItemDto],
  })
  findBySet(@Param('set') set: string): Promise<ItemDto[]> {
    return this.itemsService.findBySet(set);
  }

  @Get('traits/:traits')
  @ApiOperation({ summary: 'Get items by associated traits' })
  @ApiResponse({
    status: 200,
    description: 'Items retrieved successfully',
    type: [ItemDto],
  })
  findByAssociatedTraits(@Param('traits') traits: string): Promise<ItemDto[]> {
    const traitsArray = traits.split(',');
    return this.itemsService.findByAssociatedTraits(traitsArray);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Item retrieved successfully',
    type: ItemDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found',
  })
  findById(@Param('id') id: string): Promise<ItemDto | null> {
    return this.itemsService.findById(id);
  }

  @Get('api/:apiName')
  @ApiOperation({ summary: 'Get item by API name' })
  @ApiResponse({
    status: 200,
    description: 'Item retrieved successfully',
    type: ItemDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found',
  })
  findByApiName(@Param('apiName') apiName: string): Promise<ItemDto | null> {
    return this.itemsService.findByApiName(apiName);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update item' })
  @ApiResponse({
    status: 200,
    description: 'Item updated successfully',
    type: ItemDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found',
  })
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateItemDto: UpdateItemDto,
  ): Promise<ItemDto | null> {
    return this.itemsService.update(id, updateItemDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete item' })
  @ApiResponse({
    status: 200,
    description: 'Item deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.itemsService.remove(id);
  }
}
