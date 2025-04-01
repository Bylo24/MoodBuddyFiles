import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys for notification settings
const NOTIFICATIONS_ENABLED_KEY = 'notifications_enabled';
const NOTIFICATION_TIME_KEY = 'notification_time';
const NOTIFICATION_INITIALIZED_KEY = 'notification_initialized';
const NOTIFICATION_LAST_SCHEDULED_KEY = 'notification_last_scheduled';

// Default notification time (8:00 PM)
const DEFAULT_NOTIFICATION_HOUR = 20;
const DEFAULT_NOTIFICATION_MINUTE = 0;

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Notification messages for variety
const notificationMessages = [
  {
    title: "How are you feeling today?",
    body: "Take a moment to check in with your mood and track your mental wellbeing."
  },
  {
    title: "Time for your daily check-in",
    body: "A few minutes of reflection can make a big difference in understanding your emotions."
  },
  {
    title: "Mood check reminder",
    body: "Don't forget to log your mood today. Your future self will thank you!"
  },
  {
    title: "Mental wellness check",
    body: "How's your day been? Log your mood to keep track of your emotional journey."
  },
  {
    title: "Mood Buddy check-in",
    body: "Your mood tracker is waiting for today's update. How are you feeling?"
  }
];

/**
 * Get a random notification message
 */
function getRandomNotificationMessage() {
  const randomIndex = Math.floor(Math.random() * notificationMessages.length);
  return notificationMessages[randomIndex];
}

/**
 * Request permission to send notifications
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    let finalStatus = existingStatus;
    
    // Only ask if permissions have not already been determined
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // Return true if permission was granted
    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get the current notification time settings
 */
export async function getNotificationTime(): Promise<{ hour: number; minute: number }> {
  try {
    const timeString = await AsyncStorage.getItem(NOTIFICATION_TIME_KEY);
    if (timeString) {
      const time = JSON.parse(timeString);
      return { hour: time.hour, minute: time.minute };
    }
    // Return default time if not set
    return { hour: DEFAULT_NOTIFICATION_HOUR, minute: DEFAULT_NOTIFICATION_MINUTE };
  } catch (error) {
    console.error('Error getting notification time:', error);
    return { hour: DEFAULT_NOTIFICATION_HOUR, minute: DEFAULT_NOTIFICATION_MINUTE };
  }
}

/**
 * Set the notification time
 */
export async function setNotificationTime(hour: number, minute: number): Promise<void> {
  try {
    console.log(`Setting notification time to ${hour}:${minute}`);
    await AsyncStorage.setItem(NOTIFICATION_TIME_KEY, JSON.stringify({ hour, minute }));
    
    // Reschedule notifications with the new time if enabled
    const notificationsEnabled = await getNotificationsEnabled();
    if (notificationsEnabled) {
      await scheduleDailyReminder();
    }
  } catch (error) {
    console.error('Error setting notification time:', error);
    throw error;
  }
}

/**
 * Format time to a readable string (e.g., "8:00 PM")
 */
export function formatTimeFromHourMinute(hour: number, minute: number): string {
  const date = new Date();
  date.setHours(hour, minute, 0);
  
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  
  return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * Check if a notification was already scheduled today
 * This helps prevent duplicate notifications
 */
async function wasNotificationScheduledToday(): Promise<boolean> {
  try {
    const lastScheduled = await AsyncStorage.getItem(NOTIFICATION_LAST_SCHEDULED_KEY);
    if (!lastScheduled) return false;
    
    const lastScheduledDate = new Date(parseInt(lastScheduled, 10));
    const today = new Date();
    
    // Check if the last scheduled date is from today
    return (
      lastScheduledDate.getDate() === today.getDate() &&
      lastScheduledDate.getMonth() === today.getMonth() &&
      lastScheduledDate.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    console.error('Error checking if notification was scheduled today:', error);
    return false;
  }
}

/**
 * Record that a notification was scheduled today
 */
async function recordNotificationScheduled(): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_LAST_SCHEDULED_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error recording notification scheduled:', error);
  }
}

/**
 * Schedule a daily reminder notification
 * @param skipImmediateNotification If true, won't show a notification immediately
 */
export async function scheduleDailyReminder(skipImmediateNotification: boolean = true): Promise<string | null> {
  try {
    // TEMPORARILY DISABLED - Always return null to disable notifications
    return null;
    
    // Check if notifications are enabled in app settings
    const notificationsEnabled = await getNotificationsEnabled();
    if (!notificationsEnabled) {
      console.log('Notifications are disabled in app settings');
      return null;
    }
    
    // Check if we have permission
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permissions not granted');
      return null;
    }
    
    // Cancel any existing notifications to prevent duplicates
    await cancelAllScheduledNotifications();
    
    // Get notification time settings
    const { hour, minute } = await getNotificationTime();
    
    console.log(`Scheduling daily reminder for ${hour}:${minute}`);
    
    // Get current time
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Check if the scheduled time is in the past for today
    const isTimeInPast = (currentHour > hour) || (currentHour === hour && currentMinute >= minute);
    
    // Create the trigger for the notification
    let trigger: any;
    
    // If the time is in the past and we want to skip immediate notification,
    // schedule for tomorrow at the specified time
    if (isTimeInPast && skipImmediateNotification) {
      // Schedule for tomorrow at the specified time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(hour, minute, 0, 0);
      
      trigger = {
        date: tomorrow,
        repeats: false
      };
      
      console.log(`Time is in the past, scheduling for tomorrow: ${tomorrow.toLocaleString()}`);
    } else {
      // Schedule for today at the specified time (or immediately if time is in the past)
      trigger = {
        hour,
        minute,
        repeats: true,
      };
    }
    
    // Get a random message for variety
    const message = getRandomNotificationMessage();
    
    // Create the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger,
    });
    
    console.log(`Daily reminder scheduled with ID: ${notificationId} for ${formatTimeFromHourMinute(hour, minute)}`);
    
    // Mark as initialized and record that we scheduled a notification today
    await AsyncStorage.setItem(NOTIFICATION_INITIALIZED_KEY, 'true');
    await recordNotificationScheduled();
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
    throw error;
  }
}

/**
 * Check if notifications are currently scheduled
 */
export async function checkScheduledNotifications(): Promise<boolean> {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`Found ${scheduledNotifications.length} scheduled notifications`);
    
    // Log details of scheduled notifications for debugging
    if (scheduledNotifications.length > 0) {
      scheduledNotifications.forEach((notification, index) => {
        const trigger = notification.trigger as any;
        console.log(`Notification ${index + 1}:`, {
          id: notification.identifier,
          title: notification.content.title,
          trigger: trigger.dateComponents ? 
            `${trigger.dateComponents.hour}:${trigger.dateComponents.minute}` : 
            trigger.date ? new Date(trigger.date).toLocaleString() : 'unknown time'
        });
      });
    }
    
    return scheduledNotifications.length > 0;
  } catch (error) {
    console.error('Error checking scheduled notifications:', error);
    return false;
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All scheduled notifications cancelled');
  } catch (error) {
    console.error('Error cancelling notifications:', error);
    throw error;
  }
}

/**
 * Get the current notification settings from storage
 */
export async function getNotificationsEnabled(): Promise<boolean> {
  try {
    // TEMPORARILY DISABLED - Always return false
    return false;
    
    const value = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    // Default to true if not set
    const enabled = value !== 'false';
    console.log('Notifications enabled:', enabled);
    return enabled;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return false; // Default to false on error (changed from true)
  }
}

/**
 * Set notification settings and update scheduled notifications
 */
export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  try {
    console.log(`Setting notifications enabled: ${enabled}`);
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled.toString());
    
    if (enabled) {
      // Schedule the daily reminder if notifications are enabled
      await scheduleDailyReminder(true); // Skip immediate notification
    } else {
      // Cancel all notifications if disabled
      await cancelAllScheduledNotifications();
    }
  } catch (error) {
    console.error('Error setting notification settings:', error);
    throw error;
  }
}

/**
 * Check if notifications have been initialized before
 */
async function hasInitializedNotifications(): Promise<boolean> {
  try {
    const initialized = await AsyncStorage.getItem(NOTIFICATION_INITIALIZED_KEY);
    return initialized === 'true';
  } catch (error) {
    console.error('Error checking if notifications initialized:', error);
    return false;
  }
}

/**
 * Initialize notifications when the app starts
 */
export async function initializeNotifications(): Promise<void> {
  try {
    console.log('Initializing notifications...');
    
    // TEMPORARILY DISABLED - Just return without scheduling
    return;
    
    // Check if we've already initialized notifications before
    const initialized = await hasInitializedNotifications();
    if (initialized) {
      console.log('Notifications have been initialized before, checking current status');
      
      // Check if notifications are enabled
      const notificationsEnabled = await getNotificationsEnabled();
      if (!notificationsEnabled) {
        console.log('Notifications are disabled, not scheduling');
        return;
      }
      
      // Check if notifications are already scheduled
      const hasScheduledNotifications = await checkScheduledNotifications();
      if (hasScheduledNotifications) {
        console.log('Notifications are already scheduled, no need to reschedule');
        return;
      }
      
      // If enabled but not scheduled, schedule them
      console.log('Notifications are enabled but not scheduled, rescheduling');
      await scheduleDailyReminder(true); // Skip immediate notification
    } else {
      // First time initialization - don't schedule immediately
      console.log('First time notification initialization - not scheduling immediately');
      // Just mark as initialized, but don't schedule yet
      await AsyncStorage.setItem(NOTIFICATION_INITIALIZED_KEY, 'true');
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
}

/**
 * Schedule a test notification that will fire after a few seconds
 * Useful for testing notification permissions and display
 */
export async function scheduleTestNotification(): Promise<string | null> {
  try {
    // TEMPORARILY DISABLED - Return null
    return null;
    
    // Check if we have permission
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permissions not granted');
      return null;
    }
    
    // Schedule a notification to appear in 5 seconds
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification",
        body: "This is a test notification to verify that notifications are working correctly.",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        seconds: 5,
      },
    });
    
    console.log('Test notification scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling test notification:', error);
    return null;
  }
}