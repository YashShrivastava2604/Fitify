import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Picker } from '@react-native-picker/picker';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import COLORS from '../../constants/colors';
import { VALIDATION } from '../../constants/config';
import { useProfileStore } from '../../stores/profileStore';
import { calculateBMI, getBMICategory } from '../../utils/calculations';

const OnboardingScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    height: '',
    currentWeight: '',
    goal: '',
    activityLevel: 'sedentary',
  });
  const [errors, setErrors] = useState({});
  
  const { completeOnboarding, isLoading } = useProfileStore();

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Age validation
    const age = parseInt(formData.age);
    if (!formData.age || isNaN(age) || age < VALIDATION.MIN_AGE || age > VALIDATION.MAX_AGE) {
      newErrors.age = `Age must be between ${VALIDATION.MIN_AGE} and ${VALIDATION.MAX_AGE}`;
    }

    // Gender validation
    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }

    // Height validation
    const height = parseFloat(formData.height);
    if (!formData.height || isNaN(height) || height < VALIDATION.MIN_HEIGHT || height > VALIDATION.MAX_HEIGHT) {
      newErrors.height = `Height must be between ${VALIDATION.MIN_HEIGHT} and ${VALIDATION.MAX_HEIGHT} cm`;
    }

    // Weight validation
    const weight = parseFloat(formData.currentWeight);
    if (!formData.currentWeight || isNaN(weight) || weight < VALIDATION.MIN_WEIGHT || weight > VALIDATION.MAX_WEIGHT) {
      newErrors.currentWeight = `Weight must be between ${VALIDATION.MIN_WEIGHT} and ${VALIDATION.MAX_WEIGHT} kg`;
    }

    // Goal validation
    if (!formData.goal) {
      newErrors.goal = 'Please select your goal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again');
      return;
    }

    try {
      const data = {
        age: parseInt(formData.age),
        gender: formData.gender,
        height: parseFloat(formData.height),
        currentWeight: parseFloat(formData.currentWeight),
        goal: formData.goal,
        activityLevel: formData.activityLevel,
      };

      await completeOnboarding(data);
      
      Alert.alert(
        'Welcome to FitiFy!',
        'Your profile has been set up successfully.',
        [{ text: 'Get Started', onPress: () => navigation.replace('Main') }]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to complete onboarding');
    }
  };

  // Calculate BMI preview
  const bmi = formData.height && formData.currentWeight 
    ? calculateBMI(parseFloat(formData.currentWeight), parseFloat(formData.height))
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Help us personalize your nutrition journey</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Age"
            value={formData.age}
            onChangeText={(value) => updateFormData('age', value)}
            placeholder="Enter your age"
            keyboardType="numeric"
            error={errors.age}
            leftIcon="person-outline"
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Gender</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formData.gender}
                onValueChange={(value) => updateFormData('gender', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select gender" value="" />
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>
            {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
          </View>

          <Input
            label="Height (cm)"
            value={formData.height}
            onChangeText={(value) => updateFormData('height', value)}
            placeholder="Enter your height"
            keyboardType="numeric"
            error={errors.height}
            leftIcon="resize-outline"
          />

          <Input
            label="Current Weight (kg)"
            value={formData.currentWeight}
            onChangeText={(value) => updateFormData('currentWeight', value)}
            placeholder="Enter your weight"
            keyboardType="numeric"
            error={errors.currentWeight}
            leftIcon="fitness-outline"
          />

          {bmi > 0 && (
            <View style={styles.bmiPreview}>
              <Text style={styles.bmiText}>
                BMI: {bmi} ({getBMICategory(bmi)})
              </Text>
            </View>
          )}

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Goal</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formData.goal}
                onValueChange={(value) => updateFormData('goal', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select your goal" value="" />
                <Picker.Item label="Lose Weight" value="lose" />
                <Picker.Item label="Maintain Weight" value="maintain" />
                <Picker.Item label="Gain Weight" value="gain" />
              </Picker>
            </View>
            {errors.goal && <Text style={styles.errorText}>{errors.goal}</Text>}
          </View>

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Activity Level</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formData.activityLevel}
                onValueChange={(value) => updateFormData('activityLevel', value)}
                style={styles.picker}
              >
                <Picker.Item label="Sedentary (little/no exercise)" value="sedentary" />
                <Picker.Item label="Lightly Active (1-3 days/week)" value="lightly_active" />
                <Picker.Item label="Moderately Active (3-5 days/week)" value="moderately_active" />
                <Picker.Item label="Very Active (6-7 days/week)" value="very_active" />
                <Picker.Item label="Extra Active (very hard exercise)" value="extra_active" />
              </Picker>
            </View>
          </View>
        </View>

        <Button
          title="Complete Setup"
          onPress={handleSubmit}
          loading={isLoading}
          style={styles.submitButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  picker: {
    height: 48,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginTop: 4,
  },
  bmiPreview: {
    backgroundColor: COLORS.backgroundGray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  bmiText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 16,
  },
});

export default OnboardingScreen;
