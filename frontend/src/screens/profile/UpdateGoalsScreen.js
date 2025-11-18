import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfileStore } from '../../stores/profileStore';
import Loading from '../../components/common/Loading';
import Button from '../../components/common/Button';
import COLORS from '../../constants/colors';

const UpdateGoalsScreen = ({ navigation }) => {
  const { profile, updateProfile, isLoading } = useProfileStore();

  const [formData, setFormData] = useState({
    goal: 'maintain',
    targetWeight: '',
    activityLevel: 'moderate',
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        goal: profile.goal || 'maintain',
        targetWeight: profile.targetWeight?.toString() || '',
        activityLevel: profile.activityLevel || 'moderate',
      });
    }
  }, [profile]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.targetWeight) {
      newErrors.targetWeight = 'Target weight is required';
    } else {
      const weight = parseFloat(formData.targetWeight);
      if (weight < 30 || weight > 300) {
        newErrors.targetWeight = 'Target weight must be between 30 and 300 kg';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors below');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        goal: formData.goal,
        targetWeight: parseFloat(formData.targetWeight),
        activityLevel: formData.activityLevel,
      });

      Alert.alert('Success', 'Goals updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update goals');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !profile) {
    return <Loading text="Loading profile..." />;
  }

  const goalOptions = [
    { value: 'lose', label: 'Lose Weight', icon: 'arrow-down-circle-outline', color: COLORS.error },
    { value: 'maintain', label: 'Maintain Weight', icon: 'radio-button-off-outline', color: COLORS.info },
    { value: 'gain', label: 'Gain Weight', icon: 'arrow-up-circle-outline', color: COLORS.success },
  ];

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
    { value: 'light', label: 'Light', description: '1-3 days/week' },
    { value: 'moderate', label: 'Moderate', description: '3-5 days/week' },
    { value: 'active', label: 'Very Active', description: '5-6 days/week' },
    { value: 'veryActive', label: 'Extremely Active', description: '6-7 days/week' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Update Goals</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Goal Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weight Goal</Text>
          <Text style={styles.description}>
            Select your primary fitness goal
          </Text>

          {goalOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                formData.goal === option.value && styles.optionButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, goal: option.value })}
            >
              <View style={styles.optionContent}>
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={formData.goal === option.value ? option.color : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.optionLabel,
                    formData.goal === option.value && styles.optionLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
              </View>
              {formData.goal === option.value && (
                <Ionicons name="checkmark-circle" size={24} color={option.color} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Target Weight Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Target Weight</Text>
          <Text style={styles.description}>
            Set your goal weight
          </Text>

          <View style={styles.formGroup}>
            <View style={styles.weightInputContainer}>
              <TextInput
                style={[styles.input, errors.targetWeight && styles.inputError]}
                placeholder="Enter target weight"
                value={formData.targetWeight}
                onChangeText={(text) => {
                  setFormData({ ...formData, targetWeight: text });
                  if (errors.targetWeight) setErrors({ ...errors, targetWeight: null });
                }}
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.textLight}
              />
              <Text style={styles.unit}>kg</Text>
            </View>
            {errors.targetWeight && (
              <Text style={styles.errorText}>{errors.targetWeight}</Text>
            )}

            <View style={styles.weightStats}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Current</Text>
                <Text style={styles.statValue}>{profile.currentWeight} kg</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={COLORS.textSecondary} />
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Target</Text>
                <Text style={styles.statValue}>
                  {formData.targetWeight || '-'} kg
                </Text>
              </View>
              {formData.targetWeight && (
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>To Go</Text>
                  <Text style={[
                    styles.statValue,
                    { color: Math.abs(profile.currentWeight - parseFloat(formData.targetWeight)) > 0 ? COLORS.primary : COLORS.success }
                  ]}>
                    {Math.abs(profile.currentWeight - parseFloat(formData.targetWeight)).toFixed(1)} kg
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Activity Level Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Activity Level</Text>
          <Text style={styles.description}>
            This helps calculate your daily calorie needs
          </Text>

          {activityLevels.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.activityOption,
                formData.activityLevel === level.value && styles.activityOptionActive,
              ]}
              onPress={() => setFormData({ ...formData, activityLevel: level.value })}
            >
              <View style={styles.activityContent}>
                <View style={[
                  styles.checkbox,
                  formData.activityLevel === level.value && styles.checkboxActive,
                ]}>
                  {formData.activityLevel === level.value && (
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                  )}
                </View>
                <View style={styles.activityText}>
                  <Text style={styles.activityLabel}>{level.label}</Text>
                  <Text style={styles.activityDescription}>{level.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Card */}
        <View style={[styles.card, styles.summaryCard]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Daily Calorie Target</Text>
            <Text style={styles.summaryValue}>
              {profile.dailyCalorieTarget} cal/day
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Macro Distribution</Text>
            <View style={styles.macroSummary}>
              <Text style={styles.macroSummaryItem}>
                Protein: {profile.macroTargets?.protein}g
              </Text>
              <Text style={styles.macroSummaryItem}>
                Carbs: {profile.macroTargets?.carbs}g
              </Text>
              <Text style={styles.macroSummaryItem}>
                Fats: {profile.macroTargets?.fats}g
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.actionButton}
          />
          <Button
            title={isSaving ? 'Saving...' : 'Save Goals'}
            onPress={handleSave}
            style={styles.actionButton}
            disabled={isSaving}
          />
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundGray,
  },
  optionButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  optionLabelActive: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  formGroup: {
    marginBottom: 0,
  },
  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.backgroundGray,
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: `${COLORS.error}10`,
  },
  unit: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    paddingRight: 12,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 6,
  },
  weightStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  activityOption: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundGray,
  },
  activityOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundGray,
  },
  checkboxActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  activityText: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  summaryCard: {
    backgroundColor: `${COLORS.primary}10`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  summaryItem: {
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: `${COLORS.primary}30`,
    marginVertical: 12,
  },
  macroSummary: {
    gap: 6,
  },
  macroSummaryItem: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

export default UpdateGoalsScreen;
