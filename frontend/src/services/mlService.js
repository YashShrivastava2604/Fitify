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
 * Recognize food from image using Clarifai
 * @param {string} imageUri - Local image URI
 * @returns {Promise<Object>} - Food recognition result
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

    // Validate required fields
    if (!result.food_name || !result.nutrition) {
      throw new Error('Incomplete recognition data');
    }

    console.log(`✅ Recognized: ${result.food_name} (confidence: ${Math.round(result.confidence * 100)}%)`);

    // Return ONLY the data object (unwrapped)
    return result;

  } catch (error) {
    console.error('❌ ML Service Error:', error);
    
    // Re-throw with user-friendly message
    if (error.response) {
      throw new Error(error.response.data?.error || 'Recognition failed');
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to recognize food. Please try again.');
    }
  }
};

export default {
  recognizeFood
};
