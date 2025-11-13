import { ApiProperty } from '@nestjs/swagger';
import { Item } from '../domain/item';

export class ItemDto implements Item {
  @ApiProperty()
  id: number | string;

  @ApiProperty()
  apiName: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  enName?: string | null;

  @ApiProperty()
  description: string;

  @ApiProperty()
  effects: Record<string, any>;

  @ApiProperty()
  composition: string[];

  @ApiProperty()
  associatedTraits: string[];

  @ApiProperty()
  incompatibleTraits: string[];

  @ApiProperty()
  tags: string[];

  @ApiProperty()
  unique: boolean;

  @ApiProperty()
  icon: string;

  @ApiProperty()
  variableMatches?: Array<{
    match: string;
    type: string;
    full_match: string;
    hash: string;
    value: number;
  }> | null;

  @ApiProperty()
  set?: string | null;

  @ApiProperty()
  isActive?: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
