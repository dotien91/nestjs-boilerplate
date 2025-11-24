const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function crawlUnits() {
  console.log('Starting browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('Navigating to metatft.com/new-set#Units...');
    await page.goto('https://www.metatft.com/new-set#Units', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for units to load
    console.log('Waiting for units to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Scroll to load lazy content
    console.log('Scrolling page to load content...');
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if(totalHeight >= scrollHeight){
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // First, try to extract data from window object or global variables
    console.log('Trying to extract data from page JavaScript...');
    let units = await page.evaluate(() => {
      // Try to find data in window object
      if (window.__NEXT_DATA__) {
        return window.__NEXT_DATA__.props?.pageProps || window.__NEXT_DATA__.props || null;
      }
      
      // Try other common data storage locations
      if (window.__INITIAL_STATE__) {
        return window.__INITIAL_STATE__;
      }
      
      if (window.__APOLLO_STATE__) {
        return window.__APOLLO_STATE__;
      }
      
      // Try to find React/Next.js data
      const scripts = Array.from(document.querySelectorAll('script'));
      for (const script of scripts) {
        const content = script.textContent || script.innerHTML;
        if (content.includes('__NEXT_DATA__') || content.includes('champions') || content.includes('units')) {
          try {
            // Try to extract JSON from script
            const jsonMatch = content.match(/__NEXT_DATA__\s*=\s*({[\s\S]*?});/) ||
                            content.match(/(\{[\s\S]*?"champions"[\s\S]*?\})/) ||
                            content.match(/(\{[\s\S]*?"units"[\s\S]*?\})/);
            
            if (jsonMatch) {
              try {
                const parsed = JSON.parse(jsonMatch[1]);
                return parsed;
              } catch (e) {
                // Try to find nested JSON
                const nestedMatch = content.match(/\{[\s\S]{100,50000}\}/);
                if (nestedMatch) {
                  try {
                    return JSON.parse(nestedMatch[0]);
                  } catch (e2) {
                    // Continue
                  }
                }
              }
            }
          } catch (e) {
            // Continue
          }
        }
      }
      
      return null;
    });

    // If we found data in JavaScript, process it
    if (units) {
      console.log('Found data in page JavaScript!');
      units = processJsonData(units);
    } else {
      units = [];
    }

    // Also try DOM extraction as fallback
    console.log('Extracting unit data from DOM...');
    const domUnits = await page.evaluate(() => {
      const unitElements = [];
      
      // Try multiple selectors to find unit cards - more comprehensive
      const selectors = [
        'div[class*="unit"]',
        'div[class*="Unit"]',
        'div[class*="champion"]',
        'div[class*="Champion"]',
        '[data-testid*="unit"]',
        '[data-testid*="champion"]',
        'article',
        '.card',
        '[role="article"]',
        'li[class*="unit"]',
        'li[class*="champion"]'
      ];

      let elements = [];
      for (const selector of selectors) {
        const found = document.querySelectorAll(selector);
        if (found.length > 5) { // Lower threshold
          elements = found;
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          break;
        }
      }

      // If no elements found, try to get all clickable/visible elements with images
      if (elements.length === 0 || elements.length < 10) {
        // Try to find by looking for images (unit avatars) - prioritize champion images
        const championImages = document.querySelectorAll('img[src*="championsplashes"], img[src*="champion"]');
        if (championImages.length > 0) {
          console.log(`Found ${championImages.length} champion images`);
          // Get parent containers
          elements = Array.from(championImages).map(img => {
            let parent = img.closest('div, article, section, li, a, button');
            if (!parent) parent = img.parentElement;
            // Go up a few levels to get the card container
            let card = parent;
            for (let i = 0; i < 3 && card; i++) {
              if (card.classList && card.classList.length > 0) {
                break;
              }
              card = card.parentElement;
            }
            return card || parent;
          }).filter(el => el !== null);
        } else {
          // Fallback to all images
          const images = document.querySelectorAll('img[src*="unit"], img[src*="avatar"]');
          if (images.length > 0) {
            elements = Array.from(images).map(img => {
              let parent = img.closest('div, article, section, li, a');
              if (!parent) parent = img.parentElement;
              return parent;
            }).filter(el => el !== null);
          }
        }
      }

      // Extract data from each element - with better filtering
      const seenNames = new Set();
      const seenAvatars = new Set();
      
      elements.forEach((element, index) => {
        if (!element) return;

        try {
          // Skip if it's clearly not a unit (traits, icons, etc.)
          const elementText = element.textContent || '';
          const elementClass = element.className || '';
          
          // Skip if it's clearly not a unit (but be less strict)
          const hasChampionImage = element.querySelector('img[src*="championsplashes"], img[src*="champion"]:not([src*="trait"]):not([src*="icon"])');
          const hasTraitOnly = element.querySelector('img[src*="trait"]') && !hasChampionImage;
          const hasIconOnly = element.querySelector('img[src*="/icons/"]') && !hasChampionImage;
          
          if (hasTraitOnly || hasIconOnly || 
              (elementText.includes('Region Effects:') && !hasChampionImage) ||
              (elementText === 'Unlockable Unit' && !hasChampionImage)) {
            return;
          }

          const unit = {
            id: index + 1,
            name: null,
            avatar: null,
            price: null,
            skills: [],
            traits: [],
            stats: {},
            description: null
          };

          // Extract name - try multiple methods, prioritize champion names
          const nameSelectors = [
            '[class*="champion"][class*="name"]',
            '[class*="unit"][class*="name"]',
            'h3', 'h4',
            '[class*="Name"]',
            '[class*="Title"]'
          ];
          
          let rawName = null;
          for (const selector of nameSelectors) {
            const nameEl = element.querySelector(selector);
            if (nameEl && nameEl.textContent.trim() && nameEl.textContent.trim().length < 100) {
              rawName = nameEl.textContent.trim();
              // Skip generic names
              if (!rawName.match(/^(Gold|Mana|AP|AD|HP|Armor|MR|Cost|Price|Unlockable|New Units|TFT Set)/i)) {
                break;
              } else {
                rawName = null;
              }
            }
          }

          // If no name found, try alt text from images
          if (!rawName) {
            const img = element.querySelector('img[src*="champion"], img[src*="unit"]');
            if (img && img.alt && !img.alt.includes('icon') && !img.alt.includes('trait')) {
              rawName = img.alt.trim();
            }
          }
          
          // Clean up name - extract just the champion name (before traits/numbers)
          if (rawName) {
            // Try to extract champion name from concatenated string
            // Pattern: "ChampionNameTrait1Trait2Cost" or "ChampionName Trait1 Trait2 Cost"
            // Look for the first word that's a proper name (starts with capital, followed by lowercase)
            const nameMatch = rawName.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
            if (nameMatch) {
              unit.name = nameMatch[1].trim();
            } else {
              // Fallback: take first part before any number or all-caps word
              const cleaned = rawName.split(/(?=[A-Z]{2,}|\d+$)/)[0].trim();
              if (cleaned.length > 2) {
                unit.name = cleaned;
              } else {
                unit.name = rawName;
              }
            }
          }
          
          // Also try to extract from image filename
          if (!unit.name) {
            const img = element.querySelector('img[src*="championsplashes"]');
            if (img && img.src) {
              const filenameMatch = img.src.match(/tft16_([^.]+)\./);
              if (filenameMatch) {
                // Convert filename to name (e.g., "aurelionsol" -> "Aurelion Sol")
                const filename = filenameMatch[1].toLowerCase();
                // Common champion name patterns
                const nameMap = {
                  'aurelionsol': 'Aurelion Sol',
                  'baronnashor': 'Baron Nashor',
                  'aatrox': 'Aatrox',
                  'annie': 'Annie'
                };
                
                if (nameMap[filename]) {
                  unit.name = nameMap[filename];
                } else {
                  // Try to split camelCase or add spaces before capitals
                  unit.name = filename
                    .replace(/([a-z])([A-Z])/g, '$1 $2')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                }
              }
            }
          }

          // Extract avatar/image - prioritize champion images
          const img = element.querySelector('img[src*="champion"], img[src*="unit"], img');
          if (img) {
            const imgSrc = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
            // Skip icon images
            if (imgSrc && !imgSrc.includes('/icons/') && !imgSrc.includes('unlock.png')) {
              unit.avatar = imgSrc;
            }
          }

          // Extract price/cost - look for cost indicators (1-5 gold typically)
          // First try to find cost in the raw name (often at the end)
          if (rawName) {
            const costAtEnd = rawName.match(/(\d+)$/);
            if (costAtEnd) {
              const cost = parseInt(costAtEnd[1]);
              if (cost >= 1 && cost <= 5) {
                unit.price = cost;
              }
            }
          }
          
          // Also try specific cost elements
          if (!unit.price) {
            const priceEl = element.querySelector('[class*="cost"], [class*="price"], [class*="gold"], [class*="tier"]');
            if (priceEl) {
              const priceText = priceEl.textContent;
              const priceMatch = priceText.match(/\b([1-5])\b/);
              if (priceMatch) {
                unit.price = parseInt(priceMatch[1]);
              }
            }
          }
          
          // Try to find cost in the element's text
          if (!unit.price) {
            const costMatch = elementText.match(/\b([1-5])\s*(?:gold|cost|tier)\b/i) || 
                            elementText.match(/\b(?:cost|tier|gold)[\s:]*([1-5])\b/i);
            if (costMatch) {
              unit.price = parseInt(costMatch[1]);
            }
          }

          // Extract traits/origins/classes - be more selective
          // First try to extract from the raw name (traits are often concatenated)
          if (rawName && unit.name && rawName !== unit.name) {
            // Extract traits from the part after the champion name
            const afterName = rawName.substring(unit.name.length);
            // Split on capital letters (traits usually start with capital)
            const traitMatches = afterName.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g);
            if (traitMatches) {
              traitMatches.forEach(trait => {
                const cleanTrait = trait.trim();
                if (cleanTrait.length > 2 && cleanTrait.length < 30 && 
                    !cleanTrait.match(/^\d+$/) &&
                    cleanTrait !== unit.name) {
                  unit.traits.push(cleanTrait);
                }
              });
            }
          }
          
          // Also try to find trait elements
          const traitElements = element.querySelectorAll('[class*="trait"]:not([class*="icon"]), [class*="origin"], [class*="class"]');
          const traitSet = new Set(unit.traits);
          traitElements.forEach(traitEl => {
            const traitName = traitEl.textContent.trim();
            // Only add if it's a reasonable trait name (not too long, not generic)
            if (traitName && traitName.length < 30 && 
                !traitName.includes('Region Effects') &&
                !traitName.includes('Unlockable') &&
                !traitName.match(/^\d+$/) &&
                traitName !== unit.name) {
              traitSet.add(traitName);
            }
          });
          unit.traits = Array.from(traitSet);

          // Extract skills/abilities - look for ability descriptions
          const skillElements = element.querySelectorAll('[class*="skill"], [class*="ability"], [class*="spell"]');
          skillElements.forEach(skillEl => {
            const skillName = skillEl.querySelector('h1, h2, h3, h4, [class*="name"]');
            const skillDesc = skillEl.textContent.trim();
            if (skillDesc && skillDesc.length > 20 && skillDesc.length < 500) {
              unit.skills.push({
                name: skillName ? skillName.textContent.trim() : null,
                description: skillDesc
              });
            }
          });

          // Extract description
          const descEl = element.querySelector('[class*="desc"]:not([class*="icon"]), [class*="description"]');
          if (descEl) {
            const desc = descEl.textContent.trim();
            if (desc && desc.length > 10 && desc.length < 1000) {
              unit.description = desc;
            }
          }

          // Only add unit if it has at least an avatar (name can be extracted later)
          // Be less strict - allow units with just avatar or just name
          const isValidAvatar = unit.avatar && 
                                !unit.avatar.includes('/icons/') && 
                                !unit.avatar.includes('unlock.png') &&
                                (unit.avatar.includes('champion') || unit.avatar.includes('championsplashes'));
          
          const isValidName = unit.name && 
                             unit.name.length > 2 && 
                             unit.name.length < 50 &&
                             !unit.name.match(/^(Gold|Mana|AP|AD|HP|Armor|MR|Cost|Price|Unlockable|New Units|TFT Set|Region Effects)/i);
          
          if ((isValidAvatar || isValidName) && 
              !seenAvatars.has(unit.avatar || '') && 
              !seenNames.has(unit.name || '')) {
            if (unit.avatar) seenAvatars.add(unit.avatar);
            if (unit.name) seenNames.add(unit.name);
            unitElements.push(unit);
          }
        } catch (error) {
          // Silently skip errors
        }
      });

      return unitElements;
    });

    // Combine results - prefer JavaScript data, fallback to DOM
    if (units.length === 0 && domUnits.length > 0) {
      console.log(`Found ${domUnits.length} units from DOM extraction`);
      units = domUnits;
    } else if (domUnits.length > 0 && units.length > 0) {
      // Merge both results, avoiding duplicates
      const merged = [...units];
      const existingNames = new Set(units.map(u => u.name).filter(Boolean));
      
      domUnits.forEach(domUnit => {
        if (!domUnit.name || !existingNames.has(domUnit.name)) {
          merged.push(domUnit);
          if (domUnit.name) existingNames.add(domUnit.name);
        }
      });
      
      units = merged;
      console.log(`Merged ${units.length} total units (${units.length - domUnits.length} from JS, ${domUnits.length} from DOM)`);
    } else {
      console.log(`Found ${units.length} units`);
    }

    // Save to JSON file
    const outputPath = path.join(__dirname, '../src/asset/units.json');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      outputPath,
      JSON.stringify(units, null, 2),
      'utf8'
    );

    console.log(`\n✓ Successfully saved ${units.length} units to ${outputPath}`);
    console.log('\nSample unit:', units[0] ? JSON.stringify(units[0], null, 2) : 'No units found');

  } catch (error) {
    console.error('Error during crawling:', error);
    throw error;
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

function processJsonData(jsonData) {
  const units = [];
  
  // Recursive function to find arrays of units/champions
  function findUnits(obj, path = '') {
    if (!obj || typeof obj !== 'object') return;
    
    // If it's an array, check if it contains unit-like objects
    if (Array.isArray(obj)) {
      if (obj.length > 0 && typeof obj[0] === 'object') {
        // Check if first item looks like a unit
        const first = obj[0];
        if (first.name || first.championId || first.character_id || first.icon || first.cost !== undefined) {
          return obj;
        }
      }
      // Recursively search in array items
      for (const item of obj) {
        const found = findUnits(item, path);
        if (found) return found;
      }
      return null;
    }
    
    // Check common keys
    if (obj.units && Array.isArray(obj.units)) return obj.units;
    if (obj.champions && Array.isArray(obj.champions)) return obj.champions;
    if (obj.data && Array.isArray(obj.data)) return obj.data;
    if (obj.items && Array.isArray(obj.items)) {
      // Check if items are actually units
      if (obj.items.length > 0 && (obj.items[0].name || obj.items[0].championId)) {
        return obj.items;
      }
    }
    
    // Recursively search in object properties
    for (const key in obj) {
      if (key === 'units' || key === 'champions' || key === 'data') {
        const found = findUnits(obj[key], `${path}.${key}`);
        if (found) return found;
      }
      // Search deeper
      const found = findUnits(obj[key], `${path}.${key}`);
      if (found) return found;
    }
    
    return null;
  }
  
  const data = findUnits(jsonData) || jsonData.units || jsonData.champions || jsonData.data || jsonData;
  
  if (Array.isArray(data)) {
    return data.map((unit, index) => {
      // Normalize unit data
      const normalized = {
        id: unit.id || unit.championId || unit.character_id || index + 1,
        name: unit.name || unit.championId || unit.character_id || unit.displayName || null,
        avatar: unit.icon || unit.image || unit.avatar || unit.portrait || unit.squareIcon || null,
        price: unit.cost !== undefined ? unit.cost : (unit.gold !== undefined ? unit.gold : (unit.tier !== undefined ? unit.tier : null)),
        skills: [],
        traits: [],
        stats: {},
        description: unit.description || unit.desc || null
      };
      
      // Extract ability/skill
      if (unit.ability) {
        normalized.skills.push({
          name: unit.ability.name || null,
          description: unit.ability.desc || unit.ability.description || null,
          mana: unit.ability.mana || null,
          manaStart: unit.ability.manaStart || null
        });
      }
      
      // Extract traits/origins/classes
      if (unit.traits && Array.isArray(unit.traits)) {
        normalized.traits = unit.traits.map(t => typeof t === 'string' ? t : (t.name || t.trait || t));
      } else if (unit.origins && Array.isArray(unit.origins)) {
        normalized.traits = unit.origins;
      } else if (unit.classes && Array.isArray(unit.classes)) {
        normalized.traits = unit.classes;
      }
      
      // Extract stats
      if (unit.stats) {
        normalized.stats = {
          hp: unit.stats.hp || unit.stats.health || null,
          armor: unit.stats.armor || null,
          magicResist: unit.stats.magicResist || unit.stats.mr || null,
          attackDamage: unit.stats.attackDamage || unit.stats.ad || null,
          attackSpeed: unit.stats.attackSpeed || unit.stats.as || null,
          range: unit.stats.range || null,
          critChance: unit.stats.critChance || null,
          critMultiplier: unit.stats.critMultiplier || null
        };
      }
      
      return normalized;
    }).filter(u => u.name || u.avatar); // Only return units with at least name or avatar
  } else if (typeof data === 'object' && data !== null) {
    // If it's an object, try to extract arrays from it recursively
    const found = findUnits(data);
    if (found) {
      return processJsonData({ units: found });
    }
  }
  
  return units;
}

// Run the crawler
crawlUnits().catch(console.error);

