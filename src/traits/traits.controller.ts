import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TraitsService } from './traits.service';
import { CreateTraitDto } from './dto/create-trait.dto';
import { UpdateTraitDto } from './dto/update-trait.dto';
import { Trait } from './domain/trait';
import { QueryTraitDto } from './dto/query-trait.dto';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { NullableType } from '../utils/types/nullable.type';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';

@ApiTags('Traits')
@Controller({
  path: 'traits',
  version: '1',
})
export class TraitsController {
  constructor(private readonly traitsService: TraitsService) {}

  @ApiOperation({ summary: 'Tạo trait mới (tộc/hệ)' })
  @ApiCreatedResponse({
    type: Trait,
  })
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTraitDto: CreateTraitDto): Promise<Trait> {
    return this.traitsService.create(createTraitDto);
  }

  @ApiOperation({ summary: 'Lấy danh sách traits với phân trang' })
  @ApiOkResponse({
    type: InfinityPaginationResponse(Trait),
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryTraitDto,
  ): Promise<InfinityPaginationResponseDto<Trait>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.traitsService.findManyWithPagination({
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

  @ApiOperation({ summary: 'Lấy trait theo ID' })
  @ApiOkResponse({
    type: Trait,
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(@Param('id') id: Trait['id']): Promise<NullableType<Trait>> {
    return this.traitsService.findById(id);
  }

  @ApiOperation({ summary: 'Lấy trait theo key' })
  @ApiOkResponse({
    type: Trait,
  })
  @Get('key/:key')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'key',
    type: String,
    required: true,
    example: 'guardian',
  })
  findByKey(@Param('key') key: Trait['key']): Promise<NullableType<Trait>> {
    return this.traitsService.findByKey(key);
  }

  @ApiOperation({ summary: 'Cập nhật trait' })
  @ApiOkResponse({
    type: Trait,
  })
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Param('id') id: Trait['id'],
    @Body() updateTraitDto: UpdateTraitDto,
  ): Promise<Trait | null> {
    return this.traitsService.update(id, updateTraitDto);
  }

  @ApiOperation({ summary: 'Xóa trait' })
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: Trait['id']): Promise<void> {
    return this.traitsService.remove(id);
  }
}
