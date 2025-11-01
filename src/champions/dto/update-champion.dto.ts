import { PartialType } from '@nestjs/swagger';
import { CreateChampionDto } from './create-champion.dto';

export class UpdateChampionDto extends PartialType(CreateChampionDto) {}
