import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TftArmoryItemsService } from '../tft-armory-items/tft-armory-items.service';
import * as fs from 'fs';
import * as path from 'path';

interface TftArmoryItemData {
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
}

async function importTftArmoryItems() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tftArmoryItemsService = app.get(TftArmoryItemsService);

  // Read TFTSet16_latest_en_us.json
  const jsonPath = path.join(__dirname, 'TFTSet16_latest_en_us.json');
  const jsonData: any = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const armoryItemsData: TftArmoryItemData[] = jsonData.armory_items || [];

  console.log(`Found ${armoryItemsData.length} TFT armory items to import`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const item of armoryItemsData) {
    try {
      // Skip if no apiName or name
      if (!item.apiName || !item.name) {
        console.log(`⏭️  Skipping armory item (missing apiName or name)`);
        skipCount++;
        continue;
      }

      // Check if item already exists
      try {
        const existing = await tftArmoryItemsService.findByApiName(
          item.apiName,
        );
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
      const tftArmoryItem = await tftArmoryItemsService.create({
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
      });

      console.log(
        `✅ Created: ${tftArmoryItem.name} (apiName: ${tftArmoryItem.apiName})`,
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
  console.log(`📊 Total: ${armoryItemsData.length}`);

  await app.close();
  process.exit(0);
}

importTftArmoryItems().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
