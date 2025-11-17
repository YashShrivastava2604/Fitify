const FoodDatabase = require('../models/FoodDatabase');
const axios = require('axios');

const USDA_API_KEY = process.env.USDA_API_KEY;

/**
 * Search for food - INDB first, then USDA
 */
const searchFood = async (query) => {
  try {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    console.log(`🔍 Searching for: "${query}"`);
    
    // Step 1: Search INDB (MongoDB)
    const indbResults = await FoodDatabase.find({
      name: { $regex: query, $options: 'i' }
    }).limit(10);

    if (indbResults.length > 0) {
      console.log(`✅ Found ${indbResults.length} results in INDB`);
      return {
        success: true,
        source: 'indb',
        data: indbResults.map(food => ({
          name: food.name,
          servingSize: food.servingSize,
          servingUnit: food.servingUnit,
          nutrition: food.nutrition,
          source: 'indb',
          _id: food._id
        }))
      };
    }

    console.log(`⚠️ Not found in INDB, trying USDA...`);

    // Step 2: Search USDA API (fallback)
    if (!USDA_API_KEY) {
      throw new Error('Food not found in database');
    }

    const usdaResults = await searchUSDAFood(query);
    
    if (usdaResults.success && usdaResults.data.length > 0) {
      console.log(`✅ Found ${usdaResults.data.length} results in USDA`);
      return usdaResults;
    }

    throw new Error(`Food "${query}" not found`);

  } catch (error) {
    console.error('❌ Food search error:', error.message);
    throw error;
  }
};

/**
 * Search USDA FoodData Central API
 */
const searchUSDAFood = async (query) => {
  try {
    const response = await axios.get('https://api.nal.usda.gov/fdc/v1/foods/search', {
      params: {
        query: query,
        pageSize: 10,
        api_key: USDA_API_KEY,
      },
      timeout: 5000,
    });

    if (!response.data.foods || response.data.foods.length === 0) {
      return { success: false, data: [] };
    }

    const foods = response.data.foods.map(food => {
      const nutrients = food.foodNutrients || [];
      
      return {
        name: food.description,
        servingSize: food.servingSize || 100,
        servingUnit: food.servingUnitName || 'g',
        nutrition: {
          calories: getNutrientValue(nutrients, 1008),
          protein: getNutrientValue(nutrients, 1003),
          carbs: getNutrientValue(nutrients, 1005),
          fats: getNutrientValue(nutrients, 1004),
          fiber: getNutrientValue(nutrients, 1079),
        },
        source: 'usda',
        _id: `usda_${food.fdcId}`
      };
    });

    return {
      success: true,
      source: 'usda',
      data: foods
    };

  } catch (error) {
    console.error('❌ USDA search error:', error.message);
    return { success: false, data: [] };
  }
};

/**
 * Extract nutrient value from USDA format
 */
const getNutrientValue = (nutrients, nutrientId) => {
  const nutrient = nutrients.find(n => n.nutrientId === nutrientId || n.nutrient?.id === nutrientId);
  return nutrient ? Math.round(nutrient.value) : 0;
};

module.exports = {
  searchFood,
};
