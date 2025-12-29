const puppeteer = require('puppeteer');
const { execSync } = require('child_process');

// Constant: Giới hạn số lượng items crawl (0 = không giới hạn)
const MAX_ITEMS_TO_CRAWL = 0; // Set 0 để crawl tất cả, hoặc số cụ thể để giới hạn

async function crawlItemsTier() {
  console.log('Starting browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  try {
    const page = await browser.newPage();
    
    // Giả lập trình duyệt thực tế
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    );
    
    console.log('Navigating to metatft.com/items...');
    await page.goto('https://www.metatft.com/items', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Đợi hàng dữ liệu đầu tiên xuất hiện
    console.log('Waiting for item rows to load...');
    await page.waitForSelector('.StatsTable, table, [class*="Table"], [class*="ItemRow"]', { timeout: 20000 });

    // Scroll để load lazy content
    console.log('Scrolling to load all content...');
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Extracting item tier data...');
    const results = await page.evaluate(() => {
      const rows = document.querySelectorAll('.StatsTable tr, table tr, [class*="ItemRow"], [class*="Table"] tr');
      
      return Array.from(rows).slice(1).map((row) => {
        // 1. Lấy tên item
        const itemName = row.querySelector('.item-name, [class*="ItemName"], a[href*="/items/"]')?.textContent?.trim() || 
                        row.querySelector('td:first-child')?.textContent?.trim() ||
                        'Unknown';

        // 2. Lấy tier (S, A, B, C, D)
        let tier = null;
        
        // Tìm tier từ class
        const tierElement = row.querySelector('[class*="Tier"], [class*="tier"], .CompRowTierBadge');
        if (tierElement) {
          tier = tierElement.textContent?.trim() || null;
          if (tier && tier.length > 0) {
            // Lấy chữ cái tier từ text (S, A, B, C, D)
            const tierMatch = tier.match(/^([SABCD])$/i);
            if (tierMatch) {
              tier = tierMatch[1].toUpperCase();
            } else {
              tier = null;
            }
          }
        }

        // Nếu chưa tìm được, tìm trong các cell
        if (!tier) {
          const cells = row.querySelectorAll('td, th');
          for (let i = 0; i < Math.min(5, cells.length); i++) {
            const cellText = cells[i]?.textContent?.trim() || '';
            if (/^[SABCD]$/i.test(cellText)) {
              tier = cellText.toUpperCase();
              break;
            }
          }
        }

        // Nếu vẫn chưa tìm được, tìm trong toàn bộ row text
        if (!tier) {
          const rowText = row.textContent || '';
          const tierMatch = rowText.match(/\b([SABCD])\b/i);
          if (tierMatch) {
            tier = tierMatch[1].toUpperCase();
          }
        }

        // 3. Lấy API name từ link (nếu có)
        const itemLink = row.querySelector('a[href*="/items/"]');
        let apiName = null;
        if (itemLink) {
          const href = itemLink.getAttribute('href') || itemLink.href;
          const match = href.match(/\/items\/([^\/\?]+)/);
          if (match) {
            apiName = match[1];
          }
        }

        if (itemName === 'Unknown' || !tier) {
          return null;
        }

        return {
          name: itemName,
          apiName: apiName,
          tier: tier,
        };
      }).filter(item => item !== null && item.name && item.tier);
    });

    console.log(`\n✓ Extracted ${results.length} items with tier data`);

    // Giới hạn số lượng items nếu có MAX_ITEMS_TO_CRAWL > 0
    let finalResults = results;
    if (MAX_ITEMS_TO_CRAWL > 0 && results.length > MAX_ITEMS_TO_CRAWL) {
      console.log(`⚠️  Limiting to ${MAX_ITEMS_TO_CRAWL} items (from ${results.length})`);
      finalResults = results.slice(0, MAX_ITEMS_TO_CRAWL);
    }

    // Remove duplicates based on name
    const uniqueItems = [];
    const seenNames = new Set();
    
    finalResults.forEach(item => {
      const normalizedName = (item.name || '').toLowerCase().trim();
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        uniqueItems.push(item);
      }
    });

    console.log(`✓ Found ${uniqueItems.length} unique items after deduplication`);

    // Save to JSON file tạm thời
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, '../src/asset/items-tier.json');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      outputPath,
      JSON.stringify(uniqueItems, null, 2),
      'utf8'
    );

    console.log(`\n✓ Successfully saved ${uniqueItems.length} items to ${outputPath}`);
    console.log(`\n🔄 Starting tier update...`);
    
    // Tự động update tier sau khi crawl xong
    try {
      execSync('npm run update:items-tier', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log(`\n✅ Tier update completed!`);
    } catch (error) {
      console.error(`\n❌ Error updating tier:`, error.message);
      throw error;
    }
    
    return uniqueItems;
  } catch (error) {
    console.error('Crawl failed:', error);
    throw error;
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

// Run the crawler
if (require.main === module) {
  crawlItemsTier().catch(console.error);
}

module.exports = { crawlItemsTier };

