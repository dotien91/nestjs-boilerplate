import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { TftAugmentOdd } from '../../../../domain/tft-augment-odd';
import { TftAugmentOddRepository } from '../../tft-augment-odd.repository';
import { TftAugmentOddSchemaClass } from '../entities/tft-augment-odd.schema';
import { TftAugmentOddMapper } from '../mappers/tft-augment-odd.mapper';

@Injectable()
export class TftAugmentOddsDocumentRepository
  implements TftAugmentOddRepository
{
  constructor(
    @InjectModel(TftAugmentOddSchemaClass.name)
    private readonly tftAugmentOddsModel: Model<TftAugmentOddSchemaClass>,
  ) {}

  async create(data: TftAugmentOdd): Promise<TftAugmentOdd> {
    const persistenceModel = TftAugmentOddMapper.toPersistence(data);
    const createdOdd = new this.tftAugmentOddsModel(persistenceModel);
    const oddObject = await createdOdd.save();
    return TftAugmentOddMapper.toDomain(oddObject);
  }

  async findMany(): Promise<TftAugmentOdd[]> {
    const oddObjects = await this.tftAugmentOddsModel.find();
    return oddObjects.map((oddObject) =>
      TftAugmentOddMapper.toDomain(oddObject),
    );
  }

  async findById(
    id: TftAugmentOdd['id'],
  ): Promise<NullableType<TftAugmentOdd>> {
    const oddObject = await this.tftAugmentOddsModel.findById(id);
    return oddObject ? TftAugmentOddMapper.toDomain(oddObject) : null;
  }

  async update(
    id: TftAugmentOdd['id'],
    payload: Partial<TftAugmentOdd>,
  ): Promise<TftAugmentOdd | null> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const odd = await this.tftAugmentOddsModel.findOne(filter);

    if (!odd) {
      return null;
    }

    const oddObject = await this.tftAugmentOddsModel.findOneAndUpdate(
      filter,
      TftAugmentOddMapper.toPersistence({
        ...TftAugmentOddMapper.toDomain(odd),
        ...clonedPayload,
      }),
      { new: true },
    );

    return oddObject ? TftAugmentOddMapper.toDomain(oddObject) : null;
  }

  async remove(id: TftAugmentOdd['id']): Promise<void> {
    await this.tftAugmentOddsModel.deleteOne({ _id: id.toString() });
  }
}

