const XLSX = require('xlsx');
const mongoose = require('mongoose');
const FoodDatabase = require('../src/models/FoodDatabase');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/fitify', {
  // remove deprecated options for mongoose v6+
});

// Load Excel file
const workbook = XLSX.readFile('../data/INDB.xlsx');
const sheetName = workbook.SheetNames[0];
const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

const importINDB = async () => {
  try {
    await FoodDatabase.deleteMany({});

    const foods = rows.map(row => ({
      name: row['food_name']?.trim() || '',
      alternateNames: [],
      servingSize: 100,
      servingUnit: 'g',
      source: 'indb',
      nutrition: {
        calories: Number(row['energy_kcal']) || 0,
        protein: Number(row['protein_g']) || 0,
        carbs: Number(row['carb_g']) || 0,
        fats: Number(row['fat_g']) || 0,
        fiber: Number(row['fibre_g']) || 0,
      },
      metadata: {
        category: '',   // Fill if available
        region: '',
      }
    })).filter(food => food.name);

    await FoodDatabase.insertMany(foods);
    console.log(`✅ Imported ${foods.length} foods into INDB`);

  } catch (error) {
    console.error('❌ Import error:', error);
  } finally {
    mongoose.connection.close();
  }
};

importINDB();
