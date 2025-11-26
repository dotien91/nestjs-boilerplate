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
import { TftUnitsService } from './tft-units.service';
import { CreateTftUnitDto } from './dto/create-tft-unit.dto';
import { UpdateTftUnitDto } from './dto/update-tft-unit.dto';
import { TftUnit } from './domain/tft-unit';
import { QueryTftUnitDto } from './dto/query-tft-unit.dto';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { NullableType } from '../utils/types/nullable.type';

@ApiTags('TFT Units')
@Controller({
  path: 'tft-units',
  version: '1',
})
export class TftUnitsController {
  constructor(private readonly tftUnitsService: TftUnitsService) {}

  @ApiOperation({ summary: 'Tạo TFT unit mới' })
  @ApiCreatedResponse({
    type: TftUnit,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTftUnitDto: CreateTftUnitDto): Promise<TftUnit> {
    return this.tftUnitsService.create(createTftUnitDto);
  }

  @ApiOperation({ summary: 'Lấy danh sách TFT units với phân trang' })
  @ApiOkResponse({
    type: InfinityPaginationResponse(TftUnit),
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryTftUnitDto,
  ): Promise<InfinityPaginationResponseDto<TftUnit>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.tftUnitsService.findManyWithPagination({
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

  @ApiOperation({ summary: 'Lấy TFT unit theo ID' })
  @ApiOkResponse({
    type: TftUnit,
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(@Param('id') id: TftUnit['id']): Promise<NullableType<TftUnit>> {
    return this.tftUnitsService.findById(id);
  }

  @ApiOperation({ summary: 'Lấy TFT unit theo API name' })
  @ApiOkResponse({
    type: TftUnit,
  })
  @Get('api-name/:apiName')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'apiName',
    type: String,
    required: true,
    example: 'TFT16_Tristana',
  })
  findByApiName(
    @Param('apiName') apiName: string,
  ): Promise<NullableType<TftUnit>> {
    return this.tftUnitsService.findByApiName(apiName);
  }

  @ApiOperation({ summary: 'Lấy TFT units theo cost' })
  @ApiOkResponse({
    type: [TftUnit],
  })
  @Get('cost/:cost')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'cost',
    type: Number,
    required: true,
    example: 1,
  })
  async findByCost(
    @Param('cost') cost: number,
  ): Promise<TftUnit[]> {
    return this.tftUnitsService.findManyWithPagination({
      filterOptions: { cost },
      sortOptions: null,
      paginationOptions: { page: 1, limit: 100 },
    });
  }

  @ApiOperation({ summary: 'Cập nhật TFT unit' })
  @ApiOkResponse({
    type: TftUnit,
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Param('id') id: TftUnit['id'],
    @Body() updateTftUnitDto: UpdateTftUnitDto,
  ): Promise<TftUnit | null> {
    return this.tftUnitsService.update(id, updateTftUnitDto);
  }

  @ApiOperation({ summary: 'Xóa TFT unit' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: TftUnit['id']): Promise<void> {
    return this.tftUnitsService.remove(id);
  }
}

