const axios = require('axios');

// Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const CLARIFAI_PAT = process.env.CLARIFAI_API_KEY;
const CONFIDENCE_THRESHOLD = 0.70;

// Import nutrition database
const NUTRITION_DATABASE = require('../data/nutritionDatabase');

/**
 * Hybrid ML Recognition
 */
const recognizeFood = async (base64Image) => {
  let result = null;
  let source = 'clarifai';

  // Skip self-hosted, go directly to Clarifai
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

  // Get nutrition data
  const nutrition = getNutritionData(result.food_name);

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
 * Call self-hosted ML model (will fail if not running)
 */
const callSelfHostedModel = async (base64Image) => {
  const response = await axios.post(
    `${ML_SERVICE_URL}/predict`,
    { image: base64Image },
    { timeout: 10000 }
  );

  return {
    food_name: response.data.food_name,
    confidence: response.data.confidence,
    alternatives: response.data.alternatives || []
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
    food_name: topFood.name.replace(/-/g, ' '), // Clean up name
    confidence: topFood.value,
    alternatives: concepts.slice(1, 4).map(c => ({
      name: c.name.replace(/-/g, ' '),
      confidence: c.value
    }))
  };
};

/**
 * Get nutrition data from database
 */
const getNutritionData = (foodName) => {
  const key = foodName.toLowerCase().replace(/[^a-z]/g, '');
  
  // Try exact match
  if (NUTRITION_DATABASE[key]) {
    return NUTRITION_DATABASE[key];
  }

  // Try partial match
  for (const dbKey in NUTRITION_DATABASE) {
    if (key.includes(dbKey) || dbKey.includes(key)) {
      return NUTRITION_DATABASE[dbKey];
    }
  }

  // Default fallback
  console.log(`⚠️ No nutrition data for: ${foodName}, using default`);
  return {
    calories: 150,
    protein: 5,
    carbs: 20,
    fats: 5,
    fiber: 2
  };
};

module.exports = {
  recognizeFood,
  getNutritionData
};
