import { Platform } from 'react-native';
import { getApp } from '@react-native-firebase/app';

import {
  AuthorizationStatus,
  getAPNSToken,
  getMessaging,
  getToken,
  registerDeviceForRemoteMessages,
  requestPermission,
} from '@react-native-firebase/messaging';

const firebaseApp = getApp();
const messaging = getMessaging(firebaseApp);

const API_URL = 'https://syilapp-w8ye.onrender.com';

export const saveFCMToken = async email => {
  try {
    if (!email) {
      console.log('FCM: Email missing');
      return null;
    }

    /*
     * iOS ko APNs ke saath register karta hai.
     * Auto-registration enabled hone par bhi ye safely call kiya ja sakta hai.
     */
    await registerDeviceForRemoteMessages(messaging);

    const authStatus = await requestPermission(messaging);

    const permissionGranted =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (!permissionGranted) {
      console.log('FCM: Notification permission denied');
      return null;
    }

    if (Platform.OS === 'ios') {
      const apnsToken = await getAPNSToken(messaging);

      console.log(
        'APNs Token:',
        apnsToken ? 'Generated successfully' : 'Not available yet',
      );
    }

    const fcmToken = await getToken(messaging);

    if (!fcmToken) {
      console.log('FCM: Token is empty');
      return null;
    }

    console.log('FCM Token generated successfully');

    const response = await fetch(
      `${API_URL}/save-dealer-fcm-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          fcmToken,
          platform: Platform.OS,
        }),
      },
    );

    const responseText = await response.text();

    let responseData = {};

    try {
      responseData = responseText
        ? JSON.parse(responseText)
        : {};
    } catch {
      throw new Error(
        `Server returned invalid response: ${responseText.slice(0, 150)}`,
      );
    }

    if (!response.ok) {
      throw new Error(
        responseData.message ||
          responseData.error ||
          `HTTP ${response.status}`,
      );
    }

    console.log(
      'Dealer FCM token saved successfully:',
      responseData,
    );

    return fcmToken;
  } catch (error) {
    console.error('Dealer FCM setup error:', error);
    return null;
  }
};