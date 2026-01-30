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
  // url pattern: .../game-items/set16/infinity-edge.png?v=70
  let filename = url.split('/').pop()?.split('?')[0]?.split('.')[0] || '';
  filename = filename.replace(/[-_]v?\d+$/, ''); // remove version suffix if any
  return filename.replace(/[^a-zA-Z0-9]/g, ''); // keep alphanumeric only
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
  // PUBLIC METHODS
  // ==========================================
  
  async crawlTeamComps(url?: string) {
    const targetUrl = url || 'https://mobalytics.gg/tft/team-comps';
    const browser = await this.initBrowser();

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
    if (tiers.length === 0) return;

    const units = await this.tftUnitsService.findAll();
    const unitMap = new Map<string, typeof units[number]>();

    units.forEach((unit) => {
      const normalizedName = this.normalizeUnitNameForMetaTft(unit.name || unit.characterName || unit.enName || '');
      if (normalizedName) unitMap.set(normalizedName, unit);
    });

    let updatedCount = 0;
    for (const entry of tiers) {
      const key = this.normalizeUnitNameForMetaTft(entry.name);
      const unit = unitMap.get(key);
      if (!unit) continue;

      if (unit.tier !== entry.tier) {
        await this.tftUnitsService.update(unit.id, { tier: entry.tier });
        updatedCount += 1;
      }
    }
    this.logger.log(`✅ Unit tier crawl finished. Updated: ${updatedCount}`);
  }

  // @Cron(CronExpression.EVERY_4_HOURS)
  async handleDailyCrawl() {
    this.logger.log('🕛 Daily crawl job started.');
    await this.crawlAllCompositions();
    this.logger.log('✅ Daily crawl job finished.');
  }

  /**
   * ==========================================
   * MAIN LOGIC: FULL SYNC
   * ==========================================
   */
  async crawlAllCompositions() {
    const targetUrl = 'https://mobalytics.gg/tft/team-comps';
    this.logger.log('🚀 STARTING FULL SYNC CRAWL PROCESS...');

    const browser = await this.initBrowser();

    try {
      this.logger.log('Phase 1: Fetching Comp Links...');
      const compLinks = await this.getCompLinks(browser, targetUrl);
      this.logger.log(`Found ${compLinks.length} comps. Starting detailed crawl...`);

      const BATCH_SIZE = 3;
      let createdCount = 0;
      let updatedCount = 0;
      const validNames: string[] = [];

      for (let i = 0; i < compLinks.length; i += BATCH_SIZE) {
        const batch = compLinks.slice(i, i + BATCH_SIZE);
        this.logger.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`);

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

        for (const composition of batchResults) {
          if (!composition || !composition.name) continue;
          validNames.push(composition.name);

          try {
            const exists = await this.compositionsService.findByName(composition.name);

            if (exists) {
              if (exists.tier !== composition.tier) {
                await this.compositionsService.update(exists.id, { 
                    tier: composition.tier,
                });
                this.logger.log(`🔄 Updated Tier: ${composition.name} (${exists.tier} -> ${composition.tier})`);
                updatedCount++;
              } else {
                this.logger.log(`⏭️ Skip duplicate: ${composition.name}`);
              }
            } else {
              await this.compositionsService.create(composition);
              this.logger.log(`✅ Created: ${composition.name}`);
              createdCount++;
            }
          } catch (dbError) {
            this.logger.error(`DB Error for ${composition.name}: ${dbError}`);
          }
        }
        await new Promise(r => setTimeout(r, 1000));
      }

      if (validNames.length > 0) {
        this.logger.log(`🧹 Cleaning up stale compositions...`);
        const deletedCount = await this.compositionsService.removeByNameNotIn(validNames);
        this.logger.log(`🗑️ Deleted ${deletedCount} stale compositions.`);
      }

      return { createdCount, updatedCount };

    } catch (error) {
      this.logger.error(`Fatal Error: ${error}`);
      return [];
    } finally {
      await browser.close();
    }
  }

  async crawlCompDetail(url: string, existingBrowser?: puppeteer.Browser) {
    const browser = existingBrowser || (await this.initBrowser());
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['font', 'media', 'stylesheet', 'other'].includes(resourceType)) {
        req.abort();
      } else if (resourceType === 'image') {
        const url = req.url();
        // Chỉ load ảnh quan trọng để parse, chặn quảng cáo
        if (url.includes('champions/icons') || url.includes('items') || url.includes('game-items') || url.includes('augments')) {
            req.continue();
        } else {
            req.abort();
        }
      } else {
        req.continue();
      }
    });

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
      
      // Chờ h1 để đảm bảo trang load cơ bản
      await page.waitForSelector('h1', { timeout: 30000 }).catch(() => null);

      // Scroll nhẹ
      await page.evaluate(async () => {
        window.scrollBy(0, 500);
        await new Promise((resolve) => setTimeout(resolve, 500));
      });

      // Chờ ít nhất 1 ảnh champion xuất hiện trong SVG (đặc điểm của board)
      await page.waitForSelector('svg image[href*="/champions/icons/"]', { timeout: 10000 }).catch(() => null);

      const content = await page.content();
      const composition = await this.parseDetailHtml(content, url);

      return composition;

    } finally {
      await page.close();
      if (!existingBrowser) await browser.close();
    }
  }

  // ==========================================
  // PARSING & UTILS
  // ==========================================

  private async parseDetailHtml(html: string, sourceUrl: string): Promise<CreateCompositionDto> {
    const $ = cheerio.load(html);
    
    // 1. Basic Metadata
    const compName = $('h1').first().text().trim() || 'Unknown Comp';
    const tier = $('img[src*="hex-tiers"]').attr('alt')?.toUpperCase() || 'C';
    let plan = 'Standard';
    $('div').each((_, el) => {
        const t = $(el).text().trim();
        if(['Fast 8', 'Fast 9', 'Slow Roll', 'Hyper Roll', 'Standard'].includes(t)) {
            plan = t;
            return false; // break
        }
    });
    const metaDescription = $('meta[name="description"]').attr('content') || `Guide for ${compName}`;
    const difficulty = $('div').filter((_, el) => ['Easy', 'Medium', 'Hard'].includes($(el).text().trim())).first().text().trim() || 'Medium';

    // 2. LOGIC TÌM BOARD "CHÍNH CHỦ" (DENSITY SCAN)
    const units: CrawlUnit[] = [];
    let coreChampion: CrawlUnit | null = null;
    const unknownItems = new Set<string>();

    const allHexImages = $('svg image[href*="/champions/icons/"]');
    
    if (allHexImages.length > 0) {
        // [FIXED] Bỏ generic <any> gây lỗi TS
        const boardCandidates = new Map<any, { count: number, element: cheerio.Cheerio }>();

        allHexImages.each((_, imgEl) => {
            const $img = $(imgEl);
            // Traverse ngược lên: Image -> SVG -> Wrapper -> Cell -> Row -> Board
            const $cell = $img.closest('div').parent(); 
            const $row = $cell.parent();
            const $board = $row.parent();

            if ($board.length) {
                const boardEl = $board.get(0);
                if (!boardCandidates.has(boardEl)) {
                    boardCandidates.set(boardEl, { count: 0, element: $board });
                }
                // [FIXED] Thêm dấu ! để assert non-null
                boardCandidates.get(boardEl)!.count++;
            }
        });

        // [FIXED] Khai báo type rõ ràng cho bestBoard
        let bestBoard: cheerio.Cheerio | null = null;
        let maxCount = 0;
        for (const candidate of boardCandidates.values()) {
            if (candidate.count > maxCount) {
                maxCount = candidate.count;
                bestBoard = candidate.element;
            }
        }

        if (bestBoard) {
            bestBoard.children('div').each((rowIndex, rowEl) => {
                $(rowEl).children('div').each((colIndex, cellEl) => {
                    const $cell = $(cellEl);
                    
                    // Tìm ảnh tướng SVG trong Cell này
                    const $unitImg = $cell.find('svg image[href*="/champions/icons/"]');
                    if ($unitImg.length === 0) return; // Ô trống

                    // Lấy thông tin Unit
                    const src = $unitImg.attr('href') || '';
                    const rawSlug = src.split('/').pop()?.split('?')[0]?.split('.')[0] || '';
                    if (!rawSlug) return;

                    const rawName = this.normalizeChampionName(rawSlug);
                    
                    // Lấy Item: Tìm thẻ img (không phải svg image) trong cell
                    const items: string[] = [];
                    $cell.find('img').each((_, itemEl) => {
                        const itemSrc = $(itemEl).attr('src') || '';
                        // Bỏ qua icon tướng và synergy
                        if (itemSrc.includes('/champions/icons/') || itemSrc.includes('synergies') || itemSrc.includes('hex-tiers')) return;
                        
                        const itemSlug = extractItemSlugFromUrl(itemSrc) || $(itemEl).attr('alt');
                        if (itemSlug) {
                             const apiName = this.mapItemApiName(itemSlug as string);
                             if (apiName) items.push(apiName);
                             else unknownItems.add(itemSlug as string);
                        }
                    });

                    const isCarry = items.length > 0;
                    const unitData: CrawlUnit = {
                        championId: generateSlug(rawName),
                        championKey: this.itemLookupService.getValidChampionKey(rawName) || generateChampionKey(rawName),
                        name: rawName,
                        cost: 0, // Sẽ fill từ DB
                        star: 2,
                        carry: isCarry,
                        position: { row: rowIndex, col: colIndex },
                        items: items,
                        image: src,
                        traits: [],
                    };
                    units.push(unitData);

                    // Xác định Core Champ (nhiều đồ nhất)
                    if (isCarry && (!coreChampion || items.length > (coreChampion.items?.length || 0))) {
                        coreChampion = unitData;
                    }
                });
            });
        }
    }

    // 3. Fallback: Nếu không tìm thấy Board
    if (units.length === 0) {
       this.logger.warn(`Fallback parsing triggered for ${sourceUrl}`);
       // Có thể thêm logic fallback list ở đây nếu cần
    }

    // 4. Update Cost & Traits từ DB
    for (const unit of units) {
      try {
        let tftUnit = await this.tftUnitsService.findByApiName(unit.championKey);
        if (!tftUnit) {
          tftUnit = await this.tftUnitsService.findByApiName(`TFT16_${unit.name.replace(/\s/g, '')}`);
        }
        if (tftUnit) {
          if (tftUnit.cost != null) unit.cost = tftUnit.cost;
          if (tftUnit.traits?.length) unit.traits = tftUnit.traits;
        }
      } catch {}
    }

    // 5. PARSE AUGMENTS (OLD LOGIC - SCAN TEXT)
    const augments: CrawlAugment[] = [];
    // Tìm các span có text "Tier 1", "Tier 2"...
    const tierSpans = $('span').filter((_, el) => /^Tier\s+\d+$/.test($(el).text().trim()));
    
    tierSpans.each((_, el) => {
      const tierText = $(el).text().trim(); // "Tier 2"
      const tier = parseInt(tierText.split(' ')[1], 10); // Lấy số 2

      // Leo lên cha để tìm khu vực chứa các icon augment tương ứng với Tier này
      $(el).parent().parent().find('img').each((_, imgEl) => {
        const $img = $(imgEl);
        let rawSlug = $img.attr('alt') || '';
        const src = $img.attr('src') || '';

        // Nếu alt không có hoặc là rác (t1, t2..), lấy từ URL
        if (!rawSlug || ['t1', 't2', 't3'].includes(rawSlug.toLowerCase())) {
             rawSlug = extractItemSlugFromUrl(src);
        }
        // Vẫn rác thì bỏ qua
        if (!rawSlug || ['t1', 't2', 't3'].includes(rawSlug.toLowerCase())) return;

        const apiName = this.itemLookupService.getValidAugmentApiName(rawSlug);
        if (apiName) {
            augments.push({ name: apiName, tier: tier });
        }
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

  // --- Helpers ---
  
  private normalizeChampionName(slug: string): string {
    // Xử lý case đặc biệt
    if (slug.toLowerCase() === 'luciansenna') return 'Lucian';
    if (slug.toLowerCase() === 'jarvaniv') return 'Jarvan IV';
    return slug.charAt(0).toUpperCase() + slug.slice(1);
  }

  private mapItemApiName(slug: string): string | null {
      const lower = slug.toLowerCase();
      if (lower === 'guardbreaker') return 'TFT_Item_PowerGauntlet';
      if (lower === 'fimbulwinter') return 'TFT_Item_FrozenHeart';
      if (lower === 'steadfasthammer') return 'TFT_Item_NightHarvester';
      return this.itemLookupService.getValidApiName(slug);
  }

  private async initBrowser() {
    return await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 },
    });
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
              totalHeight = scrollHeight; 
            }
          } else {
            retries = 0;
          }
        }, 150);
      });
    });
    await new Promise(r => setTimeout(r, 2000));
  }

  // --- MetaTFT Logic ---
  private async fetchMetaTftUnitTiers(): Promise<Array<{ name: string; tier: string }>> {
    const url = 'https://www.metatft.com/units';
    const browser = await this.initBrowser();
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
    const $ = cheerio.load(html);
    const nextDataText = $('#__NEXT_DATA__').html();
    if (!nextDataText) return [];

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
      results.forEach(r => deduped.set(this.normalizeUnitNameForMetaTft(r.name), r));
      return Array.from(deduped.values());
    } catch { return []; }
  }

  private normalizeUnitNameForMetaTft(name: string): string {
    return name.toLowerCase().trim().replace(/['’]/g, '').replace(/[^a-z0-9]/g, '');
  }
}