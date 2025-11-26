import { PartialType } from '@nestjs/swagger';
import { CreateTftAugmentOddDto } from './create-tft-augment-odd.dto';

export class UpdateTftAugmentOddDto extends PartialType(CreateTftAugmentOddDto) {}

