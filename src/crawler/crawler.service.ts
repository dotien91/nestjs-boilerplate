import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import {
  generateChampionKey,
  generateItemKey,
  generateSlug,
} from '../utils/mobalytics-helpers'; // Đảm bảo bạn đã có file utils này
import { CompositionsService } from '../compositions/compositions.service';
import { CreateCompositionDto } from '../compositions/dto/create-composition.dto';
import { ItemLookupService } from './item-lookup.service';
import { TftUnitsService } from '../tft-units/tft-units.service';

// Helper: Trích xuất tên file chuẩn từ URL ảnh Mobalytics
// Input: "https://cdn.mobalytics.gg/.../set16/voidstaff.png?v=70"
// Output: "voidstaff"
function extractItemSlugFromUrl(url: string): string {
  if (!url) return '';

  const filename = url.split('/').pop()?.split('?')[0]?.split('.')[0] || '';
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
      if (unit.name) unitMap.set(this.normalizeUnitName(unit.name), unit);
      if (unit.enName) unitMap.set(this.normalizeUnitName(unit.enName), unit);
      if (unit.characterName) {
        unitMap.set(this.normalizeUnitName(unit.characterName), unit);
      }
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

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleDailyCrawl() {
    this.logger.log('🕛 Daily crawl job started.');
    const results = await this.crawlAllCompositions();

    for (const composition of results) {
      if (!composition?.name) continue;

      const exists = await this.existsCompositionByName(composition.name);
      if (exists) {
        this.logger.log(`⏭️ Skip duplicate name: ${composition.name}`);
        continue;
      }

      await this.compositionsService.create(composition);
      this.logger.log(`✅ Created: ${composition.name}`);
    }

    this.logger.log('✅ Daily crawl job finished.');
  }

  /**
   * ==========================================
   * MAIN FUNCTION: CHẠY TOÀN BỘ QUY TRÌNH
   * ==========================================
   */
  async crawlAllCompositions() {
    const targetUrl = 'https://mobalytics.gg/tft/team-comps';
    this.logger.log('🚀 STARTING FULL CRAWL PROCESS...');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 },
    });

    try {
      this.logger.log('Phase 1: Fetching Comp Links...');
      const compLinks = await this.getCompLinks(browser, targetUrl);
      this.logger.log(
        `Found ${compLinks.length} comps. Starting detailed crawl...`,
      );

      const BATCH_SIZE = 3;
      const results: CreateCompositionDto[] = [];
      const created: CreateCompositionDto[] = [];

      for (let i = 0; i < compLinks.length; i += BATCH_SIZE) {
        const batch = compLinks.slice(i, i + BATCH_SIZE);
        this.logger.log(
          `Processing batch ${i / BATCH_SIZE + 1} (${batch.length} items)...`,
        );

        const batchResults = await Promise.all(
          batch.map((linkData) =>
            this.crawlCompDetail(linkData.url, browser)
              .then((data) => {
                if (data) {
                  this.logger.log(`✅ Crawled: ${data.name}`);
                }
                return data;
              })
              .catch((err) => {
                const message = err instanceof Error ? err.message : String(err);
                this.logger.error(`❌ Failed ${linkData.url}: ${message}`);
                return null;
              }),
          ),
        );

        results.push(
          ...batchResults.filter(
            (r): r is CreateCompositionDto => r !== null,
          ),
        );
      }

      for (const composition of results) {
        if (!composition?.name) continue;

        const exists = await this.existsCompositionByName(composition.name);
        if (exists) {
          this.logger.log(`⏭️ Skip duplicate name: ${composition.name}`);
          continue;
        }

        const createdComposition =
          await this.compositionsService.create(composition);
        created.push(createdComposition as unknown as CreateCompositionDto);
        this.logger.log(`✅ Created: ${composition.name}`);
      }

      const crawledNames = results
        .map((comp) => comp.name)
        .filter((name): name is string => Boolean(name));

      if (crawledNames.length > 0) {
        const deletedCount =
          await this.compositionsService.removeByNameNotIn(crawledNames);
        this.logger.log(`🧹 Deleted old compositions: ${deletedCount}`);
      }

      this.logger.log(
        `🎉 FINISHED! Total success: ${results.length}/${compLinks.length}`,
      );
      return created;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Fatal Error: ${message}`);
      return [];
    } finally {
      await browser.close();
    }
  }

  /**
   * HÀM 1: CRAWL DANH SÁCH ĐỘI HÌNH (Fix lỗi chỉ ra 6)
   */
  async crawlTeamComps(url?: string) {
    const targetUrl = url || 'https://mobalytics.gg/tft/team-comps';

    // Launch Browser
    const browser = await puppeteer.launch({
      headless: true, // Đổi thành false nếu muốn debug trực quan
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }, // Viewport lớn để load nhiều hơn
    });

    try {
      const page = await browser.newPage();

      // QUAN TRỌNG: Chỉ chặn IMAGE để tiết kiệm băng thông.
      // KHÔNG chặn CSS/Font vì Mobalytics cần layout để tính toán scroll trigger.
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (req.resourceType() === 'image') {
          req.abort();
        } else {
          req.continue();
        }
      });

      this.logger.log(`Navigating to ${targetUrl}...`);
      await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

      // Chờ danh sách xuất hiện
      await page.waitForSelector('a[href*="/tft/comps-guide/"]', { timeout: 15000 });

      // --- BẮT ĐẦU SMART SCROLL ---
      this.logger.log('Starting Smart Scroll to load all comps...');
      await this.scrollUntilBottom(page);
      
      // Lấy HTML sau khi đã load full
      const content = await page.content();
      
      this.logger.log('Parsing content...');
      return this.parseTeamCompsList(content, targetUrl);

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Crawl Team Comps Error: ${message}`);
      return null;
    } finally {
      await browser.close();
    }
  }

  /**
   * HÀM 2: CRAWL CHI TIẾT 1 ĐỘI HÌNH
   */
  async crawlCompDetail(url: string, existingBrowser?: puppeteer.Browser) {
    const browser =
      existingBrowser ||
      (await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1920, height: 1080 },
      }));

    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['font', 'media'].includes(type)) req.abort();
      else req.continue();
    });

    try {
      this.logger.log(`Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
      await page.evaluate(async () => {
        window.scrollBy(0, 500);
        await new Promise((resolve) => setTimeout(resolve, 500));
      });
      await page
        .waitForSelector('img[src*="/champions/icons/"]', { timeout: 10000 })
        .catch(() => null);

      const content = await page.content();
      const composition = this.parseDetailHtml(content, url);
      this.logger.log(`Crawl detail parsed data: ${JSON.stringify(composition)}`);

      if (!composition?.name) return composition;

      const exists = await this.existsCompositionByName(composition.name);
      if (exists) {
        this.logger.log(`⏭️ Skip duplicate name: ${composition.name}`);
        return composition;
      }

      return this.compositionsService.create(composition);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Crawl Detail Error: ${message}`);
      return null;
    } finally {
      await page.close();
      if (!existingBrowser) {
        await browser.close();
      }
    }
  }

  // ==========================================
  // PRIVATE HELPERS (LOGIC XỬ LÝ)
  // ==========================================

  /**
   * Logic Scroll thông minh: Cuộn -> Chờ -> Kiểm tra chiều cao -> Cuộn tiếp
   */
  private async scrollUntilBottom(page: puppeteer.Page) {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 200; // Khoảng cách cuộn mỗi lần
        let retries = 0; // Đếm số lần thử nếu không thấy load thêm

        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          
          // Cuộn xuống
          window.scrollBy(0, distance);
          totalHeight += distance;

          // Nếu đã cuộn quá chiều cao hiện tại
          if (totalHeight >= scrollHeight - window.innerHeight) {
            // Kiểm tra xem trang có load thêm nội dung không?
            // Nếu scrollHeight không đổi sau 3-4 lần check, nghĩa là hết dữ liệu
            if (retries >= 5) { 
              clearInterval(timer);
              resolve();
            } else {
                retries++;
                // Reset totalHeight về scrollHeight thực tế để tiếp tục thử cuộn
                totalHeight = scrollHeight; 
            }
          } else {
            // Nếu vẫn cuộn được bình thường thì reset retry
            retries = 0;
          }
        }, 150); // 150ms cuộn 1 lần
      });
    });
    
    // Đợi thêm 2s cuối cùng để đảm bảo DOM ổn định
    await new Promise(r => setTimeout(r, 2000));
  }

  /**
   * Parse HTML danh sách đội hình
   */
  private parseTeamCompsList(html: string, sourceUrl: string) {
    const $ = cheerio.load(html);
    const compLinks = new Map<string, { url: string; name?: string }>();

    $('a[href*="/tft/comps-guide/"]').each((_, el) => {
      const $el = $(el);
      const href = $el.attr('href');
      if (!href) return;

      const url = new URL(href, sourceUrl).toString();

      // Logic lấy tên đội hình:
      // Mobalytics cấu trúc: <a> <div> <span>Tên Đội</span> ... </div> </a>
      // Ta lấy text của thẻ span đầu tiên trong thẻ a, hoặc fallback về text của thẻ a
      let name = $el.find('span').first().text().trim();
      
      if (!name) {
         // Fallback: Lấy toàn bộ text và clean bớt các từ khóa rác nếu cần
         name = $el.text().replace(/\s+/g, ' ').trim(); 
      }

      if (!compLinks.has(url) && name) {
        compLinks.set(url, { url, name });
      }
    });

    const data = Array.from(compLinks.values());
    this.logger.log(`Parsed ${data.length} comps.`);
    
    return {
      sourceUrl,
      count: data.length,
      data,
    };
  }

  /**
   * Hàm 1: Lấy danh sách Link (Sử dụng Browser truyền vào)
   */
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
      await page.waitForSelector('a[href*="/tft/comps-guide/"]', {
        timeout: 15000,
      });

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

  /**
   * Parse HTML chi tiết đội hình
   */
  private parseDetailHtml(html: string, sourceUrl: string): CreateCompositionDto {
    const $ = cheerio.load(html);

    const compName = $('h1').first().text().trim() || 'Unknown Comp';
    const tier = $('img[src*="hex-tiers"]').attr('alt')?.toUpperCase() || 'C';
    
    let plan = 'Standard';
    $('div.m-ttncf1').each((_, el) => {
      const text = $(el).text().trim();
      if (['Fast', 'Roll', 'Level'].some((k) => text.includes(k))) {
        plan = text;
      }
    });

    const metaDescription =
      $('meta[name="description"]').attr('content') ||
      `Guide for ${compName}`;

    const difficulty = $('div')
      .filter((_, el) => {
        return ['Easy', 'Medium', 'Hard'].includes($(el).text().trim());
      })
      .first()
      .text()
      .trim() || 'Medium';

    const units: CrawlUnit[] = [];
    let coreChampion: CrawlUnit | null = null;

    const boardRows = $('.m-67sb4n .m-i9rwau');

    boardRows.each((rowIndex, rowEl) => {
      $(rowEl)
        .find('.m-bjn8wh')
        .each((colIndex, cellEl) => {
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
              const $img = $(itemEl);
              const src = $img.attr('src') || $img.attr('href') || '';
              const alt = $img.attr('alt') || '';

              const slugFromUrl = extractItemSlugFromUrl(src);
              const rawSlug = slugFromUrl || alt;
console.log("rawSlug", rawSlug);
              if (rawSlug) {
                const correctApiName =
                  this.itemLookupService.getValidApiName(rawSlug);

                if (correctApiName) {
                  items.push(correctApiName);
                } else {
                  this.logger.warn(`Cannot map item slug: ${rawSlug}`);
                  items.push(`UNKNOWN_${rawSlug}`);
                }
              }
            });

            const isCarry = items.length > 0;

            const unitData: CrawlUnit = {
              championId: generateSlug(rawName),
              championKey: generateChampionKey(rawName),
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

    if (units.length === 0) {
      this.logger.warn('Board parsing failed, falling back to list parsing...');
      const unitsMap = new Map<string, CrawlUnit>();
      $('a[href*="/tft/champions/"]').each((_, el) => {
        const $el = $(el);
        const img = $el.find('img').first();
        const rawName = img.attr('alt');
        if (!rawName || rawName.length > 20) return;

        const champId = generateSlug(rawName);
        const items: string[] = [];
        const container = $el.closest('div');
        const itemContainer = container.parent();
        itemContainer.find('img[src*="game-items"]').each((_, itemEl) => {
          const itemAlt = $(itemEl).attr('alt');
          if (itemAlt) items.push(generateItemKey(itemAlt));
        });

        const isCarry = items.length >= 2;
        const existing = unitsMap.get(champId);
        if (!existing || items.length > (existing.items?.length || 0)) {
          const unitData: CrawlUnit = {
            championId: champId,
            championKey: generateChampionKey(rawName),
            name: rawName,
            cost: 0,
            star: 2,
            carry: isCarry,
            position: { row: 3, col: unitsMap.size },
            items: items,
            traits: [],
          };
          unitsMap.set(champId, unitData);
          if (isCarry && !coreChampion) coreChampion = unitData;
        }
      });
      units.push(...unitsMap.values());
    }

    const augments: CrawlAugment[] = [];

    const tierSpans = $('span').filter((_, el) => {
      return /^Tier\s+\d+$/.test($(el).text().trim());
    });

    tierSpans.each((_, el) => {
      const $span = $(el);
      const tierText = $span.text().trim();
      const tier = parseInt(tierText.split(' ')[1], 10);

      const $groupContainer = $span.parent().parent();

      $groupContainer.find('img').each((_, imgEl) => {
        const $img = $(imgEl);
        let rawSlug = $img.attr('alt') || '';
        const src = $img.attr('src') || '';

        if (!rawSlug || ['t1', 't2', 't3'].includes(rawSlug.toLowerCase())) {
          rawSlug = extractItemSlugFromUrl(src);
        }

        if (!rawSlug || ['t1', 't2', 't3'].includes(rawSlug.toLowerCase())) return;

        const apiName = this.itemLookupService.getValidAugmentApiName(rawSlug);

        if (apiName) {
          augments.push({
            name: apiName,
            tier: tier,
          });
        }
      });
    });

    const uniqueAugmentsMap = new Map<string, CrawlAugment>();
    augments.forEach((augment) => {
      if (!uniqueAugmentsMap.has(augment.name)) {
        uniqueAugmentsMap.set(augment.name, augment);
      }
    });

    const finalAugments = Array.from(uniqueAugmentsMap.values());

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
      carouselPriority: undefined,
      augments: finalAugments,
      coreChampion: coreChampion || units[0],
      teamcode: undefined,
    };
  }

  private async existsCompositionByName(name: string): Promise<boolean> {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const results = await this.compositionsService.findManyWithPagination({
      filterOptions: { name: `^${escaped}$` },
      sortOptions: null,
      paginationOptions: { page: 1, limit: 1 },
    });
    return results.length > 0;
  }

  /**
   * Hàm hỗ trợ lấy nội dung 1 trang (dùng cho Detail)
   */
  private async getPageContent(url: string, waitSelector: string) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 },
    });
    const page = await browser.newPage();

    // Detail page không cần scroll nhiều, nhưng chặn request không cần thiết
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['font', 'media'].includes(type)) req.abort();
      else req.continue();
    });

    try {
      this.logger.log(`Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
      await page.evaluate(async () => {
        window.scrollBy(0, 500);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      });
      await page.waitForSelector(waitSelector, { timeout: 10000 }).catch(() => null);
      return await page.content();
    } finally {
      await browser.close();
    }
  }

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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`MetaTFT crawl error: ${message}`);
      return [];
    } finally {
      await browser.close();
    }
  }

  private extractUnitTiersFromNextData(html: string): Array<{ name: string; tier: string }> {
    const $ = cheerio.load(html);
    const nextDataText = $('#__NEXT_DATA__').html();
    if (!nextDataText) {
      return this.extractUnitTiersFromDom($);
    }

    let data: any;
    try {
      data = JSON.parse(nextDataText);
    } catch {
      return [];
    }

    const tiers = new Set(['S', 'A', 'B', 'C', 'D']);
    const results: Array<{ name: string; tier: string }> = [];

    const visit = (node: any) => {
      if (!node) return;
      if (Array.isArray(node)) {
        node.forEach(visit);
        return;
      }
      if (typeof node === 'object') {
        const tierValue =
          typeof node.tier === 'string' ? node.tier.toUpperCase() : undefined;
        const nameValue =
          typeof node.name === 'string'
            ? node.name
            : typeof node.unit?.name === 'string'
              ? node.unit.name
              : typeof node.champion?.name === 'string'
                ? node.champion.name
                : undefined;

        if (nameValue && tierValue && tiers.has(tierValue)) {
          results.push({ name: nameValue, tier: tierValue });
        }

        Object.values(node).forEach(visit);
      }
    };

    visit(data);

    const deduped = new Map<string, { name: string; tier: string }>();
    results.forEach((entry) => {
      const key = this.normalizeUnitName(entry.name);
      if (!deduped.has(key)) {
        deduped.set(key, entry);
      }
    });

    const nextDataResults = Array.from(deduped.values());
    if (nextDataResults.length > 0) {
      return nextDataResults;
    }

    return this.extractUnitTiersFromDom($);
  }

  private extractUnitTiersFromDom(
    $: cheerio.Root,
  ): Array<{ name: string; tier: string }> {
    const results: Array<{ name: string; tier: string }> = [];
    const tiers = new Set(['S', 'A', 'B', 'C', 'D']);

    $('.TableTier .StatTierBadge').each((_, el) => {
      const $badge = $(el);
      const tierText = $badge.text().trim().toUpperCase();
      const tierClass = ($badge.attr('class') || '').match(/Badge_([A-Z])/);
      const tier = tierClass?.[1] || tierText;
      if (!tiers.has(tier)) return;

      const $container = $badge.closest('tr, .TableRow, .TableRowItem, .TableRowWrapper, .UnitRow, .UnitCard');

      const name =
        $container.find('[data-testid="UnitName"]').first().text().trim() ||
        $container.find('.UnitName').first().text().trim() ||
        $container.find('.ChampionName').first().text().trim() ||
        $container.find('a[href*="/units/"]').first().text().trim() ||
        $container.find('img[alt]').first().attr('alt')?.trim() ||
        '';

      if (name) {
        results.push({ name, tier });
      }
    });

    const deduped = new Map<string, { name: string; tier: string }>();
    results.forEach((entry) => {
      const key = this.normalizeUnitName(entry.name);
      if (!deduped.has(key)) {
        deduped.set(key, entry);
      }
    });

    return Array.from(deduped.values());
  }

  private normalizeUnitName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  // Parse style="left: 14%; top: 25%" ra row/col
  private parsePositionFromStyle(styleString: string): { row: number; col: number } {
    const leftMatch = styleString.match(/left:\s*([\d.]+)%/);
    const topMatch = styleString.match(/top:\s*([\d.]+)%/);

    if (!leftMatch || !topMatch) return { row: 3, col: 0 };

    const left = parseFloat(leftMatch[1]);
    const top = parseFloat(topMatch[1]);

    // Mobalytics Board Grid: 7 Cột, 4 Hàng
    // Col width ~ 14.28% (100/7)
    // Row height ~ 25% (100/4)
    
    // Thêm sai số nhỏ (+2) để làm tròn chính xác hơn
    const col = Math.floor((left + 2) / 14.28);
    const row = Math.floor((top + 2) / 25);

    // Clamp giá trị để không vượt quá giới hạn
    return { 
        row: Math.min(Math.max(row, 0), 3), 
        col: Math.min(Math.max(col, 0), 6) 
    };
  }
}