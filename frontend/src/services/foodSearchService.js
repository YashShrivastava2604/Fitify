import api from './api';

/**
 * Search for food in backend database
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of food items
 */
export const searchFood = async (query) => {
  try {
    const response = await api.get(`/api/food/search?query=${encodeURIComponent(query)}`);
    return response.data.data; // Array of foods
  } catch (error) {
    console.error('Food search error:', error);
    throw error;
  }
};

export default {
  searchFood
};
