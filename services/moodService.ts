import { supabase } from '../utils/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MoodRating } from '../types';
import { getCurrentSubscriptionTier } from './subscriptionService';
import { 
  mockMoodEntries, 
  getMockTodayMoodEntry, 
  getMockRecentMoodEntries,
  getMockTodayDetailedMoodEntries,
  getMockMoodStreak
} from './mockDataService';

export interface MoodEntry {
  id?: string;
  user_id?: string;
  date: string;
  rating: MoodRating;
  details?: string;
  created_at?: string;
}

export interface DetailedMoodEntry {
  id?: string;
  user_id?: string;
  date: string;
  time?: string;
  rating: MoodRating;
  note?: string;
  emotion_details?: string;
  created_at?: string;
}

const CACHE_DURATIONS = {
  TODAY_MOOD: 60 * 60 * 1000,        // 1 hour (increased from 30 minutes)
  RECENT_ENTRIES: 2 * 60 * 60 * 1000, // 2 hours (increased from 1 hour)
  DETAILED_ENTRIES: 60 * 60 * 1000,   // 1 hour (increased from 30 minutes)
  STREAK: 4 * 60 * 60 * 1000,         // 4 hours (increased from 2 hours)
  WEEKLY_AVERAGE: 2 * 60 * 60 * 1000  // 2 hours (increased from 1 hour)
};

const CACHE_KEYS = {
  TODAY_MOOD: 'cache_today_mood',
  RECENT_ENTRIES: 'cache_recent_entries_',
  DETAILED_ENTRIES: 'cache_detailed_entries',
  STREAK: 'cache_mood_streak',
  WEEKLY_AVERAGE: 'cache_weekly_average'
};

function getLocalToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

async function isCacheValid(key: string): Promise<boolean> {
  try {
    if (memoryCache.has(key)) {
      const cache = memoryCache.get(key)!;
      const now = Date.now();
      
      let cacheDuration = CACHE_DURATIONS.TODAY_MOOD;
      if (key.startsWith(CACHE_KEYS.RECENT_ENTRIES)) {
        cacheDuration = CACHE_DURATIONS.RECENT_ENTRIES;
      } else if (key === CACHE_KEYS.DETAILED_ENTRIES) {
        cacheDuration = CACHE_DURATIONS.DETAILED_ENTRIES;
      } else if (key === CACHE_KEYS.STREAK) {
        cacheDuration = CACHE_DURATIONS.STREAK;
      } else if (key === CACHE_KEYS.WEEKLY_AVERAGE) {
        cacheDuration = CACHE_DURATIONS.WEEKLY_AVERAGE;
      }
      
      return (now - cache.timestamp) < cacheDuration;
    }
    
    const cacheTimestamp = await AsyncStorage.getItem(`${key}_timestamp`);
    if (!cacheTimestamp) return false;
    
    const timestamp = parseInt(cacheTimestamp, 10);
    const now = Date.now();
    
    let cacheDuration = CACHE_DURATIONS.TODAY_MOOD;
    if (key.startsWith(CACHE_KEYS.RECENT_ENTRIES)) {
      cacheDuration = CACHE_DURATIONS.RECENT_ENTRIES;
    } else if (key === CACHE_KEYS.DETAILED_ENTRIES) {
      cacheDuration = CACHE_DURATIONS.DETAILED_ENTRIES;
    } else if (key === CACHE_KEYS.STREAK) {
      cacheDuration = CACHE_DURATIONS.STREAK;
    } else if (key === CACHE_KEYS.WEEKLY_AVERAGE) {
      cacheDuration = CACHE_DURATIONS.WEEKLY_AVERAGE;
    }
    
    return (now - timestamp) < cacheDuration;
  } catch (error) {
    console.error('Error checking cache validity:', error);
    return false;
  }
}

async function setCache(key: string, data: any): Promise<void> {
  try {
    const timestamp = Date.now();
    
    memoryCache.set(key, { data, timestamp });
    
    setTimeout(async () => {
      try {
        await AsyncStorage.setItem(key, JSON.stringify(data));
        await AsyncStorage.setItem(`${key}_timestamp`, timestamp.toString());
      } catch (error) {
        console.error('Error setting AsyncStorage cache:', error);
      }
    }, 0);
  } catch (error) {
    console.error('Error setting cache:', error);
  }
}

async function getCache<T>(key: string): Promise<T | null> {
  try {
    const isValid = await isCacheValid(key);
    if (!isValid) return null;
    
    if (memoryCache.has(key)) {
      return memoryCache.get(key)!.data as T;
    }
    
    const data = await AsyncStorage.getItem(key);
    if (!data) return null;
    
    const parsedData = JSON.parse(data) as T;
    
    memoryCache.set(key, { 
      data: parsedData, 
      timestamp: parseInt(await AsyncStorage.getItem(`${key}_timestamp`) || '0', 10) 
    });
    
    return parsedData;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
}

const memoryCache = new Map<string, { data: any, timestamp: number }>();

export async function saveMoodEntry(rating: MoodRating, details: string = ''): Promise<MoodEntry | null> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log('No active session found when saving mood entry');
      return null;
    }
    
    const userId = session.user.id;
    
    const today = getLocalToday();
    
    const subscriptionTier = await getCurrentSubscriptionTier();
    const isPremium = subscriptionTier === 'premium';
    
    if (isPremium) {
      const { data: detailedEntry, error: detailedError } = await supabase
        .from('mood_entries_detailed')
        .insert([
          { 
            user_id: userId, 
            date: today, 
            time: new Date().toISOString().split('T')[1], 
            rating, 
            note: details,
            emotion_details: details
          }
        ])
        .select()
        .single();
      
      if (detailedError) {
        console.error('Error inserting detailed mood entry:', detailedError);
        await AsyncStorage.setItem('last_mood_rating', rating.toString());
        await AsyncStorage.setItem('last_mood_details', details);
        await AsyncStorage.setItem('last_mood_date', today);
        return null;
      }
      
      const { data: todayEntries, error: entriesError } = await supabase
        .from('mood_entries_detailed')
        .select('rating')
        .eq('user_id', userId)
        .eq('date', today);
      
      if (entriesError) {
        console.error('Error fetching today\'s mood entries:', entriesError);
        await AsyncStorage.setItem('last_mood_rating', rating.toString());
        await AsyncStorage.setItem('last_mood_details', details);
        await AsyncStorage.setItem('last_mood_date', today);
        return null;
      }
      
      const sum = todayEntries.reduce((total, entry) => total + entry.rating, 0);
      const averageRating = Math.round(sum / todayEntries.length) as MoodRating;
      
      const { data: existingEntry, error: checkError } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();
      
      let result;
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking for existing entry:', checkError);
      }
      
      if (existingEntry) {
        const { data, error } = await supabase
          .from('mood_entries')
          .update({ 
            rating: averageRating, 
            emotion_details: details || existingEntry.emotion_details,
            note: details || existingEntry.note
          })
          .eq('id', existingEntry.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating mood entry:', error);
          await AsyncStorage.setItem('last_mood_rating', rating.toString());
          await AsyncStorage.setItem('last_mood_details', details);
          await AsyncStorage.setItem('last_mood_date', today);
          return null;
        }
        
        result = data;
        console.log('Updated mood entry with new average:', data);
      } else {
        const { data, error } = await supabase
          .from('mood_entries')
          .insert([
            { 
              user_id: userId, 
              date: today, 
              rating: averageRating, 
              emotion_details: details,
              note: details
            }
          ])
          .select()
          .single();
        
        if (error) {
          console.error('Error inserting mood entry:', error);
          await AsyncStorage.setItem('last_mood_rating', rating.toString());
          await AsyncStorage.setItem('last_mood_details', details);
          await AsyncStorage.setItem('last_mood_date', today);
          return null;
        }
        
        result = data;
        console.log('Inserted new mood entry with average:', data);
      }
      
      await AsyncStorage.setItem('last_mood_rating', averageRating.toString());
      await AsyncStorage.setItem('last_mood_details', details);
      await AsyncStorage.setItem('last_mood_date', today);
      
      await AsyncStorage.removeItem(CACHE_KEYS.TODAY_MOOD);
      await AsyncStorage.removeItem(CACHE_KEYS.DETAILED_ENTRIES);
      await AsyncStorage.removeItem(CACHE_KEYS.RECENT_ENTRIES + '7');
      await AsyncStorage.removeItem(CACHE_KEYS.RECENT_ENTRIES + '30');
      await AsyncStorage.removeItem(CACHE_KEYS.WEEKLY_AVERAGE);
      await AsyncStorage.removeItem(CACHE_KEYS.STREAK);
      
      return result;
    } else {
      const { data: existingEntry, error: checkError } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking for existing entry:', checkError);
      }
      
      let result;
      
      if (existingEntry) {
        const { data, error } = await supabase
          .from('mood_entries')
          .update({ 
            rating, 
            emotion_details: details,
            note: details
          })
          .eq('id', existingEntry.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating mood entry:', error);
          await AsyncStorage.setItem('last_mood_rating', rating.toString());
          await AsyncStorage.setItem('last_mood_details', details);
          await AsyncStorage.setItem('last_mood_date', today);
          return null;
        }
        
        result = data;
        console.log('Updated mood entry:', data);
      } else {
        const { data, error } = await supabase
          .from('mood_entries')
          .insert([
            { 
              user_id: userId, 
              date: today, 
              rating, 
              emotion_details: details,
              note: details
            }
          ])
          .select()
          .single();
        
        if (error) {
          console.error('Error inserting mood entry:', error);
          await AsyncStorage.setItem('last_mood_rating', rating.toString());
          await AsyncStorage.setItem('last_mood_details', details);
          await AsyncStorage.setItem('last_mood_date', today);
          return null;
        }
        
        result = data;
        console.log('Inserted new mood entry:', data);
      }
      
      await AsyncStorage.setItem('last_mood_rating', rating.toString());
      await AsyncStorage.setItem('last_mood_details', details);
      await AsyncStorage.setItem('last_mood_date', today);
      
      await AsyncStorage.removeItem(CACHE_KEYS.TODAY_MOOD);
      await AsyncStorage.removeItem(CACHE_KEYS.RECENT_ENTRIES + '7');
      await AsyncStorage.removeItem(CACHE_KEYS.RECENT_ENTRIES + '30');
      await AsyncStorage.removeItem(CACHE_KEYS.WEEKLY_AVERAGE);
      await AsyncStorage.removeItem(CACHE_KEYS.STREAK);
      
      return result;
    }
  } catch (error) {
    console.error('Error in saveMoodEntry:', error);
    return null;
  }
}

export async function getTodayMoodEntry(): Promise<MoodEntry | null> {
  try {
    const today = getLocalToday();

    const lastMoodRating = await AsyncStorage.getItem('last_mood_rating');
    const lastMoodDate = await AsyncStorage.getItem('last_mood_date');
    const lastMoodDetails = await AsyncStorage.getItem('last_mood_details');

    if (lastMoodDate === today && lastMoodRating) {
      const quickEntry: MoodEntry = {
        date: today,
        rating: parseInt(lastMoodRating) as MoodRating,
        emotion_details: lastMoodDetails || ''
      };
      
      return quickEntry;
    }

    const cachedEntry = await getCache<MoodEntry>(CACHE_KEYS.TODAY_MOOD);
    if (cachedEntry) {
      return cachedEntry;
    }
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log('No active session found when getting today\'s mood entry');
      return getMockTodayMoodEntry();
    }
    
    const userId = session.user.id;
    
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();
    
    if (error) {
      console.error('Error fetching today\'s mood entry:', error);
      return getMockTodayMoodEntry();
    }
    
    if (data) {
      await setCache(CACHE_KEYS.TODAY_MOOD, data);
    }
    
    return data;
  } catch (error) {
    console.error('Error in getTodayMoodEntry:', error);
    return getMockTodayMoodEntry();
  }
}

export async function getMostRecentMoodEntry(): Promise<MoodEntry | null> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log('No active session found when getting most recent mood entry');
      return getMockTodayMoodEntry();
    }
    
    const userId = session.user.id;
    
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.error('Error fetching most recent mood entry:', error);
      return getMockTodayMoodEntry();
    }
    
    return data;
  } catch (error) {
    console.error('Error in getMostRecentMoodEntry:', error);
    return getMockTodayMoodEntry();
  }
}

export async function getTodayDetailedMoodEntries(): Promise<DetailedMoodEntry[]> {
  try {
    const cachedEntries = await getCache<DetailedMoodEntry[]>(CACHE_KEYS.DETAILED_ENTRIES);
    if (cachedEntries) {
      console.log('Using cached detailed mood entries');
      return cachedEntries;
    }
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log('No active session found when getting today\'s detailed mood entries');
      return getMockTodayDetailedMoodEntries();
    }
    
    const userId = session.user.id;
    
    const today = getLocalToday();
    
    const { data, error } = await supabase
      .from('mood_entries_detailed')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .order('time', { ascending: true });
    
    if (error) {
      console.error('Error fetching today\'s detailed mood entries:', error);
      return getMockTodayDetailedMoodEntries();
    }
    
    if (data && data.length > 0) {
      await setCache(CACHE_KEYS.DETAILED_ENTRIES, data);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getTodayDetailedMoodEntries:', error);
    return getMockTodayDetailedMoodEntries();
  }
}

export async function getRecentMoodEntries(days: number = 7): Promise<MoodEntry[]> {
  try {
    const cacheKey = `${CACHE_KEYS.RECENT_ENTRIES}${days}`;
    const cachedEntries = await getCache<MoodEntry[]>(cacheKey);
    if (cachedEntries) {
      console.log(`Using cached recent mood entries (${days} days)`);
      return cachedEntries;
    }
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log('No active session found when getting recent mood entries');
      return getMockRecentMoodEntries(days);
    }
    
    const userId = session.user.id;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    const endDateStr = getLocalToday();
    
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching recent mood entries:', error);
      return getMockRecentMoodEntries(days);
    }
    
    if (data && data.length > 0) {
      await setCache(cacheKey, data);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getRecentMoodEntries:', error);
    return getMockRecentMoodEntries(days);
  }
}

export async function getMoodStreak(): Promise<number> {
  try {
    const cachedStreak = await getCache<number>(CACHE_KEYS.STREAK);
    if (cachedStreak !== null) {
      console.log('Using cached mood streak');
      return cachedStreak;
    }
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log('No active session found when getting mood streak');
      return getMockMoodStreak();
    }
    
    const userId = session.user.id;
    
    const { data, error } = await supabase
      .from('mood_entries')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching mood entries for streak calculation:', error);
      return getMockMoodStreak();
    }
    
    if (!data || data.length === 0) {
      return 0;
    }
    
    let streak = 0;
    
    const today = getLocalToday();
    const todayDate = new Date(today);
    
    const mostRecentDate = new Date(data[0].date);
    const mostRecentDateStr = mostRecentDate.toISOString().split('T')[0];
    
    if (mostRecentDateStr !== today) {
      const yesterday = new Date(todayDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (mostRecentDateStr !== yesterdayStr) {
        return 0;
      }
    }
    
    const dateMap = new Map();
    data.forEach(entry => {
      dateMap.set(entry.date, true);
    });
    
    let currentDate = mostRecentDateStr === today ? todayDate : mostRecentDate;
    
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      if (dateMap.has(dateStr)) {
        streak++;
        
        currentDate.setDate(currentDate.getDate() - 1);
        
        if (streak > 365) break;
      } else {
        break;
      }
    }
    
    await setCache(CACHE_KEYS.STREAK, streak);
    
    return streak;
  } catch (error) {
    console.error('Error in getMoodStreak:', error);
    return getMockMoodStreak();
  }
}

export async function getAverageMood(days: number = 30): Promise<number | null> {
  try {
    const entries = await getRecentMoodEntries(days);
    
    if (entries.length === 0) {
      return null;
    }
    
    const sum = entries.reduce((total, entry) => total + entry.rating, 0);
    return sum / entries.length;
  } catch (error) {
    console.error('Error in getAverageMood:', error);
    return null;
  }
}

export async function getWeeklyAverageMood(): Promise<number | null> {
  try {
    const cachedAverage = await getCache<number | null>(CACHE_KEYS.WEEKLY_AVERAGE);
    if (cachedAverage !== null) {
      console.log('Using cached weekly average mood');
      return cachedAverage;
    }
    
    const entries = await getRecentMoodEntries(7);
    
    if (entries.length === 0) {
      return null;
    }
    
    const sum = entries.reduce((total, entry) => total + entry.rating, 0);
    const average = sum / entries.length;
    
    await setCache(CACHE_KEYS.WEEKLY_AVERAGE, average);
    
    return average;
  } catch (error) {
    console.error('Error in getWeeklyAverageMood:', error);
    return null;
  }
}

export async function getCurrentWeekMoodEntries(): Promise<MoodEntry[]> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log('No active session found when getting current week mood entries');
      return getMockRecentMoodEntries(7);
    }
    
    const userId = session.user.id;
    
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startDateStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
    const endDateStr = getLocalToday();
    
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching current week mood entries:', error);
      return getMockRecentMoodEntries(7);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getCurrentWeekMoodEntries:', error);
    return getMockRecentMoodEntries(7);
  }
}
