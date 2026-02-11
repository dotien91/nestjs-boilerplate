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
export class CompositionsDocumentRepository
  implements CompositionRepository
{
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

    if (filterOptions?.isLateGame !== undefined && filterOptions?.isLateGame !== null) {
      where.isLateGame = filterOptions.isLateGame;
    }

    if (filterOptions?.isOp !== undefined && filterOptions?.isOp !== null) {
      where.isOp = filterOptions.isOp;
    }

    // Filter by units
    if (filterOptions?.units && filterOptions.units.length > 0) {
      const searchInAllArrays = filterOptions.searchInAllArrays ?? true;
      const unitFilters = filterOptions.units.map(identifier => {
        // Escape special regex characters
        const escapedIdentifier = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regexMatch = { $regex: escapedIdentifier, $options: 'i' };

        if (searchInAllArrays) {
          // Search in units, earlyGame, midGame, and bench
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
          // Search only in units array
          return {
            $or: [
              { 'units.championId': regexMatch },
              { 'units.championKey': regexMatch },
            ],
          };
        }
      });

      // Add unit filters to $and conditions
      andConditions.push(...unitFilters);
    }

    // Combine base filters and unit filters
    if (andConditions.length > 0) {
      // If we have base filters, add them to $and as well
      const baseFilterKeys = Object.keys(where);
      if (baseFilterKeys.length > 0) {
        const baseFilters: any = {};
        baseFilterKeys.forEach(key => {
          baseFilters[key] = where[key];
          delete where[key];
        });
        andConditions.unshift(baseFilters);
      }
      where.$and = andConditions;
    }

    // Luôn sort: isOp (OP trước) -> tier (S > A > B > C > D) -> các field khác -> thời gian
    const pipeline: any[] = [
      { $match: where },
      {
        $addFields: {
          // isOp: true -> 0 (ưu tiên trước), false -> 1
          isOpOrder: { $cond: [{ $eq: ['$isOp', true] }, 0, 1] },
          // tierOrder: S=0, A=1, B=2, C=3, D=4, null/khác=5
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

    // Build sort: isOp trước (0 rồi 1), sau đó tierOrder (S rồi A, B, C, D), rồi field khác
    const sortObj: any = { isOpOrder: 1, tierOrder: 1 };

    if (sortOptions && sortOptions.length > 0) {
      // Thêm các sort options từ user (sau isOp và tier)
      sortOptions.forEach((sort) => {
        const field = sort.orderBy === 'id' ? '_id' : sort.orderBy;
        if (field !== 'tierOrder' && field !== 'tier' && field !== 'isOpOrder' && field !== 'isOp') {
          sortObj[field] = sort.order.toUpperCase() === 'ASC' ? 1 : -1;
        }
      });
    }

    // Sau cùng, luôn sort theo updatedAt DESC (gần nhất trước) nếu chưa có sort theo updatedAt
    if (!sortObj.updatedAt && !sortObj.createdAt) {
      sortObj.updatedAt = -1; // DESC - gần nhất trước
    }

    pipeline.push(
      { $sort: sortObj },
      // Pagination
      { $skip: (paginationOptions.page - 1) * paginationOptions.limit },
      { $limit: paginationOptions.limit },
      // Remove helper fields trước khi return
      { $unset: ['tierOrder', 'isOpOrder'] },
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

  async removeByNameNotIn(names: string[]): Promise<number> {
    const result = await this.compositionsModel.deleteMany({
      name: { $nin: names },
    });
    return result.deletedCount || 0;
  }

  async findCompositionsByUnits(
    unitIdentifiers: string[],
    searchInAllArrays: boolean = true,
  ): Promise<Composition[]> {
    // Build MongoDB query to find compositions containing ALL specified units
    // Use case-insensitive regex for flexible matching
    const where: FilterQuery<CompositionSchemaClass> = {
      $and: unitIdentifiers.map(identifier => {
        // Escape special regex characters
        const escapedIdentifier = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regexMatch = { $regex: escapedIdentifier, $options: 'i' };

        if (searchInAllArrays) {
          // Search in units, earlyGame, midGame, and bench
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
          // Search only in units array
          return {
            $or: [
              { 'units.championId': regexMatch },
              { 'units.championKey': regexMatch },
            ],
          };
        }
      }),
    };

    const compositionObjects = await this.compositionsModel.find(where);

    return compositionObjects.map((compositionObject) =>
      CompositionMapper.toDomain(compositionObject),
    );
  }
}

