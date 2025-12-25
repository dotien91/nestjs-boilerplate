import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CompositionsService } from '../compositions/compositions.service';
import { TftUnitsService } from '../tft-units/tft-units.service';
import * as fs from 'fs';
import * as path from 'path';

interface CrawledComposition {
  id: number;
  name: string;
  tier?: string | null;
  plan?: string | null;
  difficulty?: string | null;
  units: Array<{
    name: string;
    championKey: string;
    championId?: string | null;
    cost?: number | null;
    star: number;
    position: { row: number; col: number };
    items: string[];
    image?: string | null;
    needUnlock: boolean;
    need3Star: boolean;
  }>;
  stats: {
    avgPlace?: number | null;
    pickRate?: number | null;
    winRate?: number | null;
  };
}

/**
 * Map championKey to TFT unit
 * Tries multiple variations: "Azir", "TFT16_Azir", "TFT16_Azir", etc.
 */
async function findUnitByChampionKey(
  tftUnitsService: TftUnitsService,
  championKey: string,
): Promise<{ id: string; apiName: string; cost: number | null } | null> {
  if (!championKey) return null;

  // Try exact match first
  let unit = await tftUnitsService.findByApiName(championKey);
  if (unit) {
    return {
      id: String(unit.id),
      apiName: unit.apiName,
      cost: unit.cost ?? null,
    };
  }

  // Try with TFT16_ prefix
  const withPrefix = `TFT16_${championKey}`;
  unit = await tftUnitsService.findByApiName(withPrefix);
  if (unit) {
    return {
      id: String(unit.id),
      apiName: unit.apiName,
      cost: unit.cost ?? null,
    };
  }

  // Try with TFT_ prefix
  const withTftPrefix = `TFT_${championKey}`;
  unit = await tftUnitsService.findByApiName(withTftPrefix);
  if (unit) {
    return {
      id: String(unit.id),
      apiName: unit.apiName,
      cost: unit.cost ?? null,
    };
  }

  // Try case variations
  const lowerKey = championKey.toLowerCase();
  const upperKey = championKey.toUpperCase();
  const capitalizedKey =
    championKey.charAt(0).toUpperCase() + championKey.slice(1).toLowerCase();

  for (const key of [lowerKey, upperKey, capitalizedKey]) {
    unit = await tftUnitsService.findByApiName(key);
    if (unit) {
      return {
        id: String(unit.id),
        apiName: unit.apiName,
        cost: unit.cost ?? null,
      };
    }

    unit = await tftUnitsService.findByApiName(`TFT16_${key}`);
    if (unit) {
      return {
        id: String(unit.id),
        apiName: unit.apiName,
        cost: unit.cost ?? null,
      };
    }
  }

  return null;
}

async function importCompositions() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const compositionsService = app.get(CompositionsService);
  const tftUnitsService = app.get(TftUnitsService);

  // Read compositions.json
  const jsonPath = path.join(__dirname, 'compositions.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ File not found: ${jsonPath}`);
    console.error('Please run the crawl script first: npm run crawl:compositions');
    process.exit(1);
  }

  const compositionsData: CrawledComposition[] = JSON.parse(
    fs.readFileSync(jsonPath, 'utf-8'),
  );

  console.log(`Found ${compositionsData.length} compositions to import`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const errors: Array<{ name: string; error: string }> = [];

  for (const compData of compositionsData) {
    try {
      // Check if composition already exists by name (case-insensitive)
      const existingByName = await compositionsService.findManyWithPagination({
        filterOptions: {
          name: compData.name.trim(),
        },
        sortOptions: null,
        paginationOptions: {
          page: 1,
          limit: 1,
        },
      });

      if (existingByName && existingByName.length > 0) {
        const existing = existingByName[0];
        // Check if name matches exactly (case-insensitive)
        if (existing.name.toLowerCase().trim() === compData.name.toLowerCase().trim()) {
          console.log(
            `⏭️  Skipping ${compData.name} (already exists with name: "${existing.name}", compId: ${existing.compId})`,
          );
          skipCount++;
          continue;
        }
      }

      // Also check by compId (backup check)
      const compIdSlug = compData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      const existingByCompId = await compositionsService.findByCompId(
        `comp-${compIdSlug}`,
      );
      if (existingByCompId) {
        console.log(
          `⏭️  Skipping ${compData.name} (already exists with compId: ${existingByCompId.compId})`,
        );
        skipCount++;
        continue;
      }

      // Map units - find championIds for each unit
      const mappedUnits: Array<{
        championId: string;
        championKey: string;
        name: string;
        cost: number;
        star: number;
        carry: boolean;
        position: { row: number; col: number };
        items: string[];
        image?: string; // Only string | undefined, not null
        needUnlock: boolean;
        need3Star: boolean;
        traits: string[];
      }> = [];
      const unitMappingErrors: string[] = [];

      for (const unit of compData.units) {
        // Validate position (board is 4 rows x 7 cols max)
        if (unit.position) {
          if (unit.position.row < 0 || unit.position.row >= 4 || 
              unit.position.col < 0 || unit.position.col >= 7) {
            unitMappingErrors.push(
              `Unit ${unit.name} has invalid position: row=${unit.position.row}, col=${unit.position.col}`,
            );
            // Skip this unit but continue with others
            continue;
          }
        }

        const unitInfo = await findUnitByChampionKey(
          tftUnitsService,
          unit.championKey,
        );

        if (!unitInfo) {
          unitMappingErrors.push(
            `Unit ${unit.name} (key: ${unit.championKey}) not found`,
          );
          // Skip this unit but continue with others
          continue;
        }

        // Get full unit details to get traits and needUnlock from database
        const fullUnit = await tftUnitsService.findById(unitInfo.id);
        // Ensure championKey has TFT16_ prefix
        let championKey = unitInfo.apiName;
        if (!championKey.startsWith('TFT16_')) {
          championKey = `TFT16_${championKey}`;
        }

        // Get traits from TFT Unit database
        const traits = fullUnit?.traits || [];
        
        // Get needUnlock from TFT Unit database (priority), fallback to crawled data
        const needUnlock = fullUnit?.needUnlock === true ? true : (unit.needUnlock || false);

        // Convert null to undefined for image field
        const imageValue = unit.image?.trim();
        const finalImage = imageValue && imageValue.length > 0 ? imageValue : undefined;
        
        mappedUnits.push({
          championId: unitInfo.id,
          championKey: championKey,
          name: (unit.name || '').trim(), // Trim to remove trailing spaces
          cost: unitInfo.cost ?? unit.cost ?? 1,
          star: unit.star,
          carry: false, // Default to false, can be set manually later
          position: unit.position,
          items: unit.items || [],
          image: finalImage, // Only string | undefined, never null
          needUnlock: needUnlock, // From TFT Unit database
          need3Star: unit.need3Star,
          traits: traits, // From TFT Unit database
        });
      }

      if (mappedUnits.length === 0) {
        console.log(
          `⏭️  Skipping ${compData.name} (no valid units found after mapping)`,
        );
        skipCount++;
        continue;
      }

      if (unitMappingErrors.length > 0) {
        console.log(
          `⚠️  ${compData.name}: ${unitMappingErrors.length} units could not be mapped:`,
        );
        unitMappingErrors.forEach((err) => console.log(`   - ${err}`));
      }

      // Create composition
      const composition = await compositionsService.create({
        name: compData.name.trim(),
        tier: compData.tier || undefined,
        plan: compData.plan || undefined,
        difficulty: compData.difficulty || undefined,
        boardSize: { rows: 4, cols: 7 }, // Default board size
        units: mappedUnits,
        // Note: earlyGame, midGame, bench, carryItems, notes are not available from crawl
        // These would need to be added manually or crawled from detail pages
        earlyGame: undefined, // Will default to empty array in schema
        midGame: undefined, // Will default to empty array in schema
        bench: undefined, // Will default to empty array in schema
        carryItems: undefined, // Will default to empty array in schema
        notes: [], // Empty array by default
      });

      console.log(
        `✅ Created: ${composition.name} (compId: ${composition.compId}, ${mappedUnits.length} units)`,
      );
      successCount++;
    } catch (error: any) {
      console.error(`❌ Error importing ${compData.name}:`, error.message);
      errors.push({ name: compData.name, error: error.message });
      errorCount++;
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  if (errors.length > 0) {
    console.log('\n=== Errors ===');
    errors.forEach(({ name, error }) => {
      console.log(`- ${name}: ${error}`);
    });
  }

  await app.close();
}

importCompositions().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

