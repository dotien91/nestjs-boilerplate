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

    return this.itemsRepository.update(id, {
      name: updateItemDto.name,
      apiName: updateItemDto.apiName,
      enName: updateItemDto.enName,
      desc: updateItemDto.desc,
      icon: updateItemDto.icon,
      composition: updateItemDto.composition,
      associatedTraits: updateItemDto.associatedTraits,
      incompatibleTraits: updateItemDto.incompatibleTraits,
      tags: updateItemDto.tags,
      unique: updateItemDto.unique,
      disabled: updateItemDto.disabled,
      effects: updateItemDto.effects,
      variableMatches: updateItemDto.variableMatches,
      from: updateItemDto.from,
    });
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
}

