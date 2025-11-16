const axios = require('axios');
const FoodDatabase = require('../models/FoodDatabase'); // Mongoose model

// Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const CLARIFAI_PAT = process.env.CLARIFAI_API_KEY;
const CONFIDENCE_THRESHOLD = 0.7;

/**
 * Hybrid ML Recognition
 */
const recognizeFood = async (base64Image) => {
  let result = null;
  let source = 'clarifai';

  console.log('🔍 Using Clarifai API...');

  try {
    const clarifaiResult = await callClarifaiAPI(base64Image);
    result = clarifaiResult;
    source = 'clarifai';
  } catch (error) {
    console.error('❌ Clarifai failed:', error.message);
    return {
      success: false,
      error: 'Recognition failed',
      message: 'Could not recognize food. Please try again or enter manually.'
    };
  }

  // Get nutrition data asynchronously from MongoDB
  const nutrition = await getNutritionData(result.food_name);

  return {
    success: true,
    food_name: result.food_name,
    confidence: result.confidence,
    nutrition: nutrition,
    source: source,
    alternatives: result.alternatives || []
  };
};

/**
 * Call Clarifai API (fallback)
 */
const callClarifaiAPI = async (base64Image) => {
  if (!CLARIFAI_PAT) {
    throw new Error('Clarifai API key not configured');
  }

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

  // Normalize key
  const key = foodName.toLowerCase().replace(/[^a-z]/g, '');

  // Exact match using text index
  const exactMatch = await FoodDatabase.findOne({
    $text: { $search: `"${foodName}"` }
  });

  if (exactMatch) {
    return exactMatch.nutrition;
  }

  // Partial fallback search 
  const regex = new RegExp(key, 'i');
  const partialMatch = await FoodDatabase.findOne({ name: regex });

  if (partialMatch) {
    return partialMatch.nutrition;
  }

  console.log(`⚠️ No nutrition data for: ${foodName}, using default`);

  return defaultNutrition();
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
  getNutritionData
};
