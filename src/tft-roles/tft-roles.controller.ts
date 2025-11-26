import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { TftRolesService } from './tft-roles.service';
import { CreateTftRoleDto } from './dto/create-tft-role.dto';
import { UpdateTftRoleDto } from './dto/update-tft-role.dto';
import { TftRole } from './domain/tft-role';
import { NullableType } from '../utils/types/nullable.type';

@ApiTags('TFT Roles')
@Controller({
  path: 'tft-roles',
  version: '1',
})
export class TftRolesController {
  constructor(private readonly tftRolesService: TftRolesService) {}

  @ApiOperation({ summary: 'Tạo TFT role mới' })
  @ApiCreatedResponse({
    type: TftRole,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTftRoleDto: CreateTftRoleDto): Promise<TftRole> {
    return this.tftRolesService.create(createTftRoleDto);
  }

  @ApiOperation({ summary: 'Lấy danh sách TFT roles' })
  @ApiOkResponse({
    type: [TftRole],
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(): Promise<TftRole[]> {
    return this.tftRolesService.findMany();
  }

  @ApiOperation({ summary: 'Lấy TFT role theo ID' })
  @ApiOkResponse({
    type: TftRole,
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(@Param('id') id: TftRole['id']): Promise<NullableType<TftRole>> {
    return this.tftRolesService.findById(id);
  }

  @ApiOperation({ summary: 'Lấy TFT role theo API name' })
  @ApiOkResponse({
    type: TftRole,
  })
  @Get('api-name/:apiName')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'apiName',
    type: String,
    required: true,
    example: 'ADCaster',
  })
  findByApiName(
    @Param('apiName') apiName: string,
  ): Promise<NullableType<TftRole>> {
    return this.tftRolesService.findByApiName(apiName);
  }

  @ApiOperation({ summary: 'Cập nhật TFT role' })
  @ApiOkResponse({
    type: TftRole,
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Param('id') id: TftRole['id'],
    @Body() updateTftRoleDto: UpdateTftRoleDto,
  ): Promise<TftRole | null> {
    return this.tftRolesService.update(id, updateTftRoleDto);
  }

  @ApiOperation({ summary: 'Xóa TFT role' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: TftRole['id']): Promise<void> {
    return this.tftRolesService.remove(id);
  }
}

