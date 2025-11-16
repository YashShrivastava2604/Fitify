// frontend/src/services/foodSearchService.js
import api from './api';

export const searchFood = async (query) => {
  try {
    const response = await api.get(`/api/food/search?query=${encodeURIComponent(query)}`);
    return response.data.data;  // { name, servingSize, servingUnit, nutrition }
  } catch (error) {
    console.error('Food search error:', error);
    throw error;
  }
};

export default {
  searchFood
};