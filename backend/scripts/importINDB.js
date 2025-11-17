const XLSX = require('xlsx');
const mongoose = require('mongoose');
const FoodDatabase = require('../src/models/FoodDatabase');
require('dotenv').config();


const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://s2497239_db_user:VqcIJiSccXxRprES@clusterfitify.hbi32uj.mongodb.net/?retryWrites=true&w=majority&appName=ClusterFITIFY'
console.log(mongoUri)
mongoose.connect(mongoUri, {
  // options, if any for your mongoose version
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
