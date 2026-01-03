import { NullableType } from '../../../utils/types/nullable.type';
import { ScreenTracking } from '../../domain/screen-tracking';

export abstract class ScreenTrackingRepository {
  abstract create(data: ScreenTracking): Promise<ScreenTracking>;

  abstract findById(id: ScreenTracking['id']): Promise<NullableType<ScreenTracking>>;
}

