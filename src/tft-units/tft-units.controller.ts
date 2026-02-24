import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
  HttpStatus,
  HttpCode,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
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
import { TftUnitsService } from './tft-units.service';
import { CreateTftUnitDto } from './dto/create-tft-unit.dto';
import { UpdateTftUnitDto } from './dto/update-tft-unit.dto';
import { TftUnit } from './domain/tft-unit';
import { QueryTftUnitDto, FilterTftUnitDto, SortTftUnitDto } from './dto/query-tft-unit.dto';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { NullableType } from '../utils/types/nullable.type';

type MinimalTftUnitResponse = {
  id: string;
  apiName: string;
  characterName: string | null;
  cost: number | null;
  endName: string | null;
  name: string;
  tier: string | null;
  traits: string[];
};

@ApiTags('TFT Units')
@Controller({
  path: 'tft-units',
  version: '1',
})
export class TftUnitsController {
  constructor(private readonly tftUnitsService: TftUnitsService) {}

  private toMinimalUnit(unit: TftUnit): MinimalTftUnitResponse {
    return {
      id: unit.id != null ? String(unit.id) : '',
      apiName: unit.apiName,
      characterName: unit.characterName ?? null,
      cost: unit.cost ?? null,
      endName: unit.enName ?? null,
      name: unit.name,
      tier: unit.tier ?? null,
      traits: unit.traits ?? [],
    };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
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
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(0) // Cache đến khi server restart
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryTftUnitDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<InfinityPaginationResponseDto<TftUnit | MinimalTftUnitResponse>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    // Build filters từ flat properties - chỉ giữ field có giá trị
    let filters: FilterTftUnitDto | undefined = undefined;
    const filterObj: Partial<FilterTftUnitDto> = {};
    
    if (query?.name) filterObj.name = query.name;
    if (query?.apiName) filterObj.apiName = query.apiName;
    if (query?.trait) filterObj.trait = query.trait;
    if (query?.cost !== undefined && query?.cost !== null) filterObj.cost = query.cost;
    if (query?.role) filterObj.role = query.role;
    
    if (Object.keys(filterObj).length > 0) {
      filters = filterObj as FilterTftUnitDto;
    }

    // Build sort từ flat properties
    let sort: SortTftUnitDto[] | undefined = undefined;
    if (query?.orderBy && query?.order) {
      sort = [
        {
          orderBy: query.orderBy,
          order: query.order,
        },
      ];
    }

    const isMinimal = !!query?.minimal;
    const result = await this.tftUnitsService.findManyWithPagination({
      filterOptions: filters,
      sortOptions: sort,
      paginationOptions: { page, limit },
      minimal: isMinimal,
    });
    const data = Array.isArray(result) ? result : result.data ?? [];
    const totalCount = typeof (result as any).totalCount === 'number' ? (result as any).totalCount : data.length;

    const responseData: Array<TftUnit | MinimalTftUnitResponse> = isMinimal
      ? data.map((unit) => this.toMinimalUnit(unit))
      : data;

    res.setHeader('X-Total-Count', String(totalCount));
    return infinityPagination<TftUnit | MinimalTftUnitResponse>(responseData, {
      page,
      limit,
    }, totalCount);
  }

  @ApiOperation({ summary: 'Lấy tất cả TFT units (không phân trang)' })
  @ApiOkResponse({
    type: [TftUnit],
  })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(0) // Cache đến khi server restart
  @Get('list-all')
  @HttpCode(HttpStatus.OK)
  async findAllUnits(
    @Query('minimal') minimal?: string,
  ): Promise<Array<TftUnit | MinimalTftUnitResponse>> {
    const isMinimal = minimal === 'true' || minimal === '1';
    const data = await this.tftUnitsService.findAll({ minimal: isMinimal });
    return isMinimal ? data.map((unit) => this.toMinimalUnit(unit)) : data;
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
    @Query('minimal') minimal?: string,
  ): Promise<Array<TftUnit | MinimalTftUnitResponse>> {
    const isMinimal = minimal === 'true' || minimal === '1';
    const { data } = await this.tftUnitsService.findManyWithPagination({
      filterOptions: { cost },
      sortOptions: null,
      paginationOptions: { page: 1, limit: 100 },
      minimal: isMinimal,
    });
    return isMinimal ? data.map((unit) => this.toMinimalUnit(unit)) : data;
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
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

