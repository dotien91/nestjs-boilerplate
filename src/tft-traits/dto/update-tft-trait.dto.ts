import { PartialType } from '@nestjs/swagger';
import { CreateTftTraitDto } from './create-tft-trait.dto';

export class UpdateTftTraitDto extends PartialType(CreateTftTraitDto) {}

