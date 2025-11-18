const FoodDatabase = require('../models/FoodDatabase');
const { recognizeFoodWithGemini } = require('./geminiService');

const CLARIFAI_PAT = process.env.CLARIFAI_API_KEY;

/**
 * Recognize food - Gemini Primary + Clarifai Fallback
 */
const recognizeFood = async (base64Image) => {
  let result = null;
  let source = 'gemini';

  console.log('🍽️ Starting food recognition with Gemini...');

  try {
    // Step 1: Try Gemini first (better for Indian food)
    console.log('  1️⃣ Trying Gemini Pro Vision...');
    result = await recognizeFoodWithGemini(base64Image);
    source = 'gemini';
    console.log(`  ✅ Gemini found: ${result.food_name} (${(result.confidence * 100).toFixed(0)}%)`);

    // If Gemini confidence is too low, try Clarifai as fallback
    if (result.confidence < 0.5 && CLARIFAI_PAT) {
      console.log('  ⚠️ Gemini confidence low, trying Clarifai fallback...');
      try {
        const clarifaiResult = await callClarifaiAPI(base64Image);
        console.log(`  ✅ Clarifai found: ${clarifaiResult.food_name} (${(clarifaiResult.confidence * 100).toFixed(0)}%)`);
        
        // Use Clarifai if confidence is higher
        if (clarifaiResult.confidence > result.confidence) {
          result = clarifaiResult;
          source = 'clarifai';
        }
      } catch (clarifaiError) {
        console.log('  ⚠️ Clarifai fallback failed, using Gemini result');
      }
    }

  } catch (geminiError) {
    console.log('  ❌ Gemini failed, trying Clarifai...');
    
    if (CLARIFAI_PAT) {
      try {
        result = await callClarifaiAPI(base64Image);
        source = 'clarifai';
        console.log(`  ✅ Clarifai found: ${result.food_name}`);
      } catch (clarifaiError) {
        console.error('  ❌ Both APIs failed');
        throw new Error('Food recognition failed');
      }
    } else {
      throw new Error('Gemini failed and Clarifai not configured');
    }
  }

  // Get nutrition data
  const nutrition = await getNutritionData(result.food_name);

  return {
    success: true,
    food_name: result.food_name,
    confidence: result.confidence,
    nutrition: nutrition,
    source: source,
    alternatives: result.alternatives || [],
  };
};

/**
 * Clarifai API (fallback only)
 */
const callClarifaiAPI = async (base64Image) => {
  if (!CLARIFAI_PAT) {
    throw new Error('Clarifai API key not configured');
  }

  const axios = require('axios');
  const base64Data = base64Image.includes(',')
    ? base64Image.split(',')[1]
    : base64Image;

  const response = await axios.post(
    'https://api.clarifai.com/v2/models/food-item-recognition/outputs',
    {
      user_app_id: {
        user_id: 'clarifai',
        app_id: 'main'
      },
      inputs: [{
        data: {
          image: { base64: base64Data }
        }
      }]
    },
    {
      headers: {
        'Authorization': `Key ${CLARIFAI_PAT}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );

  const concepts = response.data.outputs[0].data.concepts;
  const topFood = concepts[0];

  return {
    food_name: topFood.name.replace(/-/g, ' '),
    confidence: topFood.value,
    alternatives: concepts.slice(1, 4).map(c => ({
      name: c.name.replace(/-/g, ' '),
      confidence: c.value
    }))
  };
};

/**
 * Get nutrition data from MongoDB
 */
const getNutritionData = async (foodName) => {
  if (!foodName) return defaultNutrition();

  try {
    const exactMatch = await FoodDatabase.findOne({
      $text: { $search: `"${foodName}"` }
    });

    if (exactMatch) {
      return exactMatch.nutrition;
    }

    const regex = new RegExp(foodName, 'i');
    const partialMatch = await FoodDatabase.findOne({ name: regex });

    if (partialMatch) {
      return partialMatch.nutrition;
    }

    console.log(`⚠️ No nutrition data for: ${foodName}, using default`);
    return defaultNutrition();
  } catch (error) {
    console.error('Error getting nutrition:', error);
    return defaultNutrition();
  }
};

const defaultNutrition = () => ({
  calories: 150,
  protein: 5,
  carbs: 20,
  fats: 5,
  fiber: 2
});

module.exports = {
  recognizeFood,
};
