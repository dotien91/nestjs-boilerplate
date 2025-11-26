import { PartialType } from '@nestjs/swagger';
import { CreateTftItemDto } from './create-tft-item.dto';

export class UpdateTftItemDto extends PartialType(CreateTftItemDto) {}

