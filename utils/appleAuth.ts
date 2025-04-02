import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from './supabaseClient';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

export function useAppleAuth() {
  const generateNonce = async () => {
    const randomString = Array.from(Crypto.getRandomValues(new Uint8Array(32)))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
    
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      randomString
    );
    
    return { rawNonce: randomString, hashedNonce };
  };

  const signInWithApple = async () => {
    try {
      if (Platform.OS !== 'ios') {
        console.log('Apple Sign In is only available on iOS');
        return null;
      }

      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        console.log('Apple Authentication is not available on this device');
        return null;
      }

      // Generate a cryptographically secure nonce
      const { rawNonce, hashedNonce } = await generateNonce();

      console.log('Starting Apple Sign In flow...');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        console.error('No identity token received from Apple');
        return null;
      }

      console.log('Got Apple identity token, exchanging with Supabase...');
      
      // Exchange the Apple credential for a Supabase session
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      });

      if (error) {
        console.error('Supabase error during Apple sign in:', error);
        throw error;
      }
      
      console.log('Successfully signed in with Apple');
      return data;
    } catch (error) {
      if (error.code === 'ERR_CANCELED') {
        console.log('User canceled Apple sign in');
        return null;
      }
      
      if (error.code === 'ERR_APPLE_AUTHENTICATION_UNAVAILABLE') {
        console.log('Apple Authentication is not available on this device');
        return null;
      }
      
      console.error('Error signing in with Apple:', {
        code: error.code,
        message: error.message,
        name: error.name
      });
      throw error;
    }
  };

  const isAppleAuthAvailable = async () => {
    try {
      if (Platform.OS !== 'ios') {
        return false;
      }
      return await AppleAuthentication.isAvailableAsync();
    } catch (error) {
      console.error('Error checking Apple authentication availability:', error);
      return false;
    }
  };

  return {
    signInWithApple,
    isAppleAuthAvailable,
  };
}
