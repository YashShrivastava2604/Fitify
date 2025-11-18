const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY not configured');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const recognizeFoodWithGemini = async (base64Image) => {
  try {
    console.log('🔍 Gemini 2.5 Flash: Analyzing food image...');

    const base64Data = base64Image.includes(',')
      ? base64Image.split(',')[1]
      : base64Image;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an expert food recognition and nutrition AI specialized in Indian cuisine.

Analyze this food image. If it contains MULTIPLE DISHES (like a thali), list each dish separately with nutrition. If it's a SINGLE DISH, return one item.

Respond with ONLY a valid JSON object (no markdown, no code blocks, no extra text):

{
  "is_multi_dish": true,
  "dishes": [
    {
      "name": "Paneer Butter Masala",
      "type": "curry",
      "confidence": 0.9,
      "default_serving_size": 100,
      "nutrition": {
        "calories": 250,
        "protein": 12,
        "carbs": 15,
        "fats": 18,
        "fiber": 3
      }
    }
  ],
  "overall_confidence": 0.92,
  "platter_type": "North Indian Thali"
}

CRITICAL: RESPOND WITH ONLY JSON - NO MARKDOWN, NO CODE BLOCKS, NO BACKTICKS`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg',
        },
      },
      prompt,
    ]);

    const response = await result.response;
    let text = response.text().trim();

    console.log('📝 Gemini raw response:', text.substring(0, 500));

    // Remove markdown code blocks - PROPER WAY
    const codeBlockPattern = /^``````$/;
    const match = text.match(codeBlockPattern);
    
    if (match) {
      text = match[1].trim();
      console.log('🧹 Removed code block wrapper');
    }

    console.log('🧹 Cleaned text:', text.substring(0, 300));

    // Parse JSON
    let parsedData;
    try {
      parsedData = JSON.parse(text);
      console.log('✅ JSON parsed successfully');
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError.message);
      
      // Last resort: extract JSON object
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('🔄 Extracting JSON object...');
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        console.error('📄 Failed text:', text);
        throw new Error('No valid JSON found in response');
      }
    }

    // Validate
    if (!parsedData.dishes || !Array.isArray(parsedData.dishes)) {
      throw new Error('Invalid dishes array');
    }

    // Normalize dishes
    parsedData.dishes = parsedData.dishes.map(dish => ({
      name: dish.name || 'Unknown Food',
      type: dish.type || 'unknown',
      confidence: Math.min(Math.max(dish.confidence || 0.7, 0), 1),
      default_serving_size: dish.default_serving_size || 100,
      nutrition: {
        calories: dish.nutrition?.calories || 150,
        protein: dish.nutrition?.protein || 5,
        carbs: dish.nutrition?.carbs || 20,
        fats: dish.nutrition?.fats || 5,
        fiber: dish.nutrition?.fiber || 2
      }
    }));

    console.log('✅ Recognized:', 
      parsedData.is_multi_dish 
        ? `${parsedData.dishes.length} dishes`
        : parsedData.dishes[0].name
    );

    return {
      is_multi_dish: parsedData.is_multi_dish || false,
      dishes: parsedData.dishes,
      overall_confidence: parsedData.overall_confidence || 0.7,
      platter_type: parsedData.platter_type,
      source: 'gemini-2.5',
    };

  } catch (error) {
    console.error('❌ Gemini error:', error.message);
    throw error;
  }
};

module.exports = {
  recognizeFoodWithGemini,
};
