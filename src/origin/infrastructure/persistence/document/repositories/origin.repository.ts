import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import {
  FilterOriginDto,
  SortOriginDto,
} from '../../../../dto/query-origin.dto';
import { Origin } from '../../../../domain/origin';
import { OriginRepository } from '../../origin.repository';
import { OriginSchemaClass } from '../entities/origin.schema';
import { OriginMapper } from '../mappers/origin.mapper';

@Injectable()
export class OriginsDocumentRepository implements OriginRepository {
  constructor(
    @InjectModel(OriginSchemaClass.name)
    private readonly originsModel: Model<OriginSchemaClass>,
  ) {}

  async create(data: Origin): Promise<Origin> {
    const persistenceModel = OriginMapper.toPersistence(data);
    const createdOrigin = new this.originsModel(persistenceModel);
    const originObject = await createdOrigin.save();
    return OriginMapper.toDomain(originObject);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterOriginDto | null;
    sortOptions?: SortOriginDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Origin[]> {
    const where: FilterQuery<OriginSchemaClass> = {};

    // Debug: Log filter options và query
    console.log('🔍 Filter options:', JSON.stringify(filterOptions, null, 2));

    if (filterOptions?.name) {
      where.name = { $regex: filterOptions.name, $options: 'i' };
    }

    if (filterOptions?.key) {
      where.key = filterOptions.key;
    }

    if (filterOptions?.type) {
      where.type = filterOptions.type;
    }

    if (filterOptions?.set) {
      where.set = filterOptions.set;
    }

    // Debug: Log MongoDB query
    console.log('🔍 MongoDB where clause:', JSON.stringify(where, null, 2));

    const originObjects = await this.originsModel
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

    return originObjects.map((originObject) =>
      OriginMapper.toDomain(originObject),
    );
  }

  async findById(id: Origin['id']): Promise<NullableType<Origin>> {
    const originObject = await this.originsModel.findById(id);
    return originObject ? OriginMapper.toDomain(originObject) : null;
  }

  async findByKey(key: Origin['key']): Promise<NullableType<Origin>> {
    if (!key) return null;

    const originObject = await this.originsModel.findOne({ key });
    return originObject ? OriginMapper.toDomain(originObject) : null;
  }

  async update(
    id: Origin['id'],
    payload: Partial<Origin>,
  ): Promise<Origin | null> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const origin = await this.originsModel.findOne(filter);

    if (!origin) {
      return null;
    }

    const originObject = await this.originsModel.findOneAndUpdate(
      filter,
      OriginMapper.toPersistence({
        ...OriginMapper.toDomain(origin),
        ...clonedPayload,
      }),
      { new: true },
    );

    return originObject ? OriginMapper.toDomain(originObject) : null;
  }

  async remove(id: Origin['id']): Promise<void> {
    await this.originsModel.deleteOne({
      _id: id.toString(),
    });
  }
}
