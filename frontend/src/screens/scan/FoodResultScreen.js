import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import COLORS from '../../constants/colors';
import { useMealsStore } from '../../stores/mealsStore';
import { searchDishes } from '../../services/mlService';

const FoodResultScreen = ({ route, navigation }) => {
  const { result, imageUri } = route.params;
  const { logMeal } = useMealsStore();

  // State for dishes
  const [dishes, setDishes] = useState(
    result.dishes.map((dish, index) => ({
      id: `${index}-${Date.now()}`,
      name: dish.name,
      type: dish.type,
      confidence: dish.confidence,
      servingSize: dish.default_serving_size || 100,
      nutrition: dish.nutrition,
    }))
  );

  // Search modal state
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Safety check
  React.useEffect(() => {
    if (!result || !result.dishes || result.dishes.length === 0) {
      Alert.alert('Error', 'No food data available', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  }, [result]);

  if (!result || !result.dishes || dishes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate total nutrition
  const calculateTotalNutrition = () => {
    return dishes.reduce((total, dish) => {
      const multiplier = dish.servingSize / 100;
      return {
        calories: total.calories + Math.round(dish.nutrition.calories * multiplier),
        protein: total.protein + Math.round(dish.nutrition.protein * multiplier),
        carbs: total.carbs + Math.round(dish.nutrition.carbs * multiplier),
        fats: total.fats + Math.round(dish.nutrition.fats * multiplier),
      };
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
  };

  const totalNutrition = calculateTotalNutrition();

  // Adjust serving size for a dish
  const adjustServing = (dishId, amount) => {
    setDishes(dishes.map(dish => {
      if (dish.id === dishId) {
        const newSize = Math.max(10, Math.min(1000, dish.servingSize + amount));
        return { ...dish, servingSize: newSize };
      }
      return dish;
    }));
  };

  // Delete dish
  const deleteDish = (dishId) => {
    if (dishes.length === 1) {
      Alert.alert('Cannot Delete', 'At least one dish is required');
      return;
    }

    Alert.alert(
      'Delete Dish',
      'Remove this dish from the list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDishes(dishes.filter(d => d.id !== dishId));
          }
        }
      ]
    );
  };

  // Search dishes
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchDishes(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search dishes');
    } finally {
      setIsSearching(false);
    }
  };

  // Add dish from search
  const addDish = (searchResult) => {
    const newDish = {
      id: `${dishes.length}-${Date.now()}`,
      name: searchResult.name,
      type: 'added',
      confidence: 1.0,
      servingSize: 100,
      nutrition: searchResult.nutrition,
    };

    setDishes([...dishes, newDish]);
    setSearchModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Save all dishes
  const handleSaveMeal = () => {
    Alert.alert(
      'Add to Diary',
      'Which meal type?',
      [
        { text: 'Breakfast', onPress: () => saveMeal('breakfast') },
        { text: 'Lunch', onPress: () => saveMeal('lunch') },
        { text: 'Dinner', onPress: () => saveMeal('dinner') },
        { text: 'Snack', onPress: () => saveMeal('snack') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const saveMeal = async (mealType) => {
    try {
      // Save each dish separately
      for (const dish of dishes) {
        const multiplier = dish.servingSize / 100;
        const adjustedNutrition = {
          calories: Math.round(dish.nutrition.calories * multiplier),
          protein: Math.round(dish.nutrition.protein * multiplier),
          carbs: Math.round(dish.nutrition.carbs * multiplier),
          fats: Math.round(dish.nutrition.fats * multiplier),
        };

        await logMeal({
          foodName: dish.name,
          nutrition: adjustedNutrition,
          mealType: mealType,
          servingSize: dish.servingSize,
          imageUrl: imageUri,
          source: 'scan',
          mlConfidence: dish.confidence,
          mlSource: result.source,
        });
      }

      Alert.alert('Success', `${dishes.length} dish${dishes.length > 1 ? 'es' : ''} added to diary!`, [
        { text: 'View Diary', onPress: () => navigation.navigate('Diary') },
        { text: 'Add Another', onPress: () => navigation.popToTop() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save meals. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {result.is_multi_dish ? result.platter_type || 'Multi-Dish' : 'Food Recognition'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Food Image */}
        <Image source={{ uri: imageUri }} style={styles.foodImage} />

        {/* Confidence Badge */}
        <View style={styles.confidenceCard}>
          <View style={styles.confidenceBadge}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.confidenceText}>
              {Math.round(result.overall_confidence * 100)}% confident
            </Text>
          </View>
          <View style={styles.sourceBadge}>
            <Ionicons name="sparkles" size={14} color={COLORS.textSecondary} />
            <Text style={styles.sourceText}>Gemini 2.5 Flash</Text>
          </View>
        </View>

        {/* Dishes Table */}
        <View style={styles.dishesCard}>
          <View style={styles.dishesHeader}>
            <Text style={styles.sectionTitle}>
              Recognized Dishes ({dishes.length})
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setSearchModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Dish</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Serving</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Calories</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Dish Rows */}
          {dishes.map((dish) => (
            <DishRow
              key={dish.id}
              dish={dish}
              onAdjustServing={adjustServing}
              onDelete={deleteDish}
            />
          ))}
        </View>

        {/* Total Nutrition */}
        <View style={styles.nutritionCard}>
          <Text style={styles.sectionTitle}>Total Nutrition</Text>
          
          <View style={styles.nutritionGrid}>
            <NutritionItem
              icon="flame"
              label="Calories"
              value={totalNutrition.calories}
              unit="cal"
              color={COLORS.error}
            />
            <NutritionItem
              icon="fitness"
              label="Protein"
              value={totalNutrition.protein}
              unit="g"
              color={COLORS.protein}
            />
            <NutritionItem
              icon="leaf"
              label="Carbs"
              value={totalNutrition.carbs}
              unit="g"
              color={COLORS.carbs}
            />
            <NutritionItem
              icon="water"
              label="Fats"
              value={totalNutrition.fats}
              unit="g"
              color={COLORS.fats}
            />
          </View>
        </View>

        {/* Action Button */}
        <Button
          title={`Add ${dishes.length} Dish${dishes.length > 1 ? 'es' : ''} to Diary`}
          onPress={handleSaveMeal}
          style={styles.saveButton}
        />
      </ScrollView>

      {/* Search Modal */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Dish</Text>
              <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search dishes..."
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
              />
            </View>

            <FlatList
              data={searchResults}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchResultItem}
                  onPress={() => addDish(item)}
                >
                  <Text style={styles.searchResultName}>{item.name}</Text>
                  <Text style={styles.searchResultCal}>
                    {item.nutrition.calories} cal
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptySearch}>
                  <Ionicons name="search-outline" size={48} color={COLORS.textLight} />
                  <Text style={styles.emptySearchText}>
                    {searchQuery.length < 2
                      ? 'Type to search dishes'
                      : isSearching
                      ? 'Searching...'
                      : 'No results found'}
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Dish Row Component
const DishRow = ({ dish, onAdjustServing, onDelete }) => {
  const multiplier = dish.servingSize / 100;
  const calories = Math.round(dish.nutrition.calories * multiplier);

  return (
    <View style={styles.dishRow}>
      <View style={{ flex: 2 }}>
        <Text style={styles.dishName}>{dish.name}</Text>
        <Text style={styles.dishType}>{dish.type}</Text>
      </View>

      <View style={styles.servingControl}>
        <TouchableOpacity
          style={styles.servingBtn}
          onPress={() => onAdjustServing(dish.id, -10)}
        >
          <Ionicons name="remove" size={16} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.servingText}>{dish.servingSize}g</Text>
        <TouchableOpacity
          style={styles.servingBtn}
          onPress={() => onAdjustServing(dish.id, 10)}
        >
          <Ionicons name="add" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.caloriesText}>{calories}</Text>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(dish.id)}
      >
        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );
};

// Nutrition Item Component
const NutritionItem = ({ icon, label, value, unit, color }) => (
  <View style={styles.nutritionItem}>
    <View style={[styles.nutritionIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.nutritionLabel}>{label}</Text>
    <Text style={styles.nutritionValue}>
      {value}
      <Text style={styles.nutritionUnit}>{unit}</Text>
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundGray,
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
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  foodImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  confidenceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  dishesCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  dishesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  addButton: {
    padding: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dishName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  dishType: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  servingControl: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  servingBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: 40,
    textAlign: 'center',
  },
  caloriesText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  deleteBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutritionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  nutritionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  nutritionLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  nutritionUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: COLORS.textSecondary,
  },
  saveButton: {
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchResultName: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  searchResultCal: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptySearch: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptySearchText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
});

export default FoodResultScreen;
