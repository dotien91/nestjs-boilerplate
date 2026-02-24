import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { TftAugment } from '../../../../domain/tft-augment';
import { TftAugmentRepository } from '../../tft-augment.repository';
import {
  FilterTftAugmentDto,
  SortTftAugmentDto,
} from '../../../../dto/query-tft-augment.dto';
import { TftAugmentSchemaClass } from '../entities/tft-augment.schema';
import { TftAugmentMapper } from '../mappers/tft-augment.mapper';

@Injectable()
export class TftAugmentsDocumentRepository implements TftAugmentRepository {
  constructor(
    @InjectModel(TftAugmentSchemaClass.name)
    private readonly tftAugmentsModel: Model<TftAugmentSchemaClass>,
  ) {}

  async create(data: TftAugment): Promise<TftAugment> {
    const persistenceModel = TftAugmentMapper.toPersistence(data);
    const createdAugment = new this.tftAugmentsModel(persistenceModel);
    const augmentObject = await createdAugment.save();
    return TftAugmentMapper.toDomain(augmentObject);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTftAugmentDto | null;
    sortOptions?: SortTftAugmentDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<{ data: TftAugment[]; totalCount: number }> {
    const where: FilterQuery<TftAugmentSchemaClass> = {};

    if (filterOptions?.name) {
      where.name = { $regex: filterOptions.name, $options: 'i' };
    }

    if (filterOptions?.apiName) {
      where.apiName = filterOptions.apiName;
    }

    if (filterOptions?.trait) {
      where.$or = [
        { associatedTraits: filterOptions.trait },
        { incompatibleTraits: filterOptions.trait },
      ];
    }

    if (filterOptions?.stage) {
      where.tags = filterOptions.stage;
    }

    if (filterOptions?.unique !== undefined && filterOptions?.unique !== null) {
      where.unique = filterOptions.unique;
    }

    const sortObj = sortOptions?.reduce(
      (accumulator, sort) => ({
        ...accumulator,
        [sort.orderBy === 'id' ? '_id' : sort.orderBy]:
          sort.order.toUpperCase() === 'ASC' ? 1 : -1,
      }),
      {},
    );

    const [totalCount, augmentObjects] = await Promise.all([
      this.tftAugmentsModel.countDocuments(where),
      this.tftAugmentsModel
        .find(where)
        .sort(sortObj ?? {})
        .skip((paginationOptions.page - 1) * paginationOptions.limit)
        .limit(paginationOptions.limit),
    ]);

    const data = augmentObjects.map((augmentObject) =>
      TftAugmentMapper.toDomain(augmentObject),
    );
    return { data, totalCount };
  }

  async findById(id: TftAugment['id']): Promise<NullableType<TftAugment>> {
    const augmentObject = await this.tftAugmentsModel.findById(id);
    return augmentObject ? TftAugmentMapper.toDomain(augmentObject) : null;
  }

  async findByApiName(apiName: string): Promise<NullableType<TftAugment>> {
    if (!apiName) return null;

    const augmentObject = await this.tftAugmentsModel.findOne({ apiName });
    return augmentObject ? TftAugmentMapper.toDomain(augmentObject) : null;
  }

  async update(
    id: TftAugment['id'],
    payload: Partial<TftAugment>,
  ): Promise<TftAugment | null> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const augment = await this.tftAugmentsModel.findOne(filter);

    if (!augment) {
      return null;
    }

    const augmentObject = await this.tftAugmentsModel.findOneAndUpdate(
      filter,
      TftAugmentMapper.toPersistence({
        ...TftAugmentMapper.toDomain(augment),
        ...clonedPayload,
      }),
      { new: true },
    );

    return augmentObject ? TftAugmentMapper.toDomain(augmentObject) : null;
  }

  async remove(id: TftAugment['id']): Promise<void> {
    await this.tftAugmentsModel.deleteOne({ _id: id.toString() });
  }
}

