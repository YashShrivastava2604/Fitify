import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';

const DiaryScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mock data (will be replaced with actual API data)
  const meals = {
    breakfast: [
      { id: 1, name: 'Oatmeal with berries', calories: 320, protein: 12, carbs: 52, fats: 8 },
      { id: 2, name: 'Green smoothie', calories: 180, protein: 8, carbs: 28, fats: 4 },
    ],
    lunch: [
      { id: 3, name: 'Grilled chicken salad', calories: 420, protein: 45, carbs: 20, fats: 18 },
    ],
    dinner: [
      { id: 4, name: 'Salmon with vegetables', calories: 530, protein: 42, carbs: 30, fats: 28 },
    ],
    snack: [],
  };

  const totals = {
    calories: 1450,
    protein: 107,
    carbs: 130,
    fats: 58,
  };

  const targets = {
    calories: 1800,
    protein: 120,
    carbs: 160,
    fats: 60,
  };

  const MealSection = ({ title, icon, items, mealType }) => (
    <View style={styles.mealSection}>
      <View style={styles.mealHeader}>
        <View style={styles.mealTitleContainer}>
          <Ionicons name={icon} size={24} color={COLORS.primary} />
          <Text style={styles.mealTitle}>{title}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddFood', { mealType })}
        >
          <Ionicons name="add-circle-outline" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <Text style={styles.emptyText}>No items logged</Text>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.foodItem}>
            <View style={styles.foodInfo}>
              <Text style={styles.foodName}>{item.name}</Text>
              <Text style={styles.foodDetails}>
                P: {item.protein}g | C: {item.carbs}g | F: {item.fats}g
              </Text>
            </View>
            <Text style={styles.foodCalories}>{item.calories} cal</Text>
          </View>
        ))
      )}
    </View>
  );

  const MacroProgress = ({ label, current, target, color }) => {
    const percentage = (current / target) * 100;
    
    return (
      <View style={styles.macroItem}>
        <View style={styles.macroInfo}>
          <Text style={styles.macroLabel}>{label}</Text>
          <Text style={styles.macroValue}>{current}g / {target}g</Text>
        </View>
        <View style={styles.macroBar}>
          <View 
            style={[
              styles.macroBarFill, 
              { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }
            ]} 
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Date Selector */}
        <View style={styles.dateSelector}>
          <TouchableOpacity>
            <Ionicons name="chevron-back" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short', 
              day: 'numeric',
              year: 'numeric' 
            })}
          </Text>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Daily Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Daily Summary</Text>
          
          <View style={styles.caloriesRow}>
            <View style={styles.caloriesItem}>
              <Text style={styles.caloriesLabel}>Consumed</Text>
              <Text style={styles.caloriesValue}>{totals.calories}</Text>
            </View>
            <View style={styles.caloriesDivider} />
            <View style={styles.caloriesItem}>
              <Text style={styles.caloriesLabel}>Target</Text>
              <Text style={styles.caloriesValue}>{targets.calories}</Text>
            </View>
            <View style={styles.caloriesDivider} />
            <View style={styles.caloriesItem}>
              <Text style={styles.caloriesLabel}>Remaining</Text>
              <Text style={[
                styles.caloriesValue,
                { color: targets.calories - totals.calories >= 0 ? COLORS.success : COLORS.error }
              ]}>
                {targets.calories - totals.calories}
              </Text>
            </View>
          </View>

          <View style={styles.macrosContainer}>
            <MacroProgress 
              label="Protein" 
              current={totals.protein} 
              target={targets.protein}
              color={COLORS.protein}
            />
            <MacroProgress 
              label="Carbs" 
              current={totals.carbs} 
              target={targets.carbs}
              color={COLORS.carbs}
            />
            <MacroProgress 
              label="Fats" 
              current={totals.fats} 
              target={targets.fats}
              color={COLORS.fats}
            />
          </View>
        </View>

        {/* Meals */}
        <MealSection 
          title="Breakfast" 
          icon="sunny-outline" 
          items={meals.breakfast}
          mealType="breakfast"
        />
        <MealSection 
          title="Lunch" 
          icon="restaurant-outline" 
          items={meals.lunch}
          mealType="lunch"
        />
        <MealSection 
          title="Dinner" 
          icon="moon-outline" 
          items={meals.dinner}
          mealType="dinner"
        />
        <MealSection 
          title="Snacks" 
          icon="fast-food-outline" 
          items={meals.snack}
          mealType="snack"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundGray,
  },
  scrollContent: {
    padding: 20,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  caloriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  caloriesItem: {
    alignItems: 'center',
  },
  caloriesLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  caloriesValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  caloriesDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  macrosContainer: {
    gap: 12,
  },
  macroItem: {
    marginBottom: 8,
  },
  macroInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  macroValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  macroBar: {
    height: 8,
    backgroundColor: COLORS.backgroundGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  mealSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  foodDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  foodCalories: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});

export default DiaryScreen;
