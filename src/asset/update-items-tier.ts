import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TftItemsService } from '../tft-items/tft-items.service';
import { TftItem } from '../tft-items/domain/tft-item';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface ItemTierData {
  name: string;
  apiName?: string | null;
  tier: string;
}

async function updateItemsTier() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tftItemsService = app.get(TftItemsService);
  const logger = new Logger('UpdateItemsTierScript');

  try {
    logger.log('Starting TFT Items Tier Update Script...');

    // 1. Read crawled tier data
    const jsonPath = path.join(__dirname, 'items-tier.json');
    if (!fs.existsSync(jsonPath)) {
      logger.error(`❌ File not found: ${jsonPath}`);
      logger.error('Please run the crawl script first: npm run crawl:items-tier');
      process.exit(1);
    }

    const crawledItems: ItemTierData[] = JSON.parse(
      fs.readFileSync(jsonPath, 'utf-8'),
    );
    logger.log(`Found ${crawledItems.length} items with tier data.`);

    // 2. Get all existing items from the database (using pagination with large limit)
    const allItems = await tftItemsService.findManyWithPagination({
      filterOptions: null,
      sortOptions: null,
      paginationOptions: {
        page: 1,
        limit: 10000, // Large limit to get all items
      },
    });
    logger.log(`Found ${allItems.length} existing items in the database.`);

    let updatedCount = 0;
    let notFoundCount = 0;
    const errors: Array<{ name: string; error: string }> = [];

    // 3. Match and update items
    for (const crawledItem of crawledItems) {
      try {
        let matchedItem: TftItem | null = null;

        // Try to find by apiName first (most reliable)
        if (crawledItem.apiName) {
          matchedItem = await tftItemsService.findByApiName(crawledItem.apiName);
        }

        // If not found by apiName, try by name (case-insensitive)
        if (!matchedItem) {
          const itemsByName = await tftItemsService.findManyWithPagination({
            filterOptions: {
              name: crawledItem.name.trim(),
            },
            sortOptions: null,
            paginationOptions: {
              page: 1,
              limit: 10,
            },
          });

          if (itemsByName && itemsByName.length > 0) {
            // Find exact match (case-insensitive)
            const found = itemsByName.find(
              (item) => item.name?.toLowerCase().trim() === crawledItem.name.toLowerCase().trim(),
            );
            if (found) {
              matchedItem = found;
            }
          }
        }

        if (matchedItem) {
          const currentTier = matchedItem.tier || null;
          if (currentTier !== crawledItem.tier) {
            await tftItemsService.update(matchedItem.id, {
              tier: crawledItem.tier,
            });
            logger.log(
              `✅ Updated tier for ${matchedItem.name} (${matchedItem.apiName}): ${currentTier || 'null'} -> ${crawledItem.tier}`,
            );
            updatedCount++;
          } else {
            // logger.log(`⏭️ Tier for ${matchedItem.name} is already ${matchedItem.tier}. Skipping.`);
          }
        } else {
          logger.warn(`⚠️ Item "${crawledItem.name}" (apiName: ${crawledItem.apiName || 'N/A'}) not found in database.`);
          notFoundCount++;
        }
      } catch (error: any) {
        logger.error(`❌ Error updating ${crawledItem.name}: ${error.message}`);
        errors.push({ name: crawledItem.name, error: error.message });
      }
    }

    logger.log('\n=== Update Summary ===');
    logger.log(`✅ Successfully updated ${updatedCount} items.`);
    logger.log(`⚠️ ${notFoundCount} crawled items not found in database.`);
    if (errors.length > 0) {
      logger.log(`❌ ${errors.length} errors occurred:`);
      errors.forEach(({ name, error }) => {
        logger.log(`   - ${name}: ${error}`);
      });
    }
    logger.log('TFT Items Tier Update Script Finished.');
  } catch (error: any) {
    logger.error(`Fatal error during update: ${error.message}`, error.stack);
    process.exit(1);
  } finally {
    await app.close();
    process.exit(0);
  }
}

updateItemsTier();

