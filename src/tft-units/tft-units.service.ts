import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateTftUnitDto } from './dto/create-tft-unit.dto';
import { UpdateTftUnitDto } from './dto/update-tft-unit.dto';
import { NullableType } from '../utils/types/nullable.type';
import {
  FilterTftUnitDto,
  SortTftUnitDto,
} from './dto/query-tft-unit.dto';
import { TftUnitRepository } from './infrastructure/persistence/tft-unit.repository';
import { TftUnit } from './domain/tft-unit';
import { IPaginationOptions } from '../utils/types/pagination-options';

@Injectable()
export class TftUnitsService {
  constructor(
    private readonly tftUnitsRepository: TftUnitRepository,
  ) {}


  async create(createTftUnitDto: CreateTftUnitDto): Promise<TftUnit> {
    // Kiểm tra apiName đã tồn tại chưa
    const unitObject = await this.tftUnitsRepository.findByApiName(
      createTftUnitDto.apiName,
    );
    if (unitObject) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          apiName: 'tftUnitApiNameAlreadyExists',
        },
      });
    }

    const unit = new TftUnit();
    unit.apiName = createTftUnitDto.apiName;
    unit.name = createTftUnitDto.name;
    unit.enName = createTftUnitDto.enName;
    unit.characterName = createTftUnitDto.characterName;
    unit.cost = createTftUnitDto.cost;
    unit.icon = createTftUnitDto.icon;
    unit.squareIcon = createTftUnitDto.squareIcon;
    unit.tileIcon = createTftUnitDto.tileIcon;
    unit.role = createTftUnitDto.role;
    unit.tier = createTftUnitDto.tier;
    unit.ability = createTftUnitDto.ability;
    unit.stats = createTftUnitDto.stats;
    unit.traits = createTftUnitDto.traits || [];
    unit.createdAt = new Date();
    unit.updatedAt = new Date();

    const createdUnit = await this.tftUnitsRepository.create(unit);

    return createdUnit;
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
    minimal,
  }: {
    filterOptions?: FilterTftUnitDto | null;
    sortOptions?: SortTftUnitDto[] | null;
    paginationOptions: IPaginationOptions;
    minimal?: boolean;
  }): Promise<{ data: TftUnit[]; totalCount: number }> {
    return this.tftUnitsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
      minimal,
    });
  }

  async findAll(options?: { minimal?: boolean }): Promise<TftUnit[]> {
    return this.tftUnitsRepository.findAll(options);
  }

  async findById(id: TftUnit['id']): Promise<NullableType<TftUnit>> {
    return this.tftUnitsRepository.findById(id);
  }

  async findByApiName(apiName: string): Promise<NullableType<TftUnit>> {
    return this.tftUnitsRepository.findByApiName(apiName);
  }

  async update(
    id: TftUnit['id'],
    updateTftUnitDto: UpdateTftUnitDto,
  ): Promise<TftUnit | null> {
    // Kiểm tra apiName đã tồn tại chưa (nếu có thay đổi)
    if (updateTftUnitDto.apiName) {
      const unitObject = await this.tftUnitsRepository.findByApiName(
        updateTftUnitDto.apiName,
      );
      if (unitObject && String(unitObject.id) !== String(id)) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            apiName: 'tftUnitApiNameAlreadyExists',
          },
        });
      }
    }

    return this.tftUnitsRepository.update(id, updateTftUnitDto);
  }

  async remove(id: TftUnit['id']): Promise<void> {
    await this.tftUnitsRepository.remove(id);
  }
}

