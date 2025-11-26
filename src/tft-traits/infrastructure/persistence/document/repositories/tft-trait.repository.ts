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
      .limit(paginationOptions.limit);

    return traitObjects.map((traitObject) =>
      TftTraitMapper.toDomain(traitObject),
    );
  }

  async findById(id: TftTrait['id']): Promise<NullableType<TftTrait>> {
    const traitObject = await this.tftTraitsModel.findById(id);
    return traitObject ? TftTraitMapper.toDomain(traitObject) : null;
  }

  async findByApiName(apiName: string): Promise<NullableType<TftTrait>> {
    if (!apiName) return null;

    const traitObject = await this.tftTraitsModel.findOne({ apiName });
    return traitObject ? TftTraitMapper.toDomain(traitObject) : null;
  }

  async update(
    id: TftTrait['id'],
    payload: Partial<TftTrait>,
  ): Promise<TftTrait | null> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const trait = await this.tftTraitsModel.findOne(filter);

    if (!trait) {
      return null;
    }

    const traitObject = await this.tftTraitsModel.findOneAndUpdate(
      filter,
      TftTraitMapper.toPersistence({
        ...TftTraitMapper.toDomain(trait),
        ...clonedPayload,
      }),
      { new: true },
    );

    return traitObject ? TftTraitMapper.toDomain(traitObject) : null;
  }

  async remove(id: TftTrait['id']): Promise<void> {
    await this.tftTraitsModel.deleteOne({ _id: id.toString() });
  }
}

