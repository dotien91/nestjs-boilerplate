import { NullableType } from '../../../utils/types/nullable.type';
import { TftRole } from '../../domain/tft-role';

export abstract class TftRoleRepository {
  abstract create(data: TftRole): Promise<TftRole>;

  abstract findMany(): Promise<TftRole[]>;

  abstract findById(id: TftRole['id']): Promise<NullableType<TftRole>>;

  abstract findByApiName(apiName: string): Promise<NullableType<TftRole>>;

  abstract update(
    id: TftRole['id'],
    payload: Partial<TftRole>,
  ): Promise<TftRole | null>;

  abstract remove(id: TftRole['id']): Promise<void>;
}

