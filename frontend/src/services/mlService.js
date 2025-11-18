import api from './api';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Prepare image for ML
 * Resizes to 800px width and compresses
 */
const prepareImage = async (uri) => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { 
        compress: 0.7, 
        format: ImageManipulator.SaveFormat.JPEG, 
        base64: true 
      }
    );

    return `data:image/jpeg;base64,${manipResult.base64}`;
  } catch (error) {
    console.error('❌ Image preparation error:', error);
    throw new Error('Failed to prepare image for recognition');
  }
};

/**
 * Recognize food from image using Gemini (with nutrition)
 * @param {string} imageUri - Local image URI
 * @returns {Promise<Object>} - Food recognition result with nutrition
 */
export const recognizeFood = async (imageUri) => {
  try {
    console.log('🔍 Preparing image...');
    const base64Image = await prepareImage(imageUri);
    
    console.log('📡 Calling ML service...');
    const response = await api.post('/api/ml/recognize', {
      image: base64Image
    });
    
    console.log('✅ ML Response:', JSON.stringify(response.data, null, 2));

    // Validate response structure
    if (!response.data || !response.data.success) {
      throw new Error('Invalid response from ML service');
    }

    // Validate data exists
    if (!response.data.data) {
      throw new Error('No recognition data in response');
    }

    const result = response.data.data;

    // Validate required fields for multi-dish
    if (!result.dishes || !Array.isArray(result.dishes) || result.dishes.length === 0) {
      throw new Error('No dishes recognized');
    }

    // Validate each dish has nutrition
    result.dishes.forEach(dish => {
      if (!dish.nutrition) {
        throw new Error(`Dish "${dish.name}" missing nutrition data`);
      }
    });

    console.log(`✅ Recognized: ${result.is_multi_dish ? `${result.dishes.length} dishes` : result.dishes[0].name}`);

    // Return the data object (unwrapped)
    return result;

  } catch (error) {
    console.error('❌ ML Service Error:', error);
    
    // Re-throw with user-friendly message
    if (error.response) {
      const errorMsg = error.response.data?.message || error.response.data?.error || 'Recognition failed';
      throw new Error(errorMsg);
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to recognize food. Please try again.');
    }
  }
};

/**
 * Search dishes from database (for manual add)
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Search results
 */
export const searchDishes = async (query) => {
  try {
    if (!query || query.length < 2) {
      return [];
    }

    console.log(`🔍 Searching dishes: "${query}"`);

    const response = await api.get(`/api/ml/search?q=${encodeURIComponent(query)}`);

    if (!response.data || !response.data.data) {
      return [];
    }

    console.log(`✅ Found ${response.data.data.length} results`);

    return response.data.data;

  } catch (error) {
    console.error('❌ Search dishes error:', error);
    
    // Don't throw - just return empty array
    return [];
  }
};

export default {
  recognizeFood,
  searchDishes,
};
