const { scheduleTestNotification } = require('../services/notificationService');

// Schedule a test notification
async function testNotification() {
  try {
    console.log('Scheduling test notification...');
    const notificationId = await scheduleTestNotification();
    console.log('Test notification scheduled with ID:', notificationId);
  } catch (error) {
    console.error('Error scheduling test notification:', error);
  }
}

testNotification();
