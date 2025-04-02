import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

interface HeaderProps {
  title?: string;
  onProfilePress: () => void;
  streak?: number;
  onStreakPress?: () => void;
}

export default function Header({ title, onProfilePress, streak = 0, onStreakPress }: HeaderProps) {
  // Animation value for streak button
  const streakAnimation = React.useRef(new Animated.Value(1)).current;
  
  // Function to animate streak button press
  const animateStreakPress = (pressed: boolean) => {
    Animated.spring(streakAnimation, {
      toValue: pressed ? 0.9 : 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true
    }).start();
  };
  
  return (
    <View style={styles.container}>
      {title ? (
        <Text style={styles.title}>{title}</Text>
      ) : (
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/mood-buddy-logo.png')} 
            style={styles.logo} 
          />
        </View>
      )}
      
      <View style={styles.rightContainer}>
        {streak > 0 && onStreakPress && (
          <Animated.View
            style={[
              styles.streakContainer,
              { transform: [{ scale: streakAnimation }] }
            ]}
          >
            <TouchableOpacity
              style={styles.streakButton}
              onPress={onStreakPress}
              onPressIn={() => animateStreakPress(true)}
              onPressOut={() => animateStreakPress(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="trophy-outline" size={20} color={theme.colors.accent} />
              <Text style={styles.streakText}>{streak}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={onProfilePress}
          activeOpacity={0.7}
        >
          <Ionicons name="person-circle" size={32} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  logoText: {
    fontSize: 22,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.primary,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    padding: 4,
    borderRadius: 20,
  },
  streakContainer: {
    marginRight: 12,
  },
  streakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    ...theme.shadows.small,
  },
  streakText: {
    fontSize: 14,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.accent,
    marginLeft: 4,
  },
});