import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useProfileStore } from '../../stores/profileStore';
import Loading from '../../components/common/Loading';
import COLORS from '../../constants/colors';

const { width } = Dimensions.get('window');
const chartWidth = width - 40;

const ProgressScreen = ({ navigation }) => {
  const { profile, stats, fetchStats, isLoading } = useProfileStore();
  const [timeRange, setTimeRange] = useState('30'); // 7, 30, 90 days

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      await fetchStats();
    } catch (error) {
      console.log('Failed to load stats:', error);
    }
  };

  if (isLoading || !profile || !stats) {
    return <Loading text="Loading progress..." />;
  }

  // Generate mock data for charts (replace with real API data later)
  const generateWeightData = () => {
    const days = parseInt(timeRange);
    const data = [];
    const startWeight = profile.currentWeight - 1;
    
    for (let i = 0; i < days; i++) {
      data.push(startWeight + (Math.random() - 0.5) * 0.5);
    }
    return data;
  };

  const generateCalorieData = () => {
    const days = parseInt(timeRange);
    const data = [];
    
    for (let i = 0; i < days; i++) {
      data.push(Math.floor(profile.dailyCalorieTarget + (Math.random() - 0.5) * 500));
    }
    return data;
  };

  const weightData = generateWeightData();
  const calorieData = generateCalorieData();

  const currentWeight = profile.currentWeight;
  const startWeight = stats.weightHistory && stats.weightHistory.length > 0
    ? stats.weightHistory[0].weight
    : profile.currentWeight;
  const weightChange = currentWeight - startWeight;
  const weightChangePercent = ((weightChange / startWeight) * 100).toFixed(1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Progress Tracking</Text>
          <View style={{ width: 24 }} />
        </View>

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
              value={profile.bmi?.toFixed(1)}
              unit={profile.bmiCategory}
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

          <LineChart
            data={{
              labels: Array(parseInt(timeRange)).fill(''),
              datasets: [
                {
                  data: weightData
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
        </View>

        {/* Daily Calorie Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Calorie Intake</Text>

          <BarChart
            data={{
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [
                {
                  data: calorieData.slice(0, 7)
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

          <View style={styles.calorieReference}>
            <View style={styles.referenceItem}>
              <View style={[styles.referenceDot, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.referenceText}>Actual intake</Text>
            </View>
            <View style={styles.referenceItem}>
              <View style={[styles.referenceDot, { backgroundColor: COLORS.info }]} />
              <Text style={styles.referenceText}>Target: {profile.dailyCalorieTarget} cal</Text>
            </View>
          </View>
        </View>

        {/* Macro Distribution */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Macro Targets</Text>

          <View style={styles.macroTargets}>
            <MacroBar
              label="Protein"
              value={profile.macroTargets.protein}
              color={COLORS.protein}
              icon="fitness-outline"
            />
            <MacroBar
              label="Carbs"
              value={profile.macroTargets.carbs}
              color={COLORS.carbs}
              icon="leaf-outline"
            />
            <MacroBar
              label="Fats"
              value={profile.macroTargets.fats}
              color={COLORS.fats}
              icon="water-outline"
            />
          </View>
        </View>

        {/* Health Metrics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Health Metrics</Text>

          <View style={styles.metricsGrid}>
            <MetricItem
              icon="heart-outline"
              label="BMR"
              value={profile.bmr?.toFixed(0)}
              unit="cal/day"
            />
            <MetricItem
              icon="flame-outline"
              label="TDEE"
              value={profile.tdee?.toFixed(0)}
              unit="cal/day"
            />
            <MetricItem
              icon="body-outline"
              label="Height"
              value={profile.height}
              unit="cm"
            />
            <MetricItem
              icon="activity-outline"
              label="Activity Level"
              value={profile.activityLevel.replace('_', ' ').toUpperCase().slice(0, 3)}
              unit=""
            />
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

const MetricItem = ({ icon, label, value, unit }) => (
  <View style={styles.metricItem}>
    <Ionicons name={icon} size={24} color={COLORS.primary} />
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>
      {value} <Text style={styles.metricUnit}>{unit}</Text>
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
  calorieReference: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  referenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  referenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  referenceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: COLORS.backgroundGray,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: COLORS.textSecondary,
  },
});
export default ProgressScreen;