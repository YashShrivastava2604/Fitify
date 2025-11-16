import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMealsStore } from '../../stores/mealsStore';
import { useProfileStore } from '../../stores/profileStore';
import Loading from '../../components/common/Loading';
import COLORS from '../../constants/colors';

const DiaryScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  
  const { dailySummary, fetchDailySummary, deleteMeal, isLoading } = useMealsStore();
  const { profile } = useProfileStore();

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      await fetchDailySummary(selectedDate);
    } catch (error) {
      console.error('Failed to load diary:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleDeleteMeal = (mealId, foodName) => {
    Alert.alert(
      'Delete Meal',
      `Remove ${foodName} from diary?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMeal(mealId);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete meal');
            }
          }
        }
      ]
    );
  };

  if (isLoading && !dailySummary) {
    return <Loading text="Loading diary..." />;
  }

  if (isLoading && !dailySummary) {
    return <Loading text="Loading diary..." />;
  }

  // ✅ ADD: Check if dailySummary exists and has required structure
  const hasSummary = dailySummary && 
                     dailySummary.totals && 
                     dailySummary.target && 
                     dailySummary.remaining &&
                     dailySummary.mealsByType;

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Date Navigator */}
        <View style={styles.dateNavigator}>
          <TouchableOpacity onPress={() => changeDate(-1)}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={styles.dateText}>
            {isToday ? 'Today' : selectedDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>

          <TouchableOpacity 
            onPress={() => changeDate(1)}
            disabled={isToday}
          >
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color={isToday ? COLORS.textLight : COLORS.text} 
            />
          </TouchableOpacity>
        </View>

        {/* Daily Summary */}
        {dailySummary && (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>Daily Summary</Text>
              
              <View style={styles.caloriesProgress}>
                <View style={styles.caloriesHeader}>
                  <Text style={styles.caloriesConsumed}>
                    {dailySummary.totals.calories}
                  </Text>
                  <Text style={styles.caloriesTarget}>
                    / {dailySummary.target.calories} cal
                  </Text>
                </View>

                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(
                          (dailySummary.totals.calories / dailySummary.target.calories) * 100,
                          100
                        )}%`
                      }
                    ]}
                  />
                </View>

                <Text style={styles.remaining}>
                  {dailySummary.remaining.calories > 0
                    ? `${dailySummary.remaining.calories} cal remaining`
                    : `${Math.abs(dailySummary.remaining.calories)} cal over`}
                </Text>
              </View>

              {/* Macros */}
              <View style={styles.macrosRow}>
                <MacroProgress
                  label="Protein"
                  current={dailySummary.totals.protein}
                  target={dailySummary.target.protein}
                  color={COLORS.protein}
                />
                <MacroProgress
                  label="Carbs"
                  current={dailySummary.totals.carbs}
                  target={dailySummary.target.carbs}
                  color={COLORS.carbs}
                />
                <MacroProgress
                  label="Fats"
                  current={dailySummary.totals.fats}
                  target={dailySummary.target.fats}
                  color={COLORS.fats}
                />
              </View>
            </View>

            {/* Meals by Type */}
            {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => (
              <MealSection
                key={mealType}
                mealType={mealType}
                meals={dailySummary.mealsByType[mealType]}
                onDeleteMeal={handleDeleteMeal}
                onAddMeal={() => navigation.navigate('Scan')}
              />
            ))}

            {!hasSummary && !isLoading && (
              <View style={styles.emptyState}>
                <Ionicons name="restaurant-outline" size={64} color={COLORS.textLight} />
                <Text style={styles.emptyText}>No meals logged yet</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => navigation.navigate('Scan')}
                >
                  <Text style={styles.addButtonText}>Add Your First Meal</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* Empty State */}
            {Object.values(dailySummary.mealsByType).every(meals => meals.length === 0) && (
              <View style={styles.emptyState}>
                <Ionicons name="restaurant-outline" size={64} color={COLORS.textLight} />
                <Text style={styles.emptyText}>No meals logged yet</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => navigation.navigate('Scan')}
                >
                  <Text style={styles.addButtonText}>Add Your First Meal</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const MacroProgress = ({ label, current, target, color }) => {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <View style={styles.macroItem}>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroProgressBar}>
        <View 
          style={[
            styles.macroProgressFill,
            { width: `${percentage}%`, backgroundColor: color }
          ]}
        />
      </View>
      <Text style={styles.macroValue}>{current}g / {target}g</Text>
    </View>
  );
};

const MealSection = ({ mealType, meals, onDeleteMeal, onAddMeal }) => {
  const mealIcons = {
    breakfast: 'sunny-outline',
    lunch: 'fast-food-outline',
    dinner: 'restaurant-outline',
    snack: 'pizza-outline'
  };

  const mealLabels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snacks'
  };

  const totalCalories = meals.reduce((sum, meal) => sum + meal.nutrition.calories, 0);

  return (
    <View style={styles.mealSection}>
      <View style={styles.mealHeader}>
        <View style={styles.mealTitleRow}>
          <Ionicons name={mealIcons[mealType]} size={20} color={COLORS.text} />
          <Text style={styles.mealTitle}>{mealLabels[mealType]}</Text>
        </View>
        <Text style={styles.mealCalories}>{totalCalories} cal</Text>
      </View>

      {meals.length > 0 ? (
        meals.map((meal) => (
          <View key={meal._id} style={styles.mealCard}>
            <View style={styles.mealInfo}>
              <Text style={styles.foodName}>{meal.food.name}</Text>
              <Text style={styles.servingSize}>
                {meal.food.servingSize}{meal.food.servingUnit}
              </Text>
              <View style={styles.nutritionRow}>
                <NutritionBadge label="Cal" value={meal.nutrition.calories} />
                <NutritionBadge label="P" value={meal.nutrition.protein} />
                <NutritionBadge label="C" value={meal.nutrition.carbs} />
                <NutritionBadge label="F" value={meal.nutrition.fats} />
              </View>
            </View>

            <TouchableOpacity
              onPress={() => onDeleteMeal(meal._id, meal.food.name)}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <TouchableOpacity style={styles.addMealButton} onPress={onAddMeal}>
          <Ionicons name="add" size={20} color={COLORS.primary} />
          <Text style={styles.addMealText}>Add {mealLabels[mealType]}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const NutritionBadge = ({ label, value }) => (
  <View style={styles.nutritionBadge}>
    <Text style={styles.nutritionBadgeLabel}>{label}</Text>
    <Text style={styles.nutritionBadgeValue}>{value}g</Text>
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
  dateNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  summaryCard: {
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
  caloriesProgress: {
    marginBottom: 20,
  },
  caloriesHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
  },
  caloriesConsumed: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  caloriesTarget: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.backgroundGray,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  remaining: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  macroProgressBar: {
    height: 6,
    backgroundColor: COLORS.backgroundGray,
    borderRadius: 3,
    marginBottom: 4,
  },
  macroProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  macroValue: {
    fontSize: 11,
    color: COLORS.text,
    textAlign: 'center',
  },
  mealSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  mealCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  mealInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  servingSize: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  nutritionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  nutritionBadge: {
    backgroundColor: COLORS.backgroundGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  nutritionBadgeLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  nutritionBadgeValue: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addMealText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DiaryScreen;
