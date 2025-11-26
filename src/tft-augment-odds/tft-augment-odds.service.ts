import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateTftAugmentOddDto } from './dto/create-tft-augment-odd.dto';
import { UpdateTftAugmentOddDto } from './dto/update-tft-augment-odd.dto';
import { NullableType } from '../utils/types/nullable.type';
import { TftAugmentOddRepository } from './infrastructure/persistence/tft-augment-odd.repository';
import { TftAugmentOdd } from './domain/tft-augment-odd';

@Injectable()
export class TftAugmentOddsService {
  constructor(
    private readonly tftAugmentOddsRepository: TftAugmentOddRepository,
  ) {}

  async create(
    createTftAugmentOddDto: CreateTftAugmentOddDto,
  ): Promise<TftAugmentOdd> {
    const odd = new TftAugmentOdd();
    odd.odds = createTftAugmentOddDto.odds;
    odd.augments = createTftAugmentOddDto.augments;
    odd.createdAt = new Date();
    odd.updatedAt = new Date();

    const createdOdd = await this.tftAugmentOddsRepository.create(odd);

    return createdOdd;
  }

  async findMany(): Promise<TftAugmentOdd[]> {
    return this.tftAugmentOddsRepository.findMany();
  }

  async findById(
    id: TftAugmentOdd['id'],
  ): Promise<NullableType<TftAugmentOdd>> {
    return this.tftAugmentOddsRepository.findById(id);
  }

  async update(
    id: TftAugmentOdd['id'],
    updateTftAugmentOddDto: UpdateTftAugmentOddDto,
  ): Promise<TftAugmentOdd | null> {
    return this.tftAugmentOddsRepository.update(id, updateTftAugmentOddDto);
  }

  async remove(id: TftAugmentOdd['id']): Promise<void> {
    await this.tftAugmentOddsRepository.remove(id);
  }
}

