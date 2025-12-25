import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { TftTrait } from '../../../../domain/tft-trait';
import { TftTraitRepository } from '../../tft-trait.repository';
import {
  FilterTftTraitDto,
  SortTftTraitDto,
} from '../../../../dto/query-tft-trait.dto';
import { TftTraitSchemaClass } from '../entities/tft-trait.schema';
import { TftTraitMapper } from '../mappers/tft-trait.mapper';

@Injectable()
export class TftTraitsDocumentRepository implements TftTraitRepository {
  constructor(
    @InjectModel(TftTraitSchemaClass.name)
    private readonly tftTraitsModel: Model<TftTraitSchemaClass>,
  ) {}

  /**
   * Generate icon URL from CDN based on trait name
   */
  private generateIconUrl(apiName: string, name: string): string {
    // Extract trait name from apiName (e.g., TFT16_Longshot -> longshot)
    // or use name directly
    const traitName = apiName
      ? apiName.replace(/^TFT\d+_/, '').toLowerCase()
      : name.toLowerCase();
    
    return `https://cdn.metatft.com/file/metatft/traits/${traitName}.png`;
  }

  /**
   * Convert lean MongoDB object to TftTrait domain entity
   * This avoids circular reference issues when serializing
   */
  private leanToDomain(traitObject: any): TftTrait {
    const domainEntity = new TftTrait();
    domainEntity.id = traitObject._id?.toString() || traitObject._id;
    domainEntity.apiName = traitObject.apiName;
    domainEntity.name = traitObject.name;
    domainEntity.enName = traitObject.enName;
    domainEntity.desc = traitObject.desc;
    // Always generate icon from CDN (override any existing icon in DB)
    domainEntity.icon = this.generateIconUrl(traitObject.apiName, traitObject.name);
    // Deep clone nested objects to avoid circular references
    domainEntity.effects = traitObject.effects ? JSON.parse(JSON.stringify(traitObject.effects)) : [];
    domainEntity.units = traitObject.units ? JSON.parse(JSON.stringify(traitObject.units)) : [];
    domainEntity.unitProperties = traitObject.unitProperties ? JSON.parse(JSON.stringify(traitObject.unitProperties)) : {};
    domainEntity.type = traitObject.type || null;
    domainEntity.createdAt = traitObject.createdAt;
    domainEntity.updatedAt = traitObject.updatedAt;
    domainEntity.deletedAt = traitObject.deletedAt;
    return domainEntity;
  }

  async create(data: TftTrait): Promise<TftTrait> {
    const persistenceModel = TftTraitMapper.toPersistence(data);
    const createdTrait = new this.tftTraitsModel(persistenceModel);
    const traitObject = await createdTrait.save();
    return TftTraitMapper.toDomain(traitObject);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTftTraitDto | null;
    sortOptions?: SortTftTraitDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<TftTrait[]> {
    const where: FilterQuery<TftTraitSchemaClass> = {};

    if (filterOptions?.name) {
      where.name = { $regex: filterOptions.name, $options: 'i' };
    }

    if (filterOptions?.apiName) {
      where.apiName = filterOptions.apiName;
    }

    if (filterOptions?.type) {
      where.type = filterOptions.type;
    }

    const traitObjects = await this.tftTraitsModel
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
      .limit(paginationOptions.limit)
      .lean();

    return traitObjects.map((traitObject: any) => this.leanToDomain(traitObject));
  }

  async findById(id: TftTrait['id']): Promise<NullableType<TftTrait>> {
    const traitObject = await this.tftTraitsModel.findById(id).lean();
    return traitObject ? this.leanToDomain(traitObject) : null;
  }

  async findByApiName(apiName: string): Promise<NullableType<TftTrait>> {
    if (!apiName) return null;

    const traitObject = await this.tftTraitsModel.findOne({ apiName }).lean();
    return traitObject ? this.leanToDomain(traitObject) : null;
  }

  async update(
    id: TftTrait['id'],
    payload: Partial<TftTrait>,
  ): Promise<TftTrait | null> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const trait = await this.tftTraitsModel.findOne(filter).lean();

    if (!trait) {
      return null;
    }

    const currentTrait = this.leanToDomain(trait);
    const traitObject = await this.tftTraitsModel.findOneAndUpdate(
      filter,
      TftTraitMapper.toPersistence({
        ...currentTrait,
        ...clonedPayload,
      }),
      { new: true },
    ).lean();

    return traitObject ? this.leanToDomain(traitObject) : null;
  }

  async remove(id: TftTrait['id']): Promise<void> {
    await this.tftTraitsModel.deleteOne({ _id: id.toString() });
  }
}

