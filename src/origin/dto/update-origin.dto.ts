import { PartialType } from '@nestjs/swagger';
import { CreateOriginDto } from './create-origin.dto';

export class UpdateOriginDto extends PartialType(CreateOriginDto) {}
