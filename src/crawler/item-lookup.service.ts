import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ItemLookupService implements OnModuleInit {
  private readonly logger = new Logger(ItemLookupService.name);

  private itemsData: any[] = [];
  private augmentsData: any[] = [];
  private readonly FUZZY_THRESHOLD = 0.6;

  async onModuleInit() {
    this.loadData();
  }

  private loadData() {
    try {
      const assetPath = path.join(
        process.cwd(),
        'src',
        'asset',
        'TFTSet16_latest_en_us.json',
      );
      const dataPath = path.join(
        process.cwd(),
        'src',
        'data',
        'TFTSet16_latest_en_us.json',
      );

      const filePath = fs.existsSync(assetPath) ? assetPath : dataPath;

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
      .replace(/['"’]/g, '')
      .replace(/\.tft_set\d+/g, '')
      .replace(/\.tex$/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  public getValidApiName(rawSlug: string): string | null {
    if (!rawSlug) return null;
    const cleanInput = this.normalize(rawSlug);

    let result = this.findInCollection(this.itemsData, cleanInput);
    if (result) return result;

    const inputWithoutNumber = cleanInput.replace(/\d+$/, '');
    if (inputWithoutNumber !== cleanInput && inputWithoutNumber.length > 2) {
      result = this.findInCollection(this.itemsData, inputWithoutNumber);
      if (result) return result;
    }

    return null;
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

  private findBestFuzzyMatch(
    collection: any[],
    cleanInput: string,
  ): { apiName: string; name: string; score: number } | null {
    let bestMatch: any = null;
    let highestScore = 0;

    for (const item of collection) {
      const targetName = this.normalize(item.en_name || item.name || '');
      if (!targetName) continue;

      const score = this.calculateSimilarity(cleanInput, targetName);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    }

    if (bestMatch && highestScore >= this.FUZZY_THRESHOLD) {
      return {
        apiName: bestMatch.apiName,
        name: bestMatch.en_name || bestMatch.name,
        score: highestScore,
      };
    }

    return null;
  }

  private calculateSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    const longerLength = longer.length;

    if (longerLength === 0) return 1;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longerLength - distance) / longerLength;
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i += 1) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j += 1) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i += 1) {
      for (let j = 1; j <= a.length; j += 1) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1),
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }
}
