import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateChampionDto } from './dto/create-champion.dto';
import { UpdateChampionDto } from './dto/update-champion.dto';
import { NullableType } from '../utils/types/nullable.type';
import { FilterChampionDto, SortChampionDto } from './dto/query-champion.dto';
import { ChampionRepository } from './infrastructure/persistence/champion.repository';
import { Champion } from './domain/champion';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { FilesService } from '../files/files.service';
import { FileType } from '../files/domain/file';

@Injectable()
export class ChampionsService {
  constructor(
    private readonly championsRepository: ChampionRepository,
    private readonly filesService: FilesService,
  ) {}

  async create(createChampionDto: CreateChampionDto): Promise<Champion> {
    // Kiểm tra key đã tồn tại chưa
    const championObject = await this.championsRepository.findByKey(
      createChampionDto.key,
    );
    if (championObject) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          key: 'championKeyAlreadyExists',
        },
      });
    }

    // Xử lý image nếu có
    let image: FileType | null | undefined = undefined;

    if (createChampionDto.image?.id) {
      try {
        const fileObject = await this.filesService.findById(
          createChampionDto.image.id,
        );
        if (!fileObject) {
          throw new UnprocessableEntityException({
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: {
              image: 'imageNotExists',
            },
          });
        }
        image = fileObject;
      } catch {
        // Skip image nếu có lỗi
        image = null;
      }
    } else if (createChampionDto.image === null) {
      image = null;
    }

    return this.championsRepository.create({
      name: createChampionDto.name,
      key: createChampionDto.key,
      cost: createChampionDto.cost,
      abilityDescription: createChampionDto.abilityDescription,
      abilityName: createChampionDto.abilityName,
      traits: createChampionDto.traits,
      health: createChampionDto.health,
      armor: createChampionDto.armor,
      magicResist: createChampionDto.magicResist,
      attackDamage: createChampionDto.attackDamage,
      attackSpeed: createChampionDto.attackSpeed,
      attackRange: createChampionDto.attackRange,
      startingMana: createChampionDto.startingMana,
      maxMana: createChampionDto.maxMana,
      image: image,
      set: createChampionDto.set,
      isActive: createChampionDto.isActive ?? true,
    });
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterChampionDto | null;
    sortOptions?: SortChampionDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Champion[]> {
    return this.championsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: Champion['id']): Promise<NullableType<Champion>> {
    return this.championsRepository.findById(id);
  }

  findByKey(key: Champion['key']): Promise<NullableType<Champion>> {
    return this.championsRepository.findByKey(key);
  }

  findByCost(cost: Champion['cost']): Promise<Champion[]> {
    return this.championsRepository.findByCost(cost);
  }

  findByTrait(traitKey: string): Promise<Champion[]> {
    return this.championsRepository.findByTrait(traitKey);
  }

  async update(
    id: Champion['id'],
    updateChampionDto: UpdateChampionDto,
  ): Promise<Champion | null> {
    // Kiểm tra key có bị trùng không (nếu update key)
    if (updateChampionDto.key) {
      const championObject = await this.championsRepository.findByKey(
        updateChampionDto.key,
      );

      if (championObject && championObject.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            key: 'championKeyAlreadyExists',
          },
        });
      }
    }

    // Xử lý image nếu có
    let image: FileType | null | undefined = undefined;

    if (updateChampionDto.image?.id) {
      try {
        const fileObject = await this.filesService.findById(
          updateChampionDto.image.id,
        );
        if (!fileObject) {
          throw new UnprocessableEntityException({
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: {
              image: 'imageNotExists',
            },
          });
        }
        image = fileObject;
      } catch {
        // Skip image nếu có lỗi
        image = null;
      }
    } else if (updateChampionDto.image === null) {
      image = null;
    }

    return this.championsRepository.update(id, {
      name: updateChampionDto.name,
      key: updateChampionDto.key,
      cost: updateChampionDto.cost,
      abilityDescription: updateChampionDto.abilityDescription,
      abilityName: updateChampionDto.abilityName,
      traits: updateChampionDto.traits,
      health: updateChampionDto.health,
      armor: updateChampionDto.armor,
      magicResist: updateChampionDto.magicResist,
      attackDamage: updateChampionDto.attackDamage,
      attackSpeed: updateChampionDto.attackSpeed,
      attackRange: updateChampionDto.attackRange,
      startingMana: updateChampionDto.startingMana,
      maxMana: updateChampionDto.maxMana,
      image: image,
      set: updateChampionDto.set,
      isActive: updateChampionDto.isActive,
    });
  }

  async remove(id: Champion['id']): Promise<void> {
    await this.championsRepository.remove(id);
  }
}
