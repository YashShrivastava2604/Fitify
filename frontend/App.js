import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, SignedIn, SignedOut, useAuth } from '@clerk/clerk-expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { CLERK_CONFIG } from './src/constants/config';
import AppNavigator from './src/navigation/AppNavigator';
import AuthScreen from './src/screens/auth/AuthScreen';
import { setAuthToken } from './src/services/api';


// Token cache for Clerk
const tokenCache = {
  async getToken(key) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key, value) {
    try {
      return await SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// Component to handle auth token syncing
const AuthTokenSync = ({ children }) => {
  const { getToken } = useAuth();

  useEffect(() => {
    const syncToken = async () => {
      try {
        const token = await getToken();
        setAuthToken(token);
      } catch (error) {
        console.error('Token sync error:', error);
      }
    };

    syncToken();
  }, [getToken]);

  return children;
};

export default function App() {

  useEffect(() => {
  fetch(process.env.EXPO_PUBLIC_API_URL + '/api/ping')
    .then(res => res.json())
    .then(console.log)
    .catch(console.error);
}, []);

  return (
    <ClerkProvider
      publishableKey={CLERK_CONFIG.PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AuthTokenSync>
          <SignedIn>
            <AppNavigator />
          </SignedIn>
          <SignedOut>
            <AuthScreen />
          </SignedOut>
        </AuthTokenSync>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
