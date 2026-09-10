import {
  Platform,
  PermissionsAndroid,
} from 'react-native';

import { getApp } from '@react-native-firebase/app';

import {
  getInitialNotification,
  getMessaging,
  getToken,
  onNotificationOpenedApp,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  requestPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';

import { openTicketFromNotification } from '../navigation/navigationRef';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseApp = getApp();
const messaging = getMessaging(firebaseApp);

const API_URL = 'https://syilapp-w8ye.onrender.com';

// =====================================================
// REQUEST NOTIFICATION PERMISSION
// =====================================================

export const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Allow Notifications',
            message:
              'SYIL Dealer App needs notification permission to notify you about new ticket messages.',
            buttonPositive: 'Allow',
            buttonNegative: 'Don’t Allow',
            buttonNeutral: 'Ask Me Later',
          },
        );

        console.log('Android notification permission:', result);

        return result === PermissionsAndroid.RESULTS.GRANTED;
      }

      return true;
    }

    // iOS
    const authStatus = await requestPermission(messaging);

    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    console.log('iOS notification permission:', authStatus);

    return enabled;
  } catch (error) {
    console.log(
      '❌ Notification permission error:',
      error?.message || error,
    );

    return false;
  }
};

// =====================================================
// NOTIFICATION OPEN HANDLER
// =====================================================

const handleNotificationOpen = remoteMessage => {
  try {
    if (!remoteMessage) {
      return;
    }

    console.log(
      '🔔 Notification opened:',
      JSON.stringify(remoteMessage),
    );

    const data = remoteMessage?.data || {};

    const ticketId = data?.ticketId;

    if (!ticketId) {
      console.log('⚠️ Notification has no ticketId');
      return;
    }

    openTicketFromNotification({
      ticketId: String(ticketId),
      ticketSubject: data?.ticketSubject || '',
      threadId: data?.threadId || '',
      fromNotification: true,
    });
  } catch (error) {
    console.log(
      '❌ Notification open handling error:',
      error?.message || error,
    );
  }
};

// =====================================================
// SETUP NOTIFICATION OPEN HANDLERS
// =====================================================

export const setupNotificationOpenHandlers = () => {
  console.log('🔔 Setting up notification open handlers...');

  const unsubscribeOpenedApp = onNotificationOpenedApp(
    messaging,
    remoteMessage => {
      console.log('🔔 App opened from background notification');

      handleNotificationOpen(remoteMessage);
    },
  );

  getInitialNotification(messaging)
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('🔔 App opened from quit-state notification');

        handleNotificationOpen(remoteMessage);
      } else {
        console.log('ℹ️ No initial notification');
      }
    })
    .catch(error => {
      console.log(
        '❌ Initial notification error:',
        error?.message || error,
      );
    });

  return () => {
    if (unsubscribeOpenedApp) {
      unsubscribeOpenedApp();
    }
  };
};

// =====================================================
// SAVE FCM TOKEN
// =====================================================

export const saveFCMToken = async email => {
  try {
    if (!email) {
      console.log('❌ Cannot save FCM token: email missing');
      return null;
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    console.log('======================================');
    console.log('SAVING FCM TOKEN');
    console.log('Email:', normalizedEmail);
    console.log('======================================');

    // ---------------------------------------------------
    // STEP 1: Notification permission
    // ---------------------------------------------------

    console.log('🔔 Starting FCM permission request...');

    const permissionGranted =
      await requestNotificationPermission();

    console.log(
      '🔔 Notification permission result:',
      permissionGranted,
    );

    if (!permissionGranted) {
      console.log(
        '❌ Notification permission denied. FCM token will not be requested.',
      );

      return null;
    }

    // ---------------------------------------------------
    // STEP 2: Register device for remote messages
    // ---------------------------------------------------

    console.log(
      '🔔 Registering device for FCM remote messages...',
    );

    try {
      await registerDeviceForRemoteMessages(messaging);

      console.log(
        '✅ Device registered for FCM remote messages',
      );
    } catch (registerError) {
      console.log(
        '⚠️ FCM remote registration:',
        registerError?.message || registerError,
      );
    }

    // ---------------------------------------------------
    // STEP 3: Get FCM token
    // ---------------------------------------------------

    console.log('🔔 Requesting FCM token...');

    const token = await getToken(messaging);

    if (!token) {
      console.log('❌ FCM token is EMPTY');

      return null;
    }

    console.log('✅ FCM token generated');
    console.log('FCM TOKEN:', token);

    // ---------------------------------------------------
    // STEP 4: Save token locally
    // ---------------------------------------------------

    await AsyncStorage.setItem(
      'dealer_fcm_token',
      token,
    );

    console.log('✅ FCM token saved locally');

    // ---------------------------------------------------
    // STEP 5: Save token to backend
    // ---------------------------------------------------

    console.log(
      '🔔 Saving FCM token to backend...',
    );

    const response = await fetch(
      `${API_URL}/save-dealer-fcm-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          fcmToken: token,
          platform: Platform.OS,
        }),
      },
    );

    console.log(
      'Save FCM HTTP status:',
      response.status,
    );

    const responseText = await response.text();

    console.log(
      'Save FCM response:',
      responseText,
    );

    if (!response.ok) {
      throw new Error(
        `Save FCM token failed with status ${response.status}`,
      );
    }

    console.log(
      '✅ FCM token saved successfully',
    );

    return token;
  } catch (error) {
    console.log(
      '❌ FCM token error:',
      error?.message || error,
    );

    return null;
  }
};

// =====================================================
// TOKEN REFRESH LISTENER
// =====================================================

let unsubscribeTokenRefresh = null;

export const startFCMTokenRefreshListener = email => {
  try {
    if (!email) {
      return;
    }

    if (unsubscribeTokenRefresh) {
      unsubscribeTokenRefresh();
      unsubscribeTokenRefresh = null;
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    console.log(
      '🔔 Starting FCM token refresh listener...',
    );

    unsubscribeTokenRefresh = onTokenRefresh(
      messaging,
      async token => {
        try {
          console.log(
            '🔄 FCM token refreshed',
          );

          await AsyncStorage.setItem(
            'dealer_fcm_token',
            token,
          );

          const response = await fetch(
            `${API_URL}/save-dealer-fcm-token`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: normalizedEmail,
                fcmToken: token,
                platform: Platform.OS,
              }),
            },
          );

          console.log(
            'Refresh token HTTP status:',
            response.status,
          );

          const responseText = await response.text();

          console.log(
            'Refresh token response:',
            responseText,
          );
        } catch (error) {
          console.log(
            '❌ FCM token refresh save error:',
            error?.message || error,
          );
        }
      },
    );
  } catch (error) {
    console.log(
      '❌ FCM refresh listener error:',
      error?.message || error,
    );
  }
};

// =====================================================
// STOP TOKEN REFRESH LISTENER
// =====================================================

export const stopFCMTokenRefreshListener = () => {
  try {
    if (unsubscribeTokenRefresh) {
      unsubscribeTokenRefresh();
      unsubscribeTokenRefresh = null;

      console.log(
        '🛑 FCM token refresh listener stopped',
      );
    }
  } catch (error) {
    console.log(
      '❌ Stop FCM listener error:',
      error?.message || error,
    );
  }
};

// =====================================================
// REMOVE FCM TOKEN FROM BACKEND
// =====================================================

export const removeFCMTokenFromBackend = async email => {
  try {
    if (!email) {
      console.log(
        '❌ Cannot remove FCM token: email missing',
      );

      return false;
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    console.log(
      '🔔 Removing FCM token from backend...',
    );

    const response = await fetch(
      `${API_URL}/remove-dealer-fcm-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      },
    );

    console.log(
      'Remove FCM HTTP status:',
      response.status,
    );

    const responseText = await response.text();

    console.log(
      'Remove FCM response:',
      responseText,
    );

    return response.ok;
  } catch (error) {
    console.log(
      '❌ Remove FCM token error:',
      error?.message || error,
    );

    return false;
  }
};

// =====================================================
// DELETE LOCAL FCM TOKEN
// =====================================================

export const deleteLocalFCMToken = async () => {
  try {
    console.log(
      '🔔 Deleting local FCM token...',
    );

    await messaging.deleteToken();

    await AsyncStorage.removeItem(
      'dealer_fcm_token',
    );

    console.log(
      '✅ Local FCM token deleted',
    );

    return true;
  } catch (error) {
    console.log(
      '❌ Delete local FCM token error:',
      error?.message || error,
    );

    try {
      await AsyncStorage.removeItem(
        'dealer_fcm_token',
      );
    } catch {}

    return false;
  }
};

// =====================================================
// COMPLETE LOGOUT
// =====================================================

export const logoutFCM = async email => {
  try {
    console.log('======================================');
    console.log('FCM LOGOUT START');
    console.log('======================================');

    stopFCMTokenRefreshListener();

    await removeFCMTokenFromBackend(email);

    await deleteLocalFCMToken();

    console.log('======================================');
    console.log('✅ FCM LOGOUT COMPLETE');
    console.log('======================================');
  } catch (error) {
    console.log(
      '❌ FCM logout error:',
      error?.message || error,
    );
  }
};