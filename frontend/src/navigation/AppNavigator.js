import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@clerk/clerk-expo';
import { useProfileStore } from '../stores/profileStore';
import Loading from '../components/common/Loading';

// Import navigators and screens
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/auth/OnboardingScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { profile, fetchProfile, isLoading } = useProfileStore();

  useEffect(() => {
    if (isSignedIn && isLoaded) {
      fetchProfile().catch(() => {
        // Profile doesn't exist yet, user needs to onboard
      });
    }
  }, [isSignedIn, isLoaded]);

  // Show loading while auth status is being determined
  if (!isLoaded || (isSignedIn && isLoading && !profile)) {
    return <Loading text="Loading..." />;
  }

  // If signed in but not onboarded, show onboarding
  const needsOnboarding = isSignedIn && profile && !profile.isOnboarded;

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