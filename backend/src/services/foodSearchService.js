const FoodDatabase = require('../models/FoodDatabase');
const axios = require('axios');

const USDA_API_KEY = process.env.USDA_API_KEY;

/**
 * Search food - INDB + USDA merged by RELEVANCE (not by source priority)
 * Results sorted by how well they match the search query
 * 
 * @param {string} query - Food name to search (e.g., "pav bhaji", "apple")
 * @returns {object} - Merged food data sorted by relevance
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

    // Combine results from both sources
    const allFoods = [];

    // Add INDB results
    if (indbResults.success && indbResults.data.length > 0) {
      console.log(`✅ Found ${indbResults.data.length} results in INDB`);
      allFoods.push(...indbResults.data);
    }

    // Add USDA results
    if (usdaResults.success && usdaResults.data.length > 0) {
      console.log(`✅ Found ${usdaResults.data.length} results in USDA`);
      allFoods.push(...usdaResults.data);
    }

    // If nothing found in either database
    if (allFoods.length === 0) {
      throw new Error(`Food "${query}" not found in INDB or USDA databases`);
    }

    // Remove duplicates (same food from both sources)
    const uniqueFoods = removeDuplicates(allFoods);

    // SORT BY RELEVANCE - THIS IS THE KEY FIX
    const sortedByRelevance = sortByRelevance(uniqueFoods, query);

    console.log(`📊 Total results (after dedup & sort): ${sortedByRelevance.length}`);

    return {
      success: true,
      source: 'merged',
      count: sortedByRelevance.length,
      data: sortedByRelevance,
    };

  } catch (error) {
    console.error('❌ Food search error:', error.message);
    throw error;
  }
};

/**
 * Sort foods by relevance to search query
 * Exact match > Starts with query > Contains query > Partial match
 */
const sortByRelevance = (foods, query) => {
  const queryLower = query.toLowerCase().trim();
  const queryWords = queryLower.split(' ');

  // Score each food based on how well it matches
  const scoredFoods = foods.map(food => {
    const nameLower = food.name.toLowerCase();
    let score = 0;

    // Exact match (highest priority) - score 1000
    if (nameLower === queryLower) {
      score = 1000;
    }
    // Exact match (ignoring case and punctuation) - score 900
    else if (
      nameLower.replace(/[^\w\s]/g, '') === queryLower.replace(/[^\w\s]/g, '')
    ) {
      score = 900;
    }
    // Starts with query - score 800
    else if (nameLower.startsWith(queryLower)) {
      score = 800;
    }
    // Contains query as whole word - score 600
    else if (new RegExp(`\\b${queryLower}\\b`).test(nameLower)) {
      score = 600;
    }
    // Starts with first word of query - score 400
    else if (queryWords.length > 0 && nameLower.startsWith(queryWords[0])) {
      score = 400;
    }
    // Contains first word of query - score 300
    else if (queryWords.length > 0 && nameLower.includes(queryWords[0])) {
      score = 300;
    }
    // Contains multiple words from query - score 200
    else if (queryWords.filter(word => nameLower.includes(word)).length > 0) {
      score = 200;
    }
    // Generic match - score 100
    else {
      score = 100;
    }

    // Bonus: INDB (Indian recipes) gets slight boost if it's an exact or high-confidence match
    // This way Indian recipes appear first when it's actually what user wants
    if (food.source === 'indb' && score >= 600) {
      score += 50;
    }

    return {
      ...food,
      relevanceScore: score,
    };
  });

  // Sort by relevance score (highest first)
  const sorted = scoredFoods.sort((a, b) => {
    // Sort by score descending
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    // If same score, prioritize INDB (Indian recipes)
    if (a.source === 'indb' && b.source !== 'indb') return -1;
    if (b.source === 'indb' && a.source !== 'indb') return 1;
    // Otherwise keep original order
    return 0;
  });

  // Remove relevanceScore before returning (clean response)
  return sorted.map(({ relevanceScore, ...rest }) => rest);
};

/**
 * Search INDB (Indian Database) in MongoDB
 */
const searchINDBFood = async (query) => {
  try {
    console.log(`   📚 Searching INDB for: "${query}"`);

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
 */
const searchUSDAFood = async (query) => {
  try {
    if (!USDA_API_KEY) {
      console.warn('⚠️ USDA_API_KEY not configured');
      return { success: false, data: [] };
    }

    console.log(`   🌐 Searching USDA for: "${query}"`);

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

    if (!response.data.foods || response.data.foods.length === 0) {
      console.log(`   ⚠️ No USDA results found`);
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
 */
const removeDuplicates = (foods) => {
  const seen = new Map();
  const unique = [];

  for (const food of foods) {
    const normalizedName = food.name.toLowerCase().trim();
    
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
