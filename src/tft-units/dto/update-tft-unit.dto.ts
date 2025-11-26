import { PartialType } from '@nestjs/swagger';
import { CreateTftUnitDto } from './create-tft-unit.dto';

export class UpdateTftUnitDto extends PartialType(CreateTftUnitDto) {}

