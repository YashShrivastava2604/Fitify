import api from './api';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Prepare image for ML
 */
const prepareImage = async (uri) => {
  const manipResult = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  return `data:image/jpeg;base64,${manipResult.base64}`;
};

/**
 * Recognize food (hybrid ML)
 */
export const recognizeFood = async (imageUri) => {
  try {
    console.log('🔍 Preparing image...');
    const base64Image = await prepareImage(imageUri);
    
    console.log('📡 Calling ML service...');
    const response = await api.post('/api/ml/recognize', {
      image: base64Image
    });
    console.log('📦 Full response:', response);
    console.log('📦 Response.data:', response.data);

    return response.data;
    // return response;
  } catch (error) {
    console.error('ML Service Error:', error);
    throw error;
  }
};

export default {
  recognizeFood
};