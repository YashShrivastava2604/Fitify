import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import COLORS from '../../constants/colors';

WebBrowser.maybeCompleteAuthSession();

const AuthScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { startSSOFlow } = useSSO();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const redirectUrl = Linking.createURL('oauth-native-callback', {
        scheme: 'fitify'
      });
      
      console.log('[Auth] Redirect URL:', redirectUrl);

      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl
      });

      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        console.log('[Auth] ✅ Session activated:', createdSessionId);
      } else if (signIn?.status === 'needs_first_factor') {
        // User exists but needs MFA
        console.log('[Auth] MFA required');
        Alert.alert('MFA Required', 'Multi-factor authentication is required');
      } else if (signUp?.status === 'missing_requirements') {
        // New user - missing required fields
        console.log('[Auth] Missing requirements:', signUp.missingFields);
        Alert.alert('Additional Info Needed', 'Please complete your profile');
      } else {
        console.warn('[Auth] Unexpected response:', { signIn, signUp });
        Alert.alert('Sign In Failed', 'An unexpected error occurred');
      }
    } catch (err) {
      console.error('[Auth] OAuth error:', err);
      Alert.alert(
        'Sign In Failed', 
        err.message || 'An error occurred during sign in. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>🥗</Text>
          <Text style={styles.title}>FitiFy</Text>
          <Text style={styles.subtitle}>Your AI-Powered Nutrition Companion</Text>
        </View>

        <View style={styles.features}>
          <FeatureItem icon="📸" text="Scan food with camera" />
          <FeatureItem icon="📊" text="Track calories & macros" />
          <FeatureItem icon="🍽️" text="Get meal plans" />
          <FeatureItem icon="💪" text="Achieve your goals" />
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.buttonText}>Continue with Google</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to our{'\n'}Terms of Service & Privacy Policy
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const FeatureItem = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 80, marginBottom: 16 },
  title: { fontSize: 36, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
  subtitle: { fontSize: 18, color: COLORS.textSecondary, textAlign: 'center' },
  features: { marginBottom: 40 },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  featureIcon: { fontSize: 28, marginRight: 16 },
  featureText: { fontSize: 16, color: COLORS.text, flex: 1 },
  button: { 
    backgroundColor: COLORS.primary, 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginBottom: 24 
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  terms: { 
    fontSize: 12, 
    color: COLORS.textLight, 
    textAlign: 'center', 
    lineHeight: 18 
  },
});

export default AuthScreen;
