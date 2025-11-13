import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ItemRepository } from '../../item.repository';
import { ItemSchemaClass, ItemSchemaDocument } from '../entities/item.schema';
import { Item } from '../../../../domain/item';
import { ItemMapper } from '../mappers/item.mapper';
import {
  FilterItemDto,
  SortItemDto,
} from '../../../../dto/query-item.dto';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class ItemsDocumentRepository implements ItemRepository {
  constructor(
    @InjectModel(ItemSchemaClass.name)
    private readonly itemModel: Model<ItemSchemaDocument>,
    private readonly mapper: ItemMapper,
  ) {}

  async create(
    data: Omit<Item, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>,
  ): Promise<Item> {
    const persistenceModel = this.mapper.toPersistence(data);
    const createdItem = new this.itemModel(persistenceModel);
    const savedItem = await createdItem.save();
    return this.mapper.toDomain(savedItem);
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
    const { page, limit } = paginationOptions;
    const skip = (page - 1) * limit;

    let query = this.itemModel.find();

    // Apply filters
    if (filterOptions) {
      if (filterOptions.apiName) {
        query = query.where('apiName').equals(filterOptions.apiName);
      }
      if (filterOptions.name) {
        query = query.where('name').regex(new RegExp(filterOptions.name, 'i'));
      }
      if (filterOptions.set) {
        query = query.where('set').equals(filterOptions.set);
      }
      if (filterOptions.isActive !== undefined) {
        query = query.where('isActive').equals(filterOptions.isActive);
      }
      if (filterOptions.associatedTraits && filterOptions.associatedTraits.length > 0) {
        query = query.where('associatedTraits').in(filterOptions.associatedTraits);
      }
      if (filterOptions.tags && filterOptions.tags.length > 0) {
        query = query.where('tags').in(filterOptions.tags);
      }
      if (filterOptions.unique !== undefined) {
        query = query.where('unique').equals(filterOptions.unique);
      }
    }

    // Apply sorting
    if (sortOptions && sortOptions.length > 0) {
      const sortObj: Record<string, 1 | -1> = {};
      sortOptions.forEach((sort) => {
        sortObj[sort.field] = sort.order === 'ASC' ? 1 : -1;
      });
      query = query.sort(sortObj);
    }

    const items = await query.skip(skip).limit(limit).exec();
    return items.map((item) => this.mapper.toDomain(item));
  }

  async findById(id: Item['id']): Promise<Item | null> {
    const item = await this.itemModel.findById(id).exec();
    if (!item) return null;
    return this.mapper.toDomain(item);
  }

  async findByApiName(apiName: string): Promise<Item | null> {
    const item = await this.itemModel.findOne({ apiName }).exec();
    if (!item) return null;
    return this.mapper.toDomain(item);
  }

  async findBySet(set: string): Promise<Item[]> {
    const items = await this.itemModel.find({ set }).exec();
    return items.map((item) => this.mapper.toDomain(item));
  }

  async findByAssociatedTraits(traits: string[]): Promise<Item[]> {
    const items = await this.itemModel
      .find({
        associatedTraits: { $in: traits },
      })
      .exec();
    return items.map((item) => this.mapper.toDomain(item));
  }

  async update(
    id: Item['id'],
    payload: Partial<Item>,
  ): Promise<Item | null> {
    const updatedItem = await this.itemModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
    if (!updatedItem) return null;
    return this.mapper.toDomain(updatedItem);
  }

  async remove(id: Item['id']): Promise<void> {
    await this.itemModel.findByIdAndDelete(id).exec();
  }
}
