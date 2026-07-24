import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as cheerio from 'cheerio';
import * as puppeteer from 'puppeteer';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { TftSeasonSnapshotsService } from '../tft-season-snapshots/tft-season-snapshots.service';
import { TftUnitSchemaClass } from '../tft-units/infrastructure/persistence/document/entities/tft-unit.schema';
import { TftItemSchemaClass } from '../tft-items/infrastructure/persistence/document/entities/tft-item.schema';
import { TftTraitSchemaClass } from '../tft-traits/infrastructure/persistence/document/entities/tft-trait.schema';
import { TftAugmentSchemaClass } from '../tft-augments/infrastructure/persistence/document/entities/tft-augment.schema';
import { CompositionSchemaClass } from '../compositions/infrastructure/persistence/document/entities/composition.schema';
import { CrawlSetResource } from './dto/crawl-set.dto';

type CrawlOptions = {
  setKey: string;
  locale: string;
  persist: boolean;
  resources?: CrawlSetResource[];
};

type SourceRecord = {
  slug: string;
  name: string;
  url?: string;
  image?: string;
  text?: string;
  category?: string;
};

@Injectable()
export class MobalyticsSetCrawlerService {
  private readonly logger = new Logger(MobalyticsSetCrawlerService.name);
  private readonly origin = 'https://mobalytics.gg';

  constructor(
    private readonly snapshotsService: TftSeasonSnapshotsService,
    @InjectModel(TftUnitSchemaClass.name)
    private readonly unitModel: Model<TftUnitSchemaClass>,
    @InjectModel(TftItemSchemaClass.name)
    private readonly itemModel: Model<TftItemSchemaClass>,
    @InjectModel(TftTraitSchemaClass.name)
    private readonly traitModel: Model<TftTraitSchemaClass>,
    @InjectModel(TftAugmentSchemaClass.name)
    private readonly augmentModel: Model<TftAugmentSchemaClass>,
    @InjectModel(CompositionSchemaClass.name)
    private readonly compositionModel: Model<CompositionSchemaClass>,
  ) {}

  async persistDataset(data: {
    season_id: string;
    units: SourceRecord[];
    items: SourceRecord[];
    traits: SourceRecord[];
    augments: SourceRecord[];
    compositions: Array<
      SourceRecord & {
        plan?: string;
        difficulty?: string;
        champions?: string[];
      }
    >;
  }, options: { downloadImages?: boolean } = {}) {
    const seasonId = data.season_id;
    const now = new Date();
    const slugToName = (slug: string) =>
      slug
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    const apiPart = (slug: string) =>
      slug.replace(/(^|-)([a-z0-9])/g, (_, __, char: string) =>
        char.toUpperCase(),
      );
    const write = async (
      model: Model<any>,
      records: SourceRecord[],
      map: (record: SourceRecord, index: number) => Record<string, unknown>,
    ) => {
      if (!records.length) return { upserted: 0, modified: 0 };
      const result = await model.bulkWrite(
        records.map((record, index) => {
          const document = map(record, index);
          return {
            updateOne: {
              filter: {
                season_id: seasonId,
                apiName: document.apiName,
              },
              update: {
                $set: { ...document, season_id: seasonId, updatedAt: now },
                $setOnInsert: { createdAt: now },
              },
              upsert: true,
            },
          };
        }),
      );
      return {
        upserted: result.upsertedCount,
        modified: result.modifiedCount,
      };
    };

    const units = await write(this.unitModel, data.units, (record) => {
      const name = slugToName(record.slug);
      const cost = Number(record.text?.match(/(\d+)$/)?.[1]) || null;
      const championIcon = `${this.origin.replace(
        'https://mobalytics.gg',
        'https://cdn.mobalytics.gg',
      )}/assets/tft/images/champions/icons/set${seasonId}/${record.slug}.png`;
      return {
        slug: record.slug,
        apiName: `TFT${seasonId}_${apiPart(record.slug)}`,
        name,
        enName: name,
        characterName: `TFT${seasonId}_${apiPart(record.slug)}`,
        cost,
        icon: championIcon,
        squareIcon: championIcon,
        tileIcon: championIcon,
        traits: [],
        popularItems: [],
      };
    });
    const items = await write(this.itemModel, data.items, (record) => ({
      slug: record.slug,
      apiName: `TFT${seasonId}_Item_${apiPart(record.slug)}`,
      name: record.name || slugToName(record.slug),
      enName: record.name || slugToName(record.slug),
      icon: record.image ?? null,
      type: record.category ?? null,
      associatedTraits: [],
      incompatibleTraits: [],
      composition: [],
      effects: {},
      tags: [],
    }));
    const traits = await write(this.traitModel, data.traits, (record) => ({
      apiName: `TFT${seasonId}_${apiPart(record.slug)}`,
      name: record.name || slugToName(record.slug),
      enName: record.name || slugToName(record.slug),
      icon: record.image ?? null,
      effects: [],
      units: [],
      unitProperties: {},
    }));
    const augments = await write(
      this.augmentModel,
      data.augments,
      (record) => ({
        apiName: `TFT${seasonId}_Augment_${apiPart(record.slug)}`,
        name: record.name || slugToName(record.slug),
        enName: record.name || slugToName(record.slug),
        icon: record.image ?? null,
        associatedTraits: [],
        incompatibleTraits: [],
        composition: [],
        effects: {},
        tags: [],
      }),
    );

    let compositions = { upserted: 0, modified: 0 };
    if (data.compositions.length) {
      const result = await this.compositionModel.bulkWrite(
        data.compositions.map((composition, order) => ({
          updateOne: {
            filter: {
              season_id: seasonId,
              compId: `${seasonId}-${composition.slug}`,
            },
            update: {
              $set: {
                season_id: seasonId,
                compId: `${seasonId}-${composition.slug}`,
                name: composition.name || slugToName(composition.slug),
                plan: composition.plan,
                difficulty: composition.difficulty,
                active: true,
                boardSize: { rows: 4, cols: 7 },
                units: (composition.champions ?? []).map((name, index) => ({
                  championId: `TFT${seasonId}_${apiPart(name.toLowerCase())}`,
                  championKey: apiPart(name.toLowerCase()),
                  name,
                  cost: 0,
                  star: 1,
                  position: { row: Math.floor(index / 7), col: index % 7 },
                  items: [],
                  traits: [],
                })),
                order: order + 1,
                updatedAt: now,
              },
              $setOnInsert: { createdAt: now },
            },
            upsert: true,
          },
        })),
      );
      compositions = {
        upserted: result.upsertedCount,
        modified: result.modifiedCount,
      };
    }
    const images = options.downloadImages
      ? await this.downloadDatasetImages(seasonId, data.units, data.items)
      : { requested: false, downloaded: 0, failed: 0, errors: [] };

    return { units, items, traits, augments, compositions, images };
  }

  private async downloadDatasetImages(
    seasonId: string,
    units: SourceRecord[],
    items: SourceRecord[],
  ) {
    const safeSeason = seasonId.replace(/[^0-9]/g, '');
    const jobs = [
      ...units.map((record) => ({
        url: `https://cdn.mobalytics.gg/assets/tft/images/champions/icons/set${safeSeason}/${record.slug}.png`,
        parts: ['champions', 'icons', `set${safeSeason}`],
        slug: record.slug,
      })),
      ...items
        .filter((record) => !!record.image)
        .map((record) => ({
          url: record.image!,
          parts: ['items', `set${safeSeason}`],
          slug: record.slug,
        })),
    ];
    const errors: string[] = [];
    let downloaded = 0;

    await this.mapWithConcurrency(jobs, 5, async (job) => {
      const safeSlug = job.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      try {
        const response = await fetch(job.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.startsWith('image/')) {
          throw new Error(`Unexpected content type: ${contentType}`);
        }
        const directory = join(
          process.cwd(),
          'src',
          'asset',
          'images',
          ...job.parts,
        );
        await mkdir(directory, { recursive: true });
        await writeFile(
          join(directory, `${safeSlug}.png`),
          Buffer.from(await response.arrayBuffer()),
        );
        downloaded += 1;
      } catch (error) {
        errors.push(`${job.url} - ${this.errorMessage(error)}`);
      }
    });

    return {
      requested: true,
      downloaded,
      failed: errors.length,
      errors,
    };
  }

  async crawl(options: CrawlOptions) {
    const setKey = options.setKey.toLowerCase();
    if (!/^set\d+$/.test(setKey)) {
      throw new BadRequestException('setKey must match set<number>');
    }

    const seasonId = setKey.replace('set', '');
    const baseUrl = `${this.origin}/tft/${setKey}`;
    const browser = await this.createBrowser();
    const warnings: string[] = [];
    const selected = new Set<CrawlSetResource>(
      options.resources ?? [
        'units',
        'items',
        'traits',
        'augments',
        'compositions',
      ],
    );

    try {
      const championsPage = selected.has('units')
        ? await this.loadOptionalPage(
            browser,
            [`${baseUrl}/champions`],
            warnings,
          )
        : null;
      const championLinks = championsPage
        ? this.extractLinkedRecords(
            championsPage,
            new RegExp(`/tft/${setKey}/champions/([^/?#]+)$`),
          )
        : [];

      const champions = await this.mapWithConcurrency(
        championLinks,
        2,
        async (champion) => {
          if (!champion.url) return champion;
          try {
            const html = await this.loadPublicPage(browser, champion.url);
            return this.extractChampionDetail(html, champion);
          } catch (error) {
            warnings.push(
              `Champion detail failed: ${champion.url} - ${this.errorMessage(error)}`,
            );
            return champion;
          }
        },
      );

      const itemRoutes: Array<readonly [string, string]> = [
        ['basic', 'items'],
        ['combined', 'items/combined'],
        ['radiant', 'items/radiant'],
        ['elusive', 'items/elusive'],
        ['consumable', 'items/consumables'],
        ['artifact', 'items/artifacts'],
      ];

      const itemGroups = selected.has('items')
        ? await this.mapWithConcurrency(
            itemRoutes,
            2,
            async ([category, path]) => {
              const url = `${baseUrl}/${path}`;
              const html = await this.loadOptionalPage(browser, [url], warnings);
              if (!html) return [];
              return this.extractImageRecords(html, category, [
                'items',
                'game-items',
              ]);
            },
          )
        : [];

      const augmentsHtml = selected.has('augments')
        ? await this.loadOptionalPage(
            browser,
            [`${baseUrl}/augments`],
            warnings,
          )
        : null;
      const augments = augmentsHtml
        ? this.extractImageRecords(augmentsHtml, 'augment', ['augment'])
        : [];

      const traitsHtml = selected.has('traits')
        ? await this.loadOptionalPage(
            browser,
            [`${baseUrl}/synergies`, `${baseUrl}/traits`],
            warnings,
          )
        : null;
      const traits = traitsHtml
        ? this.extractImageRecords(traitsHtml, 'trait', [
            `tft-synergies-${setKey}`,
          ])
        : [];

      const compsHtml = selected.has('compositions')
        ? await this.loadOptionalPage(
            browser,
            [`${baseUrl}/team-comps`],
            warnings,
          )
        : null;
      const compositions = compsHtml
        ? this.extractCompositionRecords(compsHtml)
        : [];

      const data = {
        season_id: seasonId,
        setKey,
        locale: options.locale,
        source: baseUrl,
        units: champions,
        champions,
        items: this.dedupeRecords(itemGroups.flat()),
        traits,
        augments,
        compositions,
      };

      const totalRecords =
        champions.length +
        data.items.length +
        traits.length +
        augments.length +
        compositions.length;
      if (totalRecords === 0) {
        throw new BadGatewayException({
          message: 'Mobalytics crawl returned no usable public-page data',
          warnings,
        });
      }

      let persisted = false;
      if (options.persist) {
        let snapshotData = data;
        if (options.resources) {
          const existing = await this.snapshotsService.find(
            seasonId,
            options.locale,
          );
          const previous = (existing?.data ?? {}) as Record<string, unknown>;
          snapshotData = {
            ...previous,
            ...data,
            units:
              selected.has('units') && data.units.length
                ? data.units
                : previous.units ?? [],
            champions: selected.has('units') && data.champions.length
              ? data.champions
              : previous.champions ?? [],
            items:
              selected.has('items') && data.items.length
                ? data.items
                : previous.items ?? [],
            traits:
              selected.has('traits') && data.traits.length
                ? data.traits
                : previous.traits ?? [],
            augments: selected.has('augments') && data.augments.length
              ? data.augments
              : previous.augments ?? [],
            compositions:
              selected.has('compositions') && data.compositions.length
              ? data.compositions
              : previous.compositions ?? [],
          } as typeof data;
        }
        await this.snapshotsService.upsert({
          season_id: seasonId,
          locale: options.locale,
          setKey,
          source: baseUrl,
          data: snapshotData,
          warnings,
        });
        persisted = true;
      }

      return {
        season_id: seasonId,
        setKey,
        locale: options.locale,
        persisted,
        counts: {
          champions: champions.length,
          items: data.items.length,
          traits: traits.length,
          augments: augments.length,
          compositions: compositions.length,
        },
        warnings,
        data,
      };
    } finally {
      await browser.close();
    }
  }

  private async createBrowser(): Promise<puppeteer.Browser> {
    return puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1440, height: 1200 },
    });
  }

  private async loadPublicPage(
    browser: puppeteer.Browser,
    url: string,
  ): Promise<string> {
    this.assertAllowedUrl(url);
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/138.0.0.0 Safari/537.36',
    );
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const requestUrl = request.url();
      const resourceType = request.resourceType();

      if (new URL(requestUrl).pathname.startsWith('/api/tft')) {
        request.abort();
        return;
      }
      if (['font', 'media'].includes(resourceType)) {
        request.abort();
        return;
      }
      request.continue();
    });

    try {
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 120000,
      });
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const status = response?.status() ?? 0;
      const title = await page.title();
      const bodyText = await page.evaluate(
        () => document.body?.innerText?.slice(0, 500) || '',
      );

      if (
        status === 403 ||
        /just a moment|verify you are human|cloudflare/i.test(
          `${title} ${bodyText}`,
        )
      ) {
        throw new BadGatewayException(
          `Mobalytics blocked the public page request with Cloudflare: ${url}`,
        );
      }
      if (status >= 400) {
        throw new BadGatewayException(
          `Mobalytics returned HTTP ${status}: ${url}`,
        );
      }

      await this.scrollPage(page);
      return page.content();
    } finally {
      await page.close();
    }
  }

  private async loadOptionalPage(
    browser: puppeteer.Browser,
    urls: string[],
    warnings: string[],
  ): Promise<string | null> {
    for (const url of urls) {
      try {
        return await this.loadPublicPage(browser, url);
      } catch (error) {
        warnings.push(`${url} - ${this.errorMessage(error)}`);
      }
    }
    return null;
  }

  private assertAllowedUrl(url: string): void {
    const parsed = new URL(url);
    if (
      parsed.origin !== this.origin ||
      !/^\/tft\/set\d+(?:\/|$)/.test(parsed.pathname) ||
      parsed.pathname.startsWith('/api/tft')
    ) {
      throw new BadRequestException(`Crawler URL is not allowed: ${url}`);
    }
  }

  private extractLinkedRecords(
    html: string,
    routePattern: RegExp,
  ): SourceRecord[] {
    const $ = cheerio.load(html);
    const records: SourceRecord[] = [];

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;
      const pathname = new URL(href, this.origin).pathname;
      const match = pathname.match(routePattern);
      if (!match) return;

      const image = $(element).find('img').first();
      const text = this.cleanText($(element).text());
      const imageAlt = this.cleanText(image.attr('alt') || '');
      const slug = match[1];
      records.push({
        slug,
        name: imageAlt || this.nameFromSlug(slug),
        url: new URL(href, this.origin).toString(),
        image: image.attr('src') || undefined,
        text: text || undefined,
      });
    });

    return this.dedupeRecords(records);
  }

  private extractChampionDetail(
    html: string,
    base: SourceRecord,
  ): SourceRecord & Record<string, unknown> {
    const $ = cheerio.load(html);
    const name = this.cleanText($('h1').first().text()) || base.name;
    const main = $('main').first().length ? $('main').first() : $('body');
    const text = this.cleanText(main.text()).slice(0, 12000);
    const images = this.dedupeStrings(
      main
        .find('img[src]')
        .map((_, image) => $(image).attr('src') || '')
        .get()
        .filter(Boolean),
    );

    return {
      ...base,
      name,
      text,
      images,
    };
  }

  private extractImageRecords(
    html: string,
    category: string,
    pathHints: string[],
  ): SourceRecord[] {
    const $ = cheerio.load(html);
    const records: SourceRecord[] = [];

    $('img[src]').each((_, element) => {
      const image = $(element);
      const src = image.attr('src') || '';
      const alt = this.cleanText(image.attr('alt') || '');
      if (!alt || !pathHints.some((hint) => src.toLowerCase().includes(hint))) {
        return;
      }

      const slug = this.slugFromImage(src) || this.slugify(alt);
      let container = image.parent();
      for (let depth = 0; depth < 4 && container.length; depth += 1) {
        const text = this.cleanText(container.text());
        if (text.length >= alt.length && text.length <= 1500) {
          records.push({
            slug,
            name: alt,
            image: src,
            text: text || undefined,
            category,
          });
          return;
        }
        container = container.parent();
      }
    });

    return this.dedupeRecords(records);
  }

  private extractCompositionRecords(html: string): SourceRecord[] {
    const $ = cheerio.load(html);
    const records: SourceRecord[] = [];

    $('a[href*="/comps-guide/"]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;
      const slug = new URL(href, this.origin).pathname.split('/').pop() || '';
      const text = this.cleanText($(element).text());
      const image = $(element).find('img').first();
      records.push({
        slug,
        name: text || this.nameFromSlug(slug),
        url: new URL(href, this.origin).toString(),
        image: image.attr('src') || undefined,
        text: text || undefined,
      });
    });

    return this.dedupeRecords(records);
  }

  private async scrollPage(page: puppeteer.Page): Promise<void> {
    await page.evaluate(async () => {
      for (let index = 0; index < 8; index += 1) {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      window.scrollTo(0, 0);
    });
  }

  private async mapWithConcurrency<T, R>(
    values: readonly T[],
    concurrency: number,
    mapper: (value: T) => Promise<R>,
  ): Promise<R[]> {
    const output = new Array<R>(values.length);
    let nextIndex = 0;

    const workers = Array.from(
      { length: Math.min(concurrency, values.length) },
      async () => {
        while (nextIndex < values.length) {
          const index = nextIndex;
          nextIndex += 1;
          output[index] = await mapper(values[index]);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      },
    );

    await Promise.all(workers);
    return output;
  }

  private dedupeRecords<T extends SourceRecord>(records: T[]): T[] {
    const unique = new Map<string, T>();
    for (const record of records) {
      if (!unique.has(record.slug)) {
        unique.set(record.slug, record);
      }
    }
    return Array.from(unique.values());
  }

  private dedupeStrings(values: string[]): string[] {
    return Array.from(new Set(values));
  }

  private cleanText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  private slugFromImage(url: string): string {
    const value = url.split('/').pop()?.split('?')[0]?.split('.')[0] || '';
    return this.slugify(value.replace(/[-_]v?\d+$/i, ''));
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private nameFromSlug(slug: string): string {
    return slug
      .split('-')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
