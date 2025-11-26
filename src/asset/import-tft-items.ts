import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TftItemsService } from '../tft-items/tft-items.service';
import * as fs from 'fs';
import * as path from 'path';

interface TftItemData {
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

async function importTftItems() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tftItemsService = app.get(TftItemsService);

  // Read TFTSet16_latest_en_us.json
  const jsonPath = path.join(__dirname, 'TFTSet16_latest_en_us.json');
  const jsonData: any = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const itemsData: TftItemData[] = jsonData.items || [];

  console.log(`Found ${itemsData.length} TFT items to import`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const item of itemsData) {
    try {
      // Skip if no apiName or name
      if (!item.apiName || !item.name) {
        console.log(`⏭️  Skipping item (missing apiName or name)`);
        skipCount++;
        continue;
      }

      // Check if item already exists
      try {
        const existing = await tftItemsService.findByApiName(item.apiName);
        if (existing) {
          console.log(
            `⏭️  Skipping ${item.name} (already exists with apiName: ${item.apiName})`,
          );
          skipCount++;
          continue;
        }
      } catch (error) {
        // Item doesn't exist, continue
      }

      // Create item
      const tftItem = await tftItemsService.create({
        apiName: item.apiName,
        name: item.name,
        enName: item.en_name || null,
        desc: item.desc || null,
        icon: item.icon || null,
        associatedTraits: item.associatedTraits || [],
        incompatibleTraits: item.incompatibleTraits || [],
        composition: item.composition || [],
        effects: item.effects || {},
        tags: item.tags || [],
        unique: item.unique ?? false,
        from: item.from || null,
        itemId: item.id || null,
        disabled: item.disabled ?? false,
        type: item.type || null,
        texture: item.texture || null,
      });

      console.log(
        `✅ Created: ${tftItem.name} (apiName: ${tftItem.apiName})`,
      );
      successCount++;
    } catch (error: any) {
      console.error(`❌ Error importing ${item.name}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total: ${itemsData.length}`);

  await app.close();
  process.exit(0);
}

importTftItems().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

