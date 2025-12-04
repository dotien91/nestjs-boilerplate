import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types } from 'mongoose';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { TftItem } from '../../../../domain/tft-item';
import { TftItemRepository } from '../../tft-item.repository';
import { FilterTftItemDto, SortTftItemDto } from '../../../../dto/query-tft-item.dto';
import { TftItemSchemaClass } from '../entities/tft-item.schema';
import { TftItemMapper } from '../mappers/tft-item.mapper';

@Injectable()
export class TftItemsDocumentRepository implements TftItemRepository {
  constructor(
    @InjectModel(TftItemSchemaClass.name)
    private readonly tftItemsModel: Model<TftItemSchemaClass>,
  ) {}

  async create(data: TftItem): Promise<TftItem> {
    const persistenceModel = TftItemMapper.toPersistence(data);
    const createdItem = new this.tftItemsModel(persistenceModel);
    const itemObject = await createdItem.save();
    return TftItemMapper.toDomain(itemObject);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTftItemDto | null;
    sortOptions?: SortTftItemDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<TftItem[]> {
    const where: FilterQuery<TftItemSchemaClass> = {};

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

    if (filterOptions?.unique !== undefined && filterOptions?.unique !== null) {
      where.unique = filterOptions.unique;
    }

    const itemObjects = await this.tftItemsModel
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

    return itemObjects.map((itemObject) => TftItemMapper.toDomain(itemObject));
  }

  async findById(id: TftItem['id']): Promise<NullableType<TftItem>> {
    const itemObject = await this.tftItemsModel.findById(id);
    return itemObject ? TftItemMapper.toDomain(itemObject) : null;
  }

  async findByIds(ids: TftItem['id'][]): Promise<TftItem[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    // Remove duplicates and convert to ObjectId
    const uniqueIds = [...new Set(ids)];
    const objectIds = uniqueIds
      .map((id) => {
        try {
          // Try to convert to ObjectId
          return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null;
        } catch {
          return null;
        }
      })
      .filter((id) => id !== null) as Types.ObjectId[];

    if (objectIds.length === 0) {
      return [];
    }

    // Query by _id using ObjectId
    const itemObjects = await this.tftItemsModel.find({
      _id: { $in: objectIds },
    });
    return itemObjects.map((itemObject) => TftItemMapper.toDomain(itemObject));
  }

  async findByApiName(apiName: string): Promise<NullableType<TftItem>> {
    if (!apiName) return null;

    const itemObject = await this.tftItemsModel.findOne({ apiName });
    return itemObject ? TftItemMapper.toDomain(itemObject) : null;
  }

  async update(
    id: TftItem['id'],
    payload: Partial<TftItem>,
  ): Promise<TftItem | null> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const item = await this.tftItemsModel.findOne(filter);

    if (!item) {
      return null;
    }

    const itemObject = await this.tftItemsModel.findOneAndUpdate(
      filter,
      TftItemMapper.toPersistence({
        ...TftItemMapper.toDomain(item),
        ...clonedPayload,
      }),
      { new: true },
    );

    return itemObject ? TftItemMapper.toDomain(itemObject) : null;
  }

  async remove(id: TftItem['id']): Promise<void> {
    await this.tftItemsModel.deleteOne({ _id: id.toString() });
  }
}

