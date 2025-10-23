import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { useProfileStore } from '../../stores/profileStore';
import Loading from '../../components/common/Loading';
import COLORS from '../../constants/colors';

const HomeScreen = ({ navigation }) => {
  const { user } = useUser();
  const { profile, stats, fetchProfile, fetchStats, isLoading } = useProfileStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await fetchProfile();
      await fetchStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile data');
    }
  };

  if (isLoading || !profile) {
    return <Loading text="Loading your dashboard..." />;
  }

  const MacroCard = ({ title, current, target, color, icon }) => {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    
    return (
      <View style={styles.macroCard}>
        <View style={styles.macroHeader}>
          <Ionicons name={icon} size={20} color={color} />
          <Text style={styles.macroTitle}>{title}</Text>
        </View>
        <Text style={styles.macroValue}>
          {current}g / {target}g
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

  const QuickActionCard = ({ title, subtitle, icon, onPress, color = COLORS.primary }) => (
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.firstName || 'there'}! 👋</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle-outline" size={32} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Daily Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Overview</Text>
          
          <View style={styles.caloriesContainer}>
            <Text style={styles.caloriesConsumed}>
              {stats?.currentWeight ? '1,450' : '0'} calories
            </Text>
            <Text style={styles.caloriesTarget}>
              of {profile.dailyCalorieTarget} goal
            </Text>
            <Text style={styles.caloriesRemaining}>
              {profile.dailyCalorieTarget - (stats?.currentWeight ? 1450 : 0)} remaining
            </Text>
          </View>

          {/* Macro breakdown */}
          <View style={styles.macroContainer}>
            <MacroCard 
              title="Protein"
              current={stats?.currentWeight ? 85 : 0}
              target={profile.macroTargets.protein}
              color={COLORS.protein}
              icon="fitness-outline"
            />
            <MacroCard 
              title="Carbs"
              current={stats?.currentWeight ? 140 : 0}
              target={profile.macroTargets.carbs}
              color={COLORS.carbs}
              icon="leaf-outline"
            />
            <MacroCard 
              title="Fats"
              current={stats?.currentWeight ? 45 : 0}
              target={profile.macroTargets.fats}
              color={COLORS.fats}
              icon="water-outline"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <QuickActionCard
              title="Scan Food"
              subtitle="Take a photo to log meals"
              icon="camera-outline"
              onPress={() => navigation.navigate('Scan')}
              color={COLORS.primary}
            />
            <QuickActionCard
              title="Search Food"
              subtitle="Manually add foods"
              icon="search-outline"
              onPress={() => navigation.navigate('Search')}
              color={COLORS.secondary}
            />
            <QuickActionCard
              title="View Diary"
              subtitle="See today's meals"
              icon="book-outline"
              onPress={() => navigation.navigate('Diary')}
              color={COLORS.info}
            />
            <QuickActionCard
              title="Meal Plans"
              subtitle="Get recipe suggestions"
              icon="restaurant-outline"
              onPress={() => navigation.navigate('MealPlans')}
              color={COLORS.success}
            />
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.card}>
          <View style={styles.progressHeader}>
            <Text style={styles.cardTitle}>Your Progress</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Progress')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.progressStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.currentWeight} kg</Text>
              <Text style={styles.statLabel}>Current Weight</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.bmi}</Text>
              <Text style={styles.statLabel}>BMI ({profile.bmiCategory})</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {profile.goal === 'lose' ? '-0.5' : profile.goal === 'gain' ? '+0.5' : '0.0'} kg
              </Text>
              <Text style={styles.statLabel}>Goal</Text>
            </View>
          </View>
        </View>
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
    alignItems: 'center',
    marginBottom: 24,
  },
  caloriesConsumed: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  caloriesTarget: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  caloriesRemaining: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  macroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroCard: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
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
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.backgroundGray,
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
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
  seeAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
});

export default HomeScreen;
