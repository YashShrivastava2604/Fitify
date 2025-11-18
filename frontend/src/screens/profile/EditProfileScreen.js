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

const EditProfileScreen = ({ navigation }) => {
  const { profile, updateProfile, isLoading } = useProfileStore();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    height: '',
    currentWeight: '',
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        age: profile.age?.toString() || '',
        height: profile.height?.toString() || '',
        currentWeight: profile.currentWeight?.toString() || '',
      });
    }
  }, [profile]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.age || parseInt(formData.age) < 18 || parseInt(formData.age) > 120) {
      newErrors.age = 'Age must be between 18 and 120';
    }

    if (!formData.height || parseInt(formData.height) < 100 || parseInt(formData.height) > 250) {
      newErrors.height = 'Height must be between 100 and 250 cm';
    }

    if (!formData.currentWeight || parseFloat(formData.currentWeight) < 30 || parseFloat(formData.currentWeight) > 300) {
      newErrors.currentWeight = 'Weight must be between 30 and 300 kg';
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
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: parseInt(formData.age),
        height: parseInt(formData.height),
        currentWeight: parseFloat(formData.currentWeight),
      });

      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !profile) {
    return <Loading text="Loading profile..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {/* First Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              placeholder="Enter first name"
              value={formData.firstName}
              onChangeText={(text) => {
                setFormData({ ...formData, firstName: text });
                if (errors.firstName) setErrors({ ...errors, firstName: null });
              }}
              placeholderTextColor={COLORS.textLight}
            />
            {errors.firstName && (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            )}
          </View>

          {/* Last Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              placeholder="Enter last name"
              value={formData.lastName}
              onChangeText={(text) => {
                setFormData({ ...formData, lastName: text });
                if (errors.lastName) setErrors({ ...errors, lastName: null });
              }}
              placeholderTextColor={COLORS.textLight}
            />
            {errors.lastName && (
              <Text style={styles.errorText}>{errors.lastName}</Text>
            )}
          </View>

          {/* Age */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Age (years)</Text>
            <TextInput
              style={[styles.input, errors.age && styles.inputError]}
              placeholder="18-120"
              value={formData.age}
              onChangeText={(text) => {
                setFormData({ ...formData, age: text });
                if (errors.age) setErrors({ ...errors, age: null });
              }}
              keyboardType="numeric"
              placeholderTextColor={COLORS.textLight}
            />
            {errors.age && (
              <Text style={styles.errorText}>{errors.age}</Text>
            )}
          </View>

          {/* Height */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={[styles.input, errors.height && styles.inputError]}
              placeholder="100-250"
              value={formData.height}
              onChangeText={(text) => {
                setFormData({ ...formData, height: text });
                if (errors.height) setErrors({ ...errors, height: null });
              }}
              keyboardType="numeric"
              placeholderTextColor={COLORS.textLight}
            />
            {errors.height && (
              <Text style={styles.errorText}>{errors.height}</Text>
            )}
          </View>

          {/* Current Weight */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Current Weight (kg)</Text>
            <TextInput
              style={[styles.input, errors.currentWeight && styles.inputError]}
              placeholder="30-300"
              value={formData.currentWeight}
              onChangeText={(text) => {
                setFormData({ ...formData, currentWeight: text });
                if (errors.currentWeight) setErrors({ ...errors, currentWeight: null });
              }}
              keyboardType="decimal-pad"
              placeholderTextColor={COLORS.textLight}
            />
            {errors.currentWeight && (
              <Text style={styles.errorText}>{errors.currentWeight}</Text>
            )}
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.info} />
            <Text style={styles.infoText}>
              These details help us calculate your BMI, BMR, and daily calorie needs accurately.
            </Text>
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
            title={isSaving ? 'Saving...' : 'Save Changes'}
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
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
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
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 6,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.info}10`,
    padding: 12,
    borderRadius: 12,
    gap: 12,
    marginTop: 16,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.info,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

export default EditProfileScreen;
