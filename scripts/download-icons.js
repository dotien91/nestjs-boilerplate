const fs = require('fs');
const https = require('https');
const path = require('path');

// Tạo thư mục icons nếu chưa có
const iconsDir = path.join(__dirname, '../src/asset/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Danh sách các icon codes phổ biến từ TFT
// Dựa trên các stats trong effects và các icon codes thường dùng
const iconCodes = [
  // Stats cơ bản
  'AS',   // Attack Speed
  'AP',   // Ability Power
  'AD',   // Attack Damage
  'AR',   // Armor
  'MR',   // Magic Resist
  'HP',   // Health Points
  'CRIT', // Critical Strike
  'MANA', // Mana
  'LS',   // Life Steal
  'OMNIVAMP', // Omnivamp
  
  // Các stats khác
  'CDR',  // Cooldown Reduction
  'MS',   // Movement Speed
  'RANGE', // Range
  'DODGE', // Dodge
  'TENACITY', // Tenacity
  'HEAL', // Heal
  'SHIELD', // Shield
  'DMG',  // Damage
  'TRUE', // True Damage
  'MAGIC', // Magic Damage
  'PHYSICAL', // Physical Damage
  
  // Item components
  'BF',   // B.F. Sword
  'ROD',  // Needlessly Large Rod
  'BOW',  // Recurve Bow
  'VEST', // Chain Vest
  'BELT', // Giant's Belt
  'CLOAK', // Negatron Cloak
  'SPATULA', // Spatula
  'TEAR', // Tear of the Goddess
  'GLOVE', // Sparring Gloves
  
  // Các icon khác có thể có
  'GOLD',
  'XP',
  'LEVEL',
  'STAR',
  'TRAIT',
  'AUGMENT',
];

// Chỉ thêm các icon codes phổ biến từ effects
// Không thêm tất cả keys vì nhiều keys không có icon tương ứng
const commonEffectIcons = [
  'Armor',
  'MagicResist',
  'Health',
  'Mana',
  'CritChance',
  'CritDamage',
  'Lifesteal',
  'Omnivamp',
  'Heal',
  'Shield',
  'Damage',
  'TrueDamage',
  'MagicDamage',
  'PhysicalDamage',
];

commonEffectIcons.forEach(icon => {
  if (!iconCodes.includes(icon)) {
    iconCodes.push(icon);
  }
});

// Hàm download file
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      } else if (response.statusCode === 404) {
        file.close();
        fs.unlinkSync(filepath); // Xóa file rỗng
        resolve(false);
      } else {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

// Download tất cả icons
async function downloadAllIcons() {
  const baseUrl = 'https://www.metatft.com/icons';
  const results = {
    success: [],
    failed: [],
  };

  console.log(`Starting download of ${iconCodes.length} icons...\n`);

  for (let i = 0; i < iconCodes.length; i++) {
    const code = iconCodes[i];
    const url = `${baseUrl}/${code}.svg`;
    const filepath = path.join(iconsDir, `${code}.svg`);

    try {
      console.log(`[${i + 1}/${iconCodes.length}] Downloading ${code}...`);
      const success = await downloadFile(url, filepath);
      
      if (success) {
        results.success.push(code);
        console.log(`✓ ${code} downloaded successfully\n`);
      } else {
        results.failed.push(code);
        console.log(`✗ ${code} not found (404)\n`);
      }
    } catch (error) {
      results.failed.push(code);
      console.log(`✗ ${code} failed: ${error.message}\n`);
    }

    // Delay để tránh rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n=== Download Summary ===');
  console.log(`Successfully downloaded: ${results.success.length} icons`);
  console.log(`Failed/Not found: ${results.failed.length} icons`);
  
  if (results.success.length > 0) {
    console.log('\nSuccessfully downloaded:');
    results.success.forEach(code => console.log(`  - ${code}.svg`));
  }
  
  if (results.failed.length > 0) {
    console.log('\nFailed/Not found:');
    results.failed.forEach(code => console.log(`  - ${code}.svg`));
  }

  // Lưu danh sách vào file
  fs.writeFileSync(
    path.join(iconsDir, 'download-results.json'),
    JSON.stringify(results, null, 2)
  );
}

// Chạy download
downloadAllIcons().catch(console.error);

