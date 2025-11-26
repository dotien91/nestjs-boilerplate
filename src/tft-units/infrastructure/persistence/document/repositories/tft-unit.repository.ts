import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { TftUnit } from '../../../../domain/tft-unit';
import { TftUnitRepository } from '../../tft-unit.repository';
import {
  FilterTftUnitDto,
  SortTftUnitDto,
} from '../../../../dto/query-tft-unit.dto';
import { TftUnitSchemaClass } from '../entities/tft-unit.schema';
import { TftUnitMapper } from '../mappers/tft-unit.mapper';

@Injectable()
export class TftUnitsDocumentRepository implements TftUnitRepository {
  constructor(
    @InjectModel(TftUnitSchemaClass.name)
    private readonly tftUnitsModel: Model<TftUnitSchemaClass>,
  ) {}

  async create(data: TftUnit): Promise<TftUnit> {
    const persistenceModel = TftUnitMapper.toPersistence(data);
    const createdUnit = new this.tftUnitsModel(persistenceModel);
    const unitObject = await createdUnit.save();
    return TftUnitMapper.toDomain(unitObject);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTftUnitDto | null;
    sortOptions?: SortTftUnitDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<TftUnit[]> {
    const where: FilterQuery<TftUnitSchemaClass> = {};

    if (filterOptions?.name) {
      where.name = { $regex: filterOptions.name, $options: 'i' };
    }

    if (filterOptions?.apiName) {
      where.apiName = filterOptions.apiName;
    }

    if (filterOptions?.trait) {
      where.traits = filterOptions.trait;
    }

    if (filterOptions?.cost !== undefined && filterOptions?.cost !== null) {
      where.cost = filterOptions.cost;
    }

    if (filterOptions?.role) {
      where.role = filterOptions.role;
    }

    const unitObjects = await this.tftUnitsModel
      .find(where)
      .sort(
        sortOptions?.reduce(
          (accumulator, sort) => ({
            ...accumulator,
            [sort.orderBy === 'id' ? '_id' : sort.orderBy]:
              sort.order.toUpperCase() === 'ASC' ? 1 : -1,
          }),
          {},
        ),
      )
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit);

    return unitObjects.map((unitObject) => TftUnitMapper.toDomain(unitObject));
  }

  async findById(id: TftUnit['id']): Promise<NullableType<TftUnit>> {
    const unitObject = await this.tftUnitsModel.findById(id);
    return unitObject ? TftUnitMapper.toDomain(unitObject) : null;
  }

  async findByApiName(apiName: string): Promise<NullableType<TftUnit>> {
    if (!apiName) return null;

    const unitObject = await this.tftUnitsModel.findOne({ apiName });
    return unitObject ? TftUnitMapper.toDomain(unitObject) : null;
  }

  async update(
    id: TftUnit['id'],
    payload: Partial<TftUnit>,
  ): Promise<TftUnit | null> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const unit = await this.tftUnitsModel.findOne(filter);

    if (!unit) {
      return null;
    }

    const unitObject = await this.tftUnitsModel.findOneAndUpdate(
      filter,
      TftUnitMapper.toPersistence({
        ...TftUnitMapper.toDomain(unit),
        ...clonedPayload,
      }),
      { new: true },
    );

    return unitObject ? TftUnitMapper.toDomain(unitObject) : null;
  }

  async remove(id: TftUnit['id']): Promise<void> {
    await this.tftUnitsModel.deleteOne({ _id: id.toString() });
  }
}

