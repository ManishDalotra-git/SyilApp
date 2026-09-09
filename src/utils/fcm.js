import {Platform} from 'react-native';

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


// =====================================================
// FIREBASE
// =====================================================

const firebaseApp = getApp();

const messaging =
  getMessaging(firebaseApp);


// =====================================================
// BACKEND
// =====================================================

const API_URL =
  'https://syilapp-w8ye.onrender.com';


// =====================================================
// NOTIFICATION DATA HANDLER
// =====================================================

const handleNotificationOpen =
  remoteMessage => {

    try {

      console.log(
        '=========================================='
      );

      console.log(
        'NOTIFICATION OPENED'
      );

      console.log(
        'Remote message:',
        remoteMessage
      );

      console.log(
        'Notification data:',
        remoteMessage?.data
      );

      console.log(
        '=========================================='
      );


      // -------------------------------------------------
      // NO MESSAGE
      // -------------------------------------------------

      if (!remoteMessage) {

        console.log(
          '❌ No remote message'
        );

        return;

      }


      // -------------------------------------------------
      // GET DATA
      // -------------------------------------------------

      const data =
        remoteMessage?.data || {};


      // -------------------------------------------------
      // CHECK TICKET ID
      // -------------------------------------------------

      if (!data?.ticketId) {

        console.log(
          '❌ Notification does not contain ticketId'
        );

        return;

      }


      console.log(
        '✅ Notification ticketId:',
        data.ticketId
      );


      // -------------------------------------------------
      // OPEN TICKET
      // -------------------------------------------------

      openTicketFromNotification({

        ticketId:
          String(data.ticketId),

        ticketSubject:
          String(
            data.ticketSubject ||
            remoteMessage?.notification?.title ||
            'Ticket Details'
          ),

        threadId:
          String(
            data.threadId || ''
          ),

        fromNotification:
          true,

      });


    } catch (error) {

      console.log(
        '❌ Notification open handler error:',
        error
      );

    }

  };


// =====================================================
// SETUP NOTIFICATION OPEN HANDLERS
// =====================================================
//
// IMPORTANT:
// Sirf YAHI function notification click handle karega.
//
// Background:
// onNotificationOpenedApp()
//
// Completely closed / killed:
// getInitialNotification()
//
// =====================================================

export const setupNotificationOpenHandlers =
  () => {

    console.log(
      '=========================================='
    );

    console.log(
      'SETTING UP NOTIFICATION OPEN HANDLERS'
    );

    console.log(
      '=========================================='
    );


    // =================================================
    // BACKGROUND STATE
    // =================================================

    const unsubscribe =
      onNotificationOpenedApp(
        messaging,

        remoteMessage => {

          console.log(
            '📲 Notification opened from BACKGROUND'
          );

          handleNotificationOpen(
            remoteMessage
          );

        },

      );


    // =================================================
    // QUIT / KILLED STATE
    // =================================================

    getInitialNotification(
      messaging
    )
      .then(
        remoteMessage => {

          if (!remoteMessage) {

            console.log(
              'ℹ️ No initial notification'
            );

            return;

          }


          console.log(
            '📲 Notification opened from QUIT STATE'
          );


          handleNotificationOpen(
            remoteMessage
          );

        }
      )
      .catch(
        error => {

          console.log(
            '❌ getInitialNotification error:',
            error
          );

        }
      );


    // =================================================
    // RETURN BACKGROUND LISTENER CLEANUP
    // =================================================

    return unsubscribe;

  };


// =====================================================
// SAVE FCM TOKEN
// =====================================================

export const saveFCMToken =
  async email => {

    try {

      console.log(
        '=========================================='
      );

      console.log(
        'SAVING FCM TOKEN'
      );

      console.log(
        'Email:',
        email
      );

      console.log(
        '=========================================='
      );


      // -------------------------------------------------
      // ANDROID DEVICE REGISTRATION
      // -------------------------------------------------

      if (
        Platform.OS === 'android'
      ) {

        await registerDeviceForRemoteMessages();

      }


      // -------------------------------------------------
      // GET TOKEN
      // -------------------------------------------------

      const token =
        await getToken(
          messaging
        );


      console.log(
        'FCM TOKEN:',
        token
      );


      // -------------------------------------------------
      // TOKEN CHECK
      // -------------------------------------------------

      if (!token) {

        console.log(
          '❌ FCM token not available'
        );

        return null;

      }


      // -------------------------------------------------
      // SAVE TOKEN TO BACKEND
      // -------------------------------------------------

      const response =
        await fetch(
          `${API_URL}/save-fcm-token`,
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
                  email,

                fcmToken:
                  token,

              }),

          }
        );


      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      const responseText =
        await response.text();


      console.log(
        'Save FCM HTTP status:',
        response.status
      );

      console.log(
        'Save FCM response:',
        responseText
      );


      return token;


    } catch (error) {

      console.log(
        '❌ Save FCM Token Error:',
        error
      );

      return null;

    }

  };


// =====================================================
// FCM TOKEN REFRESH
// =====================================================
//
// Firebase kabhi-kabhi FCM token change kar deta hai.
//
// New token ko backend me dobara save karenge.
//
// =====================================================

export const listenForFCMTokenRefresh =
  email => {

    if (!email) {

      console.log(
        'FCM refresh: Email missing'
      );

      return () => {};

    }


    const unsubscribe =
      onTokenRefresh(
        messaging,

        async newToken => {

          try {

            console.log(
              '===================================='
            );

            console.log(
              'FCM TOKEN REFRESHED'
            );

            console.log(
              'New FCM Token:',
              newToken
            );

            console.log(
              '===================================='
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

                }
              );


            const result =
              await response.json();


            if (!response.ok) {

              console.error(
                'FCM refresh save failed:',
                result
              );

              return;

            }


            console.log(
              'Refreshed FCM token saved successfully:',
              result
            );


          } catch (error) {

            console.error(
              'FCM token refresh error:',
              error
            );

          }

        }

      );


    return unsubscribe;

  };