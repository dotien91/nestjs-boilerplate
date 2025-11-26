import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { TftArmoryItem } from '../../../../domain/tft-armory-item';
import { TftArmoryItemRepository } from '../../tft-armory-item.repository';
import {
  FilterTftArmoryItemDto,
  SortTftArmoryItemDto,
} from '../../../../dto/query-tft-armory-item.dto';
import { TftArmoryItemSchemaClass } from '../entities/tft-armory-item.schema';
import { TftArmoryItemMapper } from '../mappers/tft-armory-item.mapper';

@Injectable()
export class TftArmoryItemsDocumentRepository
  implements TftArmoryItemRepository
{
  constructor(
    @InjectModel(TftArmoryItemSchemaClass.name)
    private readonly tftArmoryItemsModel: Model<TftArmoryItemSchemaClass>,
  ) {}

  async create(data: TftArmoryItem): Promise<TftArmoryItem> {
    const persistenceModel = TftArmoryItemMapper.toPersistence(data);
    const createdItem = new this.tftArmoryItemsModel(persistenceModel);
    const itemObject = await createdItem.save();
    return TftArmoryItemMapper.toDomain(itemObject);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTftArmoryItemDto | null;
    sortOptions?: SortTftArmoryItemDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<TftArmoryItem[]> {
    const where: FilterQuery<TftArmoryItemSchemaClass> = {};

    if (filterOptions?.name) {
      where.name = { $regex: filterOptions.name, $options: 'i' };
    }

    if (filterOptions?.apiName) {
      where.apiName = filterOptions.apiName;
    }

    const itemObjects = await this.tftArmoryItemsModel
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

    return itemObjects.map((itemObject) =>
      TftArmoryItemMapper.toDomain(itemObject),
    );
  }

  async findById(
    id: TftArmoryItem['id'],
  ): Promise<NullableType<TftArmoryItem>> {
    const itemObject = await this.tftArmoryItemsModel.findById(id);
    return itemObject ? TftArmoryItemMapper.toDomain(itemObject) : null;
  }

  async findByApiName(
    apiName: string,
  ): Promise<NullableType<TftArmoryItem>> {
    if (!apiName) return null;

    const itemObject = await this.tftArmoryItemsModel.findOne({ apiName });
    return itemObject ? TftArmoryItemMapper.toDomain(itemObject) : null;
  }

  async update(
    id: TftArmoryItem['id'],
    payload: Partial<TftArmoryItem>,
  ): Promise<TftArmoryItem | null> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const item = await this.tftArmoryItemsModel.findOne(filter);

    if (!item) {
      return null;
    }

    const itemObject = await this.tftArmoryItemsModel.findOneAndUpdate(
      filter,
      TftArmoryItemMapper.toPersistence({
        ...TftArmoryItemMapper.toDomain(item),
        ...clonedPayload,
      }),
      { new: true },
    );

    return itemObject ? TftArmoryItemMapper.toDomain(itemObject) : null;
  }

  async remove(id: TftArmoryItem['id']): Promise<void> {
    await this.tftArmoryItemsModel.deleteOne({ _id: id.toString() });
  }
}

