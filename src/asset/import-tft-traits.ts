import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TftTraitsService } from '../tft-traits/tft-traits.service';
import * as fs from 'fs';
import * as path from 'path';

interface TftTraitData {
  apiName: string;
  desc?: string;
  effects?: Array<{
    maxUnits?: number;
    minUnits?: number;
    style?: number;
    variables?: Record<string, any>;
    variableMatches?: Array<{
      match: string;
      type?: string;
      multiplier?: string;
      full_match: string;
      hash?: string;
      value: number | string | null;
    }>;
  }>;
  icon?: string;
  name: string;
  en_name?: string;
  units?: Array<{
    unit: string;
    unit_cost?: number;
  }>;
  unitProperties?: Record<string, any>;
}

async function importTftTraits() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tftTraitsService = app.get(TftTraitsService);

  // Read TFTSet16_latest_en_us.json
  const jsonPath = path.join(__dirname, 'TFTSet16_latest_en_us.json');
  const jsonData: any = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const traitsData: TftTraitData[] = jsonData.traits || [];

  console.log(`Found ${traitsData.length} TFT traits to import`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const trait of traitsData) {
    try {
      // Skip if no apiName or name
      if (!trait.apiName || !trait.name) {
        console.log(`⏭️  Skipping trait (missing apiName or name)`);
        skipCount++;
        continue;
      }

      // Check if trait already exists
      try {
        const existing = await tftTraitsService.findByApiName(trait.apiName);
        if (existing) {
          console.log(
            `⏭️  Skipping ${trait.name} (already exists with apiName: ${trait.apiName})`,
          );
          skipCount++;
          continue;
        }
      } catch (error) {
        // Trait doesn't exist, continue
      }

      // Create trait
      const tftTrait = await tftTraitsService.create({
        apiName: trait.apiName,
        name: trait.name,
        enName: trait.en_name || null,
        desc: trait.desc || null,
        icon: trait.icon || null,
        effects: trait.effects || [],
        units: trait.units || [],
        unitProperties: trait.unitProperties || {},
      });

      console.log(
        `✅ Created: ${tftTrait.name} (apiName: ${tftTrait.apiName})`,
      );
      successCount++;
    } catch (error: any) {
      console.error(`❌ Error importing ${trait.name}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total: ${traitsData.length}`);

  await app.close();
  process.exit(0);
}

importTftTraits().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

