import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, isValidObjectId } from 'mongoose';
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
   * Build filter query from FilterTftUnitDto
   */
  private buildFilterQuery(filterOptions?: FilterTftUnitDto | null): FilterQuery<TftUnitSchemaClass> {
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

    return where;
  }

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
    domainEntity.tier = unitObject.tier;
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

  private isInvalidId(id: TftUnit['id']): boolean {
    if (!id) return true;
    const idString = String(id).trim().toLowerCase();
    if (!idString || idString === 'undefined' || idString === 'null') return true;
    return !isValidObjectId(idString);
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
    const where = this.buildFilterQuery(filterOptions);

    // Nếu không có sort options, mặc định sort theo tier (S > A > B > C > D) trong MongoDB
    if (!sortOptions || sortOptions.length === 0) {
      const pipeline: any[] = [
        { $match: where },
        // Thêm field tierOrder để sort: S=0, A=1, B=2, C=3, D=4, null/khác=5
        {
          $addFields: {
            tierOrder: {
              $switch: {
                branches: [
                  { case: { $eq: [{ $toUpper: '$tier' }, 'S'] }, then: 0 },
                  { case: { $eq: [{ $toUpper: '$tier' }, 'A'] }, then: 1 },
                  { case: { $eq: [{ $toUpper: '$tier' }, 'B'] }, then: 2 },
                  { case: { $eq: [{ $toUpper: '$tier' }, 'C'] }, then: 3 },
                  { case: { $eq: [{ $toUpper: '$tier' }, 'D'] }, then: 4 },
                ],
                default: 5,
              },
            },
          },
        },
        // Sort theo tierOrder, sau đó theo name
        { $sort: { tierOrder: 1, name: 1 } },
        // Pagination
        { $skip: (paginationOptions.page - 1) * paginationOptions.limit },
        { $limit: paginationOptions.limit },
        // Remove tierOrder field trước khi return
        { $unset: 'tierOrder' },
      ];

      const unitObjects = await this.tftUnitsModel.aggregate(pipeline);
      return unitObjects.map((unitObject: any) => this.leanToDomain(unitObject));
    }

    // Nếu có sort options, dùng sort bình thường
    const unitObjects = await this.tftUnitsModel
      .find(where)
      .sort(
        sortOptions.reduce(
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

  /**
   * Find all units with filter (no pagination)
   * Used for sorting all units before pagination
   */
  async findManyWithFilter(
    filterOptions?: FilterTftUnitDto | null,
  ): Promise<TftUnit[]> {
    const where = this.buildFilterQuery(filterOptions);
    const unitObjects = await this.tftUnitsModel.find(where).lean();
    return unitObjects.map((unitObject: any) => this.leanToDomain(unitObject));
  }

  async findAll(): Promise<TftUnit[]> {
    // Sort theo tier (S > A > B > C > D) trong MongoDB
    const pipeline: any[] = [
      // Thêm field tierOrder để sort: S=0, A=1, B=2, C=3, D=4, null/khác=5
      {
        $addFields: {
          tierOrder: {
            $switch: {
              branches: [
                { case: { $eq: [{ $toUpper: '$tier' }, 'S'] }, then: 0 },
                { case: { $eq: [{ $toUpper: '$tier' }, 'A'] }, then: 1 },
                { case: { $eq: [{ $toUpper: '$tier' }, 'B'] }, then: 2 },
                { case: { $eq: [{ $toUpper: '$tier' }, 'C'] }, then: 3 },
                { case: { $eq: [{ $toUpper: '$tier' }, 'D'] }, then: 4 },
              ],
              default: 5,
            },
          },
        },
      },
      // Sort theo tierOrder, sau đó theo name
      { $sort: { tierOrder: 1, name: 1 } },
      // Remove tierOrder field trước khi return
      { $unset: 'tierOrder' },
    ];

    const unitObjects = await this.tftUnitsModel.aggregate(pipeline);
    return unitObjects.map((unitObject: any) => this.leanToDomain(unitObject));
  }

  async findById(id: TftUnit['id']): Promise<NullableType<TftUnit>> {
    if (this.isInvalidId(id)) return null;
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
    if (this.isInvalidId(id)) return null;
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
    if (this.isInvalidId(id)) return;
    await this.tftUnitsModel.deleteOne({ _id: id.toString() });
  }
}

