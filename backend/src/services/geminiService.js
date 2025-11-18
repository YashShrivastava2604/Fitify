const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY not configured');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Recognize food using Gemini 2.5 Flash - WITH NUTRITION DATA
 */
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

CRITICAL INSTRUCTIONS:
1. If thali/multi-dish: set "is_multi_dish": true and list ALL dishes
2. If single dish: set "is_multi_dish": false with one dish
3. Each dish MUST have accurate nutrition per 100g (or per piece for bread/dessert)
4. Use proper Indian dish names (paneer butter masala, dal makhani, jeera rice, garlic naan, etc.)
5. default_serving_size: typical serving in grams (bread=60g, rice=150g, curry=100g, dal=150g, dessert=50g)
6. Nutrition MUST be accurate for Indian food - use your knowledge of typical recipes
7. confidence: 0.7-0.99 based on image clarity
8. RESPOND WITH ONLY JSON - NO MARKDOWN, NO CODE BLOCKS, NO BACKTICKS
`;

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
    let text = await response.text(); // MUST await

    console.log('📝 Gemini raw response (first 500 chars):', (text || '').substring(0, 500));

    // Normalize
    text = (text || '').trim();

    // -------------------------------------
    // 💥 STEP 1 — Extract JSON from code blocks if present
    // -------------------------------------
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced && fenced[1]) {
      text = fenced[1].trim();
    } else {
      // -------------------------------------
      // 💥 STEP 2 — Extract first JSON-like block {...}
      // -------------------------------------
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0].trim();
      }
    }

    console.log('🧹 Cleaned text (first 300 chars):', (text || '').substring(0, 300));

    // -------------------------------------
    // 💥 STEP 3 — Parse JSON
    // -------------------------------------
    let parsedData;

    try {
      parsedData = JSON.parse(text);
      console.log('✅ JSON parsed successfully');
    } catch (err) {
      console.error('❌ JSON parse error:', err.message);
      console.log('📄 Raw (first 1000 chars):', (text || '').substring(0, 1000));
      throw new Error(`Gemini returned invalid JSON: ${err.message}`);
    }

    // -------------------------------------
    // 💥 STEP 4 — Validate structure
    // -------------------------------------
    if (!parsedData.dishes || !Array.isArray(parsedData.dishes)) {
      throw new Error('Invalid response: dishes[] missing');
    }

    // -------------------------------------
    // 💥 STEP 5 — Normalize dishes
    // -------------------------------------
    parsedData.dishes = parsedData.dishes.map((dish) => {
      if (!dish.nutrition) {
        console.warn(`⚠️ Dish "${dish?.name}" missing nutrition, using defaults`);
        dish.nutrition = {
          calories: 150,
          protein: 5,
          carbs: 20,
          fats: 5,
          fiber: 2,
        };
      }

      return {
        name: dish.name || 'Unknown Food',
        type: dish.type || 'unknown',
        confidence: Math.min(Math.max(Number(dish.confidence) || 0.7, 0), 1),
        default_serving_size: dish.default_serving_size || 100,
        nutrition: {
          calories: Number(dish.nutrition.calories) || 150,
          protein: Number(dish.nutrition.protein) || 5,
          carbs: Number(dish.nutrition.carbs) || 20,
          fats: Number(dish.nutrition.fats) || 5,
          fiber: Number(dish.nutrition.fiber) || 2,
        },
      };
    });

    // -------------------------------------
    // 💥 STEP 6 — Log summary
    // -------------------------------------
    console.log(
      '✅ Gemini recognized:',
      parsedData.is_multi_dish
        ? `${parsedData.dishes.length} dishes (${parsedData.platter_type || 'multi-dish'})`
        : parsedData.dishes[0].name
    );

    parsedData.dishes.forEach((dish, idx) => {
      console.log(`  ${idx + 1}. ${dish.name} - ${dish.nutrition.calories} cal (${dish.default_serving_size}g)`);
    });

    // -------------------------------------
    // 💥 STEP 7 — Return sanitized result
    // -------------------------------------
    return {
      is_multi_dish: !!parsedData.is_multi_dish,
      dishes: parsedData.dishes,
      overall_confidence: parsedData.overall_confidence || 0.7,
      platter_type: parsedData.platter_type || null,
      source: 'gemini-2.5',
    };
  } catch (error) {
    console.error('❌ Gemini error:', error?.message || error);
    console.error('Full error:', error);
    throw error;
  }
};

module.exports = {
  recognizeFoodWithGemini,
};
