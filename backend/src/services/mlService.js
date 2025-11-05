const axios = require('axios');

// Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const CLARIFAI_PAT = process.env.CLARIFAI_API_KEY;
const CONFIDENCE_THRESHOLD = 0.70; // 70% threshold

// Nutrition database (500+ foods)
const NUTRITION_DATABASE = require('../data/nutritionDatabase');

/**
 * Hybrid ML Recognition
 * 1. Priority to self-hosted model first
 * 2. If confidence < 70%, fallback to Clarifai
 * 3. Return nutrition data
 */
const recognizeFood = async (base64Image) => {
  let result = null;
  let source = 'unknown';

  // STEP 1: Try self-hosted model
  try {
    console.log('Trying self-hosted ML model...');
    
    const selfHostedResult = await callSelfHostedModel(base64Image);
    
    if (selfHostedResult.confidence >= CONFIDENCE_THRESHOLD) {
      console.log(`✅ Self-hosted model confidence: ${(selfHostedResult.confidence * 100).toFixed(1)}%`);
      result = selfHostedResult;
      source = 'self_hosted';
    } else {
      console.log(`⚠️ Low confidence: ${(selfHostedResult.confidence * 100).toFixed(1)}% - trying Clarifai...`);
      throw new Error('Low confidence, trying fallback');
    }
  } catch (error) {
    console.log('Self-hosted model failed or low confidence, using Clarifai fallback...');
    
    // STEP 2: Fallback to Clarifai
    try {
      const clarifaiResult = await callClarifaiAPI(base64Image);
      result = clarifaiResult;
      source = 'clarifai';
    } catch (clarifaiError) {
      console.error('❌ Both ML services failed');
      return {
        success: false,
        error: 'Could not recognize food',
        message: 'Please try again or enter manually'
      };
    }
  }

  // STEP 3: Get nutrition data
  const nutrition = getNutritionData(result.food_name);

  return {
    success: true,
    food_name: result.food_name,
    confidence: result.confidence,
    nutrition: nutrition,
    source: source, // 'self_hosted' or 'clarifai'
    alternatives: result.alternatives || []
  };
};

/**
 * Call self-hosted ML model (Python Flask)
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
      }
    }
  );

  const concepts = response.data.outputs[0].data.concepts;
  const topFood = concepts[0];

  return {
    food_name: topFood.name,
    confidence: topFood.value,
    alternatives: concepts.slice(1, 4).map(c => ({
      name: c.name,
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
  return NUTRITION_DATABASE['default'];
};

module.exports = {
  recognizeFood,
  getNutritionData
};
