import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import AppNavigator from './src/navigation/AppNavigator';
import AuthScreen from './src/screens/auth/AuthScreen';

// Token cache
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
      await SecureStore.setItemAsync(key, value);
    } catch (err) {}
  },
};

export default function App() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        
        {/* Show AuthScreen for signed OUT users */}
        <SignedOut>
          <AuthScreen />
        </SignedOut>

        {/* Show AppNavigator ONLY for signed IN users */}
        <SignedIn>
          <AppNavigator />
        </SignedIn>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}


// const styles = StyleSheet.create({
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
// });
