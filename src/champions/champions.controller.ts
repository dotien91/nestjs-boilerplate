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
import { ChampionsService } from './champions.service';
import { CreateChampionDto } from './dto/create-champion.dto';
import { UpdateChampionDto } from './dto/update-champion.dto';
import { Champion } from './domain/champion';
import { QueryChampionDto } from './dto/query-champion.dto';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { NullableType } from '../utils/types/nullable.type';

@ApiTags('Champions')
@Controller({
  path: 'champions',
  version: '1',
})
export class ChampionsController {
  constructor(private readonly championsService: ChampionsService) {}

  @ApiOperation({ summary: 'Tạo champion mới' })
  @ApiCreatedResponse({
    type: Champion,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createChampionDto: CreateChampionDto): Promise<Champion> {
    return this.championsService.create(createChampionDto);
  }

  @ApiOperation({ summary: 'Lấy danh sách champions với phân trang' })
  @ApiOkResponse({
    type: InfinityPaginationResponse(Champion),
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryChampionDto,
  ): Promise<InfinityPaginationResponseDto<Champion>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.championsService.findManyWithPagination({
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

  @ApiOperation({ summary: 'Lấy champion theo ID' })
  @ApiOkResponse({
    type: Champion,
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(@Param('id') id: Champion['id']): Promise<NullableType<Champion>> {
    return this.championsService.findById(id);
  }

  @ApiOperation({ summary: 'Lấy champion theo key' })
  @ApiOkResponse({
    type: Champion,
  })
  @Get('key/:key')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'key',
    type: String,
    required: true,
    example: 'ahri',
  })
  findByKey(
    @Param('key') key: Champion['key'],
  ): Promise<NullableType<Champion>> {
    return this.championsService.findByKey(key);
  }

  @ApiOperation({ summary: 'Lấy champions theo cost' })
  @ApiOkResponse({
    type: [Champion],
  })
  @Get('cost/:cost')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'cost',
    type: Number,
    required: true,
    example: 3,
  })
  findByCost(@Param('cost') cost: number): Promise<Champion[]> {
    return this.championsService.findByCost(cost);
  }

  @ApiOperation({ summary: 'Cập nhật champion' })
  @ApiOkResponse({
    type: Champion,
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Param('id') id: Champion['id'],
    @Body() updateChampionDto: UpdateChampionDto,
  ): Promise<Champion | null> {
    return this.championsService.update(id, updateChampionDto);
  }

  @ApiOperation({ summary: 'Xóa champion' })
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: Champion['id']): Promise<void> {
    return this.championsService.remove(id);
  }
}
