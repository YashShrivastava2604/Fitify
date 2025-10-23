import * as SecureStore from 'expo-secure-store';

/**
 * Secure storage utilities using Expo SecureStore
 */

export const saveToken = async (key, value) => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

export const getToken = async (key) => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const deleteToken = async (key) => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('Error deleting token:', error);
  }
};

export const clearAll = async () => {
  try {
    // Clear all stored data
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};
