import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateTraitDto } from './dto/create-trait.dto';
import { UpdateTraitDto } from './dto/update-trait.dto';
import { NullableType } from '../utils/types/nullable.type';
import { FilterTraitDto, SortTraitDto } from './dto/query-trait.dto';
import { TraitRepository } from './infrastructure/persistence/trait.repository';
import { Trait } from './domain/trait';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { FilesService } from '../files/files.service';
import { FileType } from '../files/domain/file';

@Injectable()
export class TraitsService {
  constructor(
    private readonly traitsRepository: TraitRepository,
    private readonly filesService: FilesService,
  ) {}

  async create(createTraitDto: CreateTraitDto): Promise<Trait> {
    // Kiểm tra key đã tồn tại chưa
    const traitObject = await this.traitsRepository.findByKey(
      createTraitDto.key,
    );
    if (traitObject) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          key: 'traitKeyAlreadyExists',
        },
      });
    }

    // Xử lý icon nếu có
    let icon: FileType | null | undefined = undefined;

    if (createTraitDto.icon?.id) {
      try {
        const fileObject = await this.filesService.findById(
          createTraitDto.icon.id,
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
    } else if (createTraitDto.icon === null) {
      icon = null;
    }

    return this.traitsRepository.create({
      name: createTraitDto.name,
      key: createTraitDto.key,
      type: createTraitDto.type,
      description: createTraitDto.description,
      tiers: createTraitDto.tiers,
      icon: icon,
      set: createTraitDto.set,
      isActive: createTraitDto.isActive ?? true,
    });
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTraitDto | null;
    sortOptions?: SortTraitDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Trait[]> {
    return this.traitsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: Trait['id']): Promise<NullableType<Trait>> {
    return this.traitsRepository.findById(id);
  }

  findByKey(key: Trait['key']): Promise<NullableType<Trait>> {
    return this.traitsRepository.findByKey(key);
  }

  async update(
    id: Trait['id'],
    updateTraitDto: UpdateTraitDto,
  ): Promise<Trait | null> {
    // Kiểm tra key có bị trùng không (nếu update key)
    if (updateTraitDto.key) {
      const traitObject = await this.traitsRepository.findByKey(
        updateTraitDto.key,
      );

      if (traitObject && traitObject.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            key: 'traitKeyAlreadyExists',
          },
        });
      }
    }

    // Xử lý icon nếu có
    let icon: FileType | null | undefined = undefined;

    if (updateTraitDto.icon?.id) {
      try {
        const fileObject = await this.filesService.findById(
          updateTraitDto.icon.id,
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
    } else if (updateTraitDto.icon === null) {
      icon = null;
    }

    return this.traitsRepository.update(id, {
      name: updateTraitDto.name,
      key: updateTraitDto.key,
      type: updateTraitDto.type,
      description: updateTraitDto.description,
      tiers: updateTraitDto.tiers,
      icon: icon,
      set: updateTraitDto.set,
      isActive: updateTraitDto.isActive,
    });
  }

  async remove(id: Trait['id']): Promise<void> {
    await this.traitsRepository.remove(id);
  }
}
