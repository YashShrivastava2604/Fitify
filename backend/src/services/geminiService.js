const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY not configured');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Recognize food using Gemini Pro Vision
 * Much better at Indian food recognition than Clarifai
 */
const recognizeFoodWithGemini = async (base64Image) => {
  try {
    console.log('🔍 Gemini: Analyzing food image...');

    // Remove data URI prefix if present
    const base64Data = base64Image.includes(',')
      ? base64Image.split(',')[1]
      : base64Image;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    const prompt = `You are an expert food recognition AI. Analyze this food image and provide:

1. **Food Name**: The exact name of the dish (including Indian names if applicable)
2. **Type**: Category (e.g., curry, bread, rice, dessert, etc.)
3. **Confidence**: How confident you are (0-1)
4. **Ingredients**: List main ingredients you can see
5. **Alternatives**: 2-3 other possible dishes if uncertain

Format your response as JSON with this exact structure:
{
  "food_name": "exact dish name",
  "type": "category",
  "confidence": 0.95,
  "ingredients": ["ingredient1", "ingredient2"],
  "alternatives": [
    {"name": "alternative1", "confidence": 0.3},
    {"name": "alternative2", "confidence": 0.2}
  ]
}

Be specific about Indian dishes - if it looks like pav bhaji, dal, idli, dosa, biryani, etc., identify it correctly.`;

    const response = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg',
        },
      },
      prompt,
    ]);

    const result = await response.response;
    const text = result.text();

    console.log('📝 Gemini raw response:', text);

    // Parse JSON from response
    let parsedData;
    try {
      // Extract JSON from response (Gemini sometimes adds extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response:', parseError);
      // Fallback: extract food name from text
      console.log('📌 Attempting fallback parsing...');
      parsedData = extractFoodFromText(text);
    }

    console.log('✅ Gemini recognized:', parsedData.food_name);

    return {
      food_name: parsedData.food_name || 'Unknown Food',
      confidence: parsedData.confidence || 0.7,
      type: parsedData.type || 'unknown',
      ingredients: parsedData.ingredients || [],
      alternatives: parsedData.alternatives || [],
      source: 'gemini',
    };

  } catch (error) {
    console.error('❌ Gemini error:', error.message);
    throw error;
  }
};

/**
 * Fallback: Extract food name from text if JSON parsing fails
 */
const extractFoodFromText = (text) => {
  const lowerText = text.toLowerCase();

  // Indian food keywords
  const indianFoods = {
    'pav bhaji': ['pav', 'bhaji', 'pav bhaji'],
    'dal': ['dal', 'lentil', 'dhal'],
    'idli': ['idli', 'idly'],
    'dosa': ['dosa', 'dosai'],
    'sambar': ['sambar'],
    'biryani': ['biryani', 'dum biryani'],
    'paneer': ['paneer', 'cottage cheese'],
    'tikka': ['tikka'],
    'naan': ['naan', 'nan'],
    'roti': ['roti', 'chapati'],
    'curry': ['curry', 'masala'],
    'samosa': ['samosa'],
    'dosa': ['dosa'],
    'rice': ['rice', 'basmati'],
  };

  // Find matching food
  for (const [food, keywords] of Object.entries(indianFoods)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return {
        food_name: food,
        confidence: 0.6,
        type: 'unknown',
        ingredients: [],
        alternatives: [],
      };
    }
  }

  // Generic extraction
  if (lowerText.includes('bread')) return { food_name: 'Bread', confidence: 0.5, type: 'bread', ingredients: [], alternatives: [] };
  if (lowerText.includes('rice')) return { food_name: 'Rice', confidence: 0.5, type: 'rice', ingredients: [], alternatives: [] };
  if (lowerText.includes('curry')) return { food_name: 'Curry', confidence: 0.5, type: 'curry', ingredients: [], alternatives: [] };

  return {
    food_name: 'Unknown Food',
    confidence: 0.1,
    type: 'unknown',
    ingredients: [],
    alternatives: [],
  };
};

module.exports = {
  recognizeFoodWithGemini,
};
