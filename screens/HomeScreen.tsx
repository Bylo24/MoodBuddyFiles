import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Dimensions, 
  SafeAreaView, 
  StatusBar, 
  AppState, 
  ActivityIndicator, 
  TouchableOpacity,
  Animated
} from 'react-native';
import { theme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import MoodSlider from '../components/MoodSlider';
import ActivityCard from '../components/ActivityCard';
import MoodTrendGraph from '../components/MoodTrendGraph';
import QuoteComponent from '../components/QuoteComponent';
import Header from '../components/Header';
import ProfileModal from '../components/ProfileModal';
import PremiumFeatureBadge from '../components/PremiumFeatureBadge';
import { MoodRating, Activity } from '../types';
import { getTodayMoodEntry, getRecentMoodEntries, getMoodStreak, getWeeklyAverageMood, getCurrentWeekMoodEntries, getTodayDetailedMoodEntries } from '../services/moodService';
import { getCurrentUser, isAuthenticated } from '../services/authService';
import { getCurrentSubscriptionTier } from '../services/subscriptionService';
import { supabase } from '../utils/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getActivityRecommendations } from '../services/geminiService';
import { LinearGradient } from 'expo-linear-gradient';
import { getUserFirstName } from '../services/userProfileService';

const { width: screenWidth } = Dimensions.get('window');

interface HomeScreenProps {
  onLogout: () => void;
  navigation: any;
  preloadedData?: any;
}

type TimePeriod = 'day' | 'week';

export default function HomeScreen({ onLogout, navigation, preloadedData }: HomeScreenProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const activitiesSectionRef = useRef<View>(null);
  const featureAnimations = useRef<{ [key: string]: Animated.Value }>({
    journal: new Animated.Value(1),
    exercises: new Animated.Value(1),
    analytics: new Animated.Value(1),
    predictions: new Animated.Value(1),
    upgrade: new Animated.Value(1)
  }).current;

  const [selectedMood, setSelectedMood] = useState<MoodRating | null>(preloadedData?.todayMood || null);
  const [userName, setUserName] = useState<string>(preloadedData?.userName || '');
  const [isLoading, setIsLoading] = useState(!preloadedData);
  const [streak, setStreak] = useState(preloadedData?.streak || 0);
  const [weeklyAverage, setWeeklyAverage] = useState<number | null>(preloadedData?.weeklyAverage || null);
  const [weeklyMoodEntries, setWeeklyMoodEntries] = useState<any[]>(preloadedData?.weeklyMoodEntries || []);
  const [todayMood, setTodayMood] = useState<MoodRating | null>(preloadedData?.todayMood || null);
  const [isSliderDisabled, setIsSliderDisabled] = useState(false);
  const [activities, setActivities] = useState<Activity[] | null>(preloadedData?.activities || null);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isPremium, setIsPremium] = useState(preloadedData?.isPremium || false);
  const [todayMoodEntries, setTodayMoodEntries] = useState<any[]>(preloadedData?.todayMoodEntries || []);
  const [hasMoodInput, setHasMoodInput] = useState(preloadedData?.hasMoodInput || false);
  const [lastMoodDetails, setLastMoodDetails] = useState<string>(preloadedData?.lastMoodDetails || '');
  const [showAllMoodEntries, setShowAllMoodEntries] = useState(false);
  const [trendGraphKey, setTrendGraphKey] = useState(0);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [quoteKey, setQuoteKey] = useState(Date.now());
  const [summaryTimePeriod, setSummaryTimePeriod] = useState<TimePeriod>('day');
  const [dateOffset, setDateOffset] = useState(0);
  const [historicalMoodData, setHistoricalMoodData] = useState<any>({
    dayMood: null,
    weekAverage: null,
    entries: [],
  });
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(!preloadedData);
  const [isLoadingSecondary, setIsLoadingSecondary] = useState(!preloadedData);
  const [isLoadingBackgroundData, setIsLoadingBackgroundData] = useState(true);

  const animateButtonPress = (key: string, pressed: boolean) => {
    Animated.spring(featureAnimations[key], {
      toValue: pressed ? 0.9 : 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true
    }).start();
  };

  const scrollToActivities = () => {
    setTimeout(() => {
      if (scrollViewRef.current && activitiesSectionRef.current) {
        activitiesSectionRef.current.measureLayout(
          scrollViewRef.current.getInnerViewNode(),
          (_x: number, y: number) => {
            scrollViewRef.current?.scrollTo({ y, animated: true });
          },
          () => console.log('Failed to measure layout')
        );
      }
    }, 100);
  };

  const getCurrentDate = useCallback(() => {
    const date = new Date();
    if (summaryTimePeriod === 'day') {
      date.setDate(date.getDate() - dateOffset);
    } else {
      date.setDate(date.getDate() - (dateOffset * 7));
    }
    return date;
  }, [dateOffset, summaryTimePeriod]);

  const formatCurrentDate = useCallback(() => {
    const date = getCurrentDate();
    
    if (summaryTimePeriod === 'day') {
      if (dateOffset === 0) {
        return "Today";
      } else if (dateOffset === 1) {
        return "Yesterday";
      }
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
    } else {
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short' });
      const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' });
      
      const startDay = startOfWeek.getDate();
      const endDay = endOfWeek.getDate();
      
      if (dateOffset === 0) {
        return "This Week";
      } else if (dateOffset === 1) {
        return "Last Week";
      }
      
      if (startMonth === endMonth) {
        return `${startMonth} ${startDay}-${endDay}`;
      }
      
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    }
  }, [dateOffset, summaryTimePeriod, getCurrentDate]);

  const canNavigateForward = dateOffset > 0;

  const navigateToPrevious = () => {
    setDateOffset(prev => prev + 1);
  };

  const navigateToNext = () => {
    if (canNavigateForward) {
      setDateOffset(prev => prev - 1);
    }
  };

  const resetToToday = () => {
    setDateOffset(0);
  };

  const loadHistoricalMoodData = useCallback(async () => {
    if (dateOffset === 0) {
      return;
    }
    
    setIsLoadingHistorical(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No active session found, skipping historical data load');
        setIsLoadingHistorical(false);
        return;
      }
      
      const targetDate = getCurrentDate();
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      if (summaryTimePeriod === 'day') {
        const { data: dayEntries, error: dayError } = await supabase
          .from('mood_entries')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('date', targetDateStr)
          .order('time', { ascending: true });
          
        if (dayError) {
          console.error('Error fetching historical day data:', dayError);
        } else {
          let dayAverage = null;
          if (dayEntries && dayEntries.length > 0) {
            const sum = dayEntries.reduce((total, entry) => total + entry.rating, 0);
            dayAverage = Math.round(sum / dayEntries.length);
          }
          
          setHistoricalMoodData({
            dayMood: dayAverage,
            entries: dayEntries || [],
            weekAverage: null,
          });
        }
        
        const sevenDaysAgo = new Date(targetDate);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const startDate = sevenDaysAgo.toISOString().split('T')[0];
        
        const { data: weekEntries, error: weekError } = await supabase
          .from('mood_entries')
          .select('*')
          .eq('user_id', session.user.id)
          .gte('date', startDate)
          .lte('date', targetDateStr)
          .order('date', { ascending: false });
          
        if (weekError) {
          console.error('Error fetching historical week data:', weekError);
        } else if (weekEntries && weekEntries.length > 0) {
          const sum = weekEntries.reduce((total, entry) => total + entry.rating, 0);
          const avg = sum / weekEntries.length;
          
          setHistoricalMoodData(prev => ({
            ...prev,
            weekAverage: avg,
          }));
        }
      } else {
        const startOfWeek = new Date(targetDate);
        startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        const startDateStr = startOfWeek.toISOString().split('T')[0];
        const endDateStr = endOfWeek.toISOString().split('T')[0];
        
        const { data: weekEntries, error: weekError } = await supabase
          .from('mood_entries')
          .select('*')
          .eq('user_id', session.user.id)
          .gte('date', startDateStr)
          .lte('date', endDateStr)
          .order('date', { ascending: true });
          
        if (weekError) {
          console.error('Error fetching historical week data:', weekError);
        } else {
          setHistoricalMoodData({
            dayMood: null,
            entries: weekEntries || [],
            weekAverage: null,
          });
        }
      }
    } catch (error) {
      console.error('Error loading historical mood data:', error);
    } finally {
      setIsLoadingHistorical(false);
      setIsLoadingSecondary(false);
      console.log('Background data loaded successfully');
    }
  }, [dateOffset, summaryTimePeriod, getCurrentDate]);

  useEffect(() => {
    if (preloadedData) {
      console.log('Using preloaded data for HomeScreen');
      
      // Set initial state from preloaded data
      setUserName(preloadedData.userName);
      setTodayMood(preloadedData.todayMood);
      setSelectedMood(preloadedData.todayMood);
      setHasMoodInput(preloadedData.hasMoodInput);
      setLastMoodDetails(preloadedData.lastMoodDetails);
      setIsPremium(preloadedData.isPremium);
      
      // Set initial values for other state that will be updated in background
      setStreak(preloadedData.streak);
      setWeeklyMoodEntries(preloadedData.weeklyMoodEntries);
      setTodayMoodEntries(preloadedData.todayMoodEntries);
      setWeeklyAverage(preloadedData.weeklyAverage);
      setActivities(preloadedData.activities);
      
      // No need for initial loading screen
      setIsLoadingInitial(false);
      
      // Load remaining data in background
      loadBackgroundData();
    } else {
      // If no preloaded data, load everything normally
      loadInitialData();
    }
  }, [preloadedData]);

  const loadBackgroundData = async () => {
    try {
      console.log('Loading background data...');
      setIsLoadingBackgroundData(true);
      
      // Load streak, weekly data, and detailed entries
      const [streakCount, weeklyMoodData, detailedEntries] = await Promise.all([
        getMoodStreak(),
        getCurrentWeekMoodEntries(),
        getTodayDetailedMoodEntries()
      ]);
      
      setStreak(streakCount);
      setWeeklyMoodEntries(weeklyMoodData);
      setTodayMoodEntries(detailedEntries);
      
      // Calculate weekly average
      if (weeklyMoodData.length > 0) {
        const sum = weeklyMoodData.reduce((total, entry) => total + entry.rating, 0);
        setWeeklyAverage(sum / weeklyMoodData.length);
      }
      
      // Load activity recommendations if needed
      if (preloadedData.todayMood && !preloadedData.activities) {
        if (preloadedData.lastMoodDetails && preloadedData.lastMoodDetails.trim() !== '') {
          await generateRecommendationsWithDetails(preloadedData.todayMood, preloadedData.lastMoodDetails);
        } else {
          await generateRecommendationsBasedOnMood(preloadedData.todayMood);
        }
      }
      
      setIsLoadingBackgroundData(false);
      setIsLoadingSecondary(false);
      console.log('Background data loaded successfully');
    } catch (error) {
      console.error('Error loading background data:', error);
      setIsLoadingBackgroundData(false);
      setIsLoadingSecondary(false);
    }
  };

  const loadInitialData = async () => {
    try {
      const isLoggedIn = await isAuthenticated();
      if (!isLoggedIn) {
        onLogout();
        return;
      }

      // Load critical data first
      const [firstName, todayEntry] = await Promise.all([
        getUserFirstName(),
        getTodayMoodEntry()
      ]);

      setUserName(firstName || 'Friend');
      if (todayEntry) {
        setTodayMood(todayEntry.rating);
        setSelectedMood(todayEntry.rating);
        setHasMoodInput(true);
        setLastMoodDetails(todayEntry.emotion_details || '');
      }

      // Show the screen as soon as we have the critical data
      setIsLoadingInitial(false);

      // Start loading activity recommendations if we have a mood entry
      if (todayEntry) {
        if (todayEntry.emotion_details && todayEntry.emotion_details.trim() !== '') {
          generateRecommendationsWithDetails(todayEntry.rating, todayEntry.emotion_details);
        } else {
          generateRecommendationsBasedOnMood(todayEntry.rating);
        }
      }

      // Load secondary data in the background
      loadSecondaryData();
    } catch (error) {
      console.error('Error loading initial data:', error);
      setIsLoadingInitial(false);
    }
  };

  const loadSecondaryData = async () => {
    try {
      const [
        subscriptionTier,
        streakCount,
        weeklyMoodData,
        detailedEntries
      ] = await Promise.all([
        getCurrentSubscriptionTier(),
        getMoodStreak(),
        getCurrentWeekMoodEntries(),
        getTodayDetailedMoodEntries()
      ]);

      setIsPremium(subscriptionTier === 'premium');
      setStreak(streakCount);
      setWeeklyMoodEntries(weeklyMoodData);
      setTodayMoodEntries(detailedEntries);

      if (weeklyMoodData.length > 0) {
        const sum = weeklyMoodData.reduce((total, entry) => total + entry.rating, 0);
        setWeeklyAverage(sum / weeklyMoodData.length);
      }

      setIsLoadingSecondary(false);
    } catch (error) {
      console.error('Error loading secondary data:', error);
      setIsLoadingSecondary(false);
    }
  };

  const generateRecommendationsBasedOnMood = async (moodRating: MoodRating) => {
    try {
      setIsLoadingActivities(true);
      
      const recommendedActivities = await getActivityRecommendations(moodRating, "");
      setActivities(recommendedActivities);
    } catch (error) {
      console.error('Error getting activity recommendations based on mood:', error);
      setActivities(null);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const generateRecommendationsWithDetails = async (moodRating: MoodRating, details: string) => {
    try {
      setIsLoadingActivities(true);
      
      const recommendedActivities = await getActivityRecommendations(moodRating, details);
      setActivities(recommendedActivities);
    } catch (error) {
      console.error('Error getting activity recommendations with details:', error);
      setActivities(null);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const refreshRecommendations = async () => {
    if (!todayMood) return;
    
    if (!isPremium) {
      const hasUpdated = await AsyncStorage.getItem('free_user_mood_updated');
      if (hasUpdated === 'true') {
        navigation.navigate('SubscriptionComparison', { source: 'limit' });
        return;
      }
    }
    
    setIsLoadingActivities(true);
    try {
      if (lastMoodDetails && lastMoodDetails.trim() !== '') {
        await generateRecommendationsWithDetails(todayMood, lastMoodDetails);
      } else {
        await generateRecommendationsBasedOnMood(todayMood);
      }
      
      if (!isPremium) {
        await AsyncStorage.setItem('free_user_mood_updated', 'true');
      }
      
      scrollToActivities();
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      setActivities(null);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const handleMoodChange = (mood: MoodRating | null) => {
    console.log('Mood changed in HomeScreen:', mood);
    setSelectedMood(mood);
    
    if (todayMood !== null) {
      setTodayMood(mood);
    }
  };

  const handleMoodSaved = async () => {
    console.log('Mood saved, refreshing data...');
    
    const refreshData = async () => {
      try {
        // Refresh mood data
        const [todayEntry, streakCount, weeklyMoodData, detailedEntries] = await Promise.all([
          getTodayMoodEntry(),
          getMoodStreak(),
          getCurrentWeekMoodEntries(),
          getTodayDetailedMoodEntries()
        ]);
        
        if (todayEntry) {
          setTodayMood(todayEntry.rating);
          setSelectedMood(todayEntry.rating);
          setHasMoodInput(true);
          setLastMoodDetails(todayEntry.emotion_details || '');
        }
        
        setStreak(streakCount);
        setWeeklyMoodEntries(weeklyMoodData);
        setTodayMoodEntries(detailedEntries);
        
        if (weeklyMoodData.length > 0) {
          const sum = weeklyMoodData.reduce((total, entry) => total + entry.rating, 0);
          setWeeklyAverage(sum / weeklyMoodData.length);
        }
        
        // Refresh trend graph
        setTrendGraphKey(prevKey => prevKey + 1);
        
      } catch (error) {
        console.error('Error refreshing mood data:', error);
      }
    };
    await refreshData();
    
    setHasMoodInput(true);
    setDateOffset(0);
  };

  const handleMoodDetailsSubmitted = async (rating: MoodRating, details: string) => {
    console.log('Mood details submitted:', { rating, details });
    setIsLoadingActivities(true);
    
    try {
      setLastMoodDetails(details);
      
      const recommendedActivities = await getActivityRecommendations(rating, details);
      setActivities(recommendedActivities);
      setHasMoodInput(true);
      
      scrollToActivities();
    } catch (error) {
      console.error('Error getting activity recommendations:', error);
      setActivities(null);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const handleProfilePress = () => {
    setProfileModalVisible(true);
  };

  const handleProfileModalClose = () => {
    setProfileModalVisible(false);
    
    const updateUserName = async () => {
      try {
        const firstName = await getUserFirstName();
        setUserName(firstName || 'Friend');
      } catch (error) {
        console.error('Error updating user name:', error);
      }
    };
    updateUserName();
    
    const refreshData = async () => {
      try {
        // Refresh mood data
        const [todayEntry, streakCount, weeklyMoodData, detailedEntries] = await Promise.all([
          getTodayMoodEntry(),
          getMoodStreak(),
          getCurrentWeekMoodEntries(),
          getTodayDetailedMoodEntries()
        ]);
        
        if (todayEntry) {
          setTodayMood(todayEntry.rating);
          setSelectedMood(todayEntry.rating);
          setHasMoodInput(true);
          setLastMoodDetails(todayEntry.emotion_details || '');
        }
        
        setStreak(streakCount);
        setWeeklyMoodEntries(weeklyMoodData);
        setTodayMoodEntries(detailedEntries);
        
        if (weeklyMoodData.length > 0) {
          const sum = weeklyMoodData.reduce((total, entry) => total + entry.rating, 0);
          setWeeklyAverage(sum / weeklyMoodData.length);
        }
        
        // Refresh trend graph
        setTrendGraphKey(prevKey => prevKey + 1);
        
      } catch (error) {
        console.error('Error refreshing mood data:', error);
      }
    };
    refreshData();
    
    const checkSubscription = async () => {
      try {
        const tier = await getCurrentSubscriptionTier();
        setIsPremium(tier === 'premium');
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    };
    checkSubscription();
  };

  const navigateToSubscription = () => {
    navigation.navigate('SubscriptionComparison', { source: 'upgrade' });
  };

  const toggleMoodEntries = () => {
    setShowAllMoodEntries(!showAllMoodEntries);
  };

  const toggleTimePeriod = () => {
    setSummaryTimePeriod(summaryTimePeriod === 'day' ? 'week' : 'day');
    setDateOffset(0);
  };

  function getMoodEmoji(rating: number | null): string {
    if (rating === null) return '–';
    switch (rating) {
      case 1: return '😢';
      case 2: return '😕';
      case 3: return '😐';
      case 4: return '🙂';
      case 5: return '😄';
      default: return '–';
    }
  }

  function getMoodColor(rating: number | null): string {
    if (rating === null) return theme.colors.text;
    switch (rating) {
      case 1: return theme.colors.mood1;
      case 2: return theme.colors.mood2;
      case 3: return theme.colors.mood3;
      case 4: return theme.colors.mood4;
      case 5: return theme.colors.mood5;
      default: return theme.colors.text;
    }
  }

  function formatTime(timeString: string): string {
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      return time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch (e) {
      return timeString;
    }
  }

  const navigateToJournal = () => {
    if (isPremium) {
      navigation.navigate('Journal');
    } else {
      navigateToSubscription();
    }
  };

  const navigateToExercises = () => {
    if (isPremium) {
      navigation.navigate('GuidedExercises', { isPremium });
    } else {
      navigateToSubscription();
    }
  };

  const navigateToAnalytics = () => {
    if (isPremium) {
      navigation.navigate('AdvancedMoodAnalytics', { isPremium });
    } else {
      navigateToSubscription();
    }
  };

  const navigateToStreakRewards = () => {
    if (isPremium) {
      navigation.navigate('StreakRewards', { isPremium });
    } else {
      navigateToSubscription();
    }
  };

  const navigateToPredictions = () => {
    if (isPremium) {
      navigation.navigate('MoodPredictions', { isPremium });
    } else {
      navigateToSubscription();
    }
  };

  const renderLoadingIndicator = (section: string) => {
    return null;
  };

  if (isLoadingInitial && !preloadedData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your mood data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <Header 
        onProfilePress={handleProfilePress} 
        streak={streak}
        onStreakPress={navigateToStreakRewards}
      />
      
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoadingSecondary && (
          <View style={styles.secondaryLoadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.secondaryLoadingText}>Loading additional data...</Text>
          </View>
        )}
        
        <View style={styles.header}>
          <Text style={styles.greeting}>Hey {userName},</Text>
          <Text style={styles.subGreeting}>let's make today great! ✨</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>
        
        <QuoteComponent key={quoteKey} />
        
        <View style={styles.moodCheckInContainer}>
          <Text style={styles.sectionTitle}>How are you feeling today?</Text>
          <MoodSlider 
            value={selectedMood} 
            onValueChange={handleMoodChange}
            onMoodSaved={handleMoodSaved}
            onMoodDetailsSubmitted={handleMoodDetailsSubmitted}
            disabled={isSliderDisabled}
            onGenerateRecommendations={refreshRecommendations}
          />
        </View>
        
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Explore Features</Text>
          
          <LinearGradient
            colors={[theme.colors.background, theme.colors.card + '50']}
            style={styles.featuresContainer}
          >
            <View style={styles.featuresGrid}>
              <Animated.View 
                style={[
                  styles.featureCardContainer,
                  { transform: [{ scale: featureAnimations.journal }] }
                ]}
              >
                <TouchableOpacity 
                  style={styles.featureCard}
                  onPressIn={() => animateButtonPress('journal', true)}
                  onPressOut={() => animateButtonPress('journal', false)}
                  onPress={navigateToJournal}
                  activeOpacity={0.8}
                >
                  <View style={[styles.featureIconContainer, { backgroundColor: '#4CAF50' }]}>
                    <Ionicons name="journal-outline" size={28} color="white" />
                  </View>
                  <Text style={styles.featureText}>Journal</Text>
                  {!isPremium && (
                    <View style={styles.premiumBadge}>
                      <Ionicons name="star" size={10} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View 
                style={[
                  styles.featureCardContainer,
                  { transform: [{ scale: featureAnimations.exercises }] }
                ]}
              >
                <TouchableOpacity 
                  style={styles.featureCard}
                  onPressIn={() => animateButtonPress('exercises', true)}
                  onPressOut={() => animateButtonPress('exercises', false)}
                  onPress={navigateToExercises}
                  activeOpacity={0.8}
                >
                  <View style={[styles.featureIconContainer, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="flower-outline" size={28} color="white" />
                  </View>
                  <Text style={styles.featureText}>Exercises</Text>
                  {!isPremium && (
                    <View style={styles.premiumBadge}>
                      <Ionicons name="star" size={10} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View 
                style={[
                  styles.featureCardContainer,
                  { transform: [{ scale: featureAnimations.analytics }] }
                ]}
              >
                <TouchableOpacity 
                  style={styles.featureCard}
                  onPressIn={() => animateButtonPress('analytics', true)}
                  onPressOut={() => animateButtonPress('analytics', false)}
                  onPress={navigateToAnalytics}
                  activeOpacity={0.8}
                >
                  <View style={[styles.featureIconContainer, { backgroundColor: '#3F51B5' }]}>
                    <Ionicons name="bar-chart-outline" size={28} color="white" />
                  </View>
                  <Text style={styles.featureText}>Analytics</Text>
                  {!isPremium && (
                    <View style={styles.premiumBadge}>
                      <Ionicons name="star" size={10} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View 
                style={[
                  styles.featureCardContainer,
                  { transform: [{ scale: featureAnimations.predictions }] }
                ]}
              >
                <TouchableOpacity 
                  style={styles.featureCard}
                  onPressIn={() => animateButtonPress('predictions', true)}
                  onPressOut={() => animateButtonPress('predictions', false)}
                  onPress={navigateToPredictions}
                  activeOpacity={0.8}
                >
                  <View style={[styles.featureIconContainer, { backgroundColor: '#9C27B0' }]}>
                    <Ionicons name="analytics-outline" size={28} color="white" />
                  </View>
                  <Text style={styles.featureText}>Predictions</Text>
                  {!isPremium && (
                    <View style={styles.premiumBadge}>
                      <Ionicons name="star" size={10} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
              
              {!isPremium && (
                <Animated.View 
                  style={[
                    styles.featureCardContainer,
                    { transform: [{ scale: featureAnimations.upgrade }] }
                  ]}
                >
                  <TouchableOpacity 
                    style={styles.featureCard}
                    onPressIn={() => animateButtonPress('upgrade', true)}
                    onPressOut={() => animateButtonPress('upgrade', false)}
                    onPress={navigateToSubscription}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.featureIconContainer, { backgroundColor: '#FF9800' }]}>
                      <Ionicons name="diamond-outline" size={28} color="white" />
                    </View>
                    <Text style={styles.featureText}>Upgrade</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>
          </LinearGradient>
        </View>
        
        <View style={styles.moodSummaryContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Your Mood Summary</Text>
            <TouchableOpacity 
              style={styles.periodToggleButton}
              onPress={toggleTimePeriod}
            >
              <Text style={styles.periodToggleText}>
                {summaryTimePeriod === 'day' ? 'Day' : 'Week'}
              </Text>
              <Ionicons 
                name="swap-horizontal" 
                size={16} 
                color={theme.colors.primary} 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.dateNavigationContainer}>
            <TouchableOpacity 
              style={styles.dateNavButton}
              onPress={navigateToPrevious}
            >
              <Ionicons name="chevron-back" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateDisplayButton}
              onPress={resetToToday}
            >
              <Text style={styles.dateDisplayText}>{formatCurrentDate()}</Text>
              {dateOffset > 0 && (
                <Text style={styles.returnToTodayText}>Tap to return to today</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.dateNavButton,
                !canNavigateForward && styles.dateNavButtonDisabled
              ]}
              onPress={navigateToNext}
              disabled={!canNavigateForward}
            >
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={canNavigateForward ? theme.colors.primary : theme.colors.border} 
              />
            </TouchableOpacity>
          </View>
          
          {isLoadingHistorical && dateOffset > 0 ? (
            <View style={styles.historicalLoadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.historicalLoadingText}>Loading historical data...</Text>
            </View>
          ) : (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                {summaryTimePeriod === 'day' ? (
                  <>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>
                        {dateOffset === 0 ? 'Today' : dateOffset === 1 ? 'Yesterday' : 'Day'}
                      </Text>
                      <Text style={[
                        styles.summaryValue,
                        { color: getMoodColor(dateOffset === 0 ? todayMood : historicalMoodData.dayMood) }
                      ]}>
                        {getMoodEmoji(dateOffset === 0 ? todayMood : historicalMoodData.dayMood)}
                      </Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Weekly Mood</Text>
                      <Text style={[
                        styles.summaryValue,
                        { color: getMoodColor(dateOffset === 0 
                          ? (weeklyAverage ? Math.round(weeklyAverage) : null) 
                          : (historicalMoodData.weekAverage ? Math.round(historicalMoodData.weekAverage) : null)) 
                        }
                      ]}>
                        {dateOffset === 0 
                          ? (weeklyAverage ? getMoodEmoji(Math.round(weeklyAverage) as MoodRating) : '–')
                          : (historicalMoodData.weekAverage ? getMoodEmoji(Math.round(historicalMoodData.weekAverage) as MoodRating) : '–')
                        }
                      </Text>
                    </View>
                  </>
                ) : (
                  dateOffset === 0 ? (
                    weeklyMoodEntries.length > 0 ? (
                      <>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                          const dayEntries = weeklyMoodEntries.filter(entry => {
                            const entryDate = new Date(entry.date);
                            return entryDate.getDay() === index;
                          });
                          
                          let dayAverage = null;
                          if (dayEntries.length > 0) {
                            const sum = dayEntries.reduce((total, entry) => total + entry.rating, 0);
                            dayAverage = Math.round(sum / dayEntries.length);
                          }
                          
                          return (
                            <View key={day} style={styles.weekDayItem}>
                              <Text style={styles.weekDayLabel}>{day}</Text>
                              <Text style={[
                                styles.weekDayValue,
                                { color: getMoodColor(dayAverage) }
                              ]}>
                                {dayAverage ? getMoodEmoji(dayAverage as MoodRating) : '–'}
                              </Text>
                            </View>
                          );
                        })}
                      </>
                    ) : (
                      <View style={styles.noWeekDataContainer}>
                        <Text style={styles.noWeekDataText}>No weekly data available yet</Text>
                        <Text style={styles.noWeekDataSubtext}>Track your mood daily to see weekly patterns</Text>
                      </View>
                    )
                  ) : (
                    historicalMoodData.entries.length > 0 ? (
                      <>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                          const dayEntries = historicalMoodData.entries.filter(entry => {
                            const entryDate = new Date(entry.date);
                            return entryDate.getDay() === index;
                          });
                          
                          let dayAverage = null;
                          if (dayEntries.length > 0) {
                            const sum = dayEntries.reduce((total, entry) => total + entry.rating, 0);
                            dayAverage = Math.round(sum / dayEntries.length);
                          }
                          
                          return (
                            <View key={day} style={styles.weekDayItem}>
                              <Text style={styles.weekDayLabel}>{day}</Text>
                              <Text style={[
                                styles.weekDayValue,
                                { color: getMoodColor(dayAverage) }
                              ]}>
                                {dayAverage ? getMoodEmoji(dayAverage as MoodRating) : '–'}
                              </Text>
                            </View>
                          );
                        })}
                      </>
                    ) : (
                      <View style={styles.noWeekDataContainer}>
                        <Text style={styles.noWeekDataText}>No data available for this week</Text>
                        <Text style={styles.noWeekDataSubtext}>Try a different week or start tracking your mood</Text>
                      </View>
                    )
                  )
                )}
              </View>
              
              {isPremium && summaryTimePeriod === 'day' && (
                dateOffset === 0 ? (
                  todayMoodEntries.length > 0 && (
                    <View style={styles.detailedMoodContainer}>
                      <View style={styles.detailedMoodHeader}>
                        <Text style={styles.detailedMoodTitle}>Today's Mood Entries</Text>
                        {todayMoodEntries.length > 4 && (
                          <TouchableOpacity 
                            style={styles.viewMoreButton}
                            onPress={toggleMoodEntries}
                          >
                            <Text style={styles.viewMoreButtonText}>
                              {showAllMoodEntries ? 'Collapse' : 'View All'}
                            </Text>
                            <Ionicons 
                              name={showAllMoodEntries ? 'chevron-up' : 'chevron-down'} 
                              size={16} 
                              color={theme.colors.primary} 
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                      
                      <View style={styles.detailedMoodList}>
                        {(showAllMoodEntries ? todayMoodEntries : todayMoodEntries.slice(0, 4)).map((entry, index) => (
                          <View key={entry.id} style={styles.detailedMoodItem}>
                            <Text style={styles.detailedMoodTime}>{formatTime(entry.time)}</Text>
                            <Text style={[
                              styles.detailedMoodEmoji,
                              { color: getMoodColor(entry.rating) }
                            ]}>
                              {getMoodEmoji(entry.rating)}
                            </Text>
                            {entry.note && (
                              <Text style={styles.detailedMoodNote} numberOfLines={1} ellipsizeMode="tail">
                                {entry.note}
                              </Text>
                            )}
                          </View>
                        ))}
                        
                        {!showAllMoodEntries && todayMoodEntries.length > 4 && (
                          <View style={styles.hiddenEntriesIndicator}>
                            <Text style={styles.hiddenEntriesText}>
                              +{todayMoodEntries.length - 4} more entries
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      <Text style={styles.detailedMoodAverage}>
                        Daily Average: {getMoodEmoji(todayMood)} ({todayMoodEntries.length} {todayMoodEntries.length === 1 ? 'entry' : 'entries'})
                      </Text>
                    </View>
                  )
                ) : (
                  historicalMoodData.entries.length > 0 && (
                    <View style={styles.detailedMoodContainer}>
                      <View style={styles.detailedMoodHeader}>
                        <Text style={styles.detailedMoodTitle}>
                          {dateOffset === 1 ? "Yesterday's" : "Day's"} Mood Entries
                        </Text>
                        {historicalMoodData.entries.length > 4 && (
                          <TouchableOpacity 
                            style={styles.viewMoreButton}
                            onPress={toggleMoodEntries}
                          >
                            <Text style={styles.viewMoreButtonText}>
                              {showAllMoodEntries ? 'Collapse' : 'View All'}
                            </Text>
                            <Ionicons 
                              name={showAllMoodEntries ? 'chevron-up' : 'chevron-down'} 
                              size={16} 
                              color={theme.colors.primary} 
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                      
                      <View style={styles.detailedMoodList}>
                        {(showAllMoodEntries ? historicalMoodData.entries : historicalMoodData.entries.slice(0, 4)).map((entry, index) => (
                          <View key={entry.id || index} style={styles.detailedMoodItem}>
                            <Text style={styles.detailedMoodTime}>{formatTime(entry.time)}</Text>
                            <Text style={[
                              styles.detailedMoodEmoji,
                              { color: getMoodColor(entry.rating) }
                            ]}>
                              {getMoodEmoji(entry.rating)}
                            </Text>
                            {entry.note && (
                              <Text style={styles.detailedMoodNote} numberOfLines={1} ellipsizeMode="tail">
                                {entry.note}
                              </Text>
                            )}
                          </View>
                        ))}
                        
                        {!showAllMoodEntries && historicalMoodData.entries.length > 4 && (
                          <View style={styles.hiddenEntriesIndicator}>
                            <Text style={styles.hiddenEntriesText}>
                              +{historicalMoodData.entries.length - 4} more entries
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      <Text style={styles.detailedMoodAverage}>
                        Daily Average: {getMoodEmoji(historicalMoodData.dayMood)} 
                        ({historicalMoodData.entries.length} {historicalMoodData.entries.length === 1 ? 'entry' : 'entries'})
                      </Text>
                    </View>
                  )
                )
              )}
              
              <View style={styles.trendContainer}>
                <Text style={styles.trendTitle}>Your Mood Trend</Text>
                <MoodTrendGraph 
                  key={`${trendGraphKey}-${dateOffset}-${summaryTimePeriod}`} 
                  days={summaryTimePeriod === 'day' ? 5 : 7} 
                />
              </View>
            </View>
          )}
        </View>
        
        <View 
          ref={activitiesSectionRef}
          style={styles.activitiesContainer}
        >
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recommended Activities</Text>
          </View>
          
          {hasMoodInput ? (
            <>
              <Text style={styles.sectionSubtitle}>
                {lastMoodDetails.trim() !== '' ? 
                  "Based on how you described your mood" : 
                  "Based on your mood rating"}
              </Text>
              
              {isLoadingActivities ? (
                <View style={styles.activitiesLoadingContainer}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={styles.activitiesLoadingText}>Personalizing your recommendations...</Text>
                </View>
              ) : activities && activities.length > 0 ? (
                activities.map(activity => (
                  <View key={activity.id} style={styles.activityItem}>
                    <ActivityCard 
                      activity={activity} 
                      isPremiumUser={isPremium}
                      onPress={() => {
                        if (activity.isPremium && !isPremium) {
                          navigateToSubscription();
                        } else {
                          console.log('Activity pressed:', activity.title);
                        }
                      }}
                    />
                  </View>
                ))
              ) : (
                <View style={styles.noActivitiesContainer}>
                  <Ionicons name="refresh-circle-outline" size={40} color={theme.colors.subtext} />
                  <Text style={styles.noActivitiesText}>
                    Unable to load recommendations. Please try again later.
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noMoodInputContainer}>
              <Ionicons name="arrow-up-circle-outline" size={40} color={theme.colors.primary} />
              <Text style={styles.noMoodInputText}>
                Log your mood above to get personalized activity recommendations
              </Text>
              <Text style={styles.noMoodInputSubtext}>
                Your recommendations will be based on how you're feeling today
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      <ProfileModal 
        visible={profileModalVisible} 
        onClose={handleProfileModalClose}
        onLogout={onLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingHorizontal: screenWidth * 0.05,
    paddingTop: 0,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    lineHeight: 34,
  },
  subGreeting: {
    fontSize: 22,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: 4,
    lineHeight: 28,
  },
  date: {
    fontSize: 16,
    color: theme.colors.subtext,
    marginTop: 4,
    lineHeight: 22,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresContainer: {
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.medium,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCardContainer: {
    width: '48%',
    marginBottom: 16,
  },
  featureCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...theme.shadows.medium,
    position: 'relative',
    height: 120,
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...theme.shadows.medium,
    position: 'relative',
  },
  featureText: {
    fontSize: 14,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.accent,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  moodCheckInContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: 12,
    lineHeight: 26,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    ...theme.shadows.small,
    marginBottom: 8,
  },
  periodToggleText: {
    fontSize: 14,
    fontWeight: theme.fontWeights.medium,
    color: theme.colors.primary,
    marginRight: 6,
  },
  dateNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  dateNavButtonDisabled: {
    backgroundColor: theme.colors.background,
    opacity: 0.5,
  },
  dateDisplayButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 16,
    backgroundColor: theme.colors.card,
    ...theme.shadows.small,
  },
  dateDisplayText: {
    fontSize: 16,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  returnToTodayText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 2,
  },
  historicalLoadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    ...theme.shadows.medium,
  },
  historicalLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.subtext,
    textAlign: 'center',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
    marginBottom: 8,
  },
  spinningIcon: {
    opacity: 0.6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginTop: -8,
    marginBottom: 16,
    lineHeight: 20,
  },
  moodSummaryContainer: {
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.medium,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: theme.fontWeights.bold,
    lineHeight: 34,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 8,
  },
  weekDayItem: {
    alignItems: 'center',
    width: '14%',
    paddingHorizontal: 2,
  },
  weekDayLabel: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginBottom: 6,
    textAlign: 'center',
  },
  weekDayValue: {
    fontSize: 20,
    fontWeight: theme.fontWeights.bold,
    lineHeight: 26,
    textAlign: 'center',
  },
  noWeekDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  noWeekDataText: {
    fontSize: 14,
    fontWeight: theme.fontWeights.medium,
    color: theme.colors.subtext,
    textAlign: 'center',
  },
  noWeekDataSubtext: {
    fontSize: 12,
    color: theme.colors.subtext,
    textAlign: 'center',
    marginTop: 4,
  },
  trendContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 16,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  activitiesContainer: {
    marginBottom: 16,
  },
  activityItem: {
    marginBottom: 12,
  },
  activitiesLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    marginBottom: 12,
  },
  activitiesLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.subtext,
    textAlign: 'center',
    lineHeight: 20,
  },
  noMoodInputContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    marginBottom: 12,
    minHeight: 150,
  },
  noMoodInputText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: theme.fontWeights.medium,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  noMoodInputSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.subtext,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  noActivitiesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    marginBottom: 12,
    minHeight: 150,
  },
  noActivitiesText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.subtext,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.subtext,
    textAlign: 'center',
    lineHeight: 22,
  },
  detailedMoodContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 16,
  },
  detailedMoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailedMoodTitle: {
    fontSize: 16,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    lineHeight: 22,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.primary + '15',
    borderRadius: 12,
  },
  viewMoreButtonText: {
    fontSize: 12,
    fontWeight: theme.fontWeights.medium,
    color: theme.colors.primary,
    marginRight: 4,
    lineHeight: 18,
  },
  detailedMoodList: {
    marginBottom: 12,
  },
  detailedMoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
  },
  detailedMoodTime: {
    fontSize: 14,
    color: theme.colors.subtext,
    width: 70,
    lineHeight: 20,
  },
  detailedMoodEmoji: {
    fontSize: 20,
    marginHorizontal: 12,
    lineHeight: 26,
  },
  detailedMoodNote: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    paddingRight: 4,
  },
  detailedMoodAverage: {
    fontSize: 14,
    fontWeight: theme.fontWeights.medium,
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  hiddenEntriesIndicator: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: theme.colors.background + '80',
    borderRadius: 8,
    marginTop: 4,
  },
  hiddenEntriesText: {
    fontSize: 12,
    color: theme.colors.subtext,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  secondaryLoadingContainer: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    marginVertical: 8,
  },
  secondaryLoadingText: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginTop: 8,
  },
  inlineLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  inlineLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.subtext,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: screenWidth * 0.05,
    paddingTop: 0,
    paddingBottom: 32,
  },
});
