const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Constant: Giới hạn số lượng đội hình crawl (0 = không giới hạn)
const MAX_COMPOSITIONS_TO_CRAWL = 10; // Set 0 để crawl tất cả, hoặc số cụ thể để giới hạn

async function crawlCompositions() {
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
    
    console.log('Navigating to metatft.com/comps...');
    await page.goto('https://www.metatft.com/comps', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Đợi hàng dữ liệu đầu tiên xuất hiện
    console.log('Waiting for composition rows to load...');
    await page.waitForSelector('.CompRow', { timeout: 20000 });

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

    console.log('Extracting composition data...');
    const results = await page.evaluate(() => {
      const rows = document.querySelectorAll('.CompRow');
      
      return Array.from(rows).map((row) => {
        // 1. Lấy tên đội hình
        const compName = row.querySelector('.CompName')?.textContent?.trim() || 
                        row.querySelector('[class*="Comp_Title"], [class*="CompTitle"]')?.textContent?.trim() ||
                        'Unknown';

        // 2. Lấy tier (S, A, B, C, D)
        const tierEl = row.querySelector('[class*="Tier"], [class*="tier"], .CompRowTierBadge');
        const tier = tierEl?.textContent?.trim() || null;

        // 3. Lấy chỉ số tổng quát (Avg Place, Pick Rate, Win Rate)
        const statElements = row.querySelectorAll('.StatData, .Stat_Number, [class*="Stat"]');
        const stats = {
          avgPlace: null,
          pickRate: null,
          winRate: null,
        };
        
        // Try to extract stats from various possible selectors
        const statText = row.textContent || '';
        const avgPlaceMatch = statText.match(/Avg\s+Place[:\s]*([\d.]+)/i);
        if (avgPlaceMatch) {
          stats.avgPlace = parseFloat(avgPlaceMatch[1]);
        }
        
        const pickRateMatch = statText.match(/Pick\s+Rate[:\s]*([\d.]+)/i);
        if (pickRateMatch) {
          stats.pickRate = parseFloat(pickRateMatch[1]);
        }
        
        const winRateMatch = statText.match(/Win\s+Rate[:\s]*([\d.]+)%?/i);
        if (winRateMatch) {
          stats.winRate = parseFloat(winRateMatch[1]);
        }

        // 4. Lấy thông tin Units từ UnitsContainer hoặc UnitHolder
        const unitsContainer = row.querySelector('[class*="UnitsContainer"], .UnitsContainer');
        const unitHolders = unitsContainer 
          ? unitsContainer.querySelectorAll('.Unit_Wrapper, .UnitHolder, a[href*="/units/"]')
          : row.querySelectorAll('.Unit_Wrapper, .UnitHolder, a[href*="/units/"]');
        
        const units = [];
        const seenChampionKeys = new Set();
        
        Array.from(unitHolders).forEach((unitEl, index) => {
          // Get unit link
          const unitLink = unitEl.querySelector('a[href*="/units/"]') || 
                          (unitEl.tagName === 'A' && unitEl.href?.includes('/units/') ? unitEl : null);
          
          if (!unitLink) return;
          
          const href = unitLink.getAttribute('href') || unitLink.href;
              const unitKeyMatch = href.match(/\/units\/([^\/\?]+)/);
              if (!unitKeyMatch) return;
              
              const championKey = unitKeyMatch[1];
              
          // Skip duplicates
          if (seenChampionKeys.has(championKey)) return;
          seenChampionKeys.add(championKey);
          
          // Get unit name
          const name = unitLink.querySelector('.UnitNames, .UnitName')?.textContent?.trim() ||
                      unitLink.textContent?.trim() ||
                      championKey;
          
          // Get unit image
          const img = unitLink.querySelector('img[src*="champion"], img[src*="unit"]');
          const image = img?.src || null;
          
          // Lấy danh sách trang bị
          const itemsContainer = unitEl.closest('.Unit_Wrapper, .UnitHolder');
          const itemLinks = itemsContainer 
            ? itemsContainer.querySelectorAll('a[href*="/items/"]')
            : unitEl.querySelectorAll('a[href*="/items/"]');
          
          const items = Array.from(itemLinks).map((itemLink) => {
            const itemHref = itemLink.getAttribute('href') || itemLink.href;
                const itemKeyMatch = itemHref.match(/\/items\/([^\/\?]+)/);
            return itemKeyMatch ? itemKeyMatch[1] : null;
          }).filter(Boolean);
          
          // Kiểm tra tướng 3 sao
          const isThreeStar = !!unitEl.querySelector('.Star-3, .three-star, img[alt*="Three Star"], img[alt*="3 Star"]');
          
          // Kiểm tra tướng cần unlock
          const needUnlock = !!unitEl.querySelector('.UnitUnlockIcon, img[alt*="Unlockable"], img[src*="unlock"]');
          
          // Calculate position from index (fallback)
                      const position = {
            row: Math.floor(index / 7),
            col: index % 7
                      };
                      
                      units.push({
                        name: name,
                        championKey: championKey,
                        position: position,
            items: items,
            image: image,
            needUnlock: needUnlock,
            need3Star: isThreeStar,
            star: isThreeStar ? 3 : 1
          });
        });

        // 5. Extract plan and difficulty from tags
        const planMatch = row.textContent?.match(/(?:Fast\s*9|Fast\s*8|lvl\s*[0-9]|Level\s*[0-9])/i);
        const plan = planMatch ? planMatch[0] : null;
        
        const difficultyMatch = row.textContent?.match(/\b(Hard|Easy|Medium)\b/i);
        const difficulty = difficultyMatch ? difficultyMatch[0] : null;

        return {
          name: compName,
          tier: tier,
          plan: plan,
          difficulty: difficulty,
          units: units,
          stats: stats,
        };
      });
    });

    console.log(`\n✓ Extracted ${results.length} compositions from list page`);

    // Filter out invalid compositions
    let validCompositions = results.filter(comp => 
      comp.name && 
      comp.name !== 'Unknown' && 
      comp.units && 
      comp.units.length >= 5
    );

    console.log(`✓ Found ${validCompositions.length} valid compositions`);

    // Remove duplicates based on name + units signature
    const uniqueComps = [];
    const seenSignatures = new Set();
    
    validCompositions.forEach(comp => {
      // Create signature: normalized name + sorted championKeys
      const normalizedName = (comp.name || '').toLowerCase().trim().replace(/\s+/g, ' ');
      const championKeys = (comp.units || [])
        .map(u => u.championKey || '')
        .filter(k => k.length > 0)
        .sort()
        .join(',');
      
      const signature = `${normalizedName}|${championKeys}`;
      
      if (!seenSignatures.has(signature)) {
        seenSignatures.add(signature);
        uniqueComps.push(comp);
      }
    });

    console.log(`✓ Found ${uniqueComps.length} unique compositions after deduplication`);

    // Giới hạn số lượng compositions nếu có MAX_COMPOSITIONS_TO_CRAWL > 0
    let finalComps = uniqueComps;
    if (MAX_COMPOSITIONS_TO_CRAWL > 0 && uniqueComps.length > MAX_COMPOSITIONS_TO_CRAWL) {
      console.log(`⚠️  Limiting to ${MAX_COMPOSITIONS_TO_CRAWL} compositions (from ${uniqueComps.length})`);
      finalComps = uniqueComps.slice(0, MAX_COMPOSITIONS_TO_CRAWL);
    }

    // Save to JSON file
    const outputPath = path.join(__dirname, '../src/asset/compositions.json');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      outputPath,
      JSON.stringify(finalComps, null, 2),
      'utf8'
    );

    console.log(`\n✓ Successfully saved ${finalComps.length} compositions to ${outputPath}`);
    
    return finalComps;
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
crawlCompositions().catch(console.error);
}

module.exports = { crawlCompositions };
