import { Asset } from 'expo-asset';
import * as SplashScreen from 'expo-splash-screen';

// Define critical assets that must be loaded before the app starts
const criticalAssets = [
  require('../assets/images/MBSPLASH.png'),
];

// Define non-critical assets that can be loaded in the background
const nonCriticalAssets = [
  require('../assets/images/MBLOGO2.png'),
  // Add other assets here
];

// Preload critical assets
export const loadCriticalAssets = async () => {
  try {
    const assetPromises = criticalAssets.map(asset => 
      Asset.fromModule(asset).downloadAsync()
    );
    await Promise.all(assetPromises);
    return true;
  } catch (error) {
    console.error('Error loading critical assets:', error);
    return false;
  }
};

// Load non-critical assets in the background
export const loadNonCriticalAssets = () => {
  setTimeout(() => {
    nonCriticalAssets.forEach(asset => {
      Asset.fromModule(asset).downloadAsync()
        .catch(error => console.log('Non-critical asset load error:', error));
    });
  }, 2000); // Delay by 2 seconds after app is visible
};