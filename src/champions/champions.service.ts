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
import { OriginRepository } from '../origin/infrastructure/persistence/origin.repository';
import { Origin } from '../origin/domain/origin';
import { Inject, forwardRef } from '@nestjs/common';
import { OriginsService } from '../origin/origins.service';

@Injectable()
export class ChampionsService {
  constructor(
    private readonly championsRepository: ChampionRepository,
    private readonly filesService: FilesService,
    @Inject(forwardRef(() => OriginRepository))
    private readonly originRepository: OriginRepository,
    @Inject(forwardRef(() => OriginsService))
    private readonly originsService: OriginsService,
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

    // Xử lý origins nếu có - validate và populate
    let origins: Origin[] | undefined = undefined;
    if (createChampionDto.origins && createChampionDto.origins.length > 0) {
      const originPromises = createChampionDto.origins.map((originId) =>
        this.originRepository.findById(originId),
      );
      const originResults = await Promise.all(originPromises);
      const validOrigins = originResults.filter(
        (o): o is Origin => o !== null && o !== undefined,
      );

      if (validOrigins.length !== createChampionDto.origins.length) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            origins: 'someOriginsNotExist',
          },
        });
      }

      origins = validOrigins;
    }

    const champion = await this.championsRepository.create({
      name: createChampionDto.name,
      key: createChampionDto.key,
      cost: createChampionDto.cost,
      abilityDescription: createChampionDto.abilityDescription,
      abilityName: createChampionDto.abilityName,
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
      origins: origins,
    });

    // Populate origins for response
    if (origins) {
      champion.origins = origins;
    }

    // Sync champions in origins
    const originsIds = origins
      ? origins.map((o) => String(o.id))
      : [];
    await this.syncChampionsInOrigins(champion.id, originsIds);

    return champion;
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterChampionDto | null;
    sortOptions?: SortChampionDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Champion[]> {
    const champions = await this.championsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });

    // Populate origins for all champions
    await Promise.all(
      champions.map((champion) => this.populateOrigins(champion)),
    );

    return champions;
  }

  async findById(id: Champion['id']): Promise<NullableType<Champion>> {
    const champion = await this.championsRepository.findById(id);
    if (champion) {
      // Populate origins if needed
      await this.populateOrigins(champion);
    }
    return champion;
  }

  async findByKey(key: Champion['key']): Promise<NullableType<Champion>> {
    const champion = await this.championsRepository.findByKey(key);
    if (champion) {
      // Populate origins if needed
      await this.populateOrigins(champion);
    }
    return champion;
  }

  async findByCost(cost: Champion['cost']): Promise<Champion[]> {
    const champions = await this.championsRepository.findByCost(cost);

    // Populate origins for all champions
    await Promise.all(
      champions.map((champion) => this.populateOrigins(champion)),
    );

    return champions;
  }

  async update(
    id: Champion['id'],
    updateChampionDto: UpdateChampionDto,
    skipSync = false,
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

    // Xử lý origins nếu có - validate và populate
    let origins: Origin[] | undefined = undefined;
    if (updateChampionDto.origins !== undefined) {
      if (updateChampionDto.origins.length > 0) {
        const originPromises = updateChampionDto.origins.map((originId) =>
          this.originRepository.findById(originId),
        );
        const originResults = await Promise.all(originPromises);
        const validOrigins = originResults.filter(
          (o): o is Origin => o !== null && o !== undefined,
        );

        if (validOrigins.length !== updateChampionDto.origins.length) {
          throw new UnprocessableEntityException({
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: {
              origins: 'someOriginsNotExist',
            },
          });
        }

        origins = validOrigins;
      } else {
        origins = [];
      }
    }

    const champion = await this.championsRepository.update(id, {
      name: updateChampionDto.name,
      key: updateChampionDto.key,
      cost: updateChampionDto.cost,
      abilityDescription: updateChampionDto.abilityDescription,
      abilityName: updateChampionDto.abilityName,
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
      origins: origins,
    });

    // Populate origins for response
    if (champion && origins !== undefined) {
      champion.origins = origins;
    } else if (champion) {
      await this.populateOrigins(champion);
    }

    // Sync champions in origins (skip if called from sync)
    if (champion && !skipSync) {
      const currentOriginsIds = origins
        ? origins.map((o) => String(o.id))
        : await this.championsRepository.findOriginsIds(champion.id);
      await this.syncChampionsInOrigins(champion.id, currentOriginsIds);
    }

    return champion;
  }

  async remove(id: Champion['id']): Promise<void> {
    // Get origins before removing
    const originsIds = await this.championsRepository.findOriginsIds(id);
    
    await this.championsRepository.remove(id);

    // Remove champion from all origins
    await this.syncChampionsInOrigins(id, []);
  }

  private async populateOrigins(champion: Champion): Promise<void> {
    // Skip if already populated
    if (champion.origins && champion.origins.length > 0) {
      return;
    }

    // Get origins IDs from repository
    const originsIds = await this.championsRepository.findOriginsIds(
      champion.id,
    );

    if (originsIds && originsIds.length > 0) {
      // Fetch origin objects
      const originPromises = originsIds.map((originId) =>
        this.originRepository.findById(originId),
      );
      const originResults = await Promise.all(originPromises);
      const validOrigins = originResults.filter(
        (o): o is Origin => o !== null && o !== undefined,
      );
      champion.origins = validOrigins;
    } else {
      champion.origins = [];
    }
  }

  /**
   * Đồng bộ champions trong origins
   * Khi champion thay đổi origins, cần cập nhật champions trong các origin tương ứng
   */
  private async syncChampionsInOrigins(
    championId: Champion['id'],
    newOriginsIds: string[],
  ): Promise<void> {
    const championIdString = String(championId);

    // Lấy tất cả origins hiện tại có champion này
    const allOrigins = await this.originRepository.findManyWithPagination({
      filterOptions: null,
      sortOptions: null,
      paginationOptions: { page: 1, limit: 1000 }, // Get all origins
    });

    for (const origin of allOrigins) {
      if (!origin.champions) {
        origin.champions = [];
      }

      const hasChampion = origin.champions.includes(championIdString);
      const shouldHaveChampion = newOriginsIds.includes(String(origin.id));

      if (hasChampion && !shouldHaveChampion) {
        // Remove champion from origin
        origin.champions = origin.champions.filter(
          (id) => id !== championIdString,
        );
        // Skip sync to avoid circular dependency
        await this.originsService.update(
          origin.id,
          {
            champions: origin.champions,
          },
          true, // skipSync = true
        );
      } else if (!hasChampion && shouldHaveChampion) {
        // Add champion to origin
        if (!origin.champions.includes(championIdString)) {
          origin.champions.push(championIdString);
          // Skip sync to avoid circular dependency
          await this.originsService.update(
            origin.id,
            {
              champions: origin.champions,
            },
            true, // skipSync = true
          );
        }
      }
    }
  }
}
