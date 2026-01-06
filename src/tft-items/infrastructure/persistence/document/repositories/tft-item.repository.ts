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

    if (filterOptions?.tier) {
      where.tier = filterOptions.tier;
    }

    // Luôn sort theo tier (S > A > B > C > D > E) trước, sau đó mới sort theo các field khác
    const pipeline: any[] = [
      { $match: where },
      // Thêm field tierOrder để sort: S=0, A=1, B=2, C=3, D=4, E=5, null/khác=6
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
                { case: { $eq: [{ $toUpper: '$tier' }, 'E'] }, then: 5 },
              ],
              default: 6,
            },
          },
        },
      },
    ];

    // Build sort object: luôn sort theo tierOrder trước, sau đó mới sort theo các field khác
    const sortObj: any = { tierOrder: 1 }; // Tier từ S xuống (0 -> 6)

    if (sortOptions && sortOptions.length > 0) {
      // Thêm các sort options từ user
      sortOptions.forEach((sort) => {
        const field = sort.orderBy === 'id' ? '_id' : sort.orderBy;
        // Bỏ qua nếu đã có tierOrder (không sort tier theo user option)
        if (field !== 'tierOrder') {
          sortObj[field] = sort.order.toUpperCase() === 'ASC' ? 1 : -1;
        }
      });
    } else {
      // Nếu không có sort options, mặc định sort theo name sau tier
      sortObj.name = 1;
    }

    pipeline.push(
      { $sort: sortObj },
      // Pagination
      { $skip: (paginationOptions.page - 1) * paginationOptions.limit },
      { $limit: paginationOptions.limit },
      // Remove tierOrder field trước khi return
      { $unset: 'tierOrder' },
    );

    const itemObjects = await this.tftItemsModel.aggregate(pipeline);
    return itemObjects.map((itemObject: any) => TftItemMapper.toDomain(itemObject));
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

