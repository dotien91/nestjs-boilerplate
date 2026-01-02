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
import { TftAugmentOddsService } from './tft-augment-odds.service';
import { CreateTftAugmentOddDto } from './dto/create-tft-augment-odd.dto';
import { UpdateTftAugmentOddDto } from './dto/update-tft-augment-odd.dto';
import { TftAugmentOdd } from './domain/tft-augment-odd';
import { NullableType } from '../utils/types/nullable.type';

@ApiTags('TFT Augment Odds')
@Controller({
  path: 'tft-augment-odds',
  version: '1',
})
export class TftAugmentOddsController {
  constructor(
    private readonly tftAugmentOddsService: TftAugmentOddsService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Tạo TFT augment odd mới' })
  @ApiCreatedResponse({
    type: TftAugmentOdd,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createTftAugmentOddDto: CreateTftAugmentOddDto,
  ): Promise<TftAugmentOdd> {
    return this.tftAugmentOddsService.create(createTftAugmentOddDto);
  }

  @ApiOperation({ summary: 'Lấy danh sách TFT augment odds' })
  @ApiOkResponse({
    type: [TftAugmentOdd],
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(): Promise<TftAugmentOdd[]> {
    return this.tftAugmentOddsService.findMany();
  }

  @ApiOperation({ summary: 'Lấy TFT augment odd theo ID' })
  @ApiOkResponse({
    type: TftAugmentOdd,
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(
    @Param('id') id: TftAugmentOdd['id'],
  ): Promise<NullableType<TftAugmentOdd>> {
    return this.tftAugmentOddsService.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Cập nhật TFT augment odd' })
  @ApiOkResponse({
    type: TftAugmentOdd,
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Param('id') id: TftAugmentOdd['id'],
    @Body() updateTftAugmentOddDto: UpdateTftAugmentOddDto,
  ): Promise<TftAugmentOdd | null> {
    return this.tftAugmentOddsService.update(id, updateTftAugmentOddDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Xóa TFT augment odd' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: TftAugmentOdd['id']): Promise<void> {
    return this.tftAugmentOddsService.remove(id);
  }
}

