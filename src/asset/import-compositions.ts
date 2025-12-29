import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../app.module';
import { CompositionsService } from '../compositions/compositions.service';
import { TftUnitsService } from '../tft-units/tft-units.service';
import { CompositionSchemaClass } from '../compositions/infrastructure/persistence/document/entities/composition.schema';
import { Composition } from '../compositions/domain/composition';
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
 * Tự động sắp xếp vị trí units trong đội hình
 * - Ranged units (range > 1) → hàng cuối (row 3) ở các góc
 * - Tank chính (HP cao, armor cao) → cùng bên với carry damage, hàng đầu
 * - Carry damage (có items, cost cao) → một bên (left hoặc right), hàng đầu
 */
function autoArrangeUnitPositions(units: Array<{
  championId: string;
  championKey: string;
  name: string;
  cost: number;
  star: number;
  carry: boolean;
  position: { row: number; col: number };
  items: string[];
  image?: string;
  needUnlock: boolean;
  need3Star: boolean;
  traits: string[];
  stats?: {
    range?: number | null;
    hp?: number | null;
    armor?: number | null;
    damage?: number | null;
  } | null;
}>, boardRows = 4, boardCols = 7): Array<{
  championId: string;
  championKey: string;
  name: string;
  cost: number;
  star: number;
  carry: boolean;
  position: { row: number; col: number };
  items: string[];
  image?: string;
  needUnlock: boolean;
  need3Star: boolean;
  traits: string[];
}> {
  if (units.length === 0) return units;

  // Phân loại units
  const rangedUnits: typeof units = [];
  const meleeUnits: typeof units = [];
  const carryUnits: typeof units = [];
  const tankUnits: typeof units = [];

  for (const unit of units) {
    const range = unit.stats?.range ?? 1;
    // Tướng có tay dài: range > 1 (range = 2, 3, 4, ...)
    const isRanged = range > 1;
    const hasItems = unit.items && unit.items.length > 0;
    
    // Xác định carry: đã được đánh dấu carry (từ logic import: unit có items = carry)
    const isCarry = unit.carry || hasItems;
    
    // Xác định tank: HP > 800 và Armor > 40, hoặc có trait tanky (Vanguard, Warden, etc)
    const hasTankTrait = unit.traits?.some(t => 
      ['Vanguard', 'Warden', 'Bruiser', 'Guardian'].includes(t)
    );
    const isTank = hasTankTrait || 
      (unit.stats?.hp && unit.stats.hp > 800 && unit.stats?.armor && unit.stats.armor > 40);

    // Phân loại: ranged units (tay dài) luôn vào danh sách ranged
    if (isRanged) {
      rangedUnits.push(unit);
      // Ranged unit có thể vừa là carry, nhưng vẫn phải đặt ở hàng cuối
      if (isCarry) {
        carryUnits.push(unit);
      }
    } else {
      // Melee units (tay ngắn)
      meleeUnits.push(unit);
      if (isCarry) {
        carryUnits.push(unit);
      }
    }

    if (isTank && !isCarry) { // Tank không phải carry
      tankUnits.push(unit);
    }
  }
  
  console.log(`  📊 Phân loại: ${rangedUnits.length} ranged, ${meleeUnits.length} melee, ${carryUnits.length} carry, ${tankUnits.length} tank`);

  // Xác định bên cho carry (left = col 0-2, right = col 4-6)
  // Ưu tiên bên có carry unit, nếu không có thì chọn left
  let carrySide: 'left' | 'right' = 'left';
  if (carryUnits.length > 0) {
    const firstCarryOriginalCol = carryUnits[0].position?.col ?? 0;
    carrySide = firstCarryOriginalCol < 3 ? 'left' : 'right';
  }
  const lastRow = boardRows - 1; // row 3 (0-indexed), hàng cuối cùng
  const frontRow = 0; // Hàng đầu, nơi đặt carry và tank

  // Sắp xếp vị trí
  const arrangedUnits: typeof units = [];
  const usedPositions = new Set<string>();

  // Helper để check position đã dùng
  const isPositionUsed = (row: number, col: number): boolean => {
    return usedPositions.has(`${row},${col}`);
  };

  // Helper để tìm position trống gần nhất
  const findNearestEmptyPosition = (preferredRow: number, preferredCol: number): { row: number; col: number } => {
    // Thử vị trí ưu tiên trước
    if (!isPositionUsed(preferredRow, preferredCol)) {
      return { row: preferredRow, col: preferredCol };
    }

    // Tìm xung quanh
    for (let offset = 1; offset < boardCols; offset++) {
      // Left side
      if (preferredCol - offset >= 0 && !isPositionUsed(preferredRow, preferredCol - offset)) {
        return { row: preferredRow, col: preferredCol - offset };
      }
      if (preferredCol + offset < boardCols && !isPositionUsed(preferredRow, preferredCol + offset)) {
        return { row: preferredRow, col: preferredCol + offset };
      }
    }

    // Nếu không tìm được, tìm bất kỳ vị trí trống
    for (let row = 0; row < boardRows; row++) {
      for (let col = 0; col < boardCols; col++) {
        if (!isPositionUsed(row, col)) {
          return { row, col };
        }
      }
    }

    // Fallback
    return { row: 0, col: 0 };
  };

  // 1. Đặt carry units ở hàng đầu (chỉ melee carry), ranged carry sẽ được đặt ở hàng cuối cùng bên
  // Tách carry thành melee carry và ranged carry
  const meleeCarryUnits = carryUnits.filter(u => {
    const range = u.stats?.range ?? 1;
    return range <= 1; // Melee only
  });
  
  const rangedCarryUnits = carryUnits.filter(u => {
    const range = u.stats?.range ?? 1;
    return range > 1; // Ranged carry
  });

  // Sort melee carry theo priority: nhiều items hơn, cost cao hơn, star cao hơn
  meleeCarryUnits.sort((a, b) => {
    const aItemsCount = a.items?.length ?? 0;
    const bItemsCount = b.items?.length ?? 0;
    if (bItemsCount !== aItemsCount) return bItemsCount - aItemsCount; // Nhiều items hơn = carry chính
    if (b.cost !== a.cost) return b.cost - a.cost;
    if (b.star !== a.star) return b.star - a.star;
    return 0;
  });

  // Xác định bên của melee carry trước
  if (meleeCarryUnits.length > 0) {
    const firstMeleeCarryOriginalCol = meleeCarryUnits[0].position?.col ?? 0;
    carrySide = firstMeleeCarryOriginalCol < 3 ? 'left' : 'right';
  } else if (rangedCarryUnits.length > 0) {
    // Nếu không có melee carry, dùng ranged carry để xác định bên
    const firstRangedCarryOriginalCol = rangedCarryUnits[0].position?.col ?? 0;
    carrySide = firstRangedCarryOriginalCol < 3 ? 'left' : 'right';
  }

  // Đặt melee carry ở hàng đầu
  meleeCarryUnits.forEach((unit, index) => {
    let preferredCol: number;
    if (carrySide === 'left') {
      // Left side: col 0, 1, 2
      // Carry chính (nhiều items nhất) ở col 1 (giữa bên trái)
      // Carry phụ ở col 0 hoặc 2
      if (index === 0) {
        preferredCol = 1; // Carry chính ở giữa
      } else if (index === 1) {
        preferredCol = 0; // Carry phụ 1 ở trái
      } else if (index === 2) {
        preferredCol = 2; // Carry phụ 2 ở phải
      } else {
        preferredCol = index % 3; // Nếu có nhiều hơn 3 carry, luân phiên
      }
    } else {
      // Right side: col 4, 5, 6
      // Carry chính (nhiều items nhất) ở col 5 (giữa bên phải)
      // Carry phụ ở col 4 hoặc 6
      if (index === 0) {
        preferredCol = 5; // Carry chính ở giữa
      } else if (index === 1) {
        preferredCol = 6; // Carry phụ 1 ở phải
      } else if (index === 2) {
        preferredCol = 4; // Carry phụ 2 ở trái
      } else {
        preferredCol = 4 + (index % 3); // Nếu có nhiều hơn 3 carry, luân phiên
      }
    }
    const position = findNearestEmptyPosition(frontRow, preferredCol);
    usedPositions.add(`${position.row},${position.col}`);
    arrangedUnits.push({ ...unit, position });
    console.log(`  📍 Melee Carry "${unit.name}" (${unit.items?.length ?? 0} items) → Row ${position.row}, Col ${position.col}`);
  });
  
  // Ranged carry sẽ được đặt cùng bên với melee carry ở hàng cuối (xem bước 3)

  // 2. Đặt tank chính cùng bên với carry, ở hàng đầu
  // carrySide đã được xác định ở bước 1
  if (tankUnits.length > 0 && (meleeCarryUnits.length > 0 || rangedCarryUnits.length > 0)) {
    // Sort tanks theo HP và armor
    tankUnits.sort((a, b) => {
      const aHp = a.stats?.hp ?? 0;
      const bHp = b.stats?.hp ?? 0;
      const aArmor = a.stats?.armor ?? 0;
      const bArmor = b.stats?.armor ?? 0;
      if (bHp !== aHp) return bHp - aHp;
      return bArmor - aArmor;
    });
    
    const mainTank = tankUnits[0]; // Tank có HP và armor cao nhất
    
    // Đặt tank gần carry nhất cùng bên
    const tankCol = carrySide === 'left' ? 0 : 6; // Ở góc cùng bên với carry
    const position = findNearestEmptyPosition(frontRow, tankCol);
    usedPositions.add(`${position.row},${position.col}`);
    arrangedUnits.push({ ...mainTank, position });
    
    // Đặt các tank phụ xung quanh
    tankUnits.slice(1).forEach((tank, index) => {
      const offset = index + 1;
      const tankCol2 = carrySide === 'left' 
        ? Math.min(2, offset) 
        : Math.max(4, 6 - offset);
      const position2 = findNearestEmptyPosition(frontRow, tankCol2);
      usedPositions.add(`${position2.row},${position2.col}`);
      arrangedUnits.push({ ...tank, position: position2 });
    });
  }

  // 3. Đặt ranged units ở hàng cuối (row 3 - hàng cuối cùng)
  // Ranged carry units cần đứng cùng bên với melee carry
  // Sort ranged units: ranged carry (nhiều items) được ưu tiên góc tốt hơn
  rangedUnits.sort((a, b) => {
    const aIsCarry = a.carry || (a.items?.length ?? 0) > 0;
    const bIsCarry = b.carry || (b.items?.length ?? 0) > 0;
    if (aIsCarry && !bIsCarry) return -1; // Carry ưu tiên
    if (!aIsCarry && bIsCarry) return 1;
    return (b.items?.length ?? 0) - (a.items?.length ?? 0); // Nhiều items hơn ưu tiên
  });
  
  rangedUnits.forEach((unit) => {
    const isRangedCarry = unit.carry || (unit.items?.length ?? 0) > 0;
    
    // Xác định vị trí ưu tiên cho ranged units
    let preferredPositions: Array<{ row: number; col: number }> = [];
    
    if (isRangedCarry && (meleeCarryUnits.length > 0 || rangedCarryUnits.length > 0)) {
      // Ranged carry cần đứng cùng bên với melee carry
      if (carrySide === 'left') {
        // Cùng bên trái: col 0, 1, 2 ở hàng cuối
        preferredPositions = [
          { row: lastRow, col: 0 }, // Góc trái dưới
          { row: lastRow, col: 1 },
          { row: lastRow, col: 2 },
          { row: lastRow, col: boardCols - 1 }, // Nếu bên trái đầy, dùng góc phải
          { row: lastRow, col: boardCols - 2 },
          { row: lastRow, col: 3 },
        ];
      } else {
        // Cùng bên phải: col 4, 5, 6 ở hàng cuối
        preferredPositions = [
          { row: lastRow, col: boardCols - 1 }, // Góc phải dưới
          { row: lastRow, col: 5 },
          { row: lastRow, col: 4 },
          { row: lastRow, col: 0 }, // Nếu bên phải đầy, dùng góc trái
          { row: lastRow, col: 3 },
          { row: lastRow, col: 2 },
        ];
      }
    } else {
      // Ranged units không phải carry - đặt ở góc hàng cuối
      preferredPositions = [
        { row: lastRow, col: 0 }, // Góc trái dưới
        { row: lastRow, col: boardCols - 1 }, // Góc phải dưới
        { row: lastRow, col: 1 },
        { row: lastRow, col: boardCols - 2 },
        { row: lastRow, col: 2 },
        { row: lastRow, col: boardCols - 3 },
        { row: lastRow, col: 3 }, // Giữa
      ];
    }
    
    // Tìm vị trí trống ở hàng cuối
    let position = preferredPositions.find(p => !isPositionUsed(p.row, p.col));
    
    // Nếu hàng cuối đầy, tìm vị trí trống ở hàng cuối (không chuyển lên hàng trên)
    if (!position) {
      // Tìm bất kỳ vị trí trống nào ở hàng cuối
      for (let col = 0; col < boardCols; col++) {
        if (!isPositionUsed(lastRow, col)) {
          position = { row: lastRow, col };
          break;
        }
      }
    }
    
    // Nếu vẫn không tìm được ở hàng cuối, mới tìm hàng trên (nhưng ưu tiên hàng cuối)
    if (!position) {
      position = findNearestEmptyPosition(lastRow - 1, Math.floor(boardCols / 2));
      console.log(`  ⚠️  Ranged unit "${unit.name}" không tìm được vị trí ở hàng cuối, đặt ở row ${position.row}`);
    } else {
      const sideLabel = position.col < 3 ? 'trái' : (position.col > 3 ? 'phải' : 'giữa');
      const carryLabel = isRangedCarry ? ' (Ranged Carry)' : '';
      console.log(`  📍 Ranged unit "${unit.name}"${carryLabel} (range: ${unit.stats?.range}) → Row ${position.row}, Col ${position.col} (bên ${sideLabel})`);
    }
    
    usedPositions.add(`${position.row},${position.col}`);
    arrangedUnits.push({ ...unit, position });
  });

  // 4. Đặt melee units còn lại ở hàng giữa (row 1-2), fill xung quanh carry và tank
  meleeUnits.forEach((unit) => {
    if (arrangedUnits.find(u => u.championId === unit.championId)) return; // Đã được đặt
    
    // Ưu tiên hàng 1-2, gần carry/tank
    const preferredRow = 1; // Hàng thứ 2 từ trên
    // Ưu tiên cùng bên với carry/tank
    const preferredCol = carrySide === 'left' 
      ? Math.floor(Math.random() * 4) // Col 0-3
      : 3 + Math.floor(Math.random() * 4); // Col 3-6
    
    const position = findNearestEmptyPosition(preferredRow, preferredCol);
    usedPositions.add(`${position.row},${position.col}`);
    arrangedUnits.push({ ...unit, position });
  });

  // Remove stats field từ tất cả units trước khi return
  return arrangedUnits.map(unit => {
    const { stats, ...unitWithoutStats } = unit;
    return unitWithoutStats;
  });
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

  console.log(`Found ${compositionsData.length} compositions to import\n`);

  // Bước 1: Set active = false cho tất cả compositions cũ
  console.log('🔄 Setting active=false for all existing compositions...');
  try {
    const compositionsModel = app.get(getModelToken(CompositionSchemaClass.name));
    const result = await compositionsModel.updateMany(
      {},
      { $set: { active: false } }
    );
    console.log(`✅ Deactivated ${result.modifiedCount} existing compositions\n`);
  } catch (error: any) {
    console.warn(`⚠️  Could not deactivate old compositions: ${error.message}`);
    console.log('Continuing with import...\n');
  }

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

      let existingComposition: Composition | null = null;

      // Check by name first
      if (existingByName && existingByName.length > 0) {
        const existing = existingByName[0];
        // Check if name matches exactly (case-insensitive)
        if (existing.name.toLowerCase().trim() === compData.name.toLowerCase().trim()) {
          existingComposition = existing;
        }
      }

      // Also check by compId (backup check)
      if (!existingComposition) {
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
          existingComposition = existingByCompId;
        }
      }

      // Nếu composition đã tồn tại, set active = true và skip (không update lại data)
      if (existingComposition) {
        if (!existingComposition.active) {
          await compositionsService.update(existingComposition.id, { active: true });
          console.log(
            `✅ Reactivated: ${compData.name} (compId: ${existingComposition.compId})`,
          );
        } else {
          console.log(
            `⏭️  Skipping ${compData.name} (already exists and active, compId: ${existingComposition.compId})`,
          );
        }
        skipCount++;
        continue;
      }

      // Map units - find championIds for each unit
      // Note: stats field chỉ dùng tạm thời để auto-arrange, sẽ được remove sau
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
        stats?: {
          range?: number | null;
          hp?: number | null;
          armor?: number | null;
          damage?: number | null;
        } | null;
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
        
        // Unit có items thì là carry
        const hasItems = unit.items && unit.items.length > 0;
        const isCarry = hasItems;
        
        mappedUnits.push({
          championId: unitInfo.id,
          championKey: championKey,
          name: (unit.name || '').trim(), // Trim to remove trailing spaces
          cost: unitInfo.cost ?? unit.cost ?? 1,
          star: unit.star,
          carry: isCarry, // Unit có items = carry
          position: unit.position,
          items: unit.items || [],
          image: finalImage, // Only string | undefined, never null
          needUnlock: needUnlock, // From TFT Unit database
          need3Star: unit.need3Star,
          traits: traits, // From TFT Unit database
          stats: fullUnit?.stats || null, // Include stats để auto-arrange
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

      // Tự động sắp xếp vị trí units theo logic:
      // - Ranged units → hàng cuối
      // - Tank chính → cùng bên với carry
      // - Carry → một bên
      const arrangedUnits = autoArrangeUnitPositions(mappedUnits, 4, 7);
      console.log(`📍 Auto-arranged positions for ${arrangedUnits.length} units`);

      // Create composition với active = true (composition mới crawl)
      const composition = await compositionsService.create({
        name: compData.name.trim(),
        tier: compData.tier || undefined,
        plan: compData.plan || undefined,
        difficulty: compData.difficulty || undefined,
        boardSize: { rows: 4, cols: 7 }, // Default board size
        units: arrangedUnits, // Stats đã được remove trong autoArrangeUnitPositions
        active: true, // Set active = true cho compositions mới crawl
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

