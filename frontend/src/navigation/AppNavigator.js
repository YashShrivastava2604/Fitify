import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@clerk/clerk-expo';
import { useProfileStore } from '../stores/profileStore';
import { setAuthToken } from '../services/api';
import Loading from '../components/common/Loading';

// Import navigators and screens
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/auth/OnboardingScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { getToken, isLoaded } = useAuth();
  const { profile, fetchProfile, isLoading } = useProfileStore();
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [tokenSynced, setTokenSynced] = useState(false);

  // Sync token FIRST
  useEffect(() => {
    const syncToken = async () => {
      if (!isLoaded) return;

      try {
        const token = await getToken();
        if (token) {
          setAuthToken(token);
          setTokenSynced(true);
          console.log('✅ Token synced to API');
        }
      } catch (error) {
        console.error('❌ Token sync error:', error);
      }
    };

    syncToken();
  }, [getToken, isLoaded]);

  // Fetch profile AFTER token is synced
  useEffect(() => {
    const loadProfile = async () => {
      if (tokenSynced && !hasAttemptedFetch) {
        setHasAttemptedFetch(true);
        
        try {
          await fetchProfile();
          console.log('✅ Profile loaded');
        } catch (error) {
          console.log('⚠️  Profile not found (new user needs onboarding)');
          // This is expected for new users - they'll see onboarding
        }
      }
    };

    loadProfile();
  }, [tokenSynced, hasAttemptedFetch]);

  // Show loading while auth and token sync is in progress
  if (!isLoaded || !tokenSynced) {
    return <Loading text="Loading..." />;
  }

  // Show loading while fetching profile for the first time
  if (isLoading && !hasAttemptedFetch) {
    return <Loading text="Loading your profile..." />;
  }

  // Determine if user needs onboarding
  // New user: profile is null
  // Returning user who hasn't completed onboarding: profile.isOnboarded = false
  const needsOnboarding = !profile || !profile.isOnboarded;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {needsOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
