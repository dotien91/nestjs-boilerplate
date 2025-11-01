import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { FilterTraitDto, SortTraitDto } from '../../../../dto/query-trait.dto';
import { Trait } from '../../../../domain/trait';
import { TraitRepository } from '../../trait.repository';
import { TraitSchemaClass } from '../entities/trait.schema';
import { TraitMapper } from '../mappers/trait.mapper';

@Injectable()
export class TraitsDocumentRepository implements TraitRepository {
  constructor(
    @InjectModel(TraitSchemaClass.name)
    private readonly traitsModel: Model<TraitSchemaClass>,
  ) {}

  async create(data: Trait): Promise<Trait> {
    const persistenceModel = TraitMapper.toPersistence(data);
    const createdTrait = new this.traitsModel(persistenceModel);
    const traitObject = await createdTrait.save();
    return TraitMapper.toDomain(traitObject);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTraitDto | null;
    sortOptions?: SortTraitDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Trait[]> {
    const where: FilterQuery<TraitSchemaClass> = {};

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

    const traitObjects = await this.traitsModel
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

    return traitObjects.map((traitObject) => TraitMapper.toDomain(traitObject));
  }

  async findById(id: Trait['id']): Promise<NullableType<Trait>> {
    const traitObject = await this.traitsModel.findById(id);
    return traitObject ? TraitMapper.toDomain(traitObject) : null;
  }

  async findByKey(key: Trait['key']): Promise<NullableType<Trait>> {
    if (!key) return null;

    const traitObject = await this.traitsModel.findOne({ key });
    return traitObject ? TraitMapper.toDomain(traitObject) : null;
  }

  async update(
    id: Trait['id'],
    payload: Partial<Trait>,
  ): Promise<Trait | null> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const trait = await this.traitsModel.findOne(filter);

    if (!trait) {
      return null;
    }

    const traitObject = await this.traitsModel.findOneAndUpdate(
      filter,
      TraitMapper.toPersistence({
        ...TraitMapper.toDomain(trait),
        ...clonedPayload,
      }),
      { new: true },
    );

    return traitObject ? TraitMapper.toDomain(traitObject) : null;
  }

  async remove(id: Trait['id']): Promise<void> {
    await this.traitsModel.deleteOne({
      _id: id.toString(),
    });
  }
}
