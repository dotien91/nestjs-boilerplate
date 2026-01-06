import { Injectable, NotFoundException } from '@nestjs/common';
import { join } from 'path';
import { existsSync } from 'fs';
import { readFileSync } from 'fs';

export interface ImageResponse {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

@Injectable()
export class ImagesService {
  private readonly IMAGE_BASE_PATH = join(process.cwd(), 'src', 'asset', 'images');

  /**
   * Normalize champion key
   * Input: "TFT16_Tristana" → "tft16_tristana"
   * Input: "Tristana" → "tristana"
   */
  private normalizeChampionKey(key: string): string {
    return key.toLowerCase();
  }

  /**
   * Normalize trait key
   * Remove prefix tft16_ or tft{number}_ if exists
   * Remove spaces
   * Input: "Huntress" → "huntress"
   * Input: "TFT16_Huntress" → "huntress"
   * Input: "Darkin Weapon" → "darkinweapon"
   */
  private normalizeTraitKey(key: string): string {
    let normalized = key.toLowerCase();
    // Remove tft{number}_ prefix
    normalized = normalized.replace(/^tft\d+_/, '');
    // Remove spaces
    normalized = normalized.replace(/\s+/g, '');
    return normalized;
  }

  /**
   * Normalize augment key
   * From name: lowercase, keep special chars like - and _
   * From icon path: parse filename and lowercase
   */
  private normalizeAugmentKey(key: string): string {
    // If it's an icon path, parse it
    if (key.includes('/')) {
      // Extract filename from path
      const filename = key.split('/').pop() || key;
      // Remove extension (.tex, .TFT_Set16.tex, etc.)
      let parsed = filename.replace(/\.(tex|png|jpg|jpeg)$/i, '');
      // Remove .TFT_Set{number} pattern
      parsed = parsed.replace(/\.TFT_Set\d+$/i, '');
      return parsed.toLowerCase();
    }
    // Otherwise, just lowercase
    return key.toLowerCase();
  }

  /**
   * Normalize item key
   * From apiName: lowercase
   * From icon path: parse filename and lowercase
   */
  private normalizeItemKey(key: string): string {
    // If it's an icon path, parse it
    if (key.includes('/')) {
      // Extract filename from path
      const filename = key.split('/').pop() || key;
      // Remove extension
      let parsed = filename.replace(/\.(tex|png|jpg|jpeg)$/i, '');
      // Remove .TFT_Set{number} pattern
      parsed = parsed.replace(/\.TFT_Set\d+$/i, '');
      return parsed.toLowerCase();
    }
    // Otherwise, just lowercase
    return key.toLowerCase();
  }

  /**
   * Get image by type and key
   */
  async getImage(
    type: string,
    key: string,
    extension: string,
  ): Promise<ImageResponse> {
    // Validate type
    const validTypes = [
      'champions',
      'championsplashes',
      'traits',
      'augments',
      'items',
    ];
    if (!validTypes.includes(type)) {
      throw new NotFoundException(`Invalid image type: ${type}`);
    }

    // Normalize key based on type
    let normalizedKey: string;
    switch (type) {
      case 'champions':
      case 'championsplashes':
        normalizedKey = this.normalizeChampionKey(key);
        break;
      case 'traits':
        normalizedKey = this.normalizeTraitKey(key);
        break;
      case 'augments':
        normalizedKey = this.normalizeAugmentKey(key);
        break;
      case 'items':
        normalizedKey = this.normalizeItemKey(key);
        break;
      default:
        normalizedKey = key.toLowerCase();
    }

    // Determine expected extension based on type
    const expectedExt = type === 'championsplashes' ? 'jpg' : 'png';
    const finalExtension = extension || expectedExt;

    // Build file path
    const imagePath = join(
      this.IMAGE_BASE_PATH,
      type,
      `${normalizedKey}.${finalExtension}`,
    );

    // Check if file exists
    if (!existsSync(imagePath)) {
      throw new NotFoundException({
        error: 'Image not found',
        type,
        key: normalizedKey,
      });
    }

    // Read file
    const buffer = readFileSync(imagePath);
    const contentType =
      finalExtension === 'jpg' || finalExtension === 'jpeg'
        ? 'image/jpeg'
        : 'image/png';

    return {
      buffer,
      contentType,
      filename: `${normalizedKey}.${finalExtension}`,
    };
  }
}

