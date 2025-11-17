const FoodDatabase = require('../models/FoodDatabase');
const axios = require('axios');

const USDA_API_KEY = process.env.USDA_API_KEY;

/**
 * Search food - INDB (Indian recipes) FIRST, then USDA (global foods)
 * Results are merged with INDB items appearing first
 * 
 * @param {string} query - Food name to search (e.g., "pav bhaji", "apple")
 * @returns {object} - Merged food data from both sources
 */
const searchFood = async (query) => {
  try {
    // Validate input
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    console.log(`🔍 Searching for: "${query}"`);

    // Search BOTH databases in PARALLEL for speed
    const [indbResults, usdaResults] = await Promise.all([
      searchINDBFood(query),
      searchUSDAFood(query),
    ]);

    // Merge results: INDB first, then USDA
    const mergedData = [];

    // Add INDB results (Indian recipes - prioritized)
    if (indbResults.success && indbResults.data.length > 0) {
      console.log(`✅ Found ${indbResults.data.length} results in INDB (Indian Database)`);
      mergedData.push(...indbResults.data);
    }

    // Add USDA results (Global foods)
    if (usdaResults.success && usdaResults.data.length > 0) {
      console.log(`✅ Found ${usdaResults.data.length} results in USDA`);
      mergedData.push(...usdaResults.data);
    }

    // If nothing found in either database
    if (mergedData.length === 0) {
      throw new Error(`Food "${query}" not found in INDB or USDA databases`);
    }

    // Remove duplicates (same food from both sources)
    const uniqueFoods = removeDuplicates(mergedData);

    return {
      success: true,
      source: 'merged',
      count: uniqueFoods.length,
      data: uniqueFoods,
    };

  } catch (error) {
    console.error('❌ Food search error:', error.message);
    throw error;
  }
};

/**
 * Search INDB (Indian Database) in MongoDB
 * Searches local collection of 1000+ Indian recipes
 */
const searchINDBFood = async (query) => {
  try {
    console.log(`   📚 Searching INDB for: "${query}"`);

    // Case-insensitive search on name and alternate names
    const indbResults = await FoodDatabase.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { alternateNames: { $regex: query, $options: 'i' } },
      ],
    }).limit(10);

    if (indbResults.length === 0) {
      console.log(`   ⚠️ No INDB results found`);
      return { success: false, data: [] };
    }

    // Transform INDB data to standard format
    const foods = indbResults.map(food => ({
      name: food.name,
      servingSize: food.servingSize || 100,
      servingUnit: food.servingUnit || 'g',
      nutrition: {
        calories: food.nutrition?.calories || 0,
        protein: food.nutrition?.protein || 0,
        carbs: food.nutrition?.carbs || 0,
        fats: food.nutrition?.fats || 0,
        fiber: food.nutrition?.fiber || 0,
      },
      alternateNames: food.alternateNames || [],
      category: food.metadata?.category || 'other',
      region: food.metadata?.region || 'indian',
      source: 'indb',
      _id: food._id,
    }));

    return {
      success: true,
      source: 'indb',
      data: foods,
    };

  } catch (error) {
    console.error('❌ INDB search error:', error.message);
    return { success: false, data: [] };
  }
};

/**
 * Search USDA FoodData Central API
 * Queries USDA API for 400,000+ foods
 */
const searchUSDAFood = async (query) => {
  try {
    // Validate API key
    if (!USDA_API_KEY) {
      console.warn('⚠️ USDA_API_KEY not configured');
      return { success: false, data: [] };
    }

    console.log(`   🌐 Searching USDA for: "${query}"`);

    // Call USDA API
    const response = await axios.get(
      'https://api.nal.usda.gov/fdc/v1/foods/search',
      {
        params: {
          query: query,
          pageSize: 10,
          api_key: USDA_API_KEY,
        },
        timeout: 8000,
      }
    );

    // Check if results exist
    if (!response.data.foods || response.data.foods.length === 0) {
      console.log(`   ⚠️ No USDA results found`);
      return { success: false, data: [] };
    }

    // Transform USDA data to standard format
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
        fdcId: food.fdcId,
        _id: `usda_${food.fdcId}`,
      };
    });

    return {
      success: true,
      source: 'usda',
      data: foods,
    };

  } catch (error) {
    console.error('❌ USDA search error:', error.message);
    return { success: false, data: [] };
  }
};

/**
 * Remove duplicate foods from merged results
 * Compares by normalized name (case-insensitive)
 */
const removeDuplicates = (foods) => {
  const seen = new Map();
  const unique = [];

  for (const food of foods) {
    const normalizedName = food.name.toLowerCase().trim();
    
    // Keep first occurrence (INDB results appear first due to merge order)
    if (!seen.has(normalizedName)) {
      seen.set(normalizedName, true);
      unique.push(food);
    }
  }

  return unique;
};

/**
 * Helper: Extract nutrient value from USDA nutrients array
 */
const getNutrientValue = (nutrients, nutrientId) => {
  const nutrient = nutrients.find(
    (n) => n.nutrientId === nutrientId || n.nutrient?.id === nutrientId
  );
  return nutrient ? Math.round(nutrient.value) : 0;
};

module.exports = {
  searchFood,
};
