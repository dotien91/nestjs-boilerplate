import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import {
  FilterCompositionDto,
  SortCompositionDto,
} from '../../../../dto/query-composition.dto';
import { Composition } from '../../../../domain/composition';
import { CompositionRepository } from '../../composition.repository';
import { CompositionSchemaClass } from '../entities/composition.schema';
import { CompositionMapper } from '../mappers/composition.mapper';

@Injectable()
export class CompositionsDocumentRepository implements CompositionRepository {
  constructor(
    @InjectModel(CompositionSchemaClass.name)
    private readonly compositionsModel: Model<CompositionSchemaClass>,
  ) {}

  async create(data: Composition): Promise<Composition> {
    const persistenceModel = CompositionMapper.toPersistence(data);
    const createdComposition = new this.compositionsModel(persistenceModel);
    const compositionObject = await createdComposition.save();
    return CompositionMapper.toDomain(compositionObject);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterCompositionDto | null;
    sortOptions?: SortCompositionDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Composition[]> {
    const where: FilterQuery<CompositionSchemaClass> = {};
    const andConditions: any[] = [];

    // Build base filters
    if (filterOptions?.name) {
      where.name = { $regex: filterOptions.name, $options: 'i' };
    }

    if (filterOptions?.compId) {
      where.compId = { $regex: filterOptions.compId, $options: 'i' };
    }

    if (filterOptions?.difficulty) {
      where.difficulty = filterOptions.difficulty;
    }

    if (filterOptions?.tier) {
      where.tier = filterOptions.tier;
    }

    if (
      filterOptions?.isLateGame !== undefined &&
      filterOptions?.isLateGame !== null
    ) {
      where.isLateGame = filterOptions.isLateGame;
    }

    if (filterOptions?.isOp !== undefined && filterOptions?.isOp !== null) {
      where.isOp = filterOptions.isOp;
    }

    if (filterOptions?.active !== undefined && filterOptions?.active !== null) {
      where.active = filterOptions.active;
    }

    // Filter by units (Logic cũ của V1 integrated vào pagination)
    if (filterOptions?.units && filterOptions.units.length > 0) {
      const searchInAllArrays = filterOptions.searchInAllArrays ?? true;
      const unitFilters = filterOptions.units.map((identifier) => {
        const escapedIdentifier = identifier.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&',
        );
        const regexMatch = { $regex: escapedIdentifier, $options: 'i' };

        if (searchInAllArrays) {
          return {
            $or: [
              { 'units.championId': regexMatch },
              { 'units.championKey': regexMatch },
              { 'earlyGame.championId': regexMatch },
              { 'earlyGame.championKey': regexMatch },
              { 'midGame.championId': regexMatch },
              { 'midGame.championKey': regexMatch },
              { 'bench.championId': regexMatch },
              { 'bench.championKey': regexMatch },
            ],
          };
        } else {
          return {
            $or: [
              { 'units.championId': regexMatch },
              { 'units.championKey': regexMatch },
            ],
          };
        }
      });

      andConditions.push(...unitFilters);
    }

    // Combine base filters and unit filters
    if (andConditions.length > 0) {
      const baseFilterKeys = Object.keys(where);
      if (baseFilterKeys.length > 0) {
        const baseFilters: any = {};
        baseFilterKeys.forEach((key) => {
          baseFilters[key] = where[key];
          delete where[key];
        });
        andConditions.unshift(baseFilters);
      }
      where.$and = andConditions;
    }

    // Pipeline aggregation logic
    const pipeline: any[] = [
      { $match: where },
      {
        $addFields: {
          orderSort: { $ifNull: ['$order', 999999] },
          isOpOrder: { $cond: [{ $eq: ['$isOp', true] }, 0, 1] },
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
    ];

    // Mặc định: order thấp → cao (orderSort), rồi tier (S→D), rồi isOp, rồi sort từ query
    const sortObj: any = { orderSort: 1, tierOrder: 1, isOpOrder: 1 };

    if (sortOptions && sortOptions.length > 0) {
      sortOptions.forEach((sort) => {
        const field = sort.orderBy === 'id' ? '_id' : sort.orderBy;
        if (
          field !== 'tierOrder' &&
          field !== 'tier' &&
          field !== 'isOpOrder' &&
          field !== 'isOp' &&
          field !== 'orderSort'
        ) {
          sortObj[field] = sort.order.toUpperCase() === 'ASC' ? 1 : -1;
        }
      });
    }

    if (!sortObj.updatedAt && !sortObj.createdAt) {
      sortObj.updatedAt = -1;
    }

    pipeline.push(
      { $sort: sortObj },
      { $skip: (paginationOptions.page - 1) * paginationOptions.limit },
      { $limit: paginationOptions.limit },
      { $unset: ['tierOrder', 'isOpOrder', 'orderSort'] },
    );

    const compositionObjects = await this.compositionsModel.aggregate(pipeline);
    return compositionObjects.map((compositionObject: any) =>
      CompositionMapper.toDomain(compositionObject),
    );
  }

  async findById(id: Composition['id']): Promise<NullableType<Composition>> {
    const compositionObject = await this.compositionsModel.findById(id);
    return compositionObject
      ? CompositionMapper.toDomain(compositionObject)
      : null;
  }

  async findByCompId(compId: string): Promise<NullableType<Composition>> {
    if (!compId) return null;
    const compositionObject = await this.compositionsModel.findOne({ compId });
    return compositionObject
      ? CompositionMapper.toDomain(compositionObject)
      : null;
  }

  async update(
    id: Composition['id'],
    payload: Partial<Composition>,
  ): Promise<Composition | null> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const composition = await this.compositionsModel.findOne(filter);

    if (!composition) {
      return null;
    }

    const compositionObject = await this.compositionsModel.findOneAndUpdate(
      filter,
      CompositionMapper.toPersistence({
        ...CompositionMapper.toDomain(composition),
        ...clonedPayload,
      }),
      { new: true },
    );

    return compositionObject
      ? CompositionMapper.toDomain(compositionObject)
      : null;
  }

  async findOne(name: string): Promise<NullableType<Composition>> {
    if (!name) return null;
    const compositionObject = await this.compositionsModel.findOne({ name });
    return compositionObject
      ? CompositionMapper.toDomain(compositionObject)
      : null;
  }

  async remove(id: Composition['id']): Promise<void> {
    await this.compositionsModel.deleteOne({
      _id: id.toString(),
    });
  }

  async deactivateByNameNotIn(names: string[]): Promise<number> {
    const result = await this.compositionsModel.updateMany(
      { name: { $nin: names } },
      { $set: { active: false } }
    );
    return result.modifiedCount;
  }

  async removeByNameNotIn(names: string[]): Promise<number> {
    const result = await this.compositionsModel.deleteMany({
      name: { $nin: names },
    });
    return result.deletedCount || 0;
  }

  // --- V1 Legacy Search ---
  async findCompositionsByUnits(
    unitIdentifiers: string[],
    searchInAllArrays: boolean = true,
  ): Promise<Composition[]> {
    const where: FilterQuery<CompositionSchemaClass> = {
      $and: unitIdentifiers.map((identifier) => {
        const escapedIdentifier = identifier.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&',
        );
        const regexMatch = { $regex: escapedIdentifier, $options: 'i' };

        if (searchInAllArrays) {
          return {
            $or: [
              { 'units.championId': regexMatch },
              { 'units.championKey': regexMatch },
              { 'earlyGame.championId': regexMatch },
              { 'earlyGame.championKey': regexMatch },
              { 'midGame.championId': regexMatch },
              { 'midGame.championKey': regexMatch },
              { 'bench.championId': regexMatch },
              { 'bench.championKey': regexMatch },
            ],
          };
        } else {
          return {
            $or: [
              { 'units.championId': regexMatch },
              { 'units.championKey': regexMatch },
            ],
          };
        }
      }),
    };

    const compositionObjects = await this.compositionsModel
      .find(where)
      .sort({ order: 1 })
      .exec();
    return compositionObjects.map((compositionObject) =>
      CompositionMapper.toDomain(compositionObject),
    );
  }

  // --- V2 Advanced Search (Units + Items + Augments) ---
  async search(params: {
    units?: string[];
    items?: string[];
    augments?: string[];
    searchInAllArrays?: boolean;
  }): Promise<Composition[]> {
    const { units, items, augments, searchInAllArrays } = params;

    // Nếu không có tiêu chí nào thì trả về rỗng
    if (
      (!units || units.length === 0) &&
      (!items || items.length === 0) &&
      (!augments || augments.length === 0)
    ) {
      return [];
    }

    const andConditions: any[] = [];

    // 1. Units Logic
    if (units && units.length > 0) {
      const unitConditions = units.map((u) => {
        const escapedU = u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = { $regex: escapedU, $options: 'i' };
        
        const orConditions: any[] = [
          { 'units.championId': regex },
          { 'units.championKey': regex },
          { 'units.name': regex }, // Thêm search theo Name hiển thị
        ];

        if (searchInAllArrays) {
          orConditions.push(
            { 'earlyGame.championId': regex },
            { 'midGame.championId': regex },
            { 'bench.championId': regex },
          );
        }
        return { $or: orConditions };
      });
      andConditions.push({ $and: unitConditions });
    }

    // 2. Items Logic
    if (items && items.length > 0) {
      const itemConditions = items.map((i) => {
        const escapedI = i.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // MongoDB tự tìm trong nested array: units[].items[]
        return { 'units.items': { $regex: escapedI, $options: 'i' } };
      });
      andConditions.push({ $and: itemConditions });
    }

    // 3. Augments Logic
    if (augments && augments.length > 0) {
      const augmentConditions = augments.map((a) => {
        const escapedA = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return { 'augments.name': { $regex: escapedA, $options: 'i' } };
      });
      andConditions.push({ $and: augmentConditions });
    }

    const filter = andConditions.length > 0 ? { $and: andConditions } : {};

    const entities = await this.compositionsModel
      .find(filter)
      .limit(50)
      .sort({ order: 1, createdAt: -1 }) // Ưu tiên order thấp → cao, rồi mới nhất (tier chỉ có trong GET list)
      .exec();

    return entities.map((entity) => CompositionMapper.toDomain(entity));
  }
}