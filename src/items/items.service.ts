import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { NullableType } from '../utils/types/nullable.type';
import { FilterItemDto, SortItemDto } from './dto/query-item.dto';
import { ItemRepository } from './infrastructure/persistence/item.repository';
import { Item } from './domain/item';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { ItemStatusEnum } from './items-status.enum';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ItemsService {
  constructor(
    private readonly itemsRepository: ItemRepository,
  ) {}

  async create(createItemDto: CreateItemDto): Promise<Item> {
    // Kiểm tra apiName đã tồn tại chưa (nếu có)
    if (createItemDto.apiName) {
      const itemObject = await this.itemsRepository.findByApiName(
        createItemDto.apiName,
      );
      if (itemObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            apiName: 'itemApiNameAlreadyExists',
          },
        });
      }
    }

    const item = await this.itemsRepository.create({
      name: createItemDto.name,
      apiName: createItemDto.apiName,
      enName: createItemDto.enName,
      desc: createItemDto.desc,
      icon: createItemDto.icon,
      composition: createItemDto.composition,
      associatedTraits: createItemDto.associatedTraits,
      incompatibleTraits: createItemDto.incompatibleTraits,
      tags: createItemDto.tags,
      unique: createItemDto.unique ?? false,
      disabled: createItemDto.disabled ?? false,
      status: createItemDto.status ?? ItemStatusEnum.ACTIVE,
      effects: createItemDto.effects,
      variableMatches: createItemDto.variableMatches,
      from: createItemDto.from,
    });

    return item;
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterItemDto | null;
    sortOptions?: SortItemDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Item[]> {
    return this.itemsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(id: Item['id']): Promise<NullableType<Item>> {
    return this.itemsRepository.findById(id);
  }

  async findByApiName(apiName: Item['apiName']): Promise<NullableType<Item>> {
    return this.itemsRepository.findByApiName(apiName);
  }

  async update(
    id: Item['id'],
    updateItemDto: UpdateItemDto,
  ): Promise<Item | null> {
    // Kiểm tra apiName có bị trùng không (nếu update apiName)
    if (updateItemDto.apiName) {
      const itemObject = await this.itemsRepository.findByApiName(
        updateItemDto.apiName,
      );

      if (itemObject && itemObject.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            apiName: 'itemApiNameAlreadyExists',
          },
        });
      }
    }

    // Chỉ update những field có trong DTO (loại bỏ undefined)
    const updatePayload: Partial<Item> = {};
    if (updateItemDto.name !== undefined) updatePayload.name = updateItemDto.name;
    if (updateItemDto.apiName !== undefined) updatePayload.apiName = updateItemDto.apiName;
    if (updateItemDto.enName !== undefined) updatePayload.enName = updateItemDto.enName;
    if (updateItemDto.desc !== undefined) updatePayload.desc = updateItemDto.desc;
    if (updateItemDto.icon !== undefined) updatePayload.icon = updateItemDto.icon;
    if (updateItemDto.composition !== undefined) updatePayload.composition = updateItemDto.composition;
    if (updateItemDto.associatedTraits !== undefined) updatePayload.associatedTraits = updateItemDto.associatedTraits;
    if (updateItemDto.incompatibleTraits !== undefined) updatePayload.incompatibleTraits = updateItemDto.incompatibleTraits;
    if (updateItemDto.tags !== undefined) updatePayload.tags = updateItemDto.tags;
    if (updateItemDto.unique !== undefined) updatePayload.unique = updateItemDto.unique;
    if (updateItemDto.disabled !== undefined) updatePayload.disabled = updateItemDto.disabled;
    if (updateItemDto.status !== undefined) updatePayload.status = updateItemDto.status;
    if (updateItemDto.effects !== undefined) updatePayload.effects = updateItemDto.effects;
    if (updateItemDto.variableMatches !== undefined) updatePayload.variableMatches = updateItemDto.variableMatches;
    if (updateItemDto.from !== undefined) updatePayload.from = updateItemDto.from;

    return this.itemsRepository.update(id, updatePayload);
  }

  async updateByApiName(
    apiName: Item['apiName'],
    updateItemDto: UpdateItemDto,
  ): Promise<Item | null> {
    if (!apiName) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          apiName: 'apiNameIsRequired',
        },
      });
    }

    // Kiểm tra item có tồn tại không
    const existingItem = await this.itemsRepository.findByApiName(apiName);
    if (!existingItem) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          apiName: 'itemNotFound',
        },
      });
    }

    // Kiểm tra apiName có bị trùng không (nếu update apiName)
    if (updateItemDto.apiName && updateItemDto.apiName !== apiName) {
      const itemObject = await this.itemsRepository.findByApiName(
        updateItemDto.apiName,
      );

      if (itemObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            apiName: 'itemApiNameAlreadyExists',
          },
        });
      }
    }

    // Chỉ update những field có trong DTO (loại bỏ undefined)
    const updatePayload: Partial<Item> = {};
    if (updateItemDto.name !== undefined) updatePayload.name = updateItemDto.name;
    if (updateItemDto.apiName !== undefined) updatePayload.apiName = updateItemDto.apiName;
    if (updateItemDto.enName !== undefined) updatePayload.enName = updateItemDto.enName;
    if (updateItemDto.desc !== undefined) updatePayload.desc = updateItemDto.desc;
    if (updateItemDto.icon !== undefined) updatePayload.icon = updateItemDto.icon;
    if (updateItemDto.composition !== undefined) updatePayload.composition = updateItemDto.composition;
    if (updateItemDto.associatedTraits !== undefined) updatePayload.associatedTraits = updateItemDto.associatedTraits;
    if (updateItemDto.incompatibleTraits !== undefined) updatePayload.incompatibleTraits = updateItemDto.incompatibleTraits;
    if (updateItemDto.tags !== undefined) updatePayload.tags = updateItemDto.tags;
    if (updateItemDto.unique !== undefined) updatePayload.unique = updateItemDto.unique;
    if (updateItemDto.disabled !== undefined) updatePayload.disabled = updateItemDto.disabled;
    if (updateItemDto.status !== undefined) updatePayload.status = updateItemDto.status;
    if (updateItemDto.effects !== undefined) updatePayload.effects = updateItemDto.effects;
    if (updateItemDto.variableMatches !== undefined) updatePayload.variableMatches = updateItemDto.variableMatches;
    if (updateItemDto.from !== undefined) updatePayload.from = updateItemDto.from;

    return this.itemsRepository.updateByApiName(apiName, updatePayload);
  }

  async remove(id: Item['id']): Promise<void> {
    await this.itemsRepository.remove(id);
  }

  /**
   * Import items từ JSON file
   * @param filePath - Đường dẫn đến file JSON (tương đối từ project root)
   */
  async importFromJson(filePath?: string): Promise<{ imported: number; skipped: number; errors: string[] }> {
    // Sử dụng process.cwd() để lấy project root, hoặc __dirname nếu trong dev mode
    const projectRoot = process.cwd();
    const jsonPath = filePath || path.join(projectRoot, 'src/asset/Items_en_us.json');
    
    if (!fs.existsSync(jsonPath)) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          file: 'jsonFileNotFound',
        },
      });
    }

    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    if (!jsonData.items || !Array.isArray(jsonData.items)) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          file: 'invalidJsonFormat',
        },
      });
    }

    const itemsToImport: Omit<Item, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>[] = [];
    const errors: string[] = [];
    let skipped = 0;

    for (const itemData of jsonData.items) {
      try {
        // Skip nếu không có apiName hoặc name
        if (!itemData.apiName && !itemData.name) {
          skipped++;
          continue;
        }

        // Kiểm tra xem item đã tồn tại chưa (theo apiName)
        if (itemData.apiName) {
          const existingItem = await this.itemsRepository.findByApiName(itemData.apiName);
          if (existingItem) {
            skipped++;
            continue;
          }
        }

        const item: Omit<Item, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'> = {
          name: itemData.name || itemData.en_name || 'Unknown',
          apiName: itemData.apiName || null,
          enName: itemData.en_name || itemData.name || null,
          desc: itemData.desc || null,
          icon: itemData.icon || null,
          composition: Array.isArray(itemData.composition) ? itemData.composition : [],
          associatedTraits: Array.isArray(itemData.associatedTraits) ? itemData.associatedTraits : [],
          incompatibleTraits: Array.isArray(itemData.incompatibleTraits) ? itemData.incompatibleTraits : [],
          tags: Array.isArray(itemData.tags) ? itemData.tags : [],
          unique: itemData.unique ?? false,
          disabled: itemData.disabled ?? false,
          status: itemData.status || ItemStatusEnum.ACTIVE,
          effects: itemData.effects || {},
          variableMatches: Array.isArray(itemData.variable_matches) ? itemData.variable_matches : [],
          from: itemData.from || null,
        };

        itemsToImport.push(item);
      } catch (error) {
        errors.push(`Error processing item ${itemData.apiName || itemData.name}: ${error.message}`);
      }
    }

    // Bulk insert items
    let imported = 0;
    if (itemsToImport.length > 0) {
      try {
        const createdItems = await this.itemsRepository.bulkCreate(itemsToImport);
        imported = createdItems.length;
      } catch (error) {
        errors.push(`Bulk insert error: ${error.message}`);
      }
    }

    return {
      imported,
      skipped,
      errors,
    };
  }

  /**
   * Tìm và update tất cả items không có icon/avatar URL, set disabled: false
   */
  async updateItemsWithoutIcon(): Promise<{ updated: number; items: Item[] }> {
    const itemsWithoutIcon = await this.itemsRepository.findItemsWithoutIcon();
    const updatedCount = await this.itemsRepository.bulkUpdateItemsWithoutIcon();

    return {
      updated: updatedCount,
      items: itemsWithoutIcon,
    };
  }

  /**
   * Xóa các items có tên nằm trong danh sách TFT Set 16 items
   */
  async deleteItemsByNameList(): Promise<{
    deleted: number;
    items: Item[];
    errors: string[];
  }> {
    // Danh sách items cần xóa (từ TFT Set 16)
    const itemsToDeleteNames = [
      'Manazane',
      'The Indomitable',
      'Strategist Emblem',
      'Spectral Cutlass',
      'Warmog\'s Armor',
      'Duelist Emblem',
      'Gargoyle Stoneplate',
      'Blighting Jewel',
      'Infinity Force',
      'Deathfire Grasp',
      'Zhonya\'s Paradox',
      'Tactician\'s Crown',
      'Wit\'s End',
      'Radiant Void Staff',
      'Statikk Shiv',
      'Jeweled Gauntlet',
      'Trickster\'s Glass',
      'Infinity Edge',
      'Radiant Morellonomicon',
      'Soul Fighter Emblem',
      'Mittens',
      'Radiant Blue Buff',
      'Giant Slayer',
      'Radiant Ionic Spark',
      'Thief\'s Gloves',
      'Spirit Visage',
      'Radiant Hand of Justice',
      'Spear of Shojin',
      'Titanic Hydra',
      'Guinsoo\'s Rageblade',
      'Blue Buff',
      'Bloodthirster',
      'Sterak\'s Gage',
      'Radiant Sterak\'s Gage',
      'Death\'s Defiance',
      'Protector\'s Vow',
      'Radiant Nashor\'s Tooth',
      'Sunfire Cape',
      'Flickerblades',
      'Radiant Thief\'s Gloves',
      'Radiant Giant Slayer',
      'Radiant Evenshroud',
      'Hand Of Justice',
      'Radiant Striker\'s Flail',
      'Radiant Deathblade',
      'Luchador Emblem',
      'Lich Bane',
      'Dragon\'s Claw',
      'Radiant Hextech Gunblade',
      'Bramble Vest',
      'Edge of Night',
      'Radiant Last Whisper',
      'Heavyweight Emblem',
      'Void Staff',
      'Radiant Spear of Shojin',
      'Rabadon\'s Deathcap',
      'Executioner Emblem',
      'Gambler\'s Blade',
      'Nashor\'s Tooth',
      'Titan\'s Resolve',
      'Steadfast Heart',
      'Sniper\'s Focus',
      'Protector Emblem',
      'Lightshield Crest',
      'Prowler\'s Claw',
      'Radiant Red Buff',
      'Striker\'s Flail',
      'Horizon Focus',
      'Adaptive Helm',
      'Bastion Emblem',
      'Radiant Jeweled Gauntlet',
      'Kraken\'s Fury',
      'Evenshroud',
      'Gold Collector',
      'Prodigy Emblem',
      'Hextech Gunblade',
      'Radiant Sunfire Cape',
      'Radiant Edge of Night',
      'Unending Despair',
      'Radiant Infinity Edge',
      'Red Buff',
      'Archangel\'s Staff',
      'Star Guardian Emblem',
      'Morellonomicon',
      'Sniper Emblem',
      'Battle Academia Emblem',
      'Supreme Cells Emblem',
      'Juggernaut Emblem',
      'Radiant Rabadon\'s Deathcap',
      'Edgelord Emblem',
      'Silvermere Dawn',
      'Radiant Kraken\'s Fury',
      'Rapid Firecannon',
      'Ionic Spark',
      'Last Whisper',
      'Innervating Locket',
      'Deathblade',
      'Mogul\'s Mail',
      'Hullcrusher',
      'Combination Core',
      'Fishbones',
      'Crownguard',
      'Quicksilver',
      'Radiant Adaptive Helm',
      'Mega Blade Upgrade',
      'Radiant Warmog\'s Armor',
      'Sorcerer Emblem',
      'Radiant Quicksilver',
      'Seeker\'s Armguard',
      'Mighty Blade',
      'Radiant Gargoyle Stoneplate',
      'Dawncore',
      'Radiant Archangel\'s Staff',
      'Radiant Bramble Vest',
      'Radiant Dragon\'s Claw',
      'Talisman Of Ascension',
      'Radiant Bloodthirster',
      'Wraith Emblem',
      'Spatula',
      'Needlessly Large Rod',
      'Recurve Bow',
      'Tear of the Goddess',
      'Chain Vest',
      'Negatron Cloak',
      'Sparring Gloves',
      'Giant\'s Belt',
      'Tactician\'s Cape',
      'B.F. Sword',
      'Tactician\'s Shield',
      'Crown of Demacia',
      'Power Snax',
      'Frying Pan',
      'Radiant Guinsoo\'s Rageblade',
      'Radiant Steadfast Heart',
      'Radiant Spirit Visage',
      'Radiant Titan\'s Resolve',
      'Radiant Protector\'s Vow',
      'Radiant Crownguard',
      'Crystal Gambit Emblem',
    ];

    // Tạo Set để tìm kiếm nhanh hơn
    const itemsToDeleteSet = new Set(itemsToDeleteNames);

    // Lấy tất cả items từ database
    const allItems = await this.itemsRepository.findAll();

    // Tìm items có tên trong danh sách cần xóa
    const itemsToDelete = allItems.filter((item) =>
      itemsToDeleteSet.has(item.name),
    );

    // Xóa các items
    const errors: string[] = [];
    let deletedCount = 0;

    for (const item of itemsToDelete) {
      try {
        await this.itemsRepository.remove(item.id);
        deletedCount++;
      } catch (error: any) {
        errors.push(`Error deleting item ${item.name} (${item.apiName}): ${error.message}`);
      }
    }

    return {
      deleted: deletedCount,
      items: itemsToDelete,
      errors,
    };
  }
}

