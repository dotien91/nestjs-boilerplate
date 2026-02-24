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
import { CompositionSchemaClass } from '../../../../../compositions/infrastructure/persistence/document/entities/composition.schema';

@Injectable()
export class TftItemsDocumentRepository implements TftItemRepository {
  constructor(
    @InjectModel(TftItemSchemaClass.name)
    private readonly tftItemsModel: Model<TftItemSchemaClass>,
    @InjectModel(CompositionSchemaClass.name)
    private readonly compositionsModel: Model<any>,
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
  }): Promise<{ data: TftItem[]; totalCount: number }> {
    const where: any = {};

    // 1. Lọc theo tên
    if (filterOptions?.name) {
      where.name = { $regex: filterOptions.name, $options: 'i' };
    }

    // 2. Lọc theo apiName
    if (filterOptions?.apiName) {
      where.apiName = filterOptions.apiName;
    }

    // 3. Lọc theo Trait
    if (filterOptions?.trait) {
      where.$or = [
        { associatedTraits: filterOptions.trait },
        { incompatibleTraits: filterOptions.trait },
      ];
    }

    // 4. Lọc theo Unique
    if (filterOptions?.unique !== undefined && filterOptions?.unique !== null) {
      where.unique = filterOptions.unique;
    }

    // 5. Lọc theo Tier
    if (filterOptions?.tier) {
      where.tier = filterOptions.tier;
    }

    // 6. LỌC TRANG BỊ CÓ/KHÔNG CÓ CÔNG THỨC GHÉP (hasComposition)
    if (filterOptions?.hasComposition !== undefined && filterOptions?.hasComposition !== null) {
      const isHasComp = filterOptions.hasComposition === true || String(filterOptions.hasComposition) === 'true';

      if (isHasComp) {
        // true -> Lấy những item CÓ công thức ghép (Mảng composition có ít nhất phần tử đầu tiên)
        where['composition.0'] = { $exists: true };
      } else {
        // false -> Lấy những item KHÔNG CÓ công thức ghép (Mảng composition rỗng)
        where.composition = { $size: 0 };
      }
    }

    // --- PIPELINE AGGREGATION ---
    const pipeline: any[] = [
      { $match: where },
      // Thêm field tierOrder để sắp xếp chuẩn từ S -> E
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
              default: 6, // Các item không có tier hoặc tier khác sẽ nằm cuối
            },
          },
        },
      },
    ];

    // Build sort object
    const sortObj: any = { tierOrder: 1 }; // Mặc định luôn ưu tiên Tier trước

    if (sortOptions && sortOptions.length > 0) {
      sortOptions.forEach((sort) => {
        const field = sort.orderBy === 'id' ? '_id' : sort.orderBy;
        // Bỏ qua nếu user định sort theo tierOrder (vì ta đã làm mặc định rồi)
        if (field !== 'tierOrder') {
          sortObj[field] = sort.order.toUpperCase() === 'ASC' ? 1 : -1;
        }
      });
    } else {
      // Nếu không sort gì thêm, xếp theo tên A-Z
      sortObj.name = 1;
    }

    // $facet: vừa đếm total vừa lấy data phân trang
    pipeline.push({
      $facet: {
        total: [{ $count: 'count' }],
        rows: [
          { $sort: sortObj },
          { $skip: (paginationOptions.page - 1) * paginationOptions.limit },
          { $limit: paginationOptions.limit },
          { $unset: 'tierOrder' },
        ],
      },
    });

    const result = await this.tftItemsModel.aggregate(pipeline);
    const totalCount = result[0]?.total?.[0]?.count ?? 0;
    const itemObjects = result[0]?.rows ?? [];

    return {
      data: itemObjects.map((itemObject: any) => TftItemMapper.toDomain(itemObject)),
      totalCount,
    };
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

  private async getItemApiNamesFromCompositions(): Promise<string[]> {
    const result = await this.compositionsModel
      .aggregate([
        { $match: { $or: [{ 'units.0': { $exists: true } }, { 'carryItems.0': { $exists: true } }] } },
        {
          $project: {
            unitItemList: {
              $reduce: {
                input: { $ifNull: ['$units', []] },
                initialValue: [],
                in: { $concatArrays: ['$$value', { $ifNull: ['$$this.items', []] }] },
              },
            },
            carryItemList: {
              $reduce: {
                input: { $ifNull: ['$carryItems', []] },
                initialValue: [],
                in: { $concatArrays: ['$$value', { $ifNull: ['$$this.items', []] }] },
              },
            },
          },
        },
        { $project: { allItems: { $concatArrays: ['$unitItemList', '$carryItemList'] } } },
        { $unwind: '$allItems' },
        { $match: { allItems: { $exists: true, $ne: '', $type: 'string' } } },
        { $group: { _id: null, apiNames: { $addToSet: '$allItems' } } },
      ])
      .exec();

    const doc = result[0];
    const apiNames = doc?.apiNames && Array.isArray(doc.apiNames) ? doc.apiNames : [];
    return apiNames.filter((s: string) => typeof s === 'string' && s.length > 0);
  }
}

