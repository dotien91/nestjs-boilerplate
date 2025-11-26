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
import { TftAugmentsService } from './tft-augments.service';
import { CreateTftAugmentDto } from './dto/create-tft-augment.dto';
import { UpdateTftAugmentDto } from './dto/update-tft-augment.dto';
import { TftAugment } from './domain/tft-augment';
import { QueryTftAugmentDto } from './dto/query-tft-augment.dto';
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

    return infinityPagination(
      await this.tftAugmentsService.findManyWithPagination({
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

