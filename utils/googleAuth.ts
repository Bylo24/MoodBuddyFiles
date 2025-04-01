import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { supabase } from './supabaseClient';
import { Platform } from 'react-native';

// Register WebBrowser for handling OAuth
WebBrowser.maybeCompleteAuthSession();

// Create Google auth hook
export function useGoogleAuth() {
  // Use default empty strings if environment variables are not set
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
  
  // Add detailed debug logging
  console.log('Environment Variables Check:', {
    androidClientId: androidClientId || 'NOT SET',
    iosClientId: iosClientId || 'NOT SET',
    webClientId: webClientId || 'NOT SET',
    platform: Platform.OS,
    redirectUri: Platform.select({
      ios: 'com.itsbylo.moodbuddy:/oauth2redirect',
      android: 'com.moodbuddy.app:/oauth2redirect',
      default: 'https://auth.expo.io/@itsbylo/user-app'
    })
  });

  // Use the appropriate client ID based on platform
  const clientId = Platform.select({
    ios: iosClientId,
    android: androidClientId,
    default: webClientId,
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: webClientId,
    androidClientId,
    iosClientId,
    // Update redirect URIs to match app configuration
    redirectUri: Platform.select({
      ios: 'com.itsbylo.moodbuddy:/oauth2redirect',
      android: 'com.moodbuddy.app:/oauth2redirect',
      default: 'https://auth.expo.io/@itsbylo/user-app'
    }),
    scopes: ['profile', 'email']
  });

  const signInWithGoogle = async () => {
    try {
      // Check if client IDs are configured
      if (!clientId) {
        console.error('Google Sign-In is not configured for this platform');
        throw new Error('Google Sign-In is not configured for this platform');
      }
      
      console.log('Starting Google Sign-In flow...');
      console.log('Using client ID:', clientId);
      
      const result = await promptAsync();
      console.log('Google Sign-In result type:', result?.type);
      
      if (result?.type === 'success') {
        const { authentication } = result;
        
        if (!authentication || !authentication.idToken) {
          console.error('No ID token received from Google');
          throw new Error('Failed to get authentication token from Google');
        }
        
        console.log('Got Google ID token, exchanging with Supabase...');
        
        // Exchange the Google access token for a Supabase session
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: authentication.idToken,
          nonce: request?.nonce,
        });

        if (error) {
          console.error('Supabase error during Google sign in:', error);
          throw error;
        }
        
        console.log('Successfully signed in with Google');
        return data;
      } else if (result?.type === 'cancel') {
        console.log('User canceled Google sign in');
        return null;
      } else {
        console.error('Google sign in failed:', result);
        throw new Error('Google sign in failed');
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  return {
    signInWithGoogle,
    isLoading: !request,
  };
}
