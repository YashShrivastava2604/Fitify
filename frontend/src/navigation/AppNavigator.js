import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@clerk/clerk-expo';
import { useProfileStore } from '../stores/profileStore';
import { setAuthToken } from '../services/api';
import Loading from '../components/common/Loading';

import FoodResultScreen from '../screens/scan/FoodResultScreen';
import ChatbotScreen from '../screens/chatbot/ChatbotScreen';
import SearchScreen from '../screens/search/SearchScreen';
import ProgressScreen from '../screens/progress/ProgressScreen';
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
          setTokenSynced(true);
        }
      } catch (error) {
        console.error('❌ Token sync error:', error);
        setTokenSynced(true);
      }
    };

    syncToken();
    
    const interval = setInterval(syncToken, 30000);
    return () => clearInterval(interval);
  }, [getToken, isLoaded, isSignedIn]);

  // STEP 2: Fetch profile AFTER token is synced
  useEffect(() => {
    const loadProfile = async () => {
      if (!tokenSynced || hasAttemptedFetch) return;
      
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

  if (!isLoaded || !tokenSynced) {
    return <Loading text="Initializing..." />;
  }

  if (isSignedIn && isLoading && !hasAttemptedFetch) {
    return <Loading text="Loading your profile..." />;
  }

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
        
        {/* Modal screens - accessible from any tab */}
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
        <Stack.Screen 
          name="Search" 
          component={SearchScreen}
          options={{
            presentation: 'modal',
          }}
        />
        <Stack.Screen 
          name="Progress" 
          component={ProgressScreen}
          options={{
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
