import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import COLORS from '../../constants/colors';
import { useMealsStore } from '../../stores/mealsStore';

const FoodResultScreen = ({ route, navigation }) => {
  const { result, imageUri } = route.params;
  const [servingSize, setServingSize] = useState(100); // Default 100g

  // Safety check - if no result, go back
  React.useEffect(() => {
    if (!result || !result.nutrition) {
      Alert.alert(
        'Error',
        'No food data available',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    }
  }, [result]);

  // Early return if no data
  if (!result || !result.nutrition) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const adjustedNutrition = {
    calories: Math.round((result.nutrition.calories * servingSize) / 100),
    protein: Math.round((result.nutrition.protein * servingSize) / 100),
    carbs: Math.round((result.nutrition.carbs * servingSize) / 100),
    fats: Math.round((result.nutrition.fats * servingSize) / 100),
  };

  const { logMeal } = useMealsStore();

  const handleSaveMeal = () => {
    Alert.alert(
      'Add to Diary',
      'Which meal type?',
      [
        {
          text: 'Breakfast',
          onPress: () => saveMeal('breakfast'),
        },
        {
          text: 'Lunch',
          onPress: () => saveMeal('lunch'),
        },
        {
          text: 'Dinner',
          onPress: () => saveMeal('dinner'),
        },
        {
          text: 'Snack',
          onPress: () => saveMeal('snack'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const saveMeal = async (mealType) => {
    try {
      await logMeal({
        foodName: result.food_name,
        nutrition: adjustedNutrition,
        mealType: mealType,
        servingSize: servingSize,
        imageUrl: imageUri,
        source: 'scan',
        mlConfidence: result.confidence,
        mlSource: result.source
      });

      Alert.alert('Success', 'Meal added to diary!', [
        {
          text: 'View Diary',
          onPress: () => navigation.navigate('Diary'),
        },
        {
          text: 'Add Another',
          onPress: () => navigation.popToTop(),
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save meal. Please try again.');
    }
  };

  const adjustServing = (amount) => {
    const newSize = Math.max(10, Math.min(1000, servingSize + amount));
    setServingSize(newSize);
  };

  const confidenceColor = result.confidence >= 0.8 
    ? COLORS.success 
    : result.confidence >= 0.6 
    ? COLORS.warning 
    : COLORS.error;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Food Recognition</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Food Image */}
        <Image source={{ uri: imageUri }} style={styles.foodImage} />

        {/* Recognition Result */}
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.foodName}>{result.food_name}</Text>
            <View style={[styles.confidenceBadge, { backgroundColor: `${confidenceColor}20` }]}>
              <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                {Math.round(result.confidence * 100)}% confident
              </Text>
            </View>
          </View>

          <View style={styles.sourceBadge}>
            <Ionicons 
              name={result.source === 'self_hosted' ? 'hardware-chip' : 'cloud'} 
              size={14} 
              color={COLORS.textSecondary} 
            />
            <Text style={styles.sourceText}>
              {result.source === 'self_hosted' ? 'Our AI Model' : 'Clarifai Fallback'}
            </Text>
          </View>

          {/* Alternatives */}
          {result.alternatives && result.alternatives.length > 0 && (
            <View style={styles.alternatives}>
              <Text style={styles.alternativesTitle}>Other possibilities:</Text>
              {result.alternatives.map((alt, idx) => (
                <Text key={idx} style={styles.alternativeText}>
                  • {alt.name} ({Math.round(alt.confidence * 100)}%)
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Serving Size Adjuster */}
        <View style={styles.servingCard}>
          <Text style={styles.sectionTitle}>Serving Size</Text>
          
          <View style={styles.servingControls}>
            <TouchableOpacity 
              style={styles.servingButton} 
              onPress={() => adjustServing(-25)}
            >
              <Ionicons name="remove" size={24} color={COLORS.primary} />
            </TouchableOpacity>

            <View style={styles.servingSizeDisplay}>
              <Text style={styles.servingSizeText}>{servingSize}g</Text>
            </View>

            <TouchableOpacity 
              style={styles.servingButton} 
              onPress={() => adjustServing(25)}
            >
              <Ionicons name="add" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Quick size buttons */}
          <View style={styles.quickSizes}>
            {[50, 100, 150, 200].map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.quickSizeButton,
                  servingSize === size && styles.quickSizeButtonActive,
                ]}
                onPress={() => setServingSize(size)}
              >
                <Text
                  style={[
                    styles.quickSizeText,
                    servingSize === size && styles.quickSizeTextActive,
                  ]}
                >
                  {size}g
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nutrition Info */}
        <View style={styles.nutritionCard}>
          <Text style={styles.sectionTitle}>Nutrition Information</Text>
          
          <View style={styles.nutritionGrid}>
            <NutritionItem
              icon="flame"
              label="Calories"
              value={adjustedNutrition.calories}
              unit="cal"
              color={COLORS.error}
            />
            <NutritionItem
              icon="fitness"
              label="Protein"
              value={adjustedNutrition.protein}
              unit="g"
              color={COLORS.protein}
            />
            <NutritionItem
              icon="leaf"
              label="Carbs"
              value={adjustedNutrition.carbs}
              unit="g"
              color={COLORS.carbs}
            />
            <NutritionItem
              icon="water"
              label="Fats"
              value={adjustedNutrition.fats}
              unit="g"
              color={COLORS.fats}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Not Correct?"
            variant="outline"
            onPress={() => navigation.navigate('Search')}
            style={styles.actionButton}
          />
          <Button
            title="Add to Diary"
            onPress={handleSaveMeal}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
    marginBottom: 20,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  resultHeader: {
    marginBottom: 12,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  sourceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  alternatives: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  alternativesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  alternativeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  servingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
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
  servingSizeDisplay: {
    marginHorizontal: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.backgroundGray,
    borderRadius: 12,
  },
  servingSizeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  quickSizes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickSizeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickSizeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickSizeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  quickSizeTextActive: {
    color: COLORS.white,
    fontWeight: '600',
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
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
  },
});

export default FoodResultScreen;