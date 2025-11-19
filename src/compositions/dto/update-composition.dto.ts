import { PartialType } from '@nestjs/swagger';
import { CreateCompositionDto } from './create-composition.dto';

export class UpdateCompositionDto extends PartialType(CreateCompositionDto) {}

