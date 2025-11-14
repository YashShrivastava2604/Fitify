import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@clerk/clerk-expo';
import { useProfileStore } from '../stores/profileStore';
import { setAuthToken } from '../services/api';
import Loading from '../components/common/Loading';

import FoodResultScreen from '../screens/scan/FoodResultScreen';
import ChatbotScreen from '../screens/chatbot/ChatbotScreen';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/auth/OnboardingScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { profile, fetchProfile, isLoading } = useProfileStore();
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [tokenSynced, setTokenSynced] = useState(false);

  // STEP 1: Sync token
  useEffect(() => {
    const syncToken = async () => {
      if (!isLoaded) return;

      try {
        const token = await getToken();
        console.log('═══════════════════════════════');
        console.log('🔑 STEP 1: Token Sync');
        console.log('  isLoaded:', isLoaded);
        console.log('  isSignedIn:', isSignedIn);
        console.log('  Token exists:', !!token);
        console.log('═══════════════════════════════');
        
        if (token) {
          setAuthToken(token);
          setTokenSynced(true);
          console.log('✅ Token synced to API');
        } else {
          console.error('❌ No token received from Clerk');
          // If not signed in, that's ok - show login
          setTokenSynced(true);
        }
      } catch (error) {
        console.error('❌ Token sync error:', error);
        setTokenSynced(true); // Continue anyway
      }
    };

    syncToken();
    
    // Refresh token every 30 seconds
    const interval = setInterval(syncToken, 30000);
    return () => clearInterval(interval);
  }, [getToken, isLoaded, isSignedIn]);

  // STEP 2: Fetch profile AFTER token is synced
  useEffect(() => {
    const loadProfile = async () => {
      if (!tokenSynced || hasAttemptedFetch) return;
      
      // Only try to fetch profile if user is signed in
      if (!isSignedIn) {
        console.log('⚠️  User not signed in, skipping profile fetch');
        setHasAttemptedFetch(true);
        return;
      }

      setHasAttemptedFetch(true);
      
      try {
        console.log('═══════════════════════════════');
        console.log('🔄 STEP 2: Fetching Profile');
        console.log('═══════════════════════════════');
        
        await fetchProfile();
        
        console.log('✅ Profile loaded');
        console.log('📋 Profile data:', {
          email: profile?.email,
          firstName: profile?.firstName,
          isOnboarded: profile?.isOnboarded,
        });
        console.log('═══════════════════════════════');
        
      } catch (error) {
        console.log('⚠️  Profile not found or error loading');
        console.error('Profile fetch error:', error.message);
      }
    };

    loadProfile();
  }, [tokenSynced, hasAttemptedFetch, isSignedIn]);

  // STEP 3: Determine which screen to show
  console.log('═══════════════════════════════');
  console.log('🎯 STEP 3: Navigation Decision');
  console.log('  isLoaded:', isLoaded);
  console.log('  isSignedIn:', isSignedIn);
  console.log('  tokenSynced:', tokenSynced);
  console.log('  hasAttemptedFetch:', hasAttemptedFetch);
  console.log('  profile exists:', !!profile);
  console.log('  isOnboarded:', profile?.isOnboarded);
  console.log('═══════════════════════════════');

  // Show loading while checking auth
  if (!isLoaded || !tokenSynced) {
    return <Loading text="Initializing..." />;
  }

  // Show loading while fetching profile
  if (isSignedIn && isLoading && !hasAttemptedFetch) {
    return <Loading text="Loading your profile..." />;
  }

  // NOT signed in → Show onboarding (for new users)
  if (!isSignedIn) {
    console.log('📱 Rendering: OnboardingScreen (not signed in)');
    return (
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen 
            name="Onboarding" 
            component={OnboardingScreen}
            options={{
              animationEnabled: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Signed in but profile missing or not onboarded
  const needsOnboarding = !profile || !profile.isOnboarded;

  console.log(`📱 Rendering: ${needsOnboarding ? 'OnboardingScreen' : 'Main'}`);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {needsOnboarding ? (
          <Stack.Screen 
            name="Onboarding" 
            component={OnboardingScreen}
            options={{
              animationEnabled: false,
            }}
          />
        ) : (
          <Stack.Screen 
            name="Main" 
            component={TabNavigator}
            options={{
              animationEnabled: false,
            }}
          />
        )}
        
        {/* Modal screens */}
        <Stack.Screen 
          name="FoodResult" 
          component={FoodResultScreen}
          options={{
            presentation: 'modal',
          }}
        />
        <Stack.Screen 
          name="Chatbot" 
          component={ChatbotScreen}
          options={{
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;