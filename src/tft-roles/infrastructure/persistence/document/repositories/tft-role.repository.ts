import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { TftRole } from '../../../../domain/tft-role';
import { TftRoleRepository } from '../../tft-role.repository';
import { TftRoleSchemaClass } from '../entities/tft-role.schema';
import { TftRoleMapper } from '../mappers/tft-role.mapper';

@Injectable()
export class TftRolesDocumentRepository implements TftRoleRepository {
  constructor(
    @InjectModel(TftRoleSchemaClass.name)
    private readonly tftRolesModel: Model<TftRoleSchemaClass>,
  ) {}

  async create(data: TftRole): Promise<TftRole> {
    const persistenceModel = TftRoleMapper.toPersistence(data);
    const createdRole = new this.tftRolesModel(persistenceModel);
    const roleObject = await createdRole.save();
    return TftRoleMapper.toDomain(roleObject);
  }

  async findMany(): Promise<TftRole[]> {
    const roleObjects = await this.tftRolesModel.find();
    return roleObjects.map((roleObject) => TftRoleMapper.toDomain(roleObject));
  }

  async findById(id: TftRole['id']): Promise<NullableType<TftRole>> {
    const roleObject = await this.tftRolesModel.findById(id);
    return roleObject ? TftRoleMapper.toDomain(roleObject) : null;
  }

  async findByApiName(apiName: string): Promise<NullableType<TftRole>> {
    if (!apiName) return null;

    const roleObject = await this.tftRolesModel.findOne({ apiName });
    return roleObject ? TftRoleMapper.toDomain(roleObject) : null;
  }

  async update(
    id: TftRole['id'],
    payload: Partial<TftRole>,
  ): Promise<TftRole | null> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const role = await this.tftRolesModel.findOne(filter);

    if (!role) {
      return null;
    }

    const roleObject = await this.tftRolesModel.findOneAndUpdate(
      filter,
      TftRoleMapper.toPersistence({
        ...TftRoleMapper.toDomain(role),
        ...clonedPayload,
      }),
      { new: true },
    );

    return roleObject ? TftRoleMapper.toDomain(roleObject) : null;
  }

  async remove(id: TftRole['id']): Promise<void> {
    await this.tftRolesModel.deleteOne({ _id: id.toString() });
  }
}

