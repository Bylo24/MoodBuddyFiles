import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, Dimensions, ActivityIndicator } from 'react-native';
import { MoodEntry } from '../types';
import { theme } from '../theme/theme';
import { getRecentMoodEntries } from '../services/moodService';

const { width: screenWidth } = Dimensions.get('window');

interface MoodTrendGraphProps {
  days?: number;
}

export default function MoodTrendGraph({ days = 5 }: MoodTrendGraphProps) {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load mood entries only when days prop changes
  useEffect(() => {
    const loadMoodEntries = async () => {
      setLoading(true);
      try {
        const entries = await getRecentMoodEntries(days);
        setMoodEntries(entries);
      } catch (error) {
        console.error('Error loading mood entries:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMoodEntries();
  }, [days]);
  
  // Memoized date range generation
  const dateRange = useMemo(() => {
    const range = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const entry = moodEntries.find(entry => entry.date === dateStr);
      range.push({
        date: dateStr,
        dayAbbr: date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1),
        entry: entry
      });
    }
    
    return range;
  }, [days, moodEntries]);
  
  // Memoized mood color function
  const getMoodColor = useCallback((rating: number) => {
    switch(rating) {
      case 1: return theme.colors.mood1;
      case 2: return theme.colors.mood2;
      case 3: return theme.colors.mood3;
      case 4: return theme.colors.mood4;
      case 5: return theme.colors.mood5;
      default: return theme.colors.primary;
    }
  }, []);

  // Memoized mood trend calculation
  const moodTrend = useMemo(() => {
    const entriesWithData = moodEntries.filter(entry => entry.rating !== undefined);
    if (entriesWithData.length < 2) return null;
    
    const sortedEntries = [...entriesWithData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const firstEntry = sortedEntries[0];
    const lastEntry = sortedEntries[sortedEntries.length - 1];
    
    if (lastEntry.rating > firstEntry.rating) return 'improving';
    if (lastEntry.rating < firstEntry.rating) return 'declining';
    return 'stable';
  }, [moodEntries]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading mood data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.graphContainer}>
        {dateRange.map((item, index) => (
          <View key={index} style={styles.dayColumn}>
            <View style={styles.barContainer}>
              {item.entry?.rating ? (
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: `${item.entry.rating * 20}%`,
                      backgroundColor: getMoodColor(item.entry.rating)
                    }
                  ]} 
                />
              ) : (
                <View style={styles.missingDataContainer}>
                  <View style={styles.redDot} />
                </View>
              )}
            </View>
            <Text style={styles.dayLabel}>{item.dayAbbr}</Text>
          </View>
        ))}
      </View>
      
      {moodTrend === 'improving' && (
        <Text style={styles.motivationalText}>
          You're improving! Keep going! 🎉
        </Text>
      )}
    </View>
  );
}

// Styles moved outside component to avoid recreation on each render
const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 8,
  },
  graphContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 80,
    paddingVertical: 8,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 60,
    width: 16,
    backgroundColor: 'transparent',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  bar: {
    width: '100%',
    borderRadius: 8,
  },
  missingDataContainer: {
    position: 'absolute',
    top: '50%',
    width: '100%',
    alignItems: 'center',
    transform: [{ translateY: -8 }],
  },
  redDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.error,
  },
  dayLabel: {
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.subtext,
  },
  motivationalText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.success,
    textAlign: 'center',
  },
  loadingContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.subtext,
  }
});
