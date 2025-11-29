import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import {
  FilterItemDto,
  SortItemDto,
} from '../../../../dto/query-item.dto';
import { Item } from '../../../../domain/item';
import { ItemRepository } from '../../item.repository';
import { ItemSchemaClass } from '../entities/item.schema';
import { ItemMapper } from '../mappers/item.mapper';
import { ItemStatusEnum } from '../../../../items-status.enum';

@Injectable()
export class ItemsDocumentRepository implements ItemRepository {
  constructor(
    @InjectModel(ItemSchemaClass.name)
    private readonly itemsModel: Model<ItemSchemaClass>,
  ) {}

  async create(data: Item): Promise<Item> {
    const persistenceModel = ItemMapper.toPersistence(data);
    const createdItem = new this.itemsModel(persistenceModel);
    const itemObject = await createdItem.save();
    return ItemMapper.toDomain(itemObject);
  }

  async bulkCreate(items: Omit<Item, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>[]): Promise<Item[]> {
    const persistenceModels = items.map(item => ItemMapper.toPersistence(item as Item));
    const createdItems = await this.itemsModel.insertMany(persistenceModels, { ordered: false });
    return createdItems.map(item => ItemMapper.toDomain(item));
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterItemDto | null;
    sortOptions?: SortItemDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Item[]> {
    const where: FilterQuery<ItemSchemaClass> = {};

    if (filterOptions?.name) {
      where.name = { $regex: filterOptions.name, $options: 'i' };
    }

    if (filterOptions?.apiName) {
      where.apiName = filterOptions.apiName;
    }

    if (filterOptions?.tag) {
      where.tags = { $in: [filterOptions.tag] };
    }

    if (filterOptions?.unique !== undefined) {
      where.unique = filterOptions.unique;
    }

    if (filterOptions?.disabled !== undefined) {
      where.disabled = filterOptions.disabled;
    }

    // Mặc định chỉ trả về items có status = 'active'
    // Nếu user truyền filter status khác thì dùng filter đó
    if (filterOptions?.status !== undefined) {
      where.status = filterOptions.status;
    } else {
      where.status = ItemStatusEnum.ACTIVE;
    }

    const itemObjects = await this.itemsModel
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
      ItemMapper.toDomain(itemObject),
    );
  }

  async findById(id: Item['id']): Promise<NullableType<Item>> {
    const itemObject = await this.itemsModel.findById(id);
    return itemObject ? ItemMapper.toDomain(itemObject) : null;
  }

  async findByApiName(apiName: Item['apiName']): Promise<NullableType<Item>> {
    if (!apiName) return null;

    const itemObject = await this.itemsModel.findOne({ apiName });
    return itemObject ? ItemMapper.toDomain(itemObject) : null;
  }

  async update(
    id: Item['id'],
    payload: Partial<Item>,
  ): Promise<Item | null> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const item = await this.itemsModel.findOne(filter);

    if (!item) {
      return null;
    }

    const itemObject = await this.itemsModel.findOneAndUpdate(
      filter,
      ItemMapper.toPersistence({
        ...ItemMapper.toDomain(item),
        ...clonedPayload,
      }),
      { new: true },
    );

    return itemObject ? ItemMapper.toDomain(itemObject) : null;
  }

  async updateByApiName(
    apiName: Item['apiName'],
    payload: Partial<Item>,
  ): Promise<Item | null> {
    if (!apiName) return null;

    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { apiName };
    const item = await this.itemsModel.findOne(filter);

    if (!item) {
      return null;
    }

    const itemObject = await this.itemsModel.findOneAndUpdate(
      filter,
      ItemMapper.toPersistence({
        ...ItemMapper.toDomain(item),
        ...clonedPayload,
      }),
      { new: true },
    );

    return itemObject ? ItemMapper.toDomain(itemObject) : null;
  }

  async remove(id: Item['id']): Promise<void> {
    await this.itemsModel.deleteOne({
      _id: id.toString(),
    });
  }

  async findItemsWithoutIcon(): Promise<Item[]> {
    const itemObjects = await this.itemsModel.find({
      $or: [
        { icon: null },
        { icon: { $exists: false } },
        { icon: '' },
      ],
    });

    return itemObjects.map((itemObject) =>
      ItemMapper.toDomain(itemObject),
    );
  }

  async bulkUpdateItemsWithoutIcon(): Promise<number> {
    const result = await this.itemsModel.updateMany(
      {
        $or: [
          { icon: null },
          { icon: { $exists: false } },
          { icon: '' },
        ],
      },
      {
        $set: {
          disabled: false,
        },
      },
    );

    return result.modifiedCount;
  }

  async findAll(): Promise<Item[]> {
    const itemObjects = await this.itemsModel.find({});
    return itemObjects.map((itemObject) =>
      ItemMapper.toDomain(itemObject),
    );
  }
}

