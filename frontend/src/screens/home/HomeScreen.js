import React, { useEffect, useState, useFocusEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useProfileStore } from '../../stores/profileStore';
import { useMealsStore } from '../../stores/mealsStore';
import Loading from '../../components/common/Loading';
import COLORS from '../../constants/colors';
import { useFocusEffect as useNavFocusEffect } from '@react-navigation/native';


const HomeScreen = ({ navigation }) => {
  const { user } = useUser();
  const { profile } = useProfileStore();
  const { todaysMeals, todaysTotals, fetchTodaysMeals, isLoading } = useMealsStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { getToken } = useAuth();

  // Check token on mount
  useEffect(() => {
    const checkToken = async () => {
      const token = await getToken();
      console.log('🔑 Current token:', token ? 'EXISTS' : 'NULL');
    };
    
    checkToken();
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // ✅ FIX: Refresh data whenever screen is focused (when returning from other screens)
  useNavFocusEffect(
    React.useCallback(() => {
      console.log('📱 HomeScreen focused - refreshing data');
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      console.log('🔄 Loading today\'s meals...');
      await fetchTodaysMeals();
    } catch (error) {
      console.error('❌ Failed to load meals:', error.message);
      Alert.alert('Error', 'Failed to load meals');
    }
  };

  // ✅ FIX: Proper RefreshControl handler
  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  if (isLoading || !profile) {
    return <Loading text="Loading your dashboard..." />;
  }

  const remaining = profile.dailyCalorieTarget - (todaysTotals?.calories || 0);
  const caloriePercentage = Math.min(
    ((todaysTotals?.calories || 0) / profile.dailyCalorieTarget) * 100,
    100
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        // ✅ FIX: Use proper RefreshControl component
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hello, {user?.firstName || 'there'}! 👋
            </Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle-outline" size={32} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Daily Overview Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Overview</Text>

          {/* Calories Circle Progress */}
          <View style={styles.caloriesContainer}>
            <View style={styles.caloriesCircle}>
              <Text style={styles.caloriesConsumed}>
                {todaysTotals?.calories || 0}
              </Text>
              <Text style={styles.caloriesUnit}>cal</Text>
            </View>
            
            <View style={styles.caloriesInfo}>
              <Text style={styles.caloriesTarget}>
                Goal: {profile.dailyCalorieTarget} cal
              </Text>
              <Text style={[
                styles.caloriesRemaining,
                { color: remaining > 0 ? COLORS.success : COLORS.error }
              ]}>
                {remaining > 0 
                  ? `${remaining} remaining` 
                  : `${Math.abs(remaining)} over`}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${caloriePercentage}%` }
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Macro Breakdown */}
          <View style={styles.macroContainer}>
            <MacroCard
              title="Protein"
              current={todaysTotals?.protein || 0}
              target={profile.macroTargets.protein}
              color={COLORS.protein}
              icon="fitness-outline"
            />
            <MacroCard
              title="Carbs"
              current={todaysTotals?.carbs || 0}
              target={profile.macroTargets.carbs}
              color={COLORS.carbs}
              icon="leaf-outline"
            />
            <MacroCard
              title="Fats"
              current={todaysTotals?.fats || 0}
              target={profile.macroTargets.fats}
              color={COLORS.fats}
              icon="water-outline"
            />
          </View>
        </View>

        {/* Recent Meals */}
        {todaysMeals && todaysMeals.length > 0 && (
          <View style={styles.card}>
            <View style={styles.recentHeader}>
              <Text style={styles.cardTitle}>Today's Meals</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Diary')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {todaysMeals.slice(0, 3).map((meal) => (
              <View key={meal._id} style={styles.mealRow}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{meal.food?.name || 'Unknown'}</Text>
                  <Text style={styles.mealType}>
                    {meal.mealType?.charAt(0).toUpperCase() + meal.mealType?.slice(1)} • {meal.food?.servingSize || 0}g
                  </Text>
                </View>
                <Text style={styles.mealCalories}>{meal.nutrition?.calories || 0} cal</Text>
              </View>
            ))}

            {todaysMeals.length > 3 && (
              <TouchableOpacity onPress={() => navigation.navigate('Diary')}>
                <Text style={styles.viewMoreText}>
                  View {todaysMeals.length - 3} more meals →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* No Meals Message */}
        {(!todaysMeals || todaysMeals.length === 0) && (
          <View style={styles.card}>
            <Text style={styles.noMealsText}>No meals logged yet</Text>
            <TouchableOpacity 
              style={styles.addMealButton}
              onPress={() => navigation.navigate('Search')}
            >
              <Text style={styles.addMealText}>Add your first meal</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <QuickActionCard
              title="Scan Food"
              subtitle="Take a photo"
              icon="camera-outline"
              onPress={() => navigation.navigate('Scan')}
              color={COLORS.primary}
            />
            <QuickActionCard
              title="AI Assistant"
              subtitle="Ask questions"
              icon="chatbubbles-outline"
              onPress={() => navigation.navigate('Chatbot')}
              color={COLORS.info}
            />
            <QuickActionCard
              title="Add Meal"
              subtitle="Manual entry"
              icon="search-outline"
              onPress={() => navigation.navigate('Search')}
              color={COLORS.secondary}
            />
            <QuickActionCard
              title="View Diary"
              subtitle="Full history"
              icon="book-outline"
              onPress={() => navigation.navigate('Diary')}
              color={COLORS.success}
            />
          </View>
        </View>

        {/* Progress Stats */}
        <View style={styles.card}>
          <View style={styles.progressHeader}>
            <Text style={styles.cardTitle}>Your Stats</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Progress')}>
              <Text style={styles.seeAll}>See More</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressStats}>
            <StatItem
              label="Current Weight"
              value={profile.currentWeight}
              unit="kg"
              icon="barbell-outline"
            />
            <StatItem
              label="BMI"
              value={profile.bmi?.toFixed(1) || '0'}
              unit={profile.bmiCategory || '-'}
              icon="heart-outline"
            />
            <StatItem
              label="Meals Today"
              value={todaysMeals?.length || 0}
              unit="meals"
              icon="restaurant-outline"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const MacroCard = ({ title, current, target, color, icon }) => {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <View style={styles.macroCard}>
      <View style={styles.macroHeader}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={styles.macroTitle}>{title}</Text>
      </View>
      <Text style={styles.macroValue}>
        {Math.round(current)}g / {Math.round(target)}g
      </Text>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${percentage}%`, backgroundColor: color }
          ]}
        />
      </View>
      <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
    </View>
  );
};

const QuickActionCard = ({ title, subtitle, icon, onPress, color }) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress}>
    <View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.actionText}>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

const StatItem = ({ label, value, unit, icon }) => (
  <View style={styles.statItem}>
    <Ionicons name={icon} size={20} color={COLORS.primary} />
    <View style={styles.statContent}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value} <Text style={styles.statUnit}>{unit}</Text>
      </Text>
    </View>
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
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  caloriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  caloriesCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  caloriesConsumed: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  caloriesUnit: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  caloriesInfo: {
    flex: 1,
  },
  caloriesTarget: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  caloriesRemaining: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.backgroundGray,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  macroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
  },
  macroValue: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 4,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  mealType: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  mealCalories: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  viewMoreText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 12,
  },
  noMealsText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  addMealButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addMealText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    backgroundColor: COLORS.backgroundGray,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressStats: {
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statContent: {
    marginLeft: 12,
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  statUnit: {
    fontSize: 13,
    fontWeight: 'normal',
    color: COLORS.textSecondary,
  },
});

export default HomeScreen;
