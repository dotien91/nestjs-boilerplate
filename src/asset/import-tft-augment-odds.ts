import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TftAugmentOddsService } from '../tft-augment-odds/tft-augment-odds.service';
import * as fs from 'fs';
import * as path from 'path';

interface TftAugmentOddData {
  odds: number;
  augments: string[];
}

async function importTftAugmentOdds() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tftAugmentOddsService = app.get(TftAugmentOddsService);

  // Read TFTSet16_latest_en_us.json
  const jsonPath = path.join(__dirname, 'TFTSet16_latest_en_us.json');
  const jsonData: any = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const augmentOddsData: TftAugmentOddData[] = jsonData.augmentOdds || [];

  console.log(`Found ${augmentOddsData.length} TFT augment odds to import`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const odd of augmentOddsData) {
    try {
      // Skip if no odds or augments
      if (!odd.odds || !odd.augments || odd.augments.length === 0) {
        console.log(`⏭️  Skipping augment odd (missing odds or augments)`);
        skipCount++;
        continue;
      }

      // Create odd
      const tftAugmentOdd = await tftAugmentOddsService.create({
        odds: odd.odds,
        augments: odd.augments,
      });

      console.log(
        `✅ Created: odds=${tftAugmentOdd.odds}, augments=[${tftAugmentOdd.augments.join(', ')}]`,
      );
      successCount++;
    } catch (error: any) {
      console.error(`❌ Error importing augment odd:`, error.message);
      errorCount++;
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total: ${augmentOddsData.length}`);

  await app.close();
  process.exit(0);
}

importTftAugmentOdds().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

