import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useMealsStore } from '../../stores/mealsStore';
import { useProfileStore } from '../../stores/profileStore';
import Loading from '../../components/common/Loading';
import COLORS from '../../constants/colors';

const { width } = Dimensions.get('window');
const chartWidth = width - 40;

const ProgressScreen = ({ navigation }) => {
  const { profile, stats, fetchStats, isLoading: profileLoading } = useProfileStore();
  const { fetchMealsByDate } = useMealsStore();
  const [timeRange, setTimeRange] = useState('7');
  const [weightTrendData, setWeightTrendData] = useState([]);
  const [calorieIntakeData, setCalorieIntakeData] = useState([]);
  const [weeklyLabels, setWeeklyLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  // Load meal data when timeRange changes (with debounce to avoid rate limiting)
  useEffect(() => {
    loadMealData();
  }, [timeRange]);

  const loadStats = async () => {
    try {
      console.log('📊 ProgressScreen: Loading stats...');
      await fetchStats();
      console.log('✅ Stats loaded');
    } catch (error) {
      console.error('❌ Failed to load stats:', error);
    }
  };

  const loadMealData = async () => {
    setIsLoading(true);
    try {
      const days = parseInt(timeRange);
      const calorieData = [];
      const labels = [];

      console.log(`📊 ProgressScreen: Loading meal data for ${days} days...`);

      // ✅ FIX: Load meals sequentially with delays to avoid rate limiting
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        try {
          // Add small delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));

          const mealResult = await fetchMealsByDate(date);
          const dailyCalories = mealResult?.totals?.calories || 0;
          
          calorieData.push(dailyCalories);
          
          // Add label
          if (days <= 7) {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            labels.push(dayNames[date.getDay()]);
          } else {
            labels.push(`${date.getDate()}`);
          }

          console.log(`  📅 ${date.toISOString().split('T')[0]}: ${dailyCalories} cal`);
        } catch (dayError) {
          console.error(`  ⚠️ Error loading meal for ${date.toISOString().split('T')[0]}:`, dayError.message);
          calorieData.push(0);
          
          if (days <= 7) {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            labels.push(dayNames[date.getDay()]);
          } else {
            labels.push(`${date.getDate()}`);
          }
        }
      }

      setCalorieIntakeData(calorieData);
      setWeeklyLabels(labels);

      console.log('✅ Meal data loaded:', {
        days,
        totalCals: calorieData.reduce((a, b) => a + b, 0),
        calorieData,
        labels,
      });
    } catch (error) {
      console.error('❌ Error loading meal data:', error);
      // Set empty data if error
      const days = parseInt(timeRange);
      setCalorieIntakeData(Array(days).fill(0));
      setWeeklyLabels(Array(days).fill(''));
    } finally {
      setIsLoading(false);
    }
  };

  // Process weight history data from stats
  useEffect(() => {
    if (stats && stats.weightHistory && stats.weightHistory.length > 0) {
      const days = parseInt(timeRange);
      const weightData = [];

      const recentWeights = stats.weightHistory.slice(-days);
      
      recentWeights.forEach((entry) => {
        weightData.push(entry.weight);
      });

      setWeightTrendData(weightData);

      console.log('✅ Processed weight data:', {
        days,
        weightHistory: stats.weightHistory.length,
        recentWeights: weightData,
      });
    }
  }, [stats, timeRange]);

  if (profileLoading || !profile || !stats) {
    return <Loading text="Loading progress..." />;
  }

  const currentWeight = profile.currentWeight;
  const startWeight = stats.weightHistory && stats.weightHistory.length > 0
    ? stats.weightHistory[0].weight
    : profile.currentWeight;
  const weightChange = currentWeight - startWeight;
  const weightChangePercent = startWeight !== 0 ? ((weightChange / startWeight) * 100).toFixed(1) : '0';

  // Calculate average daily calories
  const avgDailyCalories = calorieIntakeData.length > 0
    ? Math.round(calorieIntakeData.reduce((a, b) => a + b, 0) / calorieIntakeData.length)
    : 0;

  // Prepare chart data
  const chartWeightData = weightTrendData.length > 0
    ? weightTrendData
    : Array(parseInt(timeRange)).fill(profile.currentWeight);

  const chartCalorieData = calorieIntakeData.length > 0
    ? calorieIntakeData.slice(0, 7)
    : Array(7).fill(0);

  const chartWeeklyLabels = weeklyLabels.length > 0
    ? weeklyLabels.slice(0, 7)
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Progress Tracking</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingBar}>
            <Text style={styles.loadingText}>Loading meal data...</Text>
          </View>
        )}

        {/* Goal Progress Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Goal Progress</Text>

          {profile.goal === 'lose' && (
            <View style={styles.goalSection}>
              <Text style={styles.goalLabel}>Target Weight Loss</Text>
              <View style={styles.goalProgress}>
                <View style={styles.goalValue}>
                  <Text style={styles.goalNumber}>-{Math.abs(weightChange).toFixed(1)}</Text>
                  <Text style={styles.goalUnit}>kg</Text>
                </View>
                <Text style={[
                  styles.goalSubtext,
                  { color: weightChange < 0 ? COLORS.success : COLORS.error }
                ]}>
                  {weightChange < 0 ? 'Great progress!' : 'Keep going!'}
                </Text>
                <Text style={styles.goalPercent}>
                  {weightChangePercent}% of starting weight
                </Text>
              </View>
            </View>
          )}

          {profile.goal === 'gain' && (
            <View style={styles.goalSection}>
              <Text style={styles.goalLabel}>Target Weight Gain</Text>
              <View style={styles.goalProgress}>
                <View style={styles.goalValue}>
                  <Text style={styles.goalNumber}>+{weightChange.toFixed(1)}</Text>
                  <Text style={styles.goalUnit}>kg</Text>
                </View>
                <Text style={[
                  styles.goalSubtext,
                  { color: weightChange > 0 ? COLORS.success : COLORS.error }
                ]}>
                  {weightChange > 0 ? 'On track!' : 'Increase intake!'}
                </Text>
                <Text style={styles.goalPercent}>
                  {weightChangePercent}% of starting weight
                </Text>
              </View>
            </View>
          )}

          {profile.goal === 'maintain' && (
            <View style={styles.goalSection}>
              <Text style={styles.goalLabel}>Weight Maintenance</Text>
              <View style={styles.goalProgress}>
                <View style={styles.goalValue}>
                  <Text style={styles.goalNumber}>±{Math.abs(weightChange).toFixed(1)}</Text>
                  <Text style={styles.goalUnit}>kg</Text>
                </View>
                <Text style={[
                  styles.goalSubtext,
                  { color: Math.abs(weightChange) < 2 ? COLORS.success : COLORS.warning }
                ]}>
                  {Math.abs(weightChange) < 2 ? 'Weight stable!' : 'Slight variation'}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.statsGrid}>
            <StatBox
              label="Current Weight"
              value={currentWeight}
              unit="kg"
            />
            <StatBox
              label="BMI"
              value={profile.bmi?.toFixed(1) || '0'}
              unit={profile.bmiCategory || '-'}
            />
          </View>
        </View>

        {/* Weight Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weight Trend ({timeRange} days)</Text>

          <View style={styles.timeRangeButtons}>
            {['7', '30', '90'].map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.timeButton,
                  timeRange === range && styles.timeButtonActive
                ]}
                onPress={() => setTimeRange(range)}
              >
                <Text style={[
                  styles.timeButtonText,
                  timeRange === range && styles.timeButtonTextActive
                ]}>
                  {range}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {chartWeightData.length > 0 ? (
            <LineChart
              data={{
                labels: Array(parseInt(timeRange)).fill(''),
                datasets: [
                  {
                    data: chartWeightData,
                  }
                ]
              }}
              width={chartWidth}
              height={220}
              chartConfig={{
                backgroundColor: COLORS.white,
                backgroundGradientFrom: COLORS.white,
                backgroundGradientTo: COLORS.white,
                decimalPlaces: 1,
                color: () => COLORS.primary,
                labelColor: () => COLORS.textSecondary,
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: COLORS.primary
                }
              }}
              style={styles.chart}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="bar-chart-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyChartText}>No weight data available</Text>
            </View>
          )}

          <View style={styles.weightStats}>
            <View style={styles.weightStatItem}>
              <Text style={styles.weightStatLabel}>Highest</Text>
              <Text style={styles.weightStatValue}>
                {stats.weightHistory && stats.weightHistory.length > 0
                  ? Math.max(...stats.weightHistory.map(w => w.weight)).toFixed(1)
                  : currentWeight}
                <Text style={styles.weightStatUnit}> kg</Text>
              </Text>
            </View>
            <View style={styles.weightStatItem}>
              <Text style={styles.weightStatLabel}>Lowest</Text>
              <Text style={styles.weightStatValue}>
                {stats.weightHistory && stats.weightHistory.length > 0
                  ? Math.min(...stats.weightHistory.map(w => w.weight)).toFixed(1)
                  : currentWeight}
                <Text style={styles.weightStatUnit}> kg</Text>
              </Text>
            </View>
            <View style={styles.weightStatItem}>
              <Text style={styles.weightStatLabel}>Average</Text>
              <Text style={styles.weightStatValue}>
                {stats.weightHistory && stats.weightHistory.length > 0
                  ? (stats.weightHistory.reduce((a, b) => a + b.weight, 0) / stats.weightHistory.length).toFixed(1)
                  : currentWeight}
                <Text style={styles.weightStatUnit}> kg</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Daily Calorie Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Calorie Intake (Last 7 Days)</Text>

          {chartCalorieData.some(cal => cal > 0) ? (
            <>
              <BarChart
                data={{
                  labels: chartWeeklyLabels,
                  datasets: [
                    {
                      data: chartCalorieData,
                    }
                  ]
                }}
                width={chartWidth}
                height={220}
                chartConfig={{
                  backgroundColor: COLORS.white,
                  backgroundGradientFrom: COLORS.white,
                  backgroundGradientTo: COLORS.white,
                  decimalPlaces: 0,
                  color: () => COLORS.primary,
                  labelColor: () => COLORS.textSecondary,
                  barPercentage: 0.7
                }}
                style={styles.chart}
              />

              <View style={styles.calorieStats}>
                <View style={styles.calorieStatItem}>
                  <Text style={styles.calorieStatLabel}>Avg Daily</Text>
                  <Text style={styles.calorieStatValue}>{avgDailyCalories}</Text>
                  <Text style={styles.calorieStatUnit}>cal</Text>
                </View>
                <View style={styles.calorieStatItem}>
                  <Text style={styles.calorieStatLabel}>Target</Text>
                  <Text style={styles.calorieStatValue}>{profile.dailyCalorieTarget}</Text>
                  <Text style={styles.calorieStatUnit}>cal</Text>
                </View>
                <View style={styles.calorieStatItem}>
                  <Text style={styles.calorieStatLabel}>Diff</Text>
                  <Text style={[
                    styles.calorieStatValue,
                    { color: avgDailyCalories <= profile.dailyCalorieTarget ? COLORS.success : COLORS.warning }
                  ]}>
                    {Math.abs(avgDailyCalories - profile.dailyCalorieTarget)}
                  </Text>
                  <Text style={styles.calorieStatUnit}>cal</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="nutrition-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyChartText}>No meal data available</Text>
              <Text style={styles.emptyChartSubtext}>Log some meals to see trends</Text>
            </View>
          )}
        </View>

        {/* Macro Distribution */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Macro Targets</Text>

          <View style={styles.macroTargets}>
            <MacroBar
              label="Protein"
              value={profile.macroTargets?.protein || 0}
              color={COLORS.protein}
              icon="fitness-outline"
            />
            <MacroBar
              label="Carbs"
              value={profile.macroTargets?.carbs || 0}
              color={COLORS.carbs}
              icon="leaf-outline"
            />
            <MacroBar
              label="Fats"
              value={profile.macroTargets?.fats || 0}
              color={COLORS.fats}
              icon="water-outline"
            />
          </View>

          <View style={styles.macroCalcNote}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.info} />
            <Text style={styles.macroCalcText}>
              Based on {profile.dailyCalorieTarget} cal/day and {profile.goal} goal
            </Text>
          </View>
        </View>

        {/* Health Metrics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Health Metrics</Text>

          <View style={styles.metricsGrid}>
            <MetricItem
              icon="heart-outline"
              label="BMR"
              value={profile.bmr?.toFixed(0) || '0'}
              unit="cal/day"
              description="Resting metabolic rate"
            />
            <MetricItem
              icon="flame-outline"
              label="TDEE"
              value={profile.tdee?.toFixed(0) || '0'}
              unit="cal/day"
              description="Total daily energy"
            />
            <MetricItem
              icon="body-outline"
              label="Height"
              value={profile.height || '0'}
              unit="cm"
              description="Body height"
            />
            <MetricItem
              icon="activity-outline"
              label="Activity"
              value={(profile.activityLevel || 'moderate').replace(/_/g, ' ').toUpperCase().slice(0, 3)}
              unit=""
              description="Exercise frequency"
            />
          </View>

          <View style={styles.metricsNote}>
            <Text style={styles.metricsNoteText}>
              These metrics help calculate your personalized nutrition targets.
            </Text>
          </View>
        </View>

        {/* Summary Stats */}
        <View style={[styles.card, styles.summaryCard]}>
          <Text style={styles.summaryTitle}>📊 This Period Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Days Tracked</Text>
              <Text style={styles.summaryValue}>
                {Math.min(stats.weightHistory?.length || 0, parseInt(timeRange))}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Weight Change</Text>
              <Text style={[
                styles.summaryValue,
                { color: weightChange < 0 && profile.goal === 'lose' ? COLORS.success : COLORS.primary }
              ]}>
                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Avg Calories</Text>
              <Text style={styles.summaryValue}>{avgDailyCalories}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const StatBox = ({ label, value, unit }) => (
  <View style={styles.statBox}>
    <Text style={styles.statBoxValue}>{value}</Text>
    <Text style={styles.statBoxUnit}>{unit}</Text>
    <Text style={styles.statBoxLabel}>{label}</Text>
  </View>
);

const MacroBar = ({ label, value, color, icon }) => (
  <View style={styles.macroBarItem}>
    <View style={styles.macroBarLabel}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={styles.macroBarName}>{label}</Text>
    </View>
    <Text style={styles.macroBarValue}>{Math.round(value)}g</Text>
  </View>
);

const MetricItem = ({ icon, label, value, unit, description }) => (
  <View style={styles.metricItem}>
    <Ionicons name={icon} size={24} color={COLORS.primary} />
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>
      {value}<Text style={styles.metricUnit}>{unit}</Text>
    </Text>
    <Text style={styles.metricDescription}>{description}</Text>
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
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  loadingBar: {
    backgroundColor: `${COLORS.primary}20`,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
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
  goalSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  goalLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  goalProgress: {
    alignItems: 'center',
  },
  goalValue: {
    alignItems: 'center',
    marginBottom: 8,
  },
  goalNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  goalUnit: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  goalSubtext: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalPercent: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.backgroundGray,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statBoxUnit: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  statBoxLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  timeRangeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  timeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeButtonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  timeButtonTextActive: {
    color: COLORS.white,
  },
  chart: {
    marginVertical: 8,
    marginHorizontal: -20,
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundGray,
    borderRadius: 12,
    marginVertical: 8,
  },
  emptyChartText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  emptyChartSubtext: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  weightStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  weightStatItem: {
    alignItems: 'center',
  },
  weightStatLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  weightStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  weightStatUnit: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: 'normal',
  },
  calorieStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  calorieStatItem: {
    alignItems: 'center',
  },
  calorieStatLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  calorieStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  calorieStatUnit: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  macroTargets: {
    gap: 12,
  },
  macroBarItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  macroBarLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroBarName: {
    fontSize: 14,
    color: COLORS.text,
  },
  macroBarValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  macroCalcNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.info}10`,
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  macroCalcText: {
    fontSize: 12,
    color: COLORS.info,
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: COLORS.backgroundGray,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  metricUnit: {
    fontSize: 11,
    fontWeight: 'normal',
    color: COLORS.textSecondary,
  },
  metricDescription: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 2,
    textAlign: 'center',
  },
  metricsNote: {
    backgroundColor: `${COLORS.info}10`,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  metricsNoteText: {
    fontSize: 12,
    color: COLORS.info,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: `${COLORS.primary}10`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});

export default ProgressScreen;
