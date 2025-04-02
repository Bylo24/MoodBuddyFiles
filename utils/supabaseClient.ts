import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Hardcode the values directly to ensure they're available
const supabaseUrl = 'https://yzfnrdcuafamsjkppmka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6Zm5yZGN1YWZhbXNqa3BwbWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2MjAyMTUsImV4cCI6MjA1NjE5NjIxNX0.1SSzASgQcrQAGFa4RxraBdROcwIbRknmBmU6Und3iOM';

// Create the Supabase client with optimized settings
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
    // Increase timeout to prevent unnecessary retries
    fetch: (url, options) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    },
  },
});

// Defer session check to after app initialization
let sessionCheckComplete = false;

export const checkSession = async () => {
  if (sessionCheckComplete) return;
  
  try {
    const { data } = await supabase.auth.getSession();
    sessionCheckComplete = true;
    return data.session;
  } catch (error) {
    console.error('Supabase session check error:', error);
    sessionCheckComplete = true;
    return null;
  }
};

export { supabase };
