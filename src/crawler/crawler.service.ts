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
  // CRON JOBS (đã tắt)
  // ==========================================

  // @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleDailyUnitTierCrawl() {
    if (process.env.NODE_ENV !== 'development') return;
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
    if (process.env.NODE_ENV !== 'development') return;
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
      this.logger.log('Phase 1: Fetching Comp Links and Tiers from Home...');
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
            // --- [UPDATED] TRUYỀN TIER LẤY TỪ HOME VÀO HÀM DETAIL ---
            this.crawlCompDetail(linkData.url, browser, linkData.tier)
              .catch((err) => {
                const message = err instanceof Error ? err.message : String(err);
                this.logger.error(`❌ Failed ${linkData.url}: ${message}`);
                return null;
              }),
          ),
        );

        for (let j = 0; j < batchResults.length; j++) {
          const composition = batchResults[j];
          if (!composition || !composition.name) continue;
          validNames.push(composition.name);
          const order = i + j + 1;

          try {
            const exists = await this.compositionsService.findByName(composition.name);

            if (exists) {
              const tierChanged = exists.tier !== composition.tier;
              const { compId: _drop, ...rest } = composition;
              // Reactivate the composition if it was previously marked inactive
              await this.compositionsService.update(exists.id, {
                ...rest,
                order,
                active: true, // Ensure it's active when found again
              });
              
              if (tierChanged) {
                this.logger.log(`🔄 Updated Tier: ${composition.name} (${exists.tier} -> ${composition.tier})`);
              }
              const compUrl = batch[j]?.url ?? '';
              this.logger.log(`🔄 Updated: ${composition.name} (tier: ${composition.tier}, order: ${order}) ${compUrl}`);
              updatedCount++;
            } else {
              await this.compositionsService.create({ ...composition, order });
              const compUrl = batch[j]?.url ?? '';
              this.logger.log(`✅ Created: ${composition.name} (order: ${order}) ${compUrl}`);
              createdCount++;
            }
          } catch (dbError) {
            this.logger.error(`DB Error for ${composition.name}: ${dbError}`);
          }
        }
        await new Promise(r => setTimeout(r, 1000));
      }

      if (validNames.length > 0) {
        this.logger.log(`🧹 Deactivating stale compositions...`);
        // We assume you will add this method to your CompositionsService
        const deactivatedCount = await this.compositionsService.deactivateByNameNotIn(validNames);
        this.logger.log(`🗑️ Deactivated ${deactivatedCount} stale compositions.`);
      }

      return { createdCount, updatedCount };

    } catch (error) {
      this.logger.error(`Fatal Error: ${error}`);
      return { createdCount: 0, updatedCount: 0 };
    } finally {
      await browser.close();
    }
  }

  // --- [UPDATED] NHẬN THÊM passedTier VÀ BỎ CÁC BƯỚC CLICK RANK ---
  async crawlCompDetail(url: string, existingBrowser?: puppeteer.Browser, passedTier: string = 'C') {
    const browser = existingBrowser || (await this.initBrowser());
    const page = await browser.newPage();

    const context = browser.defaultBrowserContext();
    try {
        await context.overridePermissions(new URL(url).origin, ['clipboard-read', 'clipboard-write']);
    } catch (e) {
        this.logger.warn(`Permission override warning: ${e}`);
    }

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['font', 'media', 'stylesheet', 'other'].includes(resourceType)) {
        req.abort();
      } else if (resourceType === 'image') {
        const reqUrl = req.url();
        if (reqUrl.includes('champions/icons') || reqUrl.includes('items') || reqUrl.includes('game-items') || reqUrl.includes('augments')) {
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
      await page.waitForSelector('h1', { timeout: 30000 }).catch(() => null);

      await page.evaluate(async () => {
        window.scrollBy(0, 500);
        await new Promise((resolve) => setTimeout(resolve, 500));
      });

      await page.waitForSelector('svg image[href*="/champions/icons/"]', { timeout: 10000 }).catch(() => null);

      const teamCode = await this.extractTeamCode(page);
      
      const content = await page.content();
      // Truyền passedTier xuống hàm parse
      const composition = await this.parseDetailHtml(content, url, teamCode, passedTier);

      return composition;

    } finally {
      await page.close();
      if (!existingBrowser) await browser.close();
    }
  }

  // ==========================================
  // PARSING & UTILS
  // ==========================================

  private async extractTeamCode(page: puppeteer.Page): Promise<string> {
    try {
        await page.evaluate(() => {
            (window as any).capturedCode = null;
            Object.defineProperty(navigator, 'clipboard', {
                value: {
                    writeText: async (text: string) => {
                        (window as any).capturedCode = text;
                        return Promise.resolve();
                    },
                    readText: async () => Promise.resolve((window as any).capturedCode || '')
                },
                configurable: true
            });
        });

        const buttonXPath = `//button[contains(., "Import comp")] | //button[.//img[contains(@alt, "Import comp")]]`;
        
        try {
             await page.waitForSelector(`xpath/${buttonXPath}`, { timeout: 4000 });
        } catch {
             this.logger.warn('Button import not found via XPath');
             return '';
        }

        const elements = await page.$$(`xpath/${buttonXPath}`);
        
        if (elements.length > 0) {
            const btn = elements[0];
            await btn.evaluate((b) => {
                 b.scrollIntoView({ behavior: 'instant', block: 'center' });
            });
            await new Promise(r => setTimeout(r, 200)); 
            await btn.click();
            
            const code = await page.waitForFunction(() => (window as any).capturedCode, { timeout: 2000 })
                .then(handle => handle.jsonValue())
                .catch(() => null);

            if (code && typeof code === 'string' && code.length > 10) {
                this.logger.log(`📋 Intercepted Team Code: ${code.substring(0, 15)}...`);
                return code.trim();
            }
        }
    } catch (error) {
        this.logger.warn(`Failed to intercept team code: ${error instanceof Error ? error.message : error}`);
    }
    return '';
  }

  // --- [UPDATED] NHẬN passedTier VÀ SỬ DỤNG LUÔN, KHÔNG QUÉT LẠI NỮA ---
  private async parseDetailHtml(html: string, sourceUrl: string, teamCode: string = '', passedTier: string = 'C'): Promise<CreateCompositionDto> {
    const $ = cheerio.load(html);
    
    const $h1 = $('h1').first();
    const compName = $h1.text().trim() || 'Unknown Comp';
    
    // Sử dụng tier từ ngoài truyền vào
    const tier = passedTier; 

    // LOG KIỂM TRA TIER 
    this.logger.log(`[Tier Check] Comp: ${compName} - Inherited Tier from List: ${tier}`);
    // ---------------------------------------------------------

    let metaDescription = '';
    const generalInfoSection = $('.m-22cd40'); 
    if (generalInfoSection.length) {
        metaDescription = generalInfoSection.find('.m-zrc7tx').first().text().trim();
    }
    
    if (!metaDescription) {
        metaDescription = $('meta[name="description"]').attr('content') || `Guide for ${compName}`;
    }

    let plan = 'Standard';
    $('div').each((_, el) => {
        const t = $(el).text().trim();
        if(['Fast 8', 'Fast 9', 'Slow Roll', 'Hyper Roll', 'Standard'].includes(t)) {
            plan = t;
            return false; 
        }
    });

    const difficulty = $('div').filter((_, el) => ['Easy', 'Medium', 'Hard'].includes($(el).text().trim())).first().text().trim() || 'Medium';

    // 2. Logic tìm Board "Chính chủ"
    const units: CrawlUnit[] = [];
    let coreChampion: CrawlUnit | null = null;
    const unknownItems = new Set<string>();

    const allHexImages = $('svg image[href*="/champions/icons/"]');
    
    if (allHexImages.length > 0) {
        const boardCandidates = new Map<any, { count: number, element: cheerio.Cheerio }>();

        allHexImages.each((_, imgEl) => {
            const $img = $(imgEl);
            const $cell = $img.closest('div').parent(); 
            const $row = $cell.parent();
            const $board = $row.parent();

            if ($board.length) {
                const boardEl = $board.get(0);
                if (!boardCandidates.has(boardEl)) {
                    boardCandidates.set(boardEl, { count: 0, element: $board });
                }
                boardCandidates.get(boardEl)!.count++;
            }
        });

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
                    const $unitImg = $cell.find('svg image[href*="/champions/icons/"]');
                    if ($unitImg.length === 0) return; 

                    const src = $unitImg.attr('href') || '';
                    const rawSlug = src.split('/').pop()?.split('?')[0]?.split('.')[0] || '';
                    if (!rawSlug) return;

                    const rawName = this.normalizeChampionName(rawSlug);
                    
                    const items: string[] = [];
                    $cell.find('img').each((_, itemEl) => {
                        const itemSrc = $(itemEl).attr('src') || '';
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
                        cost: 0, 
                        star: 2,
                        carry: isCarry,
                        position: { row: rowIndex, col: colIndex },
                        items: items,
                        image: src,
                        traits: [],
                    };
                    units.push(unitData);

                    if (isCarry && (!coreChampion || items.length > (coreChampion.items?.length || 0))) {
                        coreChampion = unitData;
                    }
                });
            });
        }
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

    // 5. Parse Augments
    const augments: CrawlAugment[] = [];
    const tierSpans = $('span').filter((_, el) => /^Tier\s+\d+$/.test($(el).text().trim()));
    
    tierSpans.each((_, el) => {
      const tierText = $(el).text().trim(); 
      const tierValue = parseInt(tierText.split(' ')[1], 10); 

      $(el).parent().parent().find('img').each((_, imgEl) => {
        const $img = $(imgEl);
        let rawSlug = $img.attr('alt') || '';
        const src = $img.attr('src') || '';

        if (!rawSlug || ['t1', 't2', 't3'].includes(rawSlug.toLowerCase())) {
              rawSlug = extractItemSlugFromUrl(src);
        }
        if (!rawSlug || ['t1', 't2', 't3'].includes(rawSlug.toLowerCase())) return;

        const apiName = this.itemLookupService.getValidAugmentApiName(rawSlug);
        if (apiName) {
            augments.push({ name: apiName, tier: tierValue });
        }
      });
    });
    
    const finalAugments = Array.from(new Map(augments.map(a => [a.name, a])).values());

    return {
      compId: `comp-${generateSlug(compName)}-${Date.now()}`,
      name: compName,
      teamCode: teamCode, 
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
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--enable-clipboard-read',
        '--enable-clipboard-write'
      ],
      defaultViewport: { width: 1920, height: 1080 },
    });
  }

  private async getCompLinks(
    browser: puppeteer.Browser,
    url: string,
  ): Promise<Array<{ url: string; name?: string; tier: string }>> {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      // Tạm thời chặn load ảnh để lướt trang nhanh hơn
      if (req.resourceType() === 'image') req.abort();
      else req.continue();
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await page.waitForSelector('a[href*="/tft/comps-guide/"]', { timeout: 15000 });
      
      // Cuộn xuống cuối để web load hết tất cả các đội hình
      await this.scrollUntilBottom(page);

      const content = await page.content();
      const $ = cheerio.load(content);
      const links = new Map<string, { url: string; name?: string; tier: string }>();

      $('a[href*="/tft/comps-guide/"]').each((_, el) => {
        const href = $(el).attr('href');
        
        // --- QUÉT TIER TỪ THẺ HTML BÊN NGOÀI CỦA ĐỘI HÌNH ---
        let compTier = 'C'; // Mặc định
        
        // Cấu trúc: <a> nằm trong <div> con, ảnh <img> nằm ở <div> cha
        // Dùng .closest() để tìm ngược lên thẻ div cha gần nhất có chứa ảnh "hex-tiers"
        let $tierImg = $(el).parent().parent().find('img[src*="hex-tiers"]');
        
        if ($tierImg.length === 0) {
           // Fallback cực mạnh: Quét tổ tiên bọc ngoài cùng miễn là có ảnh hex-tiers
           $tierImg = $(el).closest(':has(img[src*="hex-tiers"])').find('img[src*="hex-tiers"]').first();
        }

        if ($tierImg.length) {
            // Lấy từ thuộc tính Alt (ví dụ: alt="s")
            const altText = $tierImg.attr('alt')?.toUpperCase().trim();
            if (altText && ['S', 'A', 'B', 'C', 'D'].includes(altText)) {
                compTier = altText;
            } 
            // Nếu không có Alt, cắt chữ từ đường dẫn src (ví dụ: /hex-tiers/S.svg)
            else {
                const srcText = $tierImg.attr('src') || '';
                const srcMatch = srcText.match(/hex-tiers\/([SABCD])\.svg/i);
                if (srcMatch) compTier = srcMatch[1].toUpperCase();
            }
        }
        // ----------------------------------------------------

        if (href) {
          const fullUrl = new URL(href, url).toString();
          // Dùng Map để tránh trùng lặp nếu 1 đội hình xuất hiện 2 lần
          if (!links.has(fullUrl)) {
            links.set(fullUrl, { url: fullUrl, tier: compTier });
          }
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