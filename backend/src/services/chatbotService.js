const axios = require('axios');

// Groq API (FREE - 14,400 requests/day)
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Hugging Face (Backup - FREE)
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_API_URL = 'https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct';

/**
 * Get nutritional advice using AI chatbot
 */
const getChatbotResponse = async (userMessage, context = {}) => {
  try {
    // Try Groq first (fastest)
    if (GROQ_API_KEY) {
      return await callGroqAPI(userMessage, context);
    }
    
    // Fallback to Hugging Face
    if (HF_API_KEY) {
      return await callHuggingFaceAPI(userMessage, context);
    }

    // No API keys configured
    return getFallbackResponse(userMessage);
  } catch (error) {
    console.log('Groq failed, trying fallback...');
    
    try {
      if (HF_API_KEY) {
        return await callHuggingFaceAPI(userMessage, context);
      }
    } catch (hfError) {
      console.error('Both chatbot APIs failed');
    }
    
    return getFallbackResponse(userMessage);
  }
};

/**
 * Call Groq API (Llama 3.1 - FREE & FAST)
 */
const callGroqAPI = async (userMessage, context) => {
  const systemPrompt = `You are a helpful nutrition assistant for FitiFy app.
User's profile:
- Goal: ${context.goal || 'maintain weight'}
- Daily calorie target: ${context.dailyCalorieTarget || 2000} cal
- Current weight: ${context.currentWeight || 'unknown'} kg

Provide concise, accurate nutritional advice. Keep responses under 150 words.`;

  const response = await axios.post(
    GROQ_API_URL,
    {
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 200
    },
    {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }
  );

  return {
    success: true,
    message: response.data.choices[0].message.content,
    source: 'groq'
  };
};

/**
 * Call Hugging Face API (Backup)
 */
const callHuggingFaceAPI = async (userMessage, context) => {
  const prompt = `Question: ${userMessage}\n\nProvide a brief nutrition answer (max 100 words):`;

  const response = await axios.post(
    HF_API_URL,
    { inputs: prompt },
    {
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );

  return {
    success: true,
    message: response.data[0].generated_text,
    source: 'huggingface'
  };
};

/**
 * Fallback responses when APIs are unavailable
 */
const getFallbackResponse = (userMessage) => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Simple pattern matching for common questions
  if (lowerMessage.includes('calorie') || lowerMessage.includes('calories')) {
    return {
      success: true,
      message: "Calories are units of energy from food. Your daily needs depend on age, weight, height, and activity level. Generally, adults need 1,800-2,500 calories per day. Track your intake to meet your goals!",
      source: 'fallback'
    };
  }
  
  if (lowerMessage.includes('protein')) {
    return {
      success: true,
      message: "Protein is essential for muscle building and repair. Aim for 0.8-1g per kg of body weight daily. Good sources include chicken, fish, eggs, tofu, and legumes.",
      source: 'fallback'
    };
  }
  
  if (lowerMessage.includes('weight loss') || lowerMessage.includes('lose weight')) {
    return {
      success: true,
      message: "For healthy weight loss, create a calorie deficit of 300-500 calories per day. Combine balanced nutrition with regular exercise. Aim for 0.5-1kg loss per week.",
      source: 'fallback'
    };
  }
  
  if (lowerMessage.includes('carbs') || lowerMessage.includes('carbohydrate')) {
    return {
      success: true,
      message: "Carbs are your body's main energy source. Choose complex carbs like whole grains, vegetables, and fruits over simple sugars for sustained energy.",
      source: 'fallback'
    };
  }
  
  // Default response
  return {
    success: true,
    message: "I'm here to help with nutrition questions! Try asking about calories, protein, carbs, fats, weight loss, or specific foods. For detailed advice, please consult a nutritionist.",
    source: 'fallback'
  };
};

module.exports = {
  getChatbotResponse
};
