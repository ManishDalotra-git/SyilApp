import {
  Platform,
} from 'react-native';

import {
  getApp,
} from '@react-native-firebase/app';

import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
} from '@react-native-firebase/messaging';

import {
  openTicketFromNotification,
} from '../navigation/navigationRef';


const firebaseApp = getApp();

const messaging = getMessaging(firebaseApp);


const API_URL =
  'https://syilapp-w8ye.onrender.com';


/*
 * ============================================================
 * SAVE FCM TOKEN
 * ============================================================
 *
 * Login ke baad ye function call hoga.
 *
 * Flow:
 *
 * Android/iOS
 *     ↓
 * Firebase FCM token generate
 *     ↓
 * Backend ko token send
 *     ↓
 * Backend HubSpot contact find karega
 *     ↓
 * dealer_fcm_token property me token save hoga
 *
 */
export const saveFCMToken = async email => {

  try {

    if (!email) {

      console.log(
        'FCM: Email missing',
      );

      return null;
    }


    /*
     * Android aur iOS dono me notification permission
     * request karenge.
     */
    const authStatus =
      await requestPermission(
        messaging,
      );


    const permissionGranted =
      authStatus ===
        AuthorizationStatus.AUTHORIZED ||
      authStatus ===
        AuthorizationStatus.PROVISIONAL;


    if (!permissionGranted) {

      console.log(
        'FCM: Notification permission denied',
      );

      return null;
    }


    /*
     * FCM TOKEN
     */
    const fcmToken =
      await getToken(
        messaging,
      );


    if (!fcmToken) {

      console.log(
        'FCM: Token is empty',
      );

      return null;
    }


    console.log(
      '====================================',
    );

    console.log(
      'FCM Token generated successfully',
    );

    console.log(
      'Platform:',
      Platform.OS,
    );

    console.log(
      'FCM Token:',
      fcmToken,
    );

    console.log(
      '====================================',
    );


    /*
     * Send token to backend
     */
    const response =
      await fetch(
        `${API_URL}/save-dealer-fcm-token`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({

              email:
                email
                  .trim()
                  .toLowerCase(),

              fcmToken:

                fcmToken,

              platform:
                Platform.OS,

            }),
          },
        );


    const responseText =
      await response.text();


    let responseData = {};


    try {

      responseData =
        responseText
          ? JSON.parse(
              responseText,
            )
          : {};

    } catch {

      throw new Error(
        `Server returned invalid response: ${responseText.slice(
          0,
          150,
        )}`,
      );

    }


    /*
     * Backend error
     */
    if (!response.ok) {

      throw new Error(
        responseData.message ||
        responseData.error ||
        `HTTP ${response.status}`,
      );

    }


    console.log(
      '====================================',
    );

    console.log(
      'Dealer FCM token saved successfully:',
      responseData,
    );

    console.log(
      '====================================',
    );


    return fcmToken;


  } catch (error) {

    console.error(
      'Dealer FCM setup error:',
      error,
    );

    return null;
  }
};


/*
 * ============================================================
 * FCM TOKEN REFRESH
 * ============================================================
 *
 * Firebase kabhi-kabhi existing FCM token change kar sakta hai.
 *
 * Isliye new token milne par backend me dobara save karenge.
 *
 */
export const listenForFCMTokenRefresh =
  email => {

    if (!email) {

      console.log(
        'FCM refresh: Email missing',
      );

      return () => {};
    }


    const unsubscribe =
      onTokenRefresh(
        messaging,

        async newToken => {

          try {

            console.log(
              '====================================',
            );

            console.log(
              'FCM token refreshed',
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
                  method: 'POST',

                  headers: {
                    'Content-Type':
                      'application/json',
                  },

                  body:
                    JSON.stringify({

                      email:
                        email
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
                'FCM refresh save failed:',
                result,
              );

              return;
            }


            console.log(
              'Refreshed FCM token saved successfully:',
              result,
            );


          } catch (error) {

            console.error(
              'FCM token refresh error:',
              error,
            );

          }

        },
      );


    return unsubscribe;
  };


/*
 * ============================================================
 * NOTIFICATION CLICK / NAVIGATION
 * ============================================================
 *
 * Jab user notification par tap karega:
 *
 * Notification
 *      ↓
 * ticketId
 *      ↓
 * ViewTicketDetail
 *
 */


/*
 * App background me thi
 */
export const setupNotificationNavigation =
  () => {

    console.log(
      'Notification navigation listeners started',
    );


    const unsubscribe =
      onNotificationOpenedApp(
        messaging,

        remoteMessage => {

          console.log(
            'Notification opened from background:',
            remoteMessage?.data,
          );


          openTicketFromNotification(
            remoteMessage?.data,
          );

        },
      );


    /*
     * App completely closed / killed thi
     */
    getInitialNotification(
      messaging,
    )
      .then(
        remoteMessage => {

          if (!remoteMessage) {

            console.log(
              'App was not opened from notification',
            );

            return;
          }


          console.log(
            'Notification opened from quit state:',
            remoteMessage.data,
          );


          openTicketFromNotification(
            remoteMessage.data,
          );

        },
      )
      .catch(
        error => {

          console.error(
            'Initial notification error:',
            error,
          );

        },
      );


    return unsubscribe;
  };