import { NullableType } from '../../../utils/types/nullable.type';
import { TftAugmentOdd } from '../../domain/tft-augment-odd';

export abstract class TftAugmentOddRepository {
  abstract create(data: TftAugmentOdd): Promise<TftAugmentOdd>;

  abstract findMany(): Promise<TftAugmentOdd[]>;

  abstract findById(
    id: TftAugmentOdd['id'],
  ): Promise<NullableType<TftAugmentOdd>>;

  abstract update(
    id: TftAugmentOdd['id'],
    payload: Partial<TftAugmentOdd>,
  ): Promise<TftAugmentOdd | null>;

  abstract remove(id: TftAugmentOdd['id']): Promise<void>;
}

