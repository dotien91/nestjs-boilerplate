import { PartialType } from '@nestjs/swagger';
import { CreateTftAugmentDto } from './create-tft-augment.dto';

export class UpdateTftAugmentDto extends PartialType(CreateTftAugmentDto) {}

