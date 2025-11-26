import {
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateOriginDto } from './dto/create-origin.dto';
import { UpdateOriginDto } from './dto/update-origin.dto';
import { NullableType } from '../utils/types/nullable.type';
import { FilterOriginDto, SortOriginDto } from './dto/query-origin.dto';
import { OriginRepository } from './infrastructure/persistence/origin.repository';
import { Origin } from './domain/origin';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { FilesService } from '../files/files.service';
import { FileType } from '../files/domain/file';
// Champions module removed

@Injectable()
export class OriginsService {
  constructor(
    private readonly originsRepository: OriginRepository,
    private readonly filesService: FilesService,
  ) {}

  async create(createOriginDto: CreateOriginDto): Promise<Origin> {
    // Kiểm tra key đã tồn tại chưa (nếu có key)
    if (createOriginDto.key) {
      const originObject = await this.originsRepository.findByKey(
        createOriginDto.key,
      );
      if (originObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            key: 'originKeyAlreadyExists',
          },
        });
      }
    }

    // Xử lý icon nếu có
    let icon: FileType | null | undefined = undefined;

    if (createOriginDto.icon?.id) {
      try {
        const fileObject = await this.filesService.findById(
          createOriginDto.icon.id,
        );
        if (!fileObject) {
          throw new UnprocessableEntityException({
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: {
              icon: 'iconNotExists',
            },
          });
        }
        icon = fileObject;
      } catch {
        // Skip icon nếu có lỗi
        icon = null;
      }
    } else if (createOriginDto.icon === null) {
      icon = null;
    }

    const origin = await this.originsRepository.create({
      apiName: createOriginDto.apiName,
      name: createOriginDto.name,
      trait: createOriginDto.trait,
      trait_name: createOriginDto.trait_name,
      key: createOriginDto.key,
      type: createOriginDto.type,
      description: createOriginDto.description,
      effects: createOriginDto.effects,
      img_name: createOriginDto.img_name,
      trait_img: createOriginDto.trait_img,
      description_fixed: createOriginDto.description_fixed,
      tiers: createOriginDto.tiers,
      icon: icon,
      set: createOriginDto.set,
      isActive: createOriginDto.isActive ?? true,
      champions: createOriginDto.champions ?? [],
    });

    return origin;
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterOriginDto | null;
    sortOptions?: SortOriginDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Origin[]> {
    return this.originsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(id: Origin['id']): Promise<NullableType<Origin>> {
    return this.originsRepository.findById(id);
  }

  async findByKey(key: Origin['key']): Promise<NullableType<Origin>> {
    if (!key) {
      return null;
    }
    return this.originsRepository.findByKey(key);
  }

  async update(
    id: Origin['id'],
    updateOriginDto: UpdateOriginDto,
    skipSync = false,
  ): Promise<Origin | null> {
    // Kiểm tra key có bị trùng không (nếu update key)
    if (updateOriginDto.key) {
      const originObject = await this.originsRepository.findByKey(
        updateOriginDto.key,
      );

      if (originObject && originObject.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            key: 'originKeyAlreadyExists',
          },
        });
      }
    }

    // Xử lý icon nếu có
    let icon: FileType | null | undefined = undefined;

    if (updateOriginDto.icon?.id) {
      try {
        const fileObject = await this.filesService.findById(
          updateOriginDto.icon.id,
        );
        if (!fileObject) {
          throw new UnprocessableEntityException({
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: {
              icon: 'iconNotExists',
            },
          });
        }
        icon = fileObject;
      } catch {
        // Skip icon nếu có lỗi
        icon = null;
      }
    } else if (updateOriginDto.icon === null) {
      icon = null;
    }

    const origin = await this.originsRepository.update(id, {
      name: updateOriginDto.name,
      key: updateOriginDto.key,
      type: updateOriginDto.type,
      description: updateOriginDto.description,
      tiers: updateOriginDto.tiers,
      icon: icon,
      set: updateOriginDto.set,
      isActive: updateOriginDto.isActive,
      champions: updateOriginDto.champions,
    });

    return origin;
  }

  async remove(id: Origin['id']): Promise<void> {
    await this.originsRepository.remove(id);
  }

  async getOriginWithChampions(id: Origin['id']) {
    const origin = await this.originsRepository.findById(id);

    if (!origin) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          origin: 'originNotFound',
        },
      });
    }

    // Champions module removed - return origin without populating champions
    return origin;
  }
}
