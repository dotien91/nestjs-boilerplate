import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateTftRoleDto } from './dto/create-tft-role.dto';
import { UpdateTftRoleDto } from './dto/update-tft-role.dto';
import { NullableType } from '../utils/types/nullable.type';
import { TftRoleRepository } from './infrastructure/persistence/tft-role.repository';
import { TftRole } from './domain/tft-role';

@Injectable()
export class TftRolesService {
  constructor(private readonly tftRolesRepository: TftRoleRepository) {}

  async create(createTftRoleDto: CreateTftRoleDto): Promise<TftRole> {
    // Kiểm tra apiName đã tồn tại chưa
    const roleObject = await this.tftRolesRepository.findByApiName(
      createTftRoleDto.apiName,
    );
    if (roleObject) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          apiName: 'tftRoleApiNameAlreadyExists',
        },
      });
    }

    const role = new TftRole();
    role.apiName = createTftRoleDto.apiName;
    role.name = createTftRoleDto.name;
    role.description = createTftRoleDto.description;
    role.items = createTftRoleDto.items || [];
    role.createdAt = new Date();
    role.updatedAt = new Date();

    const createdRole = await this.tftRolesRepository.create(role);

    return createdRole;
  }

  async findMany(): Promise<TftRole[]> {
    return this.tftRolesRepository.findMany();
  }

  async findById(id: TftRole['id']): Promise<NullableType<TftRole>> {
    return this.tftRolesRepository.findById(id);
  }

  async findByApiName(apiName: string): Promise<NullableType<TftRole>> {
    return this.tftRolesRepository.findByApiName(apiName);
  }

  async update(
    id: TftRole['id'],
    updateTftRoleDto: UpdateTftRoleDto,
  ): Promise<TftRole | null> {
    // Kiểm tra apiName đã tồn tại chưa (nếu có thay đổi)
    if (updateTftRoleDto.apiName) {
      const roleObject = await this.tftRolesRepository.findByApiName(
        updateTftRoleDto.apiName,
      );
      if (roleObject && String(roleObject.id) !== String(id)) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            apiName: 'tftRoleApiNameAlreadyExists',
          },
        });
      }
    }

    return this.tftRolesRepository.update(id, updateTftRoleDto);
  }

  async remove(id: TftRole['id']): Promise<void> {
    await this.tftRolesRepository.remove(id);
  }
}

