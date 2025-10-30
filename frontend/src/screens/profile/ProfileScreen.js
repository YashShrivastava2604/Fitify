import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useProfileStore } from '../../stores/profileStore';
import Loading from '../../components/common/Loading';
import Button from '../../components/common/Button';
import COLORS from '../../constants/colors';

const ProfileScreen = ({ navigation }) => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { profile, fetchProfile, isLoading } = useProfileStore();


  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  if (isLoading || !profile) {
    return <Loading text="Loading profile..." />;
  }

  const ProfileOption = ({ icon, title, subtitle, onPress, showArrow = true, color = COLORS.text }) => (
    <TouchableOpacity style={styles.option} onPress={onPress}>
      <View style={styles.optionLeft}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>{title}</Text>
          {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
      )}
    </TouchableOpacity>
  );

  const StatCard = ({ label, value, unit }) => (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color={COLORS.primary} />
          </View>
          <Text style={styles.name}>
            {user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user?.firstName || 'User'}
          </Text>
          <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatCard label="Current Weight" value={profile.currentWeight} unit="kg" />
          <StatCard label="Height" value={profile.height} unit="cm" />
          <StatCard label="BMI" value={profile.bmi} unit="" />
          <StatCard label="Age" value={profile.age} unit="years" />
        </View>

        {/* Goals Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Goals</Text>
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>Target</Text>
            <Text style={styles.goalValue}>
              {profile.goal === 'lose' ? 'Lose Weight' : 
               profile.goal === 'gain' ? 'Gain Weight' : 
               'Maintain Weight'}
            </Text>
          </View>
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>Daily Calories</Text>
            <Text style={styles.goalValue}>{profile.dailyCalorieTarget} cal</Text>
          </View>
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>Activity Level</Text>
            <Text style={styles.goalValue}>
              {profile.activityLevel.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {/* Macros Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Macro Targets</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroCard}>
              <Text style={[styles.macroValue, { color: COLORS.protein }]}>
                {profile.macroTargets.protein}g
              </Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroCard}>
              <Text style={[styles.macroValue, { color: COLORS.carbs }]}>
                {profile.macroTargets.carbs}g
              </Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroCard}>
              <Text style={[styles.macroValue, { color: COLORS.fats }]}>
                {profile.macroTargets.fats}g
              </Text>
              <Text style={styles.macroLabel}>Fats</Text>
            </View>
          </View>
        </View>

        {/* Options */}
        <View style={styles.card}>
          <ProfileOption
            icon="create-outline"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => Alert.alert('Coming Soon', 'Edit profile feature will be available in Phase 3')}
            color={COLORS.primary}
          />
          <ProfileOption
            icon="fitness-outline"
            title="Update Goals"
            subtitle="Change your weight and activity goals"
            onPress={() => Alert.alert('Coming Soon', 'Update goals feature will be available in Phase 3')}
            color={COLORS.secondary}
          />
          <ProfileOption
            icon="stats-chart-outline"
            title="Progress & Statistics"
            subtitle="View your weight and nutrition trends"
            onPress={() => Alert.alert('Coming Soon', 'Stats feature will be available in Phase 3')}
            color={COLORS.info}
          />
          <ProfileOption
            icon="settings-outline"
            title="Settings"
            subtitle="App preferences and notifications"
            onPress={() => Alert.alert('Coming Soon', 'Settings will be available in Phase 3')}
            color={COLORS.textSecondary}
          />
        </View>

        {/* Sign Out Button */}
        <Button
          title="Sign Out"
          variant="outline"
          onPress={handleSignOut}
          style={styles.signOutButton}
        />

        <Text style={styles.version}>Version 1.0.0</Text>
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
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statUnit: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
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
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  goalLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.backgroundGray,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  signOutButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  version: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 20,
  },
});

export default ProfileScreen;
