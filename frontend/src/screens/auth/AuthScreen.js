import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import Button from '../../components/common/Button';
import COLORS from '../../constants/colors';

WebBrowser.maybeCompleteAuthSession();

const AuthScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: 'exp://localhost:8081', // Update with your Expo URL
      });

      if (createdSessionId) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error('OAuth error:', JSON.stringify(err, null, 2));
      Alert.alert(
        'Sign In Error',
        'Could not sign in with Google. Please make sure:\n\n1. You have internet connection\n2. Google OAuth is enabled in Clerk Dashboard\n3. Your Clerk app is in Development mode'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>🥗</Text>
        <Text style={styles.title}>FitiFy</Text>
        <Text style={styles.subtitle}>Your AI-Powered Nutrition Companion</Text>

        <View style={styles.features}>
          <FeatureItem icon="📸" text="Scan food with camera" />
          <FeatureItem icon="📊" text="Track calories & macros" />
          <FeatureItem icon="🍽️" text="Get meal plans" />
          <FeatureItem icon="💪" text="Achieve your goals" />
        </View>

        <Button
          title="Continue with Google"
          onPress={handleGoogleSignIn}
          loading={isLoading}
          style={styles.button}
        />

        <Text style={styles.terms}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </View>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-around',
  },
  logo: {
    fontSize: 80,
    textAlign: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  features: {
    marginVertical: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: COLORS.text,
  },
  button: {
    marginTop: 24,
  },
  terms: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default AuthScreen;
