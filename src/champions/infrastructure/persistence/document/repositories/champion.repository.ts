import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import {
  FilterChampionDto,
  SortChampionDto,
} from '../../../../dto/query-champion.dto';
import { Champion } from '../../../../domain/champion';
import { ChampionRepository } from '../../champion.repository';
import { ChampionSchemaClass } from '../entities/champion.schema';
import { ChampionMapper } from '../mappers/champion.mapper';

@Injectable()
export class ChampionsDocumentRepository implements ChampionRepository {
  constructor(
    @InjectModel(ChampionSchemaClass.name)
    private readonly championsModel: Model<ChampionSchemaClass>,
  ) {}

  async create(data: Champion): Promise<Champion> {
    const persistenceModel = ChampionMapper.toPersistence(data);
    const createdChampion = new this.championsModel(persistenceModel);
    const championObject = await createdChampion.save();
    return ChampionMapper.toDomain(championObject);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterChampionDto | null;
    sortOptions?: SortChampionDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Champion[]> {
    const where: FilterQuery<ChampionSchemaClass> = {};

    if (filterOptions?.name) {
      where.name = { $regex: filterOptions.name, $options: 'i' };
    }

    if (filterOptions?.key) {
      where.key = filterOptions.key;
    }

    if (filterOptions?.cost) {
      where.cost = filterOptions.cost;
    }

    if (filterOptions?.set) {
      where.set = filterOptions.set;
    }

    if (filterOptions?.trait) {
      where['traits.key'] = filterOptions.trait;
    }

    const championObjects = await this.championsModel
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

    return championObjects.map((championObject) =>
      ChampionMapper.toDomain(championObject),
    );
  }

  async findById(id: Champion['id']): Promise<NullableType<Champion>> {
    const championObject = await this.championsModel.findById(id);
    return championObject ? ChampionMapper.toDomain(championObject) : null;
  }

  async findByKey(key: Champion['key']): Promise<NullableType<Champion>> {
    if (!key) return null;

    const championObject = await this.championsModel.findOne({ key });
    return championObject ? ChampionMapper.toDomain(championObject) : null;
  }

  async findByCost(cost: Champion['cost']): Promise<Champion[]> {
    const championObjects = await this.championsModel.find({ cost });
    return championObjects.map((championObject) =>
      ChampionMapper.toDomain(championObject),
    );
  }

  async findByTrait(traitKey: string): Promise<Champion[]> {
    const championObjects = await this.championsModel.find({
      'traits.key': traitKey,
    });
    return championObjects.map((championObject) =>
      ChampionMapper.toDomain(championObject),
    );
  }

  async update(
    id: Champion['id'],
    payload: Partial<Champion>,
  ): Promise<Champion | null> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const champion = await this.championsModel.findOne(filter);

    if (!champion) {
      return null;
    }

    const championObject = await this.championsModel.findOneAndUpdate(
      filter,
      ChampionMapper.toPersistence({
        ...ChampionMapper.toDomain(champion),
        ...clonedPayload,
      }),
      { new: true },
    );

    return championObject ? ChampionMapper.toDomain(championObject) : null;
  }

  async remove(id: Champion['id']): Promise<void> {
    await this.championsModel.deleteOne({
      _id: id.toString(),
    });
  }
}
