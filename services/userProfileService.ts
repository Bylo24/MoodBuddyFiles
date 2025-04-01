import { supabase } from '../utils/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from './authService';

// Interface for user profile
export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
}

// Get user profile from Supabase
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.log('No authenticated user found');
      return null;
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error.message);
      return null;
    }
    
    console.log('User profile fetched:', data);
    return data as UserProfile;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

// Update user profile in Supabase
export const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.log('No authenticated user found');
      return null;
    }
    
    // Check if profile exists
    const existingProfile = await getUserProfile();
    
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user profile:', error.message);
        return null;
      }
      
      console.log('User profile updated:', data);
      return data as UserProfile;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{ user_id: user.id, ...updates }])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating user profile:', error.message);
        return null;
      }
      
      console.log('User profile created:', data);
      return data as UserProfile;
    }
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return null;
  }
};

// Get user's first name
export const getUserFirstName = async (): Promise<string> => {
  try {
    // First try to get from Supabase
    const profile = await getUserProfile();
    
    if (profile?.first_name) {
      console.log('Using first name from Supabase:', profile.first_name);
      
      // Sync with AsyncStorage
      await AsyncStorage.setItem('user_display_name', profile.first_name);
      
      return profile.first_name;
    }
    
    // If not in Supabase, try AsyncStorage
    const storedName = await AsyncStorage.getItem('user_display_name');
    
    if (storedName) {
      console.log('Using name from AsyncStorage:', storedName);
      
      // Sync with Supabase
      await updateUserProfile({ first_name: storedName });
      
      return storedName;
    }
    
    // Fall back to default
    console.log('No name found, using default');
    return 'Friend';
  } catch (error) {
    console.error('Error getting user first name:', error);
    return 'Friend';
  }
};

// Update user's first name
export const updateUserFirstName = async (firstName: string): Promise<boolean> => {
  try {
    // Update in Supabase
    const updatedProfile = await updateUserProfile({ first_name: firstName });
    
    // Update in AsyncStorage
    await AsyncStorage.setItem('user_display_name', firstName);
    
    return !!updatedProfile;
  } catch (error) {
    console.error('Error updating user first name:', error);
    return false;
  }
};