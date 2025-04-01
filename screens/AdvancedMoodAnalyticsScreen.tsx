import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { getRecentMoodEntries, MoodEntry } from '../services/moodService';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get screen dimensions
const { width: screenWidth } = Dimensions.get('window');

interface AdvancedMoodAnalyticsScreenProps {
  navigation: any;
  route: any;
}

interface MoodPattern {
  day: string;
  pattern: string;
  description: string;
  entryCount: number;
}

interface MoodTrigger {
  trigger: string;
  impact: 'positive' | 'negative';
  frequency: number;
}

// Days of the week - moved outside component to avoid recreation
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Trigger words - moved outside component to avoid recreation
const triggerWords = {
  positive: ['exercise', 'workout', 'friend', 'family', 'nature', 'outdoors', 'sleep', 'rest', 'meditation', 'hobby'],
  negative: ['work', 'stress', 'tired', 'sick', 'argument', 'conflict', 'deadline', 'anxiety', 'worry']
};

export default function AdvancedMoodAnalyticsScreen({ navigation, route }: AdvancedMoodAnalyticsScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [hasEnoughData, setHasEnoughData] = useState(false);
  const [moodPatterns, setMoodPatterns] = useState<MoodPattern[]>([]);
  const [moodTriggers, setMoodTriggers] = useState<MoodTrigger[]>([]);
  const [isPremium, setIsPremium] = useState(route.params?.isPremium || false);
  const [userName, setUserName] = useState('');

  // Memoized function to analyze mood patterns
  const analyzeMoodPatterns = useCallback((entries: MoodEntry[]) => {
    // Group entries by day of week
    const entriesByDay = daysOfWeek.map(day => {
      const dayEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return daysOfWeek[entryDate.getDay()] === day;
      });
      
      return {
        day,
        entries: dayEntries,
        averageMood: dayEntries.length > 0 
          ? dayEntries.reduce((sum, entry) => sum + entry.rating, 0) / dayEntries.length 
          : null
      };
    });

    // Find patterns
    const patterns: MoodPattern[] = [];
    
    // Find the day with highest average mood
    const highestMoodDay = [...entriesByDay]
      .filter(day => day.averageMood !== null)
      .sort((a, b) => (b.averageMood || 0) - (a.averageMood || 0))[0];
      
    if (highestMoodDay && highestMoodDay.averageMood) {
      patterns.push({
        day: highestMoodDay.day,
        pattern: 'Peak Day',
        description: `You tend to feel your best on ${highestMoodDay.day}s with an average mood of ${highestMoodDay.averageMood.toFixed(1)}.`,
        entryCount: highestMoodDay.entries.length
      });
    }
    
    // Find the day with lowest average mood
    const lowestMoodDay = [...entriesByDay]
      .filter(day => day.averageMood !== null)
      .sort((a, b) => (a.averageMood || 0) - (b.averageMood || 0))[0];
      
    if (lowestMoodDay && lowestMoodDay.averageMood) {
      patterns.push({
        day: lowestMoodDay.day,
        pattern: 'Dip Day',
        description: `You tend to experience lower moods on ${lowestMoodDay.day}s with an average mood of ${lowestMoodDay.averageMood.toFixed(1)}.`,
        entryCount: lowestMoodDay.entries.length
      });
    }
    
    // Add patterns for all days with data that aren't already covered
    entriesByDay.forEach(dayData => {
      if (dayData.averageMood !== null && 
          dayData.day !== highestMoodDay?.day && 
          dayData.day !== lowestMoodDay?.day) {
        
        // Generate a pattern based on the average mood
        const avgMood = dayData.averageMood;
        let pattern = '';
        let description = '';
        
        if (avgMood >= 4) {
          pattern = 'Positive Day';
          description = `${dayData.day}s are generally good days for you with an average mood of ${avgMood.toFixed(1)}.`;
        } else if (avgMood >= 3) {
          pattern = 'Balanced Day';
          description = `You typically maintain a balanced mood of ${avgMood.toFixed(1)} on ${dayData.day}s.`;
        } else {
          pattern = 'Challenging Day';
          description = `${dayData.day}s tend to be more challenging with an average mood of ${avgMood.toFixed(1)}.`;
        }
        
        patterns.push({
          day: dayData.day,
          pattern,
          description,
          entryCount: dayData.entries.length
        });
      }
    });
    
    // Check for weekend vs weekday pattern
    const weekdayEntries = entries.filter(entry => {
      const day = new Date(entry.date).getDay();
      return day >= 1 && day <= 5; // Monday to Friday
    });
    
    const weekendEntries = entries.filter(entry => {
      const day = new Date(entry.date).getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    });
    
    const weekdayAvg = weekdayEntries.length > 0 
      ? weekdayEntries.reduce((sum, entry) => sum + entry.rating, 0) / weekdayEntries.length 
      : 0;
      
    const weekendAvg = weekendEntries.length > 0 
      ? weekendEntries.reduce((sum, entry) => sum + entry.rating, 0) / weekendEntries.length 
      : 0;
    
    if (Math.abs(weekdayAvg - weekendAvg) > 0.5 && weekdayEntries.length > 0 && weekendEntries.length > 0) {
      if (weekendAvg > weekdayAvg) {
        patterns.push({
          day: 'Weekend',
          pattern: 'Weekend Boost',
          description: `Your mood tends to improve on weekends by ${(weekendAvg - weekdayAvg).toFixed(1)} points on average.`,
          entryCount: weekendEntries.length
        });
      } else {
        patterns.push({
          day: 'Weekday',
          pattern: 'Weekday Preference',
          description: `You tend to have better moods during weekdays compared to weekends by ${(weekdayAvg - weekendAvg).toFixed(1)} points.`,
          entryCount: weekdayEntries.length
        });
      }
    }
    
    // Look for mood triggers in details
    const triggers: Record<string, { count: number, totalImpact: number, type: 'positive' | 'negative' }> = {};
    
    // Analyze details for triggers
    entries.forEach(entry => {
      if (!entry.details) return;
      
      const details = entry.details.toLowerCase();
      
      // Check for positive triggers
      triggerWords.positive.forEach(word => {
        if (details.includes(word)) {
          if (!triggers[word]) {
            triggers[word] = { count: 0, totalImpact: 0, type: 'positive' };
          }
          triggers[word].count += 1;
          triggers[word].totalImpact += entry.rating;
        }
      });
      
      // Check for negative triggers
      triggerWords.negative.forEach(word => {
        if (details.includes(word)) {
          if (!triggers[word]) {
            triggers[word] = { count: 0, totalImpact: 0, type: 'negative' };
          }
          triggers[word].count += 1;
          triggers[word].totalImpact += entry.rating;
        }
      });
    });
    
    // Convert triggers to array and sort by frequency
    const triggersArray: MoodTrigger[] = Object.entries(triggers)
      .filter(([_, data]) => data.count >= 2) // Only include triggers that appear at least twice
      .map(([trigger, data]) => ({
        trigger: trigger.charAt(0).toUpperCase() + trigger.slice(1), // Capitalize first letter
        impact: data.type,
        frequency: data.count
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5); // Take top 5
    
    setMoodPatterns(patterns);
    setMoodTriggers(triggersArray);
  }, []);

  // Load mood data
  useEffect(() => {
    const loadMoodData = async () => {
      setIsLoading(true);
      try {
        // Get user name
        const storedName = await AsyncStorage.getItem('user_display_name');
        if (storedName) {
          setUserName(storedName);
        }

        // Get mood entries from the last 30 days
        const entries = await getRecentMoodEntries(30);
        setMoodEntries(entries);

        // Check if we have enough data for analysis (at least 10 entries)
        const hasEnough = entries.length >= 10;
        setHasEnoughData(hasEnough);

        if (hasEnough) {
          // Analyze mood patterns
          analyzeMoodPatterns(entries);
        }
      } catch (error) {
        console.error('Error loading mood data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMoodData();
  }, [isPremium, analyzeMoodPatterns]);

  // Memoized function to get mood color
  const getMoodColor = useCallback((rating: number): string => {
    if (rating < 1.5) return theme.colors.mood1;
    if (rating < 2.5) return theme.colors.mood2;
    if (rating < 3.5) return theme.colors.mood3;
    if (rating < 4.5) return theme.colors.mood4;
    return theme.colors.mood5;
  }, []);

  // Memoized chart data
  const chartData = useMemo(() => {
    const today = new Date();
    const labels: string[] = [];
    const data: number[] = [];
    
    // Past 7 days data
    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Find entry for this date
      const entry = moodEntries.find(e => e.date === dateStr);
      
      if (i === 0) {
        labels.push('Today');
      } else {
        // Use shorter day abbreviations (Mo, Tu, We, etc.) to save space
        labels.push(daysOfWeek[date.getDay()].substring(0, 2));
      }
      data.push(entry ? entry.rating : 0);
    }
    
    return {
      labels,
      datasets: [
        {
          data: data.map(d => d || 0), // Replace null/undefined with 0
          color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ["Mood Rating"]
    };
  }, [moodEntries]);

  // Memoized chart config
  const chartConfig = useMemo(() => ({
    backgroundColor: theme.colors.card,
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "5",
      strokeWidth: "2",
      stroke: theme.colors.primary
    },
    // Adjust horizontal padding to move chart more to the left
    paddingRight: 15,
    paddingLeft: 0,
    // Make sure y-axis is properly scaled for mood ratings (1-5)
    yAxisInterval: 1,
    yAxisSuffix: "",
    yAxisMinValue: 0,
    yAxisMaxValue: 5,
    // Improve label formatting
    formatXLabel: (label) => label,
    formatYLabel: (label) => label,
  }), []);

  // Memoized day patterns
  const dayPatterns = useMemo(() => {
    const patterns = daysOfWeek.map(day => {
      const existingPattern = moodPatterns.find(p => p.day === day);
      if (existingPattern) {
        return existingPattern;
      }
      
      // Find entries for this day to get the count
      const dayEntries = moodEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return daysOfWeek[entryDate.getDay()] === day;
      });
      
      // Return a placeholder pattern for days without data
      return {
        day,
        pattern: 'No Data',
        description: `Log your mood on ${day}s to get personalized insights.`,
        entryCount: dayEntries.length
      };
    });
    
    // Add any non-day patterns (like Weekend/Weekday)
    const otherPatterns = moodPatterns.filter(p => !daysOfWeek.includes(p.day));
    
    return [...patterns, ...otherPatterns];
  }, [moodPatterns, moodEntries]);

  // Memoized mood variability text
  const moodVariabilityText = useMemo(() => {
    if (moodEntries.length === 0) {
      return "Not enough data to analyze mood variability.";
    }
    
    const ratings = moodEntries.map(e => e.rating);
    const min = Math.min(...ratings);
    const max = Math.max(...ratings);
    const range = max - min;
    
    if (range >= 3) {
      return "Your mood shows significant variability. Consider tracking what factors might be influencing these changes.";
    } else if (range >= 2) {
      return "Your mood shows moderate variability, which is typical for most people.";
    } else {
      return "Your mood is relatively stable. This consistency can be a sign of emotional resilience.";
    }
  }, [moodEntries]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Advanced Mood Analytics</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Analyzing your mood patterns...</Text>
          </View>
        ) : !hasEnoughData ? (
          <View style={styles.notEnoughDataContainer}>
            <Ionicons name="analytics-outline" size={64} color={theme.colors.subtext} />
            <Text style={styles.notEnoughDataTitle}>Not Enough Data</Text>
            <Text style={styles.notEnoughDataText}>
              We need at least 10 days of mood data to generate accurate analytics.
              Keep tracking your mood daily, and check back soon!
            </Text>
            <View style={styles.dataCountContainer}>
              <Text style={styles.dataCountText}>
                Current data: {moodEntries.length} day{moodEntries.length !== 1 ? 's' : ''}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${Math.min(100, (moodEntries.length / 10) * 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.dataCountSubtext}>
                {10 - moodEntries.length} more day{10 - moodEntries.length !== 1 ? 's' : ''} needed
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.returnButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.returnButtonText}>Return to Home</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.introSection}>
              <Text style={styles.greeting}>Hello {userName},</Text>
              <Text style={styles.subGreeting}>
                Here's a detailed analysis of your mood patterns and triggers.
              </Text>
            </View>
            
            <View style={styles.chartContainer}>
              <Text style={styles.sectionTitle}>Your Mood History</Text>
              <Text style={styles.chartSubtitle}>Past 7 days</Text>
              
              <View style={styles.chartWrapper}>
                <LineChart
                  data={chartData}
                  width={screenWidth * 0.85} // Reduced width to 85% of screen width
                  height={200}
                  chartConfig={chartConfig}
                  bezier
                  style={{
                    marginLeft: -10, // Reduced left margin
                    borderRadius: 16,
                  }}
                  withInnerLines={true}
                  withOuterLines={true}
                  withVerticalLines={false}
                  withHorizontalLines={true}
                  withVerticalLabels={true}
                  withHorizontalLabels={true}
                  fromZero={true}
                  segments={5} // 5 segments for 0-5 scale
                />
              </View>
              
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: 'rgba(134, 65, 244, 0.8)' }]} />
                  <Text style={styles.legendText}>Your Mood Ratings</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.patternsContainer}>
              <Text style={styles.sectionTitle}>Your Mood Patterns</Text>
              
              {/* Display all days of the week */}
              {dayPatterns.map((pattern, index) => (
                <View key={index} style={[
                  styles.patternCard,
                  pattern.pattern === 'No Data' && styles.noDataPatternCard
                ]}>
                  <View style={styles.patternHeader}>
                    <Text style={styles.patternDay}>{pattern.day}</Text>
                    <View style={styles.patternRightHeader}>
                      <View style={[
                        styles.entryCountBadge,
                        pattern.pattern === 'No Data' && styles.noDataBadge
                      ]}>
                        <Text style={[
                          styles.entryCountText,
                          pattern.pattern === 'No Data' && styles.noDataText
                        ]}>
                          {pattern.entryCount} {pattern.entryCount === 1 ? 'entry' : 'entries'}
                        </Text>
                      </View>
                      <Text style={[
                        styles.patternType,
                        pattern.pattern === 'No Data' && styles.noDataPatternType
                      ]}>
                        {pattern.pattern}
                      </Text>
                    </View>
                  </View>
                  <Text style={[
                    styles.patternDescription,
                    pattern.pattern === 'No Data' && styles.noDataPatternDescription
                  ]}>
                    {pattern.description}
                  </Text>
                </View>
              ))}
            </View>
            
            {moodTriggers.length > 0 && (
              <View style={styles.triggersContainer}>
                <Text style={styles.sectionTitle}>Potential Mood Triggers</Text>
                <Text style={styles.sectionSubtitle}>
                  Based on your mood entries and descriptions
                </Text>
                
                {moodTriggers.map((trigger, index) => (
                  <View key={index} style={styles.triggerItem}>
                    <View style={[
                      styles.triggerIcon, 
                      { backgroundColor: trigger.impact === 'positive' ? theme.colors.mood5 : theme.colors.mood2 }
                    ]}>
                      <Ionicons 
                        name={trigger.impact === 'positive' ? 'trending-up' : 'trending-down'} 
                        size={16} 
                        color="#fff" 
                      />
                    </View>
                    <View style={styles.triggerContent}>
                      <Text style={styles.triggerName}>{trigger.trigger}</Text>
                      <Text style={styles.triggerImpact}>
                        {trigger.impact === 'positive' ? 'Positive impact' : 'Negative impact'} 
                        {' • '} 
                        Mentioned {trigger.frequency} time{trigger.frequency !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
            
            <View style={styles.insightsContainer}>
              <Text style={styles.sectionTitle}>Mood Insights</Text>
              
              <View style={styles.insightCard}>
                <View style={styles.insightIconContainer}>
                  <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Tracking Consistency</Text>
                  <Text style={styles.insightDescription}>
                    You've tracked your mood for {moodEntries.length} days in the last 30 days.
                    {moodEntries.length >= 25 
                      ? " Great job staying consistent!" 
                      : moodEntries.length >= 15 
                        ? " Good consistency, keep it up!" 
                        : " Try to track more regularly for better insights."}
                  </Text>
                </View>
              </View>
              
              <View style={styles.insightCard}>
                <View style={styles.insightIconContainer}>
                  <Ionicons name="stats-chart-outline" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Mood Variability</Text>
                  <Text style={styles.insightDescription}>
                    {moodVariabilityText}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.tipsContainer}>
              <Text style={styles.sectionTitle}>Personalized Tips</Text>
              
              <View style={styles.tipCard}>
                <Ionicons name="bulb-outline" size={24} color={theme.colors.accent} style={styles.tipIcon} />
                <Text style={styles.tipText}>
                  {moodPatterns.length > 0 && moodPatterns.some(p => p.pattern === 'Dip Day')
                    ? `Plan enjoyable activities for ${moodPatterns.find(p => p.pattern === 'Dip Day')?.day || 'your dip days'} to help boost your mood.`
                    : "Try to identify activities that consistently improve your mood and incorporate them into your routine."}
                </Text>
              </View>
              
              <View style={styles.tipCard}>
                <Ionicons name="bulb-outline" size={24} color={theme.colors.accent} style={styles.tipIcon} />
                <Text style={styles.tipText}>
                  {moodTriggers.length > 0 && moodTriggers.some(t => t.impact === 'positive')
                    ? `Consider increasing activities involving "${moodTriggers.find(t => t.impact === 'positive')?.trigger.toLowerCase() || 'positive triggers'}" as they seem to boost your mood.`
                    : "Keep noting details about your day when logging moods to help identify what positively affects you."}
                </Text>
              </View>
              
              <View style={styles.tipCard}>
                <Ionicons name="bulb-outline" size={24} color={theme.colors.accent} style={styles.tipIcon} />
                <Text style={styles.tipText}>
                  {moodTriggers.length > 0 && moodTriggers.some(t => t.impact === 'negative')
                    ? `Be mindful of how "${moodTriggers.find(t => t.impact === 'negative')?.trigger.toLowerCase() || 'negative triggers'}" affects your mood and develop strategies to manage it.`
                    : "Tracking both positive and challenging moments helps build self-awareness about your emotional patterns."}
                </Text>
              </View>
            </View>
            
            <View style={styles.disclaimerContainer}>
              <Text style={styles.disclaimerText}>
                Note: These analytics are based on your historical mood patterns and may become more accurate as you continue to track your moods.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingHorizontal: screenWidth * 0.05,
    paddingTop: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.subtext,
  },
  notEnoughDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 400,
  },
  notEnoughDataTitle: {
    fontSize: 22,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  notEnoughDataText: {
    fontSize: 16,
    color: theme.colors.subtext,
    textAlign: 'center',
    marginBottom: 24,
  },
  dataCountContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  dataCountText: {
    fontSize: 16,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  dataCountSubtext: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
  returnButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  returnButtonText: {
    color: '#fff',
    fontWeight: theme.fontWeights.semibold,
    fontSize: 16,
  },
  introSection: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  subGreeting: {
    fontSize: 16,
    color: theme.colors.subtext,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    ...theme.shadows.medium,
  },
  chartSubtitle: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginBottom: 8,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.subtext,
  },
  patternsContainer: {
    marginBottom: 24,
  },
  patternCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.small,
  },
  noDataPatternCard: {
    backgroundColor: theme.colors.card + '80', // Slightly transparent
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  patternRightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patternDay: {
    fontSize: 16,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  patternType: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.semibold,
  },
  noDataPatternType: {
    color: theme.colors.subtext,
  },
  patternDescription: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
  noDataPatternDescription: {
    fontStyle: 'italic',
  },
  entryCountBadge: {
    backgroundColor: theme.colors.primary + '30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  entryCountText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.medium,
  },
  noDataBadge: {
    backgroundColor: theme.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  noDataText: {
    color: theme.colors.subtext,
  },
  triggersContainer: {
    marginBottom: 24,
  },
  triggerItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  triggerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  triggerContent: {
    flex: 1,
  },
  triggerName: {
    fontSize: 16,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  triggerImpact: {
    fontSize: 12,
    color: theme.colors.subtext,
  },
  insightsContainer: {
    marginBottom: 24,
  },
  insightCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  insightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
  tipsContainer: {
    marginBottom: 24,
  },
  tipCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...theme.shadows.small,
  },
  tipIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  disclaimerContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  disclaimerText: {
    fontSize: 12,
    color: theme.colors.subtext,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});