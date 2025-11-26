import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TftAugmentsService } from '../tft-augments/tft-augments.service';
import * as fs from 'fs';
import * as path from 'path';

interface TftAugmentData {
  apiName: string;
  associatedTraits?: string[];
  composition?: string[];
  desc?: string;
  effects?: Record<string, any>;
  from?: string | null;
  icon?: string;
  id?: string | null;
  incompatibleTraits?: string[];
  name: string;
  tags?: string[];
  unique?: boolean;
  en_name?: string;
  variable_matches?: Array<{
    match: string;
    type?: string;
    multiplier?: string;
    full_match: string;
    hash?: string;
    value: number | string;
  }>;
  disabled?: boolean;
  type?: string;
  texture?: string;
}

async function importTftAugments() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tftAugmentsService = app.get(TftAugmentsService);

  // Read TFTSet16_latest_en_us.json
  const jsonPath = path.join(__dirname, 'TFTSet16_latest_en_us.json');
  const jsonData: any = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const augmentsData: TftAugmentData[] = jsonData.augments || [];

  console.log(`Found ${augmentsData.length} TFT augments to import`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const augment of augmentsData) {
    try {
      // Skip if no apiName or name
      if (!augment.apiName || !augment.name) {
        console.log(`⏭️  Skipping augment (missing apiName or name)`);
        skipCount++;
        continue;
      }

      // Check if augment already exists
      try {
        const existing = await tftAugmentsService.findByApiName(
          augment.apiName,
        );
        if (existing) {
          console.log(
            `⏭️  Skipping ${augment.name} (already exists with apiName: ${augment.apiName})`,
          );
          skipCount++;
          continue;
        }
      } catch (error) {
        // Augment doesn't exist, continue
      }

      // Create augment
      const tftAugment = await tftAugmentsService.create({
        apiName: augment.apiName,
        name: augment.name,
        enName: augment.en_name || null,
        desc: augment.desc || null,
        icon: augment.icon || null,
        associatedTraits: augment.associatedTraits || [],
        incompatibleTraits: augment.incompatibleTraits || [],
        composition: augment.composition || [],
        effects: augment.effects || {},
        tags: augment.tags || [],
        unique: augment.unique ?? false,
        from: augment.from || null,
        augmentId: augment.id || null,
        disabled: augment.disabled ?? false,
        type: augment.type || null,
        texture: augment.texture || null,
      });

      console.log(
        `✅ Created: ${tftAugment.name} (apiName: ${tftAugment.apiName})`,
      );
      successCount++;
    } catch (error: any) {
      console.error(`❌ Error importing ${augment.name}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total: ${augmentsData.length}`);

  await app.close();
  process.exit(0);
}

importTftAugments().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

