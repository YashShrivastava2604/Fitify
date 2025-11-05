import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMealsStore } from '../../stores/mealsStore';
import Loading from '../../components/common/Loading';
import COLORS from '../../constants/colors';

// Sample food database
const FOOD_DATABASE = [
  { name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fats: 0.2 },
  { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fats: 0.3 },
  { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  { name: 'Rice', calories: 130, protein: 2.7, carbs: 28, fats: 0.3 },
  { name: 'Paneer Tikka', calories: 220, protein: 14, carbs: 8, fats: 15 },
  { name: 'Dal Makhani', calories: 150, protein: 7, carbs: 18, fats: 5 },
  { name: 'Biryani', calories: 200, protein: 7, carbs: 35, fats: 4 },
  { name: 'Roti', calories: 80, protein: 3, carbs: 15, fats: 1 },
  { name: 'Naan', calories: 260, protein: 9, carbs: 45, fats: 5 },
  { name: 'Pizza', calories: 266, protein: 11, carbs: 33, fats: 10 },
  { name: 'Burger', calories: 295, protein: 17, carbs: 28, fats: 14 },
  { name: 'Pasta', calories: 131, protein: 5, carbs: 25, fats: 1 },
  { name: 'Salad', calories: 15, protein: 1.4, carbs: 2.9, fats: 0.2 },
  { name: 'Egg', calories: 155, protein: 13, carbs: 1.1, fats: 11 },
];

const SearchScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [filteredFoods, setFilteredFoods] = useState(FOOD_DATABASE);
  const [selectedFood, setSelectedFood] = useState(null);
  const [servingSize, setServingSize] = useState(100);
  const [mealType, setMealType] = useState('lunch');
  const { logMeal, isLoading } = useMealsStore();

  useEffect(() => {
    filterFoods(searchText);
  }, [searchText]);

  const filterFoods = (text) => {
    if (!text) {
      setFilteredFoods(FOOD_DATABASE);
      return;
    }

    const filtered = FOOD_DATABASE.filter(food =>
      food.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredFoods(filtered);
  };

  const selectFood = (food) => {
    setSelectedFood(food);
    setServingSize(100);
  };

  const adjustServing = (amount) => {
    const newSize = Math.max(10, Math.min(1000, servingSize + amount));
    setServingSize(newSize);
  };

  const saveMeal = async () => {
    if (!selectedFood) {
      Alert.alert('Error', 'Please select a food item');
      return;
    }

    try {
      const adjustedNutrition = {
        calories: Math.round((selectedFood.calories * servingSize) / 100),
        protein: Math.round((selectedFood.protein * servingSize) / 100),
        carbs: Math.round((selectedFood.carbs * servingSize) / 100),
        fats: Math.round((selectedFood.fats * servingSize) / 100),
      };

      await logMeal({
        foodName: selectedFood.name,
        nutrition: adjustedNutrition,
        mealType,
        servingSize,
        source: 'manual'
      });

      Alert.alert('Success', 'Meal added to diary!', [
        {
          text: 'Add Another',
          onPress: () => {
            setSelectedFood(null);
            setSearchText('');
          }
        },
        {
          text: 'View Diary',
          onPress: () => navigation.navigate('Diary')
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save meal');
    }
  };

  if (selectedFood) {
    const adjustedNutrition = {
      calories: Math.round((selectedFood.calories * servingSize) / 100),
      protein: Math.round((selectedFood.protein * servingSize) / 100),
      carbs: Math.round((selectedFood.carbs * servingSize) / 100),
      fats: Math.round((selectedFood.fats * servingSize) / 100),
    };

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSelectedFood(null)}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Meal</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Selected Food */}
          <View style={styles.card}>
            <Text style={styles.foodNameLarge}>{selectedFood.name}</Text>

            <View style={styles.nutritionGrid}>
              <NutritionBox
                label="Calories"
                value={adjustedNutrition.calories}
                unit="cal"
              />
              <NutritionBox
                label="Protein"
                value={adjustedNutrition.protein}
                unit="g"
              />
              <NutritionBox
                label="Carbs"
                value={adjustedNutrition.carbs}
                unit="g"
              />
              <NutritionBox
                label="Fats"
                value={adjustedNutrition.fats}
                unit="g"
              />
            </View>
          </View>

          {/* Serving Size */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Serving Size</Text>

            <View style={styles.servingControls}>
              <TouchableOpacity 
                style={styles.servingButton}
                onPress={() => adjustServing(-25)}
              >
                <Ionicons name="remove" size={24} color={COLORS.primary} />
              </TouchableOpacity>

              <View style={styles.servingDisplay}>
                <Text style={styles.servingText}>{servingSize}g</Text>
              </View>

              <TouchableOpacity 
                style={styles.servingButton}
                onPress={() => adjustServing(25)}
              >
                <Ionicons name="add" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.quickSizes}>
              {[50, 100, 150, 200].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.quickButton,
                    servingSize === size && styles.quickButtonActive
                  ]}
                  onPress={() => setServingSize(size)}
                >
                  <Text style={[
                    styles.quickButtonText,
                    servingSize === size && styles.quickButtonTextActive
                  ]}>
                    {size}g
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Meal Type */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Meal Type</Text>

            <View style={styles.mealTypes}>
              {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.mealTypeButton,
                    mealType === type && styles.mealTypeButtonActive
                  ]}
                  onPress={() => setMealType(type)}
                >
                  <Text style={[
                    styles.mealTypeText,
                    mealType === type && styles.mealTypeTextActive
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={saveMeal}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Add to Diary'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search foods..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={COLORS.textLight}
        />
        {searchText && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Food List */}
      <FlatList
        data={filteredFoods}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.foodItem}
            onPress={() => selectFood(item)}
          >
            <View style={styles.foodItemContent}>
              <Text style={styles.foodItemName}>{item.name}</Text>
              <View style={styles.nutritionInfo}>
                <Text style={styles.nutritionTag}>{item.calories} cal</Text>
                <Text style={styles.nutritionTag}>{item.protein}g P</Text>
                <Text style={styles.nutritionTag}>{item.carbs}g C</Text>
                <Text style={styles.nutritionTag}>{item.fats}g F</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No foods found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const NutritionBox = ({ label, value, unit }) => (
  <View style={styles.nutritionBox}>
    <Text style={styles.nutritionBoxValue}>{value}</Text>
    <Text style={styles.nutritionBoxLabel}>{label}</Text>
    <Text style={styles.nutritionBoxUnit}>{unit}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundGray,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 15,
    color: COLORS.text,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  foodItemContent: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  nutritionInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  nutritionTag: {
    fontSize: 12,
    backgroundColor: COLORS.backgroundGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    color: COLORS.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  foodNameLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionBox: {
    width: '48%',
    backgroundColor: COLORS.backgroundGray,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  nutritionBoxValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  nutritionBoxLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  nutritionBoxUnit: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  servingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  servingButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingDisplay: {
    marginHorizontal: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.backgroundGray,
    borderRadius: 12,
  },
  servingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  quickSizes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  quickButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  mealTypes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mealTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  mealTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  mealTypeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  mealTypeTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SearchScreen;
