import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TftRolesService } from '../tft-roles/tft-roles.service';
import * as fs from 'fs';
import * as path from 'path';

interface TftRoleData {
  apiName: string;
  name: string;
  description?: string;
  items?: string[];
}

async function importTftRoles() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tftRolesService = app.get(TftRolesService);

  // Read TFTSet16_latest_en_us.json
  const jsonPath = path.join(__dirname, 'TFTSet16_latest_en_us.json');
  const jsonData: any = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const rolesData: Record<string, TftRoleData> = jsonData.roles || {};

  const rolesArray = Object.entries(rolesData).map(([key, value]) => ({
    ...value,
    key,
  }));

  console.log(`Found ${rolesArray.length} TFT roles to import`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const role of rolesArray) {
    try {
      // Skip if no apiName or name
      if (!role.apiName || !role.name) {
        console.log(`⏭️  Skipping role (missing apiName or name)`);
        skipCount++;
        continue;
      }

      // Check if role already exists
      try {
        const existing = await tftRolesService.findByApiName(role.apiName);
        if (existing) {
          console.log(
            `⏭️  Skipping ${role.name} (already exists with apiName: ${role.apiName})`,
          );
          skipCount++;
          continue;
        }
      } catch (error) {
        // Role doesn't exist, continue
      }

      // Create role
      const tftRole = await tftRolesService.create({
        apiName: role.apiName,
        name: role.name,
        description: role.description || null,
        items: role.items || [],
      });

      console.log(
        `✅ Created: ${tftRole.name} (apiName: ${tftRole.apiName})`,
      );
      successCount++;
    } catch (error: any) {
      console.error(`❌ Error importing ${role.name}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total: ${rolesArray.length}`);

  await app.close();
  process.exit(0);
}

importTftRoles().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

