import { PartialType } from '@nestjs/swagger';
import { CreateTftArmoryItemDto } from './create-tft-armory-item.dto';

export class UpdateTftArmoryItemDto extends PartialType(CreateTftArmoryItemDto) {}

