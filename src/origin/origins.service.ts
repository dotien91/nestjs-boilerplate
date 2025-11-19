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
import { ChampionRepository } from '../champions/infrastructure/persistence/champion.repository';
import { Champion } from '../champions/domain/champion';
import { Inject, forwardRef } from '@nestjs/common';
import { ChampionsService } from '../champions/champions.service';

@Injectable()
export class OriginsService {
  constructor(
    private readonly originsRepository: OriginRepository,
    private readonly filesService: FilesService,
    @Inject(forwardRef(() => ChampionRepository))
    private readonly championRepository: ChampionRepository,
    @Inject(forwardRef(() => ChampionsService))
    private readonly championsService: ChampionsService,
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

    // Sync origins in champions
    await this.syncOriginsInChampions(origin.id, origin.champions || []);

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

  async findById(
    id: Origin['id'],
  ): Promise<NullableType<Origin & { championDetails?: Champion[] }>> {
    const origin = await this.originsRepository.findById(id);

    if (!origin) {
      return null;
    }

    // Populate champions nếu có
    const championDetails: Champion[] = [];
    if (origin.champions && origin.champions.length > 0) {
      const championPromises = origin.champions.map((championId) =>
        this.championRepository.findById(championId),
      );
      const championResults = await Promise.all(championPromises);
      championDetails.push(
        ...championResults.filter(
          (c): c is Champion => c !== null && c !== undefined,
        ),
      );
    }

    return {
      ...origin,
      championDetails,
    };
  }

  async findByKey(
    key: Origin['key'],
  ): Promise<NullableType<Origin & { championDetails?: Champion[] }>> {
    if (!key) {
      return null;
    }
    const origin = await this.originsRepository.findByKey(key);

    if (!origin) {
      return null;
    }

    // Populate champions nếu có
    const championDetails: Champion[] = [];
    if (origin.champions && origin.champions.length > 0) {
      const championPromises = origin.champions.map((championId) =>
        this.championRepository.findById(championId),
      );
      const championResults = await Promise.all(championPromises);
      championDetails.push(
        ...championResults.filter(
          (c): c is Champion => c !== null && c !== undefined,
        ),
      );
    }

    return {
      ...origin,
      championDetails,
    };
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

    // Sync origins in champions if champions changed (skip if called from sync)
    if (origin && updateOriginDto.champions !== undefined && !skipSync) {
      await this.syncOriginsInChampions(origin.id, updateOriginDto.champions);
    }

    return origin;
  }

  async remove(id: Origin['id']): Promise<void> {
    // Get champions before removing
    const origin = await this.originsRepository.findById(id);
    const championsIds = origin?.champions || [];

    await this.originsRepository.remove(id);

    // Remove origin from all champions
    await this.syncOriginsInChampions(id, []);
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

    // Nếu origin có champions, lấy thông tin champions
    const championDetails: Champion[] = [];
    if (origin.champions && origin.champions.length > 0) {
      // Lấy champions từ repository
      const championPromises = origin.champions.map((championId) =>
        this.championRepository.findById(championId),
      );
      const championResults = await Promise.all(championPromises);
      championDetails.push(
        ...championResults.filter(
          (c): c is Champion => c !== null && c !== undefined,
        ),
      );
    }

    return {
      ...origin,
      championDetails,
    };
  }

  /**
   * Đồng bộ origins trong champions
   * Khi origin thay đổi champions, cần cập nhật origins trong các champion tương ứng
   */
  private async syncOriginsInChampions(
    originId: Origin['id'],
    newChampionsIds: string[],
  ): Promise<void> {
    const originIdString = String(originId);

    // Lấy tất cả champions hiện tại có origin này
    const allChampions = await this.championRepository.findManyWithPagination({
      filterOptions: null,
      sortOptions: null,
      paginationOptions: { page: 1, limit: 1000 }, // Get all champions
    });

    for (const champion of allChampions) {
      const originsIds = await this.championRepository.findOriginsIds(
        champion.id,
      );
      if (!originsIds) {
        continue;
      }

      const hasOrigin = originsIds.includes(originIdString);
      const shouldHaveOrigin = newChampionsIds.includes(String(champion.id));

      if (hasOrigin && !shouldHaveOrigin) {
        // Remove origin from champion
        const updatedOriginsIds = originsIds.filter(
          (id) => id !== originIdString,
        );
        // Skip sync to avoid circular dependency
        await this.championsService.update(
          champion.id,
          {
            origins: updatedOriginsIds,
          },
          true, // skipSync = true
        );
      } else if (!hasOrigin && shouldHaveOrigin) {
        // Add origin to champion
        if (!originsIds.includes(originIdString)) {
          originsIds.push(originIdString);
          // Skip sync to avoid circular dependency
          await this.championsService.update(
            champion.id,
            {
              origins: originsIds,
            },
            true, // skipSync = true
          );
        }
      }
    }
  }
}
