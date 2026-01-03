import { NullableType } from '../../../utils/types/nullable.type';
import { Feedback } from '../../domain/feedback';

export abstract class FeedbackRepository {
  abstract create(data: Feedback): Promise<Feedback>;

  abstract findById(id: Feedback['id']): Promise<NullableType<Feedback>>;
}

