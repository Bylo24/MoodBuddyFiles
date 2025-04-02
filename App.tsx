import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator, Platform, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { theme } from './theme/theme';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import SetupNameScreen from './screens/SetupNameScreen';
import IntroductionScreen from './screens/IntroductionScreen';
import TipsScreen from './screens/TipsScreen';
import SubscriptionComparisonScreen from './screens/SubscriptionComparisonScreen';
import GuidedExercisesScreen from './screens/GuidedExercisesScreen';
import ExerciseCategoryScreen from './screens/ExerciseCategoryScreen';
import ExercisePlayerScreen from './screens/ExercisePlayerScreen';
import StreakRewardsScreen from './screens/StreakRewardsScreen';
import MoodPredictionsScreen from './screens/MoodPredictionsScreen';
import AdvancedMoodAnalyticsScreen from './screens/AdvancedMoodAnalyticsScreen';
import TermsOfServiceScreen from './screens/TermsOfServiceScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import AboutScreen from './screens/AboutScreen';
import JournalScreen from './screens/JournalScreen';
import { isAuthenticated, signOut, getCurrentUser, isDemoUser } from './services/authService';
import { supabase } from './utils/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { getUserFirstName } from './services/userProfileService';
import * as SplashScreen from 'expo-splash-screen';
import { getTodayMoodEntry } from './services/moodService';
import { getCurrentSubscriptionTier } from './services/subscriptionService';
import { loadCriticalAssets, loadNonCriticalAssets } from './utils/assetLoader';
import { checkSession } from './utils/supabaseClient';

SplashScreen.preventAutoHideAsync();

type RootStackParamList = {
  Login: undefined;
  SetupName: undefined;
  Introduction: { userName: string };
  Tips: undefined;
  Home: undefined;
  Journal: undefined;
  SubscriptionComparison: { source: 'limit' | 'upgrade' | 'settings' | 'manage' };
  GuidedExercises: { isPremium: boolean };
  ExerciseCategory: { 
    category: 'meditation' | 'breathing' | 'mindfulness' | 'physical';
    isPremium: boolean;
  };
  ExercisePlayer: { exerciseId: string };
  StreakRewards: { isPremium: boolean };
  MoodPredictions: { isPremium: boolean };
  AdvancedMoodAnalytics: { isPremium: boolean };
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  About: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [initialRouteName, setInitialRouteName] = useState<keyof RootStackParamList>('Login');
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [preloadedHomeData, setPreloadedHomeData] = useState<any>(null);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  
  const navigationRef = useRef<any>(null);
  const notificationResponseRef = useRef<Notifications.NotificationResponse | null>(null);
  const notificationSetupDone = useRef(false);
  
  useEffect(() => {
    if (notificationSetupDone.current) return;
    
    const setupNotifications = async () => {
      try {
        notificationSetupDone.current = true;
        
        const subscription = Notifications.addNotificationReceivedListener(notification => {
          console.log('Notification received in foreground!', notification);
        });
        
        const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
          console.log('Notification response received!', response);
          notificationResponseRef.current = response;
          
          if (navigationRef.current && !isLoading) {
            handleNotificationResponse(response);
          }
        });
        
        setTimeout(() => {
          import('./services/notificationService').then(({ 
            requestNotificationPermissions, 
            initializeNotifications,
            checkScheduledNotifications 
          }) => {
            Promise.all([
              requestNotificationPermissions(),
              initializeNotifications(),
              checkScheduledNotifications()
            ]).catch(err => console.error('Notification setup error:', err));
          });
        }, 2000);
        
        return () => {
          subscription.remove();
          responseSubscription.remove();
        };
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };
    
    setupNotifications();
  }, []);
  
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN') {
        console.log('User signed in, checking onboarding status');
        checkOnboardingStatus();
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        console.log('User signed out, updating UI');
        setInitialRouteName('Login');
        setIsLoading(false);
        SplashScreen.hideAsync();
      }
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const authenticated = await isAuthenticated();
        console.log('Authentication check result:', authenticated);
        
        if (authenticated) {
          const assetPromise = loadCriticalAssets();
          const authPromise = isAuthenticated();
          
          const [assetsReady, authenticated] = await Promise.all([assetPromise, authPromise]);
          
          setAssetsLoaded(assetsReady);
          
          if (authenticated) {
            const preloadPromise = preloadMinimalHomeData();
            
            // Load non-critical assets in the background
            loadNonCriticalAssets();
            
            const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
            console.log('Onboarding completed:', onboardingCompleted);
            
            if (onboardingCompleted === 'true') {
              console.log('User has completed onboarding, proceeding to home');
              
              const firstName = await getUserFirstName();
              setUserName(firstName);
              
              await preloadPromise;
              
              setInitialRouteName('Home');
            } else {
              if (isNewUser) {
                const firstName = await getUserFirstName();
                
                if (firstName && firstName !== 'Friend') {
                  setUserName(firstName);
                  setInitialRouteName('Introduction');
                } else {
                  setInitialRouteName('SetupName');
                }
              } else {
                console.log('Returning user, skipping onboarding');
                await AsyncStorage.setItem('onboarding_completed', 'true');
                
                const firstName = await getUserFirstName();
                setUserName(firstName);
                
                await preloadPromise;
                
                setInitialRouteName('Home');
              }
            }
          } else {
            setInitialRouteName('Login');
          }
        } else {
          setInitialRouteName('Login');
        }
      } catch (error) {
        console.error('Error during app initialization:', error);
        setError(error as Error);
        setInitialRouteName('Login');
      } finally {
        setIsLoading(false);
        SplashScreen.hideAsync();
      }
    };
    
    initializeApp();
  }, [isNewUser]);
  
  const preloadMinimalHomeData = async () => {
    try {
      console.log('Preloading minimal HomeScreen data...');
      
      const [firstName, todayEntry, subscriptionTier] = await Promise.all([
        getUserFirstName(),
        getTodayMoodEntry(),
        getCurrentSubscriptionTier()
      ]);
      
      setPreloadedHomeData({
        userName: firstName || 'Friend',
        todayMood: todayEntry ? todayEntry.rating : null,
        lastMoodDetails: todayEntry ? todayEntry.emotion_details || '' : '',
        isPremium: subscriptionTier === 'premium',
        hasMoodInput: !!todayEntry,
        streak: 0,
        weeklyMoodEntries: [],
        todayMoodEntries: [],
        weeklyAverage: null,
        activities: null
      });
      
      console.log('Minimal HomeScreen data preloaded successfully');
      return true;
    } catch (error) {
      console.error('Error preloading minimal HomeScreen data:', error);
      return false;
    }
  };
  
  const checkOnboardingStatus = async () => {
    try {
      console.log('Checking onboarding status...');
      
      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      console.log('Onboarding completed:', onboardingCompleted);
      
      if (onboardingCompleted === 'true') {
        console.log('User has completed onboarding, proceeding to home');
        
        const firstName = await getUserFirstName();
        setUserName(firstName);
        console.log('Using name from Supabase/AsyncStorage:', firstName);
        
        setInitialRouteName('Home');
      } else {
        if (isNewUser) {
          const firstName = await getUserFirstName();
          
          if (firstName && firstName !== 'Friend') {
            setUserName(firstName);
            setInitialRouteName('Introduction');
            console.log('User has name but needs to complete onboarding, going to Introduction');
          } else {
            console.log('User needs to complete onboarding, going to SetupName');
            setInitialRouteName('SetupName');
          }
        } else {
          console.log('Returning user, skipping onboarding');
          await AsyncStorage.setItem('onboarding_completed', 'true');
          
          const firstName = await getUserFirstName();
          setUserName(firstName);
          console.log('Using name for returning user:', firstName);
          
          setInitialRouteName('Home');
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setInitialRouteName('SetupName');
    } finally {
      setIsLoading(false);
      SplashScreen.hideAsync();
    }
  };
  
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    console.log('Handling notification response:', response);
    
    if (navigationRef.current) {
      navigationRef.current.navigate('Home');
    }
  };
  
  const handleLogin = useCallback(async (isSignUp: boolean) => {
    console.log('Login successful, isSignUp:', isSignUp);
    setIsNewUser(isSignUp);
    
    console.log('Navigating to Home screen');
    setInitialRouteName('Home');
    
    if (isNavigationReady && navigationRef.current) {
      console.log('Navigation is ready, navigating programmatically to Home');
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
    
    setIsLoading(false);
    
    setTimeout(() => {
      import('./services/notificationService').then(({ initializeNotifications }) => {
        initializeNotifications();
      });
    }, 2000);
  }, [isNavigationReady]);
  
  const handleLogout = useCallback(async () => {
    try {
      console.log('Logging out...');
      await signOut();
      console.log('Logout successful, updating UI');
      setInitialRouteName('Login');
      
      if (navigationRef.current) {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  }, []);
  
  const handleNavigationReady = useCallback(() => {
    console.log('Navigation is ready');
    setIsNavigationReady(true);
  }, []);

  if (error) {
    SplashScreen.hideAsync().catch(() => {});
    
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingContainer}>
          <StatusBar style="light" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error.message}</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => {
              setError(null);
              setIsLoading(true);
              checkOnboardingStatus();
            }}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }
  
  if (isLoading) {
    return null;
  }
  
  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={handleNavigationReady}
      >
        <StatusBar style="light" />
        <Stack.Navigator 
          initialRouteName={initialRouteName}
          screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            animation: 'fade_from_bottom',
            animationDuration: 200
          }}
        >
          <Stack.Screen name="Login">
            {props => <LoginScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
          
          <Stack.Screen name="SetupName">
            {props => (
              <SetupNameScreen 
                {...props}
                onComplete={(name) => {
                  setUserName(name);
                  props.navigation.navigate('Introduction');
                }}
                onSkip={() => {
                  props.navigation.navigate('Introduction');
                }}
              />
            )}
          </Stack.Screen>
          
          <Stack.Screen name="Introduction" initialParams={{ userName }}>
            {props => (
              <IntroductionScreen 
                {...props}
                onComplete={() => props.navigation.navigate('Tips')}
                userName={userName}
              />
            )}
          </Stack.Screen>
          
          <Stack.Screen name="Tips">
            {props => (
              <TipsScreen 
                {...props}
                onComplete={async () => {
                  await AsyncStorage.setItem('onboarding_completed', 'true');
                  props.navigation.navigate('Home');
                }}
              />
            )}
          </Stack.Screen>
          
          <Stack.Screen name="Home">
            {props => (
              <HomeScreen 
                {...props}
                onLogout={handleLogout}
                preloadedData={preloadedHomeData}
              />
            )}
          </Stack.Screen>
          
          <Stack.Screen name="Journal" component={JournalScreen} />
          
          <Stack.Screen name="SubscriptionComparison">
            {props => (
              <SubscriptionComparisonScreen 
                onClose={() => props.navigation.goBack()}
                showCloseButton={true}
                source={props.route.params?.source || 'upgrade'}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="GuidedExercises">
            {props => (
              <GuidedExercisesScreen 
                {...props}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="ExerciseCategory">
            {props => (
              <ExerciseCategoryScreen 
                {...props}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="ExercisePlayer">
            {props => (
              <ExercisePlayerScreen 
                {...props}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="StreakRewards">
            {props => (
              <StreakRewardsScreen 
                {...props}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="MoodPredictions">
            {props => (
              <MoodPredictionsScreen 
                {...props}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="AdvancedMoodAnalytics">
            {props => (
              <AdvancedMoodAnalyticsScreen 
                {...props}
              />
            )}
          </Stack.Screen>
          
          <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
          
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          
          <Stack.Screen name="About" component={AboutScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.subtext,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
