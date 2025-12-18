const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function crawlCompositions() {
  console.log('Starting browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('Navigating to metatft.com/comps...');
    await page.goto('https://www.metatft.com/comps', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for compositions to load
    console.log('Waiting for compositions to load...');
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
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to extract data from window object or global variables
    console.log('Trying to extract data from page JavaScript...');
    let compositionsData = await page.evaluate(() => {
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
      
      return null;
    });

    // First, get list of composition cards that can be clicked to show TabContentFlex
    console.log('Getting list of composition cards...');
    const compositionCards = await page.evaluate(() => {
      const cards = [];
      // Find all clickable composition cards/containers
      const allElements = Array.from(document.querySelectorAll('*'));
      const tierElements = allElements.filter(el => {
        const text = el.textContent?.trim();
        return text && /^[SABCD]$/.test(text) && el.children.length === 0;
      });
      
      tierElements.forEach(tierEl => {
        let container = tierEl.parentElement;
        for (let i = 0; i < 8 && container; i++) {
          const unitLinks = container.querySelectorAll('a[href*="/units/"]');
          if (unitLinks.length >= 5) {
            // Find clickable element - could be the container itself or a button/link
            const clickable = container.querySelector('button, [onclick], [class*="clickable"], [class*="card"], a[href*="/comps/"]') || container;
            
            // Get composition name
            const nameMatch = container.textContent?.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+){2,})/);
            const name = nameMatch ? nameMatch[1] : 'Unknown';
            
            cards.push({
              name: name,
              tier: tierEl.textContent?.trim(),
              index: cards.length // Store index for later reference
            });
            break;
          }
          container = container.parentElement;
        }
      });
      
      return cards;
    });

    if (!compositionCards || compositionCards.length === 0) {
      console.log('⚠ No composition cards found, falling back to DOM extraction...');
      // Fallback to DOM extraction
      compositionCards = [];
    } else {
      console.log(`Found ${compositionCards.length} composition cards to process`);
    }

    // Extract compositions by clicking on cards to open TabContentFlex
    const compositions = [];
    
    // Only process if we have cards
    if (compositionCards && compositionCards.length > 0) {
      // Limit to first 10 for testing (remove limit later)
      const maxComps = Math.min(compositionCards.length, 50);
      
      for (let i = 0; i < maxComps; i++) {
        const cardInfo = compositionCards[i];
        console.log(`\n[${i + 1}/${maxComps}] Processing: ${cardInfo.name} (${cardInfo.tier})`);
        
        try {
          // Scroll to the composition card
          await page.evaluate((index) => {
            const cards = document.querySelectorAll('[class*="comp"], article, [role="article"]');
            if (cards[index]) {
              cards[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, i);
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Click on the composition card to open TabContentFlex
          const clicked = await page.evaluate((index) => {
            // Find the composition card by tier badge
            const allElements = Array.from(document.querySelectorAll('*'));
            const tierElements = allElements.filter(el => {
              const text = el.textContent?.trim();
              return text && /^[SABCD]$/.test(text) && el.children.length === 0;
            });
            
            if (index < tierElements.length) {
              const tierEl = tierElements[index];
              let container = tierEl.parentElement;
              for (let i = 0; i < 8 && container; i++) {
                const unitLinks = container.querySelectorAll('a[href*="/units/"]');
                if (unitLinks.length >= 5) {
                  // Try to find and click the card
                  const clickable = container.querySelector('button, [onclick], [class*="clickable"], [class*="card"]') || container;
                  if (clickable) {
                    clickable.click();
                    return true;
                  }
                  break;
                }
                container = container.parentElement;
              }
            }
            return false;
          }, i);
        
        if (!clicked) {
          console.log(`  ⚠ Could not click on card ${i + 1}`);
          continue;
        }
        
        // Wait for TabContentFlex to appear
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Debug: Check if modal/detail opened
        const hasModal = await page.evaluate(() => {
          const modal = document.querySelector('[class*="modal"], [class*="dialog"], [role="dialog"], [class*="TabContentFlex"]');
          const unitLinks = document.querySelectorAll('a[href*="/units/"]');
          return {
            hasModal: !!modal,
            unitLinksCount: unitLinks.length,
            modalClasses: modal ? modal.className : null
          };
        });
        console.log(`  Debug: hasModal=${hasModal.hasModal}, unitLinks=${hasModal.unitLinksCount}`);
        
        // Extract composition data from TabContentFlex
        const compData = await page.evaluate(() => {
          const comp = {
            name: null,
            tier: null,
            plan: null,
            difficulty: null,
            units: [],
            earlyGame: [],
            stats: {
              avgPlace: null,
              pickRate: null,
              winRate: null
            }
          };
          
          // Extract name
          const nameEl = document.querySelector('h1, h2, [class*="comp-name"], [class*="title"]');
          if (nameEl) {
            comp.name = nameEl.textContent?.trim();
          }
          
          // Extract tier
          const tierEl = document.querySelector('[class*="tier"], [class*="rank"]');
          if (tierEl) {
            const tierText = tierEl.textContent?.trim();
            if (/^[SABCD]$/.test(tierText)) {
              comp.tier = tierText;
            }
          }
          
          // Extract plan and difficulty
          const metaText = document.body.textContent || '';
          const planMatch = metaText.match(/(?:Fast\s*9|lvl\s*[0-9]|Level\s*[0-9])/i);
          if (planMatch) comp.plan = planMatch[0];
          
          const difficultyMatch = metaText.match(/\b(Hard|Easy|Medium)\b/i);
          if (difficultyMatch) comp.difficulty = difficultyMatch[0];
          
          // Look for TabContentFlex or modal/dialog that opened
          let boardContainer = null;
          
          // Method 1: Look for TabContentFlex specifically
          const tabContentFlex = document.querySelector('[class*="TabContentFlex"], [class*="tab-content"], [class*="modal"], [class*="dialog"], [role="dialog"]');
          if (tabContentFlex) {
            boardContainer = tabContentFlex;
          }
          
          // Method 2: Look for board layout in opened content
          if (!boardContainer) {
            const boardSelectors = [
              '[class*="board"]',
              '[class*="grid"]',
              '[class*="team"]',
              '[class*="composition"]',
              '[data-board]',
              '[id*="board"]'
            ];
            
            for (const selector of boardSelectors) {
              boardContainer = document.querySelector(selector);
              if (boardContainer && boardContainer.querySelectorAll('a[href*="/units/"], img[src*="champion"]').length >= 5) {
                break;
              }
            }
          }
          
          // Method 3: Find container with most unit links (fallback)
          if (!boardContainer) {
            const containers = Array.from(document.querySelectorAll('div, section, article'));
            boardContainer = containers.reduce((best, current) => {
              const currentUnits = current.querySelectorAll('a[href*="/units/"]').length;
              const bestUnits = best?.querySelectorAll('a[href*="/units/"]').length || 0;
              return currentUnits > bestUnits ? current : best;
            }, null);
          }
          
          // Method 4: If still no boardContainer, try to find units directly from the clicked card
          if (!boardContainer || boardContainer.querySelectorAll('a[href*="/units/"]').length < 5) {
            // Try to find the composition card that was clicked
            const allUnitLinks = Array.from(document.querySelectorAll('a[href*="/units/"]'));
            if (allUnitLinks.length >= 5) {
              // Find the container that has the most unit links and is visible
              const visibleContainers = Array.from(document.querySelectorAll('div, section, article')).filter(container => {
                const rect = container.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 && rect.top >= 0;
              });
              
              boardContainer = visibleContainers.reduce((best, current) => {
                const currentUnits = current.querySelectorAll('a[href*="/units/"]').length;
                const bestUnits = best?.querySelectorAll('a[href*="/units/"]').length || 0;
                return currentUnits > bestUnits ? current : best;
              }, null);
            }
          }
          
          if (boardContainer) {
            // Get all unit elements in board
            let unitElements = boardContainer.querySelectorAll('a[href*="/units/"]');
            
            // If not enough units, try broader search
            if (unitElements.length < 5) {
              unitElements = document.querySelectorAll('a[href*="/units/"]');
            }
            
            // Try to determine grid structure
            const unitData = [];
            unitElements.forEach((unitEl, index) => {
              const unitLink = unitEl.closest('a[href*="/units/"]') || unitEl;
              const href = unitLink.getAttribute('href');
              if (!href || !href.includes('/units/')) return;
              
              const unitKeyMatch = href.match(/\/units\/([^\/\?]+)/);
              if (!unitKeyMatch) return;
              
              const championKey = unitKeyMatch[1];
              
              // Get position from data attributes or CSS
              let position = { row: 0, col: 0 };
              
              // Method 1: Check data attributes
              const parent = unitEl.closest('[data-row], [data-col], [class*="cell"], [class*="slot"]');
              if (parent) {
                const row = parent.getAttribute('data-row') || parent.getAttribute('row');
                const col = parent.getAttribute('data-col') || parent.getAttribute('col');
                if (row !== null && col !== null) {
                  position = {
                    row: parseInt(row) || 0,
                    col: parseInt(col) || 0
                  };
                }
              }
              
              // Method 2: Calculate from visual position
              if (position.row === 0 && position.col === 0) {
                const rect = unitEl.getBoundingClientRect();
                const boardRect = boardContainer.getBoundingClientRect();
                
                // Get all unit positions
                const allRects = Array.from(unitElements).map(el => ({
                  el,
                  top: el.getBoundingClientRect().top - boardRect.top,
                  left: el.getBoundingClientRect().left - boardRect.left
                }));
                
                // Group by row (similar top values, within 20px)
                const rows = [];
                const sortedRects = [...allRects].sort((a, b) => {
                  const topDiff = Math.abs(a.top - b.top);
                  if (topDiff < 20) {
                    return a.left - b.left;
                  }
                  return a.top - b.top;
                });
                
                let currentRow = [];
                let lastTop = -1;
                sortedRects.forEach(rect => {
                  if (lastTop === -1 || Math.abs(rect.top - lastTop) < 20) {
                    currentRow.push(rect);
                    lastTop = rect.top;
                  } else {
                    if (currentRow.length > 0) rows.push(currentRow);
                    currentRow = [rect];
                    lastTop = rect.top;
                  }
                });
                if (currentRow.length > 0) rows.push(currentRow);
                
                // Find this unit's position
                for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
                  const colIdx = rows[rowIdx].findIndex(r => r.el === unitEl);
                  if (colIdx >= 0) {
                    position = { row: rowIdx, col: colIdx };
                    break;
                  }
                }
              }
              
              // Method 3: Fallback to index
              if (position.row === 0 && position.col === 0) {
                const unitIndex = Array.from(unitElements).indexOf(unitEl);
                position = {
                  row: Math.floor(unitIndex / 7),
                  col: unitIndex % 7
                };
              }
              
              // Extract unit info
              const img = unitEl.querySelector('img[src*="champion"], img[src*="unit"]');
              const linkText = unitLink.textContent?.trim();
              const imgAlt = img?.getAttribute('alt') || '';
              
              let name = linkText || imgAlt || championKey;
              name = name.replace(/^(Unlockable\s+Unit|Three\s+Star\s+Unit)\s*/i, '').trim();
              if (!name || name === championKey) {
                name = championKey.replace(/([a-z])([A-Z])/g, '$1 $2');
              }
              
              // Extract items
              const items = [];
              const itemLinks = unitEl.closest('div, section')?.querySelectorAll('a[href*="/items/"]') || [];
              itemLinks.forEach(itemLink => {
                const itemHref = itemLink.getAttribute('href');
                const itemKeyMatch = itemHref.match(/\/items\/([^\/\?]+)/);
                if (itemKeyMatch) items.push(itemKeyMatch[1]);
              });
              
              // Check for unlockable/3-star
              const unlockImg = unitEl.querySelector('img[alt*="Unlockable"], img[src*="unlock"]');
              const star3Img = unitEl.querySelector('img[alt*="Three Star"], img[alt*="3 Star"]');
              
              unitData.push({
                name: name,
                championKey: championKey,
                position: position,
                items: items,
                image: img?.src || null,
                needUnlock: !!unlockImg,
                need3Star: !!star3Img,
                star: star3Img ? 3 : 1
              });
            });
            
            comp.units = unitData;
          }
          
          // Extract early game options from CompEarlyOptionSelection
          const earlyGameOptions = [];
          const earlyOptionSelectors = [
            '[class*="CompEarlyOptionSelection"]',
            '[class*="early-option"]',
            '[class*="earlyOption"]',
            '[data-early-game]',
            '[data-early-option]'
          ];
          
          let earlyOptionContainer = null;
          for (const selector of earlyOptionSelectors) {
            earlyOptionContainer = document.querySelector(selector);
            if (earlyOptionContainer) break;
          }
          
          if (earlyOptionContainer) {
            // Find all early game unit options
            const earlyUnitElements = earlyOptionContainer.querySelectorAll('a[href*="/units/"], [class*="unit"], [class*="champion"]');
            
            earlyUnitElements.forEach((unitEl) => {
              const unitLink = unitEl.closest('a[href*="/units/"]') || unitEl;
              const href = unitLink.getAttribute('href');
              if (!href || !href.includes('/units/')) return;
              
              const unitKeyMatch = href.match(/\/units\/([^\/\?]+)/);
              if (!unitKeyMatch) return;
              
              const championKey = unitKeyMatch[1];
              
              // Get position if available
              let position = { row: 0, col: 0 };
              const parent = unitEl.closest('[data-row], [data-col]');
              if (parent) {
                const row = parent.getAttribute('data-row') || parent.getAttribute('row');
                const col = parent.getAttribute('data-col') || parent.getAttribute('col');
                if (row !== null && col !== null) {
                  position = {
                    row: parseInt(row) || 0,
                    col: parseInt(col) || 0
                  };
                }
              }
              
              // Extract unit info
              const img = unitEl.querySelector('img[src*="champion"], img[src*="unit"]');
              const linkText = unitLink.textContent?.trim();
              const imgAlt = img?.getAttribute('alt') || '';
              
              let name = linkText || imgAlt || championKey;
              name = name.replace(/^(Unlockable\s+Unit|Three\s+Star\s+Unit)\s*/i, '').trim();
              if (!name || name === championKey) {
                name = championKey.replace(/([a-z])([A-Z])/g, '$1 $2');
              }
              
              // Extract items
              const items = [];
              const itemLinks = unitEl.closest('div, section')?.querySelectorAll('a[href*="/items/"]') || [];
              itemLinks.forEach(itemLink => {
                const itemHref = itemLink.getAttribute('href');
                const itemKeyMatch = itemHref.match(/\/items\/([^\/\?]+)/);
                if (itemKeyMatch) items.push(itemKeyMatch[1]);
              });
              
              // Check for unlockable/3-star
              const unlockImg = unitEl.querySelector('img[alt*="Unlockable"], img[src*="unlock"]');
              const star3Img = unitEl.querySelector('img[alt*="Three Star"], img[alt*="3 Star"]');
              
              earlyGameOptions.push({
                name: name,
                championKey: championKey,
                position: position,
                items: items,
                image: img?.src || null,
                needUnlock: !!unlockImg,
                need3Star: !!star3Img,
                star: star3Img ? 3 : 1
              });
            });
            
            comp.earlyGame = earlyGameOptions;
          }
          
          return comp;
        });
        console.log('compData=====', JSON.stringify(compData, null, 2));
        
        // If no units found, try to extract from the card itself (before clicking)
        if (compData.units.length === 0) {
          console.log(`  ⚠ No units found in detail view, trying to extract from card...`);
          const cardData = await page.evaluate((index) => {
            const allElements = Array.from(document.querySelectorAll('*'));
            const tierElements = allElements.filter(el => {
              const text = el.textContent?.trim();
              return text && /^[SABCD]$/.test(text) && el.children.length === 0;
            });
            
            if (index < tierElements.length) {
              const tierEl = tierElements[index];
              let container = tierEl.parentElement;
              for (let i = 0; i < 8 && container; i++) {
                const unitLinks = container.querySelectorAll('a[href*="/units/"]');
                if (unitLinks.length >= 5) {
                  const units = [];
                  unitLinks.forEach((unitLink) => {
                    const href = unitLink.getAttribute('href');
                    const unitKeyMatch = href.match(/\/units\/([^\/\?]+)/);
                    if (unitKeyMatch) {
                      const championKey = unitKeyMatch[1];
                      const img = unitLink.querySelector('img');
                      const linkText = unitLink.textContent?.trim();
                      const imgAlt = img?.getAttribute('alt') || '';
                      
                      let name = linkText || imgAlt || championKey;
                      name = name.replace(/^(Unlockable\s+Unit|Three\s+Star\s+Unit)\s*/i, '').trim();
                      if (!name || name === championKey) {
                        name = championKey.replace(/([a-z])([A-Z])/g, '$1 $2');
                      }
                      
                      // Get position from DOM order
                      const unitIndex = Array.from(unitLinks).indexOf(unitLink);
                      const position = {
                        row: Math.floor(unitIndex / 7),
                        col: unitIndex % 7
                      };
                      
                      units.push({
                        name: name,
                        championKey: championKey,
                        position: position,
                        items: [],
                        image: img?.src || null,
                        needUnlock: false,
                        need3Star: false,
                        star: 1
                      });
                    }
                  });
                  
                  // Get name from container
                  const nameMatch = container.textContent?.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+){2,})/);
                  const name = nameMatch ? nameMatch[1] : null;
                  
                  return { name, units, tier: tierEl.textContent?.trim() };
                }
                container = container.parentElement;
              }
            }
            return null;
          }, i);
          
          if (cardData && cardData.units.length > 0) {
            compData.name = cardData.name || compData.name;
            compData.units = cardData.units;
            compData.tier = cardData.tier || compData.tier;
            console.log(`  ✓ Extracted from card: ${compData.name} (${compData.units.length} units)`);
          }
        }
        
        if (compData.name && compData.units.length > 0) {
          compositions.push(compData);
          console.log(`  ✓ Extracted: ${compData.name} (${compData.units.length} units)`);
        } else {
          console.log(`  ⚠ Skipped: No valid data extracted`);
        }
        
        // Close the TabContentFlex/modal if it's open (click outside or close button)
        await page.evaluate(() => {
          // Try to find and click close button or ESC key
          const closeBtn = document.querySelector('[aria-label*="close"], [class*="close"], button[aria-label*="Close"]');
          if (closeBtn) {
            closeBtn.click();
          } else {
            // Try pressing ESC
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27 }));
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`  ✗ Error processing card ${i + 1}:`, error.message);
        // Try to close any open modals
        try {
          await page.evaluate(() => {
            const closeBtn = document.querySelector('[aria-label*="close"], [class*="close"]');
            if (closeBtn) closeBtn.click();
          });
        } catch (e) {
          // Ignore
        }
      }
    }

    // Fallback: If no compositions extracted from detail pages, use DOM extraction
    if (compositions.length === 0) {
      console.log('\nFalling back to DOM extraction from list page...');
      await page.goto('https://www.metatft.com/comps', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const compositionsFromDOM = await page.evaluate(() => {
        const comps = [];
        
        // Find all composition cards by looking for tier badges (S, A, B, C, D)
        // These are typically in their own container near the composition name
        const allElements = Array.from(document.querySelectorAll('*'));
        const tierElements = allElements.filter(el => {
          const text = el.textContent?.trim();
          return text && /^[SABCD]$/.test(text) && el.children.length === 0;
        });
        
        // Get parent containers of tier elements - these should be composition cards
        const compContainers = [];
        tierElements.forEach(tierEl => {
          let container = tierEl.parentElement;
          // Go up to find the main composition container
          for (let i = 0; i < 8 && container; i++) {
            // Check if this container has multiple units (composition board)
            const unitLinks = container.querySelectorAll('a[href*="/units/"]');
            if (unitLinks.length >= 5) { // At least 5 units = likely a composition
              if (!compContainers.includes(container)) {
                compContainers.push(container);
              }
              break;
            }
            container = container.parentElement;
          }
        });
        
        compContainers.forEach((container, index) => {
          try {
            const comp = {
              id: index + 1,
              name: null,
              tier: null,
              plan: null,
              difficulty: null,
              units: [],
              stats: {
                avgPlace: null,
                pickRate: null,
                winRate: null
              }
            };
            
            // Extract tier (S, A, B, C, D) - should be a direct child or nearby
            const tierText = Array.from(container.querySelectorAll('*')).find(el => {
              const text = el.textContent?.trim();
              return text && /^[SABCD]$/.test(text) && el.children.length === 0;
            });
            if (tierText) {
              comp.tier = tierText.textContent.trim();
            }
            
            // Extract name - look for the composition title
            // Usually appears after the tier badge
            const allText = container.textContent;
            const namePatterns = [
              // Pattern: "Shurima Azir Renekton", "Bilgewater Miss Fortune Tahm Kench"
              /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){2,})/,
              // Pattern with numbers: "Demacia Vayne Garen"
              /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/
            ];
            
            for (const pattern of namePatterns) {
              const match = allText.match(pattern);
              if (match && match[1]) {
                const candidate = match[1].trim();
                // Filter out common false positives
                if (candidate.length > 5 && 
                    !candidate.match(/^(Avg Place|Pick Rate|Win Rate|Last Updated|Comps Analyzed|Ranked|Situational|Sort|Filter|Open In|Copy Team|Download|Support|Join|Follow)/i) &&
                    candidate.split(' ').length >= 2) {
                  comp.name = candidate;
                  break;
                }
              }
            }
            
            // Extract plan (Fast 9, lvl 7, lvl 6, etc.)
            const planMatch = allText.match(/(?:Fast\s*9|lvl\s*[0-9]|Level\s*[0-9])/i);
            if (planMatch) {
              comp.plan = planMatch[0];
            }
            
            // Extract difficulty (Hard, Easy, Medium)
            const difficultyMatch = allText.match(/\b(Hard|Easy|Medium)\b/i);
            if (difficultyMatch) {
              comp.difficulty = difficultyMatch[0];
            }
            
            // Extract units - find all unit links
            const unitLinks = container.querySelectorAll('a[href*="/units/"]');
            const unitMap = new Map(); // Use Map to avoid duplicates
            
            unitLinks.forEach((unitLink, linkIndex) => {
              const href = unitLink.getAttribute('href');
              const unitKeyMatch = href.match(/\/units\/([^\/\?]+)/);
              if (!unitKeyMatch) return;
              
              const championKey = unitKeyMatch[1];
              
              // Skip if we already have this unit
              if (unitMap.has(championKey)) return;
              
              // Get the unit container (parent of the link)
              let unitContainer = unitLink.parentElement;
              for (let i = 0; i < 3 && unitContainer; i++) {
                if (unitContainer.querySelector('img[src*="champion"], img[src*="unit"]')) {
                  break;
                }
                unitContainer = unitContainer.parentElement;
              }
              
              const unit = {
                name: null,
                championKey: championKey,
                championId: null, // Will be mapped later
                cost: null,
                star: 1,
                position: { row: 0, col: 0 }, // Will be calculated from board position
                items: [],
                image: null,
                needUnlock: false,
                need3Star: false
              };
              
              // Extract unit name from link text, image alt, or championKey
              const linkText = unitLink.textContent?.trim();
              const img = unitLink.querySelector('img');
              const imgAlt = img?.getAttribute('alt') || img?.getAttribute('title') || '';
              
              // Clean up name - remove "Unlockable Unit", "Three Star Unit" prefixes
              let rawName = linkText || imgAlt || championKey;
              rawName = rawName.replace(/^(Unlockable\s+Unit|Three\s+Star\s+Unit)\s*/i, '').trim();
              
              // Convert championKey to readable name if needed
              if (!rawName || rawName === championKey) {
                // Convert "MissFortune" -> "Miss Fortune", "TahmKench" -> "Tahm Kench"
                unit.name = championKey.replace(/([a-z])([A-Z])/g, '$1 $2');
              } else {
                unit.name = rawName;
              }
              
              // Extract image
              if (img) {
                unit.image = img.src || img.getAttribute('data-src') || null;
              }
              
              // Check for unlockable unit
              const unlockImg = unitContainer.querySelector('img[alt*="Unlockable"], img[src*="unlock"]');
              if (unlockImg) {
                unit.needUnlock = true;
              }
              
              // Check for 3-star unit
              const star3Img = unitContainer.querySelector('img[alt*="Three Star"], img[alt*="3 Star"]');
              if (star3Img) {
                unit.need3Star = true;
                unit.star = 3;
              }
              
              // Extract items - find item links near this unit
              const itemLinks = unitContainer.querySelectorAll('a[href*="/items/"]');
              itemLinks.forEach(itemLink => {
                const itemHref = itemLink.getAttribute('href');
                const itemKeyMatch = itemHref.match(/\/items\/([^\/\?]+)/);
                if (itemKeyMatch) {
                  unit.items.push(itemKeyMatch[1]);
                }
              });
              
              // Calculate approximate position based on order in DOM
              // This is a rough estimate - actual positions would need board layout analysis
              const unitIndex = Array.from(container.querySelectorAll('a[href*="/units/"]')).indexOf(unitLink);
              // Assume 4 rows x 7 cols board
              unit.position = {
                row: Math.floor(unitIndex / 7),
                col: unitIndex % 7
              };
              
              unitMap.set(championKey, unit);
            });
            
            comp.units = Array.from(unitMap.values());
            
            // Extract stats (Avg Place, Pick Rate, Win Rate)
            const statsText = container.textContent;
            const avgPlaceMatch = statsText.match(/Avg\s+Place[:\s]*([\d.]+)/i);
            if (avgPlaceMatch) {
              comp.stats.avgPlace = parseFloat(avgPlaceMatch[1]);
            }
            
            const pickRateMatch = statsText.match(/Pick\s+Rate[:\s]*([\d.]+)/i);
            if (pickRateMatch) {
              comp.stats.pickRate = parseFloat(pickRateMatch[1]);
            }
            
            const winRateMatch = statsText.match(/Win\s+Rate[:\s]*([\d.]+)%?/i);
            if (winRateMatch) {
              comp.stats.winRate = parseFloat(winRateMatch[1]);
            }
            
            // Only add composition if it has at least a name and some units
            if (comp.name && comp.units.length >= 5) {
              comps.push(comp);
            }
          } catch (error) {
            console.error('Error extracting composition:', error);
          }
        });
        
        return comps;
      });
      
      if (compositionsFromDOM && compositionsFromDOM.length > 0) {
        compositions.push(...compositionsFromDOM);
        console.log(`  ✓ Extracted ${compositionsFromDOM.length} compositions from DOM fallback`);
      }
    }

    // If we found data in JavaScript, try to process it
    if (compositionsData && compositions.length === 0) {
      console.log('Found data in page JavaScript, processing...');
      const processedComps = processJsonData(compositionsData);
      if (processedComps && processedComps.length > 0) {
        // Merge with DOM extracted data
        compositions.push(...processedComps);
      }
    }

    // Remove duplicates based on name
    const uniqueComps = [];
    const seenNames = new Set();
    compositions.forEach(comp => {
      if (comp.name && !seenNames.has(comp.name)) {
        seenNames.add(comp.name);
        uniqueComps.push(comp);
      }
    });

    console.log(`\n✓ Found ${uniqueComps.length} unique compositions`);

    // Save to JSON file
    const outputPath = path.join(__dirname, '../src/asset/compositions.json');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      outputPath,
      JSON.stringify(uniqueComps, null, 2),
      'utf8'
    );

    console.log(`\n✓ Successfully saved ${uniqueComps.length} compositions to ${outputPath}`);
    console.log('\nSample composition:', uniqueComps[0] ? JSON.stringify(uniqueComps[0], null, 2) : 'No compositions found');
    }
  } catch (error) {
    console.error('Error during crawling:', error);
    throw error;
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

function processJsonData(jsonData) {
  const compositions = [];
  
  // Recursive function to find arrays of compositions
  function findCompositions(obj, path = '') {
    if (!obj || typeof obj !== 'object') return;
    
    // If it's an array, check if it contains composition-like objects
    if (Array.isArray(obj)) {
      if (obj.length > 0 && typeof obj[0] === 'object') {
        // Check if first item looks like a composition
        const first = obj[0];
        if (first.name || first.composition || first.units || first.tier) {
          return obj;
        }
      }
      // Recursively search in array items
      for (const item of obj) {
        const found = findCompositions(item, path);
        if (found) return found;
      }
      return null;
    }
    
    // Check common keys
    if (obj.compositions && Array.isArray(obj.compositions)) return obj.compositions;
    if (obj.comps && Array.isArray(obj.comps)) return obj.comps;
    if (obj.data && Array.isArray(obj.data)) {
      // Check if data contains compositions
      if (obj.data.length > 0 && (obj.data[0].name || obj.data[0].units)) {
        return obj.data;
      }
    }
    
    // Recursively search in object properties
    for (const key in obj) {
      if (key === 'compositions' || key === 'comps' || key === 'data') {
        const found = findCompositions(obj[key], `${path}.${key}`);
        if (found) return found;
      }
      // Search deeper
      const found = findCompositions(obj[key], `${path}.${key}`);
      if (found) return found;
    }
    
    return null;
  }
  
  const data = findCompositions(jsonData) || jsonData.compositions || jsonData.comps || jsonData.data || jsonData;
  
  if (Array.isArray(data)) {
    return data.map((comp, index) => {
      // Normalize composition data
      const normalized = {
        id: comp.id || index + 1,
        name: comp.name || comp.title || null,
        tier: comp.tier || comp.rank || null,
        plan: comp.plan || comp.leveling || null,
        difficulty: comp.difficulty || comp.complexity || null,
        units: [],
        stats: {
          avgPlace: comp.avgPlace || comp.averagePlacement || null,
          pickRate: comp.pickRate || comp.playRate || null,
          winRate: comp.winRate || comp.winrate || null
        }
      };
      
      // Extract units
      if (comp.units && Array.isArray(comp.units)) {
        normalized.units = comp.units.map(unit => ({
          name: unit.name || unit.championName || null,
          championKey: unit.championKey || unit.apiName || unit.key || null,
          championId: unit.championId || unit.id || null,
          cost: unit.cost || unit.price || null,
          star: unit.star || unit.stars || 1,
          position: unit.position || { row: 0, col: 0 },
          items: unit.items || [],
          image: unit.image || unit.icon || unit.avatar || null,
          needUnlock: unit.needUnlock || false,
          need3Star: unit.need3Star || false
        }));
      }
      
      return normalized;
    }).filter(c => c.name && c.units && c.units.length > 0);
  }
  
  return compositions;
}

// Run the crawler
crawlCompositions().catch(console.error);

