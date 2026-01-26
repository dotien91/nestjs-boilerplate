import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ItemLookupService implements OnModuleInit {
  private readonly logger = new Logger(ItemLookupService.name);

  private itemsData: any[] = [];
  private augmentsData: any[] = [];

  async onModuleInit() {
    this.loadData();
  }

  private loadData() {
    try {
      const filePath = path.join(
        process.cwd(),
        'src',
        'asset',
        'TFTSet16_latest_en_us.json',
      );

      if (fs.existsSync(filePath)) {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const json = JSON.parse(rawData);

        const rawItems = json.items || json.data || [];
        this.itemsData = Array.isArray(rawItems)
          ? rawItems
          : Object.values(rawItems);

        const rawAugments =
          json.augments ||
          (json.data
            ? Object.values(json.data).filter((x: any) =>
                x?.apiName?.includes('Augment'),
              )
            : []);
        this.augmentsData = Array.isArray(rawAugments)
          ? rawAugments
          : Object.values(rawAugments);

        this.logger.log(
          `✅ Loaded ${this.itemsData.length} Items & ${this.augmentsData.length} Augments.`,
        );
      } else {
        this.logger.error(`❌ JSON file not found at: ${filePath}`);
      }
    } catch (error) {
      this.logger.error('❌ Failed to load JSON', error);
    }
  }

  private normalize(str: string): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .trim()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  public getValidApiName(rawSlug: string): string | null {
    if (!rawSlug) return null;
    const cleanInput = this.normalize(rawSlug);
    return this.findInCollection(this.itemsData, cleanInput);
  }

  public getValidAugmentApiName(rawSlug: string): string | null {
    if (!rawSlug) return null;
    const cleanInput = this.normalize(rawSlug);
    return this.findInCollection(this.augmentsData, cleanInput);
  }

  private findInCollection(collection: any[], cleanInput: string): string | null {
    let match = collection.find((entry) => {
      const name = this.normalize(entry.name || entry.en_name || '');
      return name === cleanInput;
    });
    if (match) return match.apiName;

    match = collection.find((entry) => {
      const api = this.normalize(entry.apiName || '');
      return api.includes(cleanInput);
    });
    if (match) return match.apiName;

    match = collection.find((entry) => {
      const icon = this.normalize(entry.icon || '');
      return icon.includes(cleanInput);
    });

    return match ? match.apiName : null;
  }
}
