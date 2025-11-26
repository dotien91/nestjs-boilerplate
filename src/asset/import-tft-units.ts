import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TftUnitsService } from '../tft-units/tft-units.service';
import * as fs from 'fs';
import * as path from 'path';

interface TftUnitData {
  apiName: string;
  characterName?: string;
  cost?: number | null;
  icon?: string | null;
  name: string;
  role?: string | null;
  squareIcon?: string | null;
  tileIcon?: string | null;
  traits?: string[];
  en_name?: string;
  ability?: {
    desc?: string | null;
    icon?: string | null;
    name?: string | null;
    variables?: Array<{
      name: string;
      value: number | number[];
    }>;
    tooltipElements?: any[];
    calculations?: Record<string, any>;
  } | null;
  stats?: {
    armor?: number | null;
    attackSpeed?: number | null;
    critChance?: number | null;
    critMultiplier?: number | null;
    damage?: number | null;
    hp?: number | null;
    initialMana?: number | null;
    magicResist?: number | null;
    mana?: number | null;
    range?: number | null;
  } | null;
}

async function importTftUnits() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tftUnitsService = app.get(TftUnitsService);

  // Read TFTSet16_latest_en_us.json
  const jsonPath = path.join(__dirname, 'TFTSet16_latest_en_us.json');
  const jsonData: any = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const unitsData: TftUnitData[] = jsonData.units || [];

  console.log(`Found ${unitsData.length} TFT units to import`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const unit of unitsData) {
    try {
      // Skip if no apiName or name
      if (!unit.apiName || !unit.name) {
        console.log(`⏭️  Skipping unit (missing apiName or name)`);
        skipCount++;
        continue;
      }

      // Check if unit already exists
      try {
        const existing = await tftUnitsService.findByApiName(unit.apiName);
        if (existing) {
          console.log(
            `⏭️  Skipping ${unit.name} (already exists with apiName: ${unit.apiName})`,
          );
          skipCount++;
          continue;
        }
      } catch (error) {
        // Unit doesn't exist, continue
      }

      // Create unit
      const tftUnit = await tftUnitsService.create({
        apiName: unit.apiName,
        name: unit.name,
        enName: unit.en_name || null,
        characterName: unit.characterName || null,
        cost: unit.cost || null,
        icon: unit.icon || null,
        squareIcon: unit.squareIcon || null,
        tileIcon: unit.tileIcon || null,
        role: unit.role || null,
        ability: unit.ability || null,
        stats: unit.stats || null,
        traits: unit.traits || [],
      });

      console.log(
        `✅ Created: ${tftUnit.name} (apiName: ${tftUnit.apiName}, cost: ${tftUnit.cost || 'N/A'})`,
      );
      successCount++;
    } catch (error: any) {
      console.error(`❌ Error importing ${unit.name}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total: ${unitsData.length}`);

  await app.close();
  process.exit(0);
}

importTftUnits().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

