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

    if (filterOptions?.name) {
      where.name = { $regex: filterOptions.name, $options: 'i' };
    }

    if (filterOptions?.compId) {
      where.compId = { $regex: filterOptions.compId, $options: 'i' };
    }

    if (filterOptions?.difficulty) {
      where.difficulty = filterOptions.difficulty;
    }

    if (filterOptions?.isLateGame !== undefined && filterOptions?.isLateGame !== null) {
      where.isLateGame = filterOptions.isLateGame;
    }

    const compositionObjects = await this.compositionsModel
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

    return compositionObjects.map((compositionObject) =>
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

  async remove(id: Composition['id']): Promise<void> {
    await this.compositionsModel.deleteOne({
      _id: id.toString(),
    });
  }
}

