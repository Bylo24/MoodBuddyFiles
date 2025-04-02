const { supabase } = require('../utils/supabaseClient');
const { getActivityRecommendations } = require('../services/geminiService');
const { getTodayMoodEntry, getMoodStreak, getRecentMoodEntries } = require('../services/moodService');
const { getCurrentSubscriptionTier } = require('../services/subscriptionService');

// Test function to verify real data is being used
async function testRealData() {
  try {
    console.log('Testing real data integration...');
    
    // Check if we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.log('No active session. Please log in first.');
      return;
    }
    
    console.log('User is authenticated:', session.user.id);
    
    // Test subscription tier
    const tier = await getCurrentSubscriptionTier();
    console.log('Current subscription tier:', tier);
    
    // Test mood data
    const todayMood = await getTodayMoodEntry();
    console.log('Today\'s mood entry:', todayMood);
    
    const streak = await getMoodStreak();
    console.log('Current mood streak:', streak);
    
    const recentEntries = await getRecentMoodEntries(7);
    console.log('Recent mood entries:', recentEntries);
    
    // Test activity recommendations
    if (todayMood) {
      const activities = await getActivityRecommendations(todayMood.rating, todayMood.emotion_details || '');
      console.log('Activity recommendations:', activities.map(a => a.title));
    } else {
      console.log('No mood entry for today, testing with sample data');
      const activities = await getActivityRecommendations(3, 'Feeling okay today');
      console.log('Sample activity recommendations:', activities.map(a => a.title));
    }
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Error testing real data:', error);
  }
}

// Run the test
testRealData();
