import { PartialType } from '@nestjs/swagger';
import { CreateTftRoleDto } from './create-tft-role.dto';

export class UpdateTftRoleDto extends PartialType(CreateTftRoleDto) {}

