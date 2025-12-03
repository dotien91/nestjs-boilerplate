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

  /**
   * Convert lean MongoDB object to TftUnit domain entity
   * This avoids circular reference issues when serializing
   */
  private leanToDomain(unitObject: any): TftUnit {
    const domainEntity = new TftUnit();
    domainEntity.id = unitObject._id?.toString() || unitObject._id;
    domainEntity.apiName = unitObject.apiName;
    domainEntity.name = unitObject.name;
    domainEntity.enName = unitObject.enName;
    domainEntity.characterName = unitObject.characterName;
    domainEntity.cost = unitObject.cost;
    domainEntity.icon = unitObject.icon;
    domainEntity.squareIcon = unitObject.squareIcon;
    domainEntity.tileIcon = unitObject.tileIcon;
    domainEntity.role = unitObject.role;
    domainEntity.needUnlock = unitObject.needUnlock;
    // Deep clone nested objects to avoid circular references
    domainEntity.ability = unitObject.ability ? JSON.parse(JSON.stringify(unitObject.ability)) : null;
    domainEntity.stats = unitObject.stats ? JSON.parse(JSON.stringify(unitObject.stats)) : null;
    domainEntity.traits = unitObject.traits || [];
    domainEntity.createdAt = unitObject.createdAt;
    domainEntity.updatedAt = unitObject.updatedAt;
    domainEntity.deletedAt = unitObject.deletedAt;
    return domainEntity;
  }

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
      // Escape special regex characters và tìm partial match
      const escapedName = filterOptions.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      where.name = { $regex: escapedName, $options: 'i' };
    }

    if (filterOptions?.apiName) {
      where.apiName = filterOptions.apiName;
    }

    // traits là array, dùng $in để filter
    if (filterOptions?.trait) {
      where.traits = { $in: [filterOptions.trait] };
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
      .limit(paginationOptions.limit)
      .lean();

    return unitObjects.map((unitObject: any) => this.leanToDomain(unitObject));
  }

  async findAll(): Promise<TftUnit[]> {
    const unitObjects = await this.tftUnitsModel.find().sort({ name: 1 }).lean();
    return unitObjects.map((unitObject: any) => this.leanToDomain(unitObject));
  }

  async findById(id: TftUnit['id']): Promise<NullableType<TftUnit>> {
    const unitObject = await this.tftUnitsModel.findById(id).lean();
    return unitObject ? this.leanToDomain(unitObject) : null;
  }

  async findByApiName(apiName: string): Promise<NullableType<TftUnit>> {
    if (!apiName) return null;

    const unitObject = await this.tftUnitsModel.findOne({ apiName }).lean();
    return unitObject ? this.leanToDomain(unitObject) : null;
  }

  async update(
    id: TftUnit['id'],
    payload: Partial<TftUnit>,
  ): Promise<TftUnit | null> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const unit = await this.tftUnitsModel.findOne(filter).lean();

    if (!unit) {
      return null;
    }

    const currentUnit = this.leanToDomain(unit);
    const unitObject = await this.tftUnitsModel.findOneAndUpdate(
      filter,
      TftUnitMapper.toPersistence({
        ...currentUnit,
        ...clonedPayload,
      }),
      { new: true },
    ).lean();

    return unitObject ? this.leanToDomain(unitObject) : null;
  }

  async remove(id: TftUnit['id']): Promise<void> {
    await this.tftUnitsModel.deleteOne({ _id: id.toString() });
  }
}

