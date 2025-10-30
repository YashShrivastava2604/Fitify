// src/screens/auth/AuthScreen.js
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
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import COLORS from '../../constants/colors';

WebBrowser.maybeCompleteAuthSession();

const AuthScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { startSSOFlow } = useSSO();

  const buildRedirectUrl = () => {
    // Preferred: expo proxy redirect (works in Expo Go when proxy is available)
    // const proxy = AuthSession.makeRedirectUri({ useProxy: true });
    // Fallback: scheme-based redirect (works for standalone / dev if you registered the scheme)
    const schemeBased = AuthSession.makeRedirectUri({ useProxy: false, scheme: 'fitify' });

    // console.log('[Auth] AuthSession.makeRedirectUri -> proxy:', proxy);
    console.log('[Auth] AuthSession.makeRedirectUri -> schemeBased:', schemeBased);

    // If proxy returned an https/http URL, prefer that (good for Expo proxy)
    // if (proxy && proxy.startsWith('http')) return proxy;

    // Otherwise fallback to scheme-based redirect (fitify://...)
    return schemeBased;
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const redirectUrl = buildRedirectUrl();
      console.log('[Auth] Using redirectUrl:', redirectUrl);

      const res = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });

      console.log('[Auth] startSSOFlow result:', JSON.stringify(res, null, 2));

      // Handle session shapes Clerk may return
      const { createdSessionId, setActive, signIn, signUp, errors } = res || {};

      if (createdSessionId && typeof setActive === 'function') {
        await setActive({ session: createdSessionId });
        console.log('[Auth] Session activated:', createdSessionId);
        setIsLoading(false);
        return;
      }

      if (signIn?.createdSessionId && typeof setActive === 'function') {
        await setActive({ session: signIn.createdSessionId });
        console.log('[Auth] Session activated (signIn):', signIn.createdSessionId);
        setIsLoading(false);
        return;
      }

      if (signUp?.createdSessionId && typeof setActive === 'function') {
        await setActive({ session: signUp.createdSessionId });
        console.log('[Auth] Session activated (signUp):', signUp.createdSessionId);
        setIsLoading(false);
        return;
      }

      console.warn('[Auth] No session created, response:', { signIn, signUp, errors });
      Alert.alert('Sign In Failed', errors?.map?.(e => e?.message).join('\n') || 'Could not complete sign in (no session). Check console.');
    } catch (err) {
      // Handle the exact TypeError you saw and show more context
      console.error('[Auth] OAuth exception:', err);
      if (err && err.message && err.message.includes("href")) {
        console.error('[Auth] Likely a redirect URL / proxy mismatch. Check printed redirect URLs and ensure they are added to Clerk allowlist and Google redirect URIs.');
      }
      Alert.alert('Sign In Failed', 'Unexpected error — check console logs.');
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
          {isLoading ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.buttonText}>Continue with Google</Text>}
        </TouchableOpacity>

        <Text style={styles.terms}>By continuing, you agree to our{'\n'}Terms of Service & Privacy Policy</Text>
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
  button: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  terms: { fontSize: 12, color: COLORS.textLight, textAlign: 'center', lineHeight: 18 },
});

export default AuthScreen;
