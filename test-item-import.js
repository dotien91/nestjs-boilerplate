const mongoose = require('mongoose');
const fs = require('fs');

async function testItemImport() {
  try {
    // Kết nối MongoDB
    await mongoose.connect('mongodb://localhost:27017', {
      dbName: 'api'
    });
    console.log('✅ Connected to MongoDB');

    // Đọc file JSON
    const jsonData = JSON.parse(fs.readFileSync('./src/asset/TFTSet15_latest_en_us.json', 'utf8'));

    // Tìm Radiant Last Whisper
    const items = jsonData.items || [];
    const lastWhisper = items.find(item => item.apiName === 'TFT5_Item_LastWhisperRadiant');

    if (!lastWhisper) {
      console.log('❌ Radiant Last Whisper not found in JSON');
      return;
    }

    console.log('✅ Found Radiant Last Whisper in JSON:', lastWhisper.name);

    // Tạo data để import
    const itemData = {
      apiName: lastWhisper.apiName,
      name: lastWhisper.name,
      enName: lastWhisper.en_name,
      description: lastWhisper.desc,
      effects: lastWhisper.effects,
      composition: lastWhisper.composition || [],
      associatedTraits: lastWhisper.associatedTraits || [],
      incompatibleTraits: lastWhisper.incompatibleTraits || [],
      tags: lastWhisper.tags || [],
      unique: lastWhisper.unique || false,
      icon: lastWhisper.icon,
      variableMatches: lastWhisper.variable_matches?.map(vm => ({
        match: vm.match,
        type: vm.type,
        full_match: vm.full_match,
        hash: vm.hash,
        value: vm.value
      })) || [],
      set: 'set15',
      isActive: true
    };

    console.log('📦 Prepared item data:', {
      apiName: itemData.apiName,
      name: itemData.name,
      effects: Object.keys(itemData.effects),
      composition: itemData.composition,
      variableMatchesCount: itemData.variableMatches.length
    });

    // Import vào database
    const ItemModel = mongoose.model('Item', new mongoose.Schema({
      apiName: { type: String, unique: true },
      name: String,
      enName: String,
      description: String,
      effects: mongoose.Schema.Types.Mixed,
      composition: [String],
      associatedTraits: [String],
      incompatibleTraits: [String],
      tags: [String],
      unique: Boolean,
      icon: String,
      variableMatches: [{
        match: String,
        type: String,
        full_match: String,
        hash: String,
        value: Number
      }],
      set: String,
      isActive: Boolean
    }, { timestamps: true }));

    // Xóa item cũ nếu có
    await ItemModel.deleteOne({ apiName: itemData.apiName });

    // Insert item mới
    const newItem = new ItemModel(itemData);
    await newItem.save();

    console.log('✅ Successfully imported Radiant Last Whisper to database!');
    console.log('🔍 Item ID:', newItem._id);

    // Query để verify
    const savedItem = await ItemModel.findOne({ apiName: itemData.apiName });
    if (savedItem) {
      console.log('✅ Verification successful!');
      console.log('📦 Saved item data:', {
        id: savedItem._id,
        apiName: savedItem.apiName,
        name: savedItem.name,
        effectsCount: Object.keys(savedItem.effects).length,
        composition: savedItem.composition,
        variableMatchesCount: savedItem.variableMatches.length,
        unique: savedItem.unique
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testItemImport();
