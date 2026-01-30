import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import {
  generateChampionKey,
  generateItemKey,
  generateSlug,
} from '../utils/mobalytics-helpers';
import { CompositionsService } from '../compositions/compositions.service';
import { CreateCompositionDto } from '../compositions/dto/create-composition.dto';
import { ItemLookupService } from './item-lookup.service';
import { TftUnitsService } from '../tft-units/tft-units.service';

// --- Helper Functions ---
function extractItemSlugFromUrl(url: string): string {
  if (!url) return '';
  let filename = url.split('/').pop()?.split('?')[0]?.split('.')[0] || '';
  filename = filename.replace(/[-_]v?\d+$/, '');
  return filename.replace(/[^a-zA-Z0-9]/g, '');
}

// --- Interfaces ---
type CrawlPosition = { row: number; col: number };

type CrawlUnit = {
  championId: string;
  championKey: string;
  name: string;
  cost: number;
  star: number;
  carry?: boolean;
  need3Star?: boolean;
  needUnlock?: boolean;
  position: CrawlPosition;
  image?: string;
  items?: string[];
  traits?: string[];
  tier?: number;
};

type CrawlAugment = {
  name: string;
  tier: number;
};

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(
    private readonly compositionsService: CompositionsService,
    private readonly itemLookupService: ItemLookupService,
    private readonly tftUnitsService: TftUnitsService,
  ) {}

  // ==========================================
  // PUBLIC METHODS (Cho Controller)
  // ==========================================
  
  /**
   * Test lấy danh sách link (không crawl chi tiết)
   */
  async crawlTeamComps(url?: string) {
    const targetUrl = url || 'https://mobalytics.gg/tft/team-comps';
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 },
    });

    try {
      const links = await this.getCompLinks(browser, targetUrl);
      return { count: links.length, data: links };
    } catch (error) {
      this.logger.error(`Crawl Team Comps Error: ${error}`);
      return { count: 0, data: [] };
    } finally {
      await browser.close();
    }
  }

  // ==========================================
  // CRON JOBS
  // ==========================================

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleDailyUnitTierCrawl() {
    this.logger.log('🕐 Daily unit tier crawl started.');
    const tiers = await this.fetchMetaTftUnitTiers();
    if (tiers.length === 0) {
      this.logger.warn('No unit tiers found from MetaTFT.');
      return;
    }

    const units = await this.tftUnitsService.findAll();
    const unitMap = new Map<string, typeof units[number]>();

    units.forEach((unit) => {
      const normalizedName = this.normalizeUnitName(unit.name || unit.characterName || unit.enName || '');
      if (normalizedName) unitMap.set(normalizedName, unit);
    });

    let updatedCount = 0;
    for (const entry of tiers) {
      const key = this.normalizeUnitName(entry.name);
      const unit = unitMap.get(key);
      if (!unit) continue;

      if (unit.tier !== entry.tier) {
        await this.tftUnitsService.update(unit.id, { tier: entry.tier });
        updatedCount += 1;
      }
    }

    this.logger.log(`✅ Unit tier crawl finished. Updated: ${updatedCount}`);
  }

  // @Cron(CronExpression.EVERY_4_HOURS) // Tắt tự động crawl
  async handleDailyCrawl() {
    this.logger.log('🕛 Daily crawl job started.');
    await this.crawlAllCompositions();
    this.logger.log('✅ Daily crawl job finished.');
  }

  /**
   * ==========================================
   * MAIN LOGIC: FULL SYNC (CRAWL + DELETE STALE)
   * ==========================================
   */
  async crawlAllCompositions() {
    const targetUrl = 'https://mobalytics.gg/tft/team-comps';
    this.logger.log('🚀 STARTING FULL SYNC CRAWL PROCESS...');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 },
    });

    try {
      // 1. Lấy danh sách link
      this.logger.log('Phase 1: Fetching Comp Links...');
      const compLinks = await this.getCompLinks(browser, targetUrl);
      this.logger.log(`Found ${compLinks.length} comps. Starting detailed crawl...`);

      const BATCH_SIZE = 3;
      let createdCount = 0;
      let updatedCount = 0;
      
      // [QUAN TRỌNG] Danh sách các tên hợp lệ tìm thấy trong lần này
      const validNames: string[] = [];

      // 2. Duyệt qua từng batch
      for (let i = 0; i < compLinks.length; i += BATCH_SIZE) {
        const batch = compLinks.slice(i, i + BATCH_SIZE);
        this.logger.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`);

        // A. Crawl dữ liệu song song (không lưu DB)
        const batchResults = await Promise.all(
          batch.map((linkData) =>
            this.crawlCompDetail(linkData.url, browser)
              .catch((err) => {
                const message = err instanceof Error ? err.message : String(err);
                this.logger.error(`❌ Failed ${linkData.url}: ${message}`);
                return null;
              }),
          ),
        );

        // B. Lưu DB tuần tự & Tracking tên
        for (const composition of batchResults) {
          if (!composition || !composition.name) continue;

          // Push tên vào danh sách hợp lệ
          validNames.push(composition.name);

          try {
            const exists = await this.compositionsService.findByName(composition.name);

            if (exists) {
              // Logic Update: Chỉ update tier hoặc các info quan trọng
              if (exists.tier !== composition.tier) {
                await this.compositionsService.update(exists.id, { 
                    tier: composition.tier,
                    // Có thể thêm các field khác cần update tại đây
                });
                this.logger.log(`🔄 Updated Tier: ${composition.name} (${exists.tier} -> ${composition.tier})`);
                updatedCount++;
              } else {
                this.logger.log(`⏭️ Skip duplicate: ${composition.name}`);
              }
            } else {
              // Logic Create
              await this.compositionsService.create(composition);
              this.logger.log(`✅ Created: ${composition.name}`);
              createdCount++;
            }
          } catch (dbError) {
            this.logger.error(`DB Error for ${composition.name}: ${dbError}`);
          }
        }
        
        // Delay tránh chặn IP
        await new Promise(r => setTimeout(r, 1000));
      }

      // 3. CLEANUP: Xóa các đội hình cũ không còn trong validNames
      // [SAFETY CHECK] Chỉ chạy xóa khi validNames không rỗng (đề phòng lỗi crawl toàn bộ)
      if (validNames.length > 0) {
        this.logger.log(`🧹 Cleaning up stale compositions...`);
        // Yêu cầu Service: removeByNameNotIn(names: string[])
        const deletedCount = await this.compositionsService.removeByNameNotIn(validNames);
        this.logger.log(`🗑️ Deleted ${deletedCount} stale compositions.`);
      } else {
        this.logger.warn('⚠️ No comps found via crawl. Cleanup skipped to prevent data loss.');
      }

      this.logger.log(`🎉 FINISHED! Created: ${createdCount}, Updated: ${updatedCount}`);
      return { createdCount, updatedCount };

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Fatal Error: ${message}`);
      return [];
    } finally {
      await browser.close();
    }
  }

/**
   * CRAWL CHI TIẾT 1 TRANG (FIXED TIMEOUT)
   */
  async crawlCompDetail(url: string, existingBrowser?: puppeteer.Browser) {
    const browser = existingBrowser || (await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1920, height: 1080 },
    }));

    const page = await browser.newPage();

    // [QUAN TRỌNG] Set User-Agent để tránh bị chặn hoặc throttle
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      // Chặn thêm các loại resource không cần thiết khác
      const resourceType = req.resourceType();
      if (['font', 'media', 'stylesheet', 'other'].includes(resourceType)) {
        req.abort();
      } else if (resourceType === 'image') {
        // Chỉ load ảnh icon tướng/item (quan trọng để parse), chặn ảnh banner quảng cáo
        const url = req.url();
        if (url.includes('champions/icons') || url.includes('items')) {
            req.continue();
        } else {
            req.abort();
        }
      } else {
        req.continue();
      }
    });

    try {
      // [QUAN TRỌNG] Đổi chiến thuật wait:
      // 1. Dùng 'domcontentloaded' thay vì 'networkidle0' (nhanh hơn, tránh timeout do tracking script)
      // 2. Tăng timeout lên 120s (2 phút)
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
      
      // [QUAN TRỌNG] Chờ thủ công element quan trọng xuất hiện thay vì chờ network
      // Class .m-67sb4n là container chứa board, hoặc chờ h1 (tên bài)
      await page.waitForSelector('h1', { timeout: 30000 }).catch(() => null);

      // Scroll nhẹ để trigger lazy load (giữ nguyên)
      await page.evaluate(async () => {
        window.scrollBy(0, 500);
        await new Promise((resolve) => setTimeout(resolve, 500));
      });

      // Chờ ảnh tướng load (giảm timeout xuống để fail-fast nếu không có ảnh)
      await page.waitForSelector('img[src*="/champions/icons/"]', { timeout: 5000 }).catch(() => null);

      const content = await page.content();
      const composition = this.parseDetailHtml(content, url);

      return composition;

    } catch (error) {
      // Ném lỗi để hàm cha log lại url bị lỗi
      throw error;
    } finally {
      await page.close();
      if (!existingBrowser) {
        await browser.close();
      }
    }
  }
  // ==========================================
  // PARSING & UTILS
  // ==========================================

  private async scrollUntilBottom(page: puppeteer.Page) {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 200;
        let retries = 0;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight - window.innerHeight) {
            if (retries >= 5) {
              clearInterval(timer);
              resolve();
            } else {
              retries++;
              totalHeight = scrollHeight; // Reset logic
            }
          } else {
            retries = 0;
          }
        }, 150);
      });
    });
    await new Promise(r => setTimeout(r, 2000));
  }

  private async getCompLinks(
    browser: puppeteer.Browser,
    url: string,
  ): Promise<Array<{ url: string; name?: string }>> {
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.resourceType() === 'image') req.abort();
      else req.continue();
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await page.waitForSelector('a[href*="/tft/comps-guide/"]', { timeout: 15000 });

      await this.scrollUntilBottom(page);

      const content = await page.content();
      const $ = cheerio.load(content);
      const links = new Map<string, { url: string; name?: string }>();

      $('a[href*="/tft/comps-guide/"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
          const fullUrl = new URL(href, url).toString();
          links.set(fullUrl, { url: fullUrl });
        }
      });

      return Array.from(links.values());
    } finally {
      await page.close();
    }
  }

  private parseDetailHtml(html: string, sourceUrl: string): CreateCompositionDto {
    const $ = cheerio.load(html);
    const compName = $('h1').first().text().trim() || 'Unknown Comp';
    const tier = $('img[src*="hex-tiers"]').attr('alt')?.toUpperCase() || 'C';
    
    let plan = 'Standard';
    $('div.m-ttncf1').each((_, el) => {
      const text = $(el).text().trim();
      if (['Fast', 'Roll', 'Level'].some((k) => text.includes(k))) plan = text;
    });

    const metaDescription = $('meta[name="description"]').attr('content') || `Guide for ${compName}`;
    const difficulty = $('div').filter((_, el) => ['Easy', 'Medium', 'Hard'].includes($(el).text().trim())).first().text().trim() || 'Medium';

    const units: CrawlUnit[] = [];
    let coreChampion: CrawlUnit | null = null;
    const unknownItems = new Set<string>();

    const boardRows = $('.m-67sb4n .m-i9rwau'); // Grid layout
    boardRows.each((rowIndex, rowEl) => {
      $(rowEl).find('.m-bjn8wh').each((colIndex, cellEl) => {
          const $cell = $(cellEl);
          const unitImage = $cell.find('image, img').filter((_, img) => {
            const src = $(img).attr('href') || $(img).attr('src') || '';
            return src.includes('/champions/icons/');
          });

          if (unitImage.length > 0) {
            const imageUrl = unitImage.attr('href') || unitImage.attr('src') || '';
            const rawSlug = imageUrl.split('/').pop()?.split('.')[0] || '';
            if (!rawSlug) return;

            const rawName = rawSlug.charAt(0).toUpperCase() + rawSlug.slice(1);
            const items: string[] = [];
            $cell.find('.m-1pmxhli img').each((_, itemEl) => {
              const src = $(itemEl).attr('src') || $(itemEl).attr('href') || '';
              const rawSlug = extractItemSlugFromUrl(src) || $(itemEl).attr('alt');
              if (rawSlug) {
                // Mapping item đặc biệt
                if (rawSlug.toLowerCase() === 'guardbreaker') items.push('TFT_Item_PowerGauntlet');
                else if (rawSlug.toLowerCase() === 'fimbulwinter') items.push('TFT_Item_FrozenHeart');
                else if (rawSlug.toLowerCase() === 'steadfasthammer') items.push('TFT_Item_NightHarvester');
                else {
                    const apiName = this.itemLookupService.getValidApiName(rawSlug);
                    if (apiName) items.push(apiName);
                    else { items.push(`UNKNOWN_${rawSlug}`); unknownItems.add(rawSlug as string); }
                }
              }
            });

            const isCarry = items.length > 0;
            const unitData: CrawlUnit = {
              championId: generateSlug(rawName),
              championKey: this.itemLookupService.getValidChampionKey(rawName) || generateChampionKey(rawName),
              name: rawName,
              cost: 0,
              star: 2,
              carry: isCarry,
              position: { row: rowIndex, col: colIndex },
              items: items,
              image: imageUrl,
              traits: [],
            };
            units.push(unitData);
            if (isCarry && (!coreChampion || items.length > (coreChampion.items?.length || 0))) {
              coreChampion = unitData;
            }
          }
        });
    });

    // Fallback parsing (List mode)
    if (units.length === 0) {
      const unitsMap = new Map<string, CrawlUnit>();
      $('a[href*="/tft/champions/"]').each((_, el) => {
        const $el = $(el);
        const img = $el.find('img').first();
        const rawName = img.attr('alt');
        if (!rawName || rawName.length > 20) return;

        const champId = generateSlug(rawName);
        const items: string[] = [];
        $el.closest('div').parent().find('img[src*="game-items"]').each((_, itemEl) => {
            const itemAlt = $(itemEl).attr('alt');
            if (itemAlt) items.push(generateItemKey(itemAlt));
        });

        const isCarry = items.length >= 2;
        if (!unitsMap.has(champId)) {
            unitsMap.set(champId, {
                championId: champId,
                championKey: this.itemLookupService.getValidChampionKey(rawName) || generateChampionKey(rawName),
                name: rawName,
                cost: 0, star: 2, carry: isCarry,
                position: { row: 3, col: unitsMap.size },
                items: items, traits: []
            });
        }
      });
      units.push(...unitsMap.values());
      coreChampion = units.find(u => u.carry) || units[0];
    }

    // Parse Augments
    const augments: CrawlAugment[] = [];
    const tierSpans = $('span').filter((_, el) => /^Tier\s+\d+$/.test($(el).text().trim()));
    tierSpans.each((_, el) => {
      const tier = parseInt($(el).text().trim().split(' ')[1], 10);
      $(el).parent().parent().find('img').each((_, imgEl) => {
        const $img = $(imgEl);
        let rawSlug = $img.attr('alt') || '';
        const src = $img.attr('src') || '';
        if (!rawSlug || ['t1', 't2', 't3'].includes(rawSlug.toLowerCase())) rawSlug = extractItemSlugFromUrl(src);
        if (!rawSlug || ['t1', 't2', 't3'].includes(rawSlug.toLowerCase())) return;

        const apiName = this.itemLookupService.getValidAugmentApiName(rawSlug);
        if (apiName) augments.push({ name: apiName, tier: tier });
      });
    });
    
    // Dedup augments
    const finalAugments = Array.from(new Map(augments.map(a => [a.name, a])).values());

    return {
      compId: `comp-${generateSlug(compName)}-${Date.now()}`,
      name: compName,
      plan: plan,
      difficulty: difficulty,
      metaDescription: metaDescription,
      isLateGame: plan.includes('8') || plan.includes('9'),
      tier: tier,
      active: true,
      boardSize: { rows: 4, cols: 7 },
      units,
      earlyGame: [],
      midGame: [],
      bench: [],
      notes: [],
      augments: finalAugments,
      coreChampion: coreChampion || units[0],
    };
  }

  // --- MetaTFT Logic ---
  private async fetchMetaTftUnitTiers(): Promise<Array<{ name: string; tier: string }>> {
    const url = 'https://www.metatft.com/units';
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 },
    });

    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      const content = await page.content();
      return this.extractUnitTiersFromNextData(content);
    } catch (e) {
      this.logger.error(e);
      return [];
    } finally {
      await browser.close();
    }
  }

  private extractUnitTiersFromNextData(html: string): Array<{ name: string; tier: string }> {
    // ... Logic MetaTFT giữ nguyên như cũ ...
    const $ = cheerio.load(html);
    const nextDataText = $('#__NEXT_DATA__').html();
    if (!nextDataText) return this.extractUnitTiersFromDom($);

    try {
      const data = JSON.parse(nextDataText);
      const tiers = new Set(['S', 'A', 'B', 'C', 'D']);
      const results: Array<{ name: string; tier: string }> = [];
      const visit = (node: any) => {
        if (!node) return;
        if (Array.isArray(node)) { node.forEach(visit); return; }
        if (typeof node === 'object') {
           const tier = typeof node.tier === 'string' ? node.tier.toUpperCase() : null;
           const name = node.name || node.unit?.name || node.champion?.name;
           if (name && tier && tiers.has(tier)) results.push({ name, tier });
           Object.values(node).forEach(visit);
        }
      };
      visit(data);
      
      const deduped = new Map<string, {name: string, tier: string}>();
      results.forEach(r => deduped.set(this.normalizeUnitName(r.name), r));
      return Array.from(deduped.values());
    } catch { return []; }
  }

  private extractUnitTiersFromDom($: cheerio.Root): Array<{ name: string; tier: string }> {
      // ... Logic Dom Fallback ...
      return [];
  }

  private normalizeUnitName(name: string): string {
    return name.toLowerCase().trim().replace(/['’]/g, '').replace(/[^a-z0-9]/g, '');
  }
}