import {
  Platform,
  PermissionsAndroid,
} from 'react-native';

import {getApp} from '@react-native-firebase/app';

import {
  getInitialNotification,
  getMessaging,
  getToken,
  onNotificationOpenedApp,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
} from '@react-native-firebase/messaging';

import {openTicketFromNotification} from '../navigation/navigationRef';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseApp = getApp();
const messaging = getMessaging(firebaseApp);

const API_URL =
  'https://syilapp-w8ye.onrender.com';


// =====================================================
// NOTIFICATION PERMISSION
// =====================================================

export const requestNotificationPermission =
  async () => {

    try {

      // -----------------------------------------------
      // ANDROID 13+
      // -----------------------------------------------

      if (
        Platform.OS === 'android' &&
        Platform.Version >= 33
      ) {

        const result =
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS
              .POST_NOTIFICATIONS,
            {
              title:
                'Allow Notifications',

              message:
                'SYIL Dealer App needs notification permission so you can receive new ticket messages.',

              buttonPositive:
                'Allow',

              buttonNegative:
                'Don’t Allow',

              buttonNeutral:
                'Ask Me Later',
            },
          );

        console.log(
          'Android notification permission:',
          result,
        );

        return (
          result ===
          PermissionsAndroid.RESULTS.GRANTED
        );
      }

      // -----------------------------------------------
      // ANDROID < 13
      // -----------------------------------------------

      if (Platform.OS === 'android') {
        return true;
      }

      // -----------------------------------------------
      // iOS
      // -----------------------------------------------

      const authStatus =
        await messaging.requestPermission();

      console.log(
        'iOS notification permission:',
        authStatus,
      );

      return (
        authStatus === 1 ||
        authStatus === 2
      );

    } catch (error) {

      console.log(
        '❌ Notification permission error:',
        error,
      );

      return false;
    }
  };


// =====================================================
// NOTIFICATION OPEN HANDLER
// =====================================================

const handleNotificationOpen =
  remoteMessage => {

    try {

      console.log(
        '==========================================',
      );

      console.log(
        '🔔 NOTIFICATION OPENED',
      );

      console.log(
        'Remote message:',
        remoteMessage,
      );

      console.log(
        'Notification data:',
        remoteMessage?.data,
      );

      console.log(
        '==========================================',
      );


      if (!remoteMessage) {
        return;
      }


      const data =
        remoteMessage?.data || {};


      if (!data?.ticketId) {

        console.log(
          '❌ Notification ticketId missing',
        );

        return;
      }


      openTicketFromNotification({

        ticketId:
          String(data.ticketId),

        ticketSubject:
          String(
            data.ticketSubject ||
            remoteMessage?.notification?.title ||
            'Ticket Details',
          ),

        threadId:
          String(
            data.threadId || '',
          ),

        fromNotification:
          true,
      });

    } catch (error) {

      console.log(
        '❌ Notification open handler error:',
        error,
      );

    }
  };


// =====================================================
// SETUP NOTIFICATION OPEN HANDLERS
// =====================================================

export const setupNotificationOpenHandlers =
  () => {

    console.log(
      'SETTING UP NOTIFICATION OPEN HANDLERS',
    );


    // -----------------------------------------------
    // APP IN BACKGROUND
    // -----------------------------------------------

    const unsubscribe =
      onNotificationOpenedApp(
        messaging,
        remoteMessage => {

          console.log(
            '📲 Notification opened from BACKGROUND',
          );

          handleNotificationOpen(
            remoteMessage,
          );

        },
      );


    // -----------------------------------------------
    // APP COMPLETELY CLOSED
    // -----------------------------------------------

    getInitialNotification(
      messaging,
    )
      .then(remoteMessage => {

        if (!remoteMessage) {

          console.log(
            'ℹ️ No initial notification',
          );

          return;
        }

        console.log(
          '📲 Notification opened from QUIT STATE',
        );

        handleNotificationOpen(
          remoteMessage,
        );

      })
      .catch(error => {

        console.log(
          '❌ getInitialNotification error:',
          error,
        );

      });


    return unsubscribe;
  };


// =====================================================
// SAVE FCM TOKEN
// =====================================================

export const saveFCMToken =
  async email => {

    try {

      if (!email) {

        console.log(
          '❌ saveFCMToken: email missing',
        );

        return null;
      }


      console.log(
        '==========================================',
      );

      console.log(
        'SAVING FCM TOKEN',
      );

      console.log(
        'Email:',
        email,
      );

      console.log(
        '==========================================',
      );


      // -----------------------------------------------
      // REQUEST NOTIFICATION PERMISSION FIRST
      // -----------------------------------------------

      const permissionGranted =
        await requestNotificationPermission();


      if (!permissionGranted) {

        console.log(
          '❌ Notification permission not granted',
        );

        return null;
      }


      // -----------------------------------------------
      // REGISTER DEVICE
      // -----------------------------------------------

      await registerDeviceForRemoteMessages();


      // -----------------------------------------------
      // GET CURRENT FCM TOKEN
      // -----------------------------------------------

      const token =
        await getToken(
          messaging,
        );


      console.log(
        'FCM TOKEN:',
        token,
      );

      if (!token) {

        console.log(
          '❌ FCM token not available',
        );

        return null;
      }

      await AsyncStorage.setItem(
        'dealer_fcm_token',
        token,
      );

      console.log(
        '✅ FCM token saved locally',
      );


      // -----------------------------------------------
      // SAVE TOKEN
      //
      // IMPORTANT:
      // Correct backend endpoint
      // -----------------------------------------------

      const response =
        await fetch(
          `${API_URL}/save-dealer-fcm-token`,
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({

                email:
                  String(email)
                    .trim()
                    .toLowerCase(),

                fcmToken:
                  token,

                platform:
                  Platform.OS,

              }),
          },
        );


      const responseText =
        await response.text();


      console.log(
        'Save FCM HTTP status:',
        response.status,
      );

      console.log(
        'Save FCM response:',
        responseText,
      );


      if (!response.ok) {

        console.log(
          '❌ FCM token save failed',
        );

        return null;
      }


      console.log(
        '✅ FCM token saved successfully',
      );


      return token;

    } catch (error) {

      console.log(
        '❌ Save FCM Token Error:',
        error,
      );

      return null;
    }
  };


// =====================================================
// FCM TOKEN REFRESH
// =====================================================

let tokenRefreshUnsubscribe =
  null;


export const startFCMTokenRefreshListener =
  email => {

    if (!email) {

      console.log(
        'FCM refresh listener: email missing',
      );

      return () => {};
    }


    // Remove previous listener
    if (tokenRefreshUnsubscribe) {

      tokenRefreshUnsubscribe();

      tokenRefreshUnsubscribe =
        null;
    }


    tokenRefreshUnsubscribe =
      onTokenRefresh(
        messaging,

        async newToken => {

          try {

            console.log(
              '====================================',
            );

            console.log(
              '🔄 FCM TOKEN REFRESHED',
            );

            console.log(
              'New FCM Token:',
              newToken,
            );

            console.log(
              '====================================',
            );


            const response =
              await fetch(
                `${API_URL}/save-dealer-fcm-token`,
                {
                  method:
                    'POST',

                  headers: {
                    'Content-Type':
                      'application/json',
                  },

                  body:
                    JSON.stringify({

                      email:
                        String(email)
                          .trim()
                          .toLowerCase(),

                      fcmToken:
                        newToken,

                      platform:
                        Platform.OS,

                    }),
                },
              );


            const result =
              await response.json();


            if (!response.ok) {

              console.error(
                '❌ Refreshed FCM token save failed:',
                result,
              );

              return;
            }


            console.log(
              '✅ Refreshed FCM token saved:',
              result,
            );

          } catch (error) {

            console.error(
              '❌ FCM token refresh error:',
              error,
            );

          }

        },
      );


    return tokenRefreshUnsubscribe;
  };


// =====================================================
// STOP FCM TOKEN REFRESH LISTENER
// =====================================================

export const stopFCMTokenRefreshListener =
  () => {

    if (
      tokenRefreshUnsubscribe
    ) {

      tokenRefreshUnsubscribe();

      tokenRefreshUnsubscribe =
        null;

      console.log(
        'FCM token refresh listener stopped',
      );
    }
  };


// =====================================================
// REMOVE FCM TOKEN FROM BACKEND
// =====================================================

export const removeFCMTokenFromBackend =
  async email => {

    try {

      if (!email) {
        return false;
      }


      const response =
        await fetch(
          `${API_URL}/remove-dealer-fcm-token`,
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({

                email:
                  String(email)
                    .trim()
                    .toLowerCase(),

              }),
          },
        );


      const result =
        await response.json();


      console.log(
        'Remove FCM token response:',
        result,
      );


      return response.ok;

    } catch (error) {

      console.log(
        '❌ Remove FCM token error:',
        error,
      );

      return false;
    }
  };


// =====================================================
// DELETE LOCAL FCM TOKEN
// =====================================================

export const deleteLocalFCMToken =
  async () => {

    try {

      await messaging.deleteToken();

      console.log(
        '✅ Local FCM token deleted',
      );

      return true;

    } catch (error) {

      console.log(
        '❌ Delete local FCM token error:',
        error,
      );

      return false;
    }
  };


// =====================================================
// LOGOUT FCM
// =====================================================

export const logoutFCM =
  async email => {

    try {

      stopFCMTokenRefreshListener();


      if (email) {

        await removeFCMTokenFromBackend(
          email,
        );

      }


      await deleteLocalFCMToken();


      console.log(
        '✅ FCM logout completed',
      );

    } catch (error) {

      console.log(
        '❌ FCM logout error:',
        error,
      );
    }
  };