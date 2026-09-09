import {
  createNavigationContainerRef,
} from '@react-navigation/native';


// =====================================================
// NAVIGATION REF
// =====================================================
//
// IMPORTANT:
// Yehi navigationRef App.jsx ke NavigationContainer
// mein bhi use hoga.
//
// Isse FCM notification se actual navigation container
// control hoga.
//
// =====================================================

export const navigationRef =
  createNavigationContainerRef();


// =====================================================
// PENDING NOTIFICATION
// =====================================================
//
// Agar notification click ke time NavigationContainer
// ready nahi hai, ticket yahan temporarily store hoga.
//
// Navigation ready hone ke baad openPendingTicket()
// isko ViewTicketDetail par open karega.
//
// =====================================================

let pendingTicketData =
  null;


// =====================================================
// OPEN TICKET FROM NOTIFICATION
// =====================================================

export const openTicketFromNotification =
  data => {

    try {

      console.log(
        '=========================================='
      );

      console.log(
        'OPEN TICKET FROM NOTIFICATION'
      );

      console.log(
        'Notification data:',
        data
      );

      console.log(
        'Navigation ready:',
        navigationRef.isReady()
      );

      console.log(
        '=========================================='
      );


      // -------------------------------------------------
      // CHECK TICKET ID
      // -------------------------------------------------

      if (!data?.ticketId) {

        console.log(
          '❌ Notification ticketId missing'
        );

        return;

      }


      // -------------------------------------------------
      // PREPARE ROUTE PARAMS
      // -------------------------------------------------

      const routeParams = {

        ticketId:
          String(data.ticketId),

        subject:
          String(
            data.ticketSubject ||
            data.subject ||
            'Ticket Details'
          ),

        threadId:
          String(
            data.threadId || ''
          ),

        fromNotification:
          true,

      };


      console.log(
        'Prepared route params:',
        routeParams
      );


      // -------------------------------------------------
      // NAVIGATION NOT READY
      // -------------------------------------------------

      if (
        !navigationRef.isReady()
      ) {

        console.log(
          '⏳ Navigation not ready.'
        );

        console.log(
          'Saving pending ticket:',
          routeParams
        );


        pendingTicketData =
          routeParams;


        return;

      }


      // -------------------------------------------------
      // NAVIGATION READY
      // -------------------------------------------------

      console.log(
        '✅ Navigation is ready'
      );

      console.log(
        '➡️ Opening ViewTicketDetail'
      );


      navigationRef.navigate(
        'ViewTicketDetail',
        routeParams
      );


    } catch (error) {

      console.log(
        '❌ openTicketFromNotification error:',
        error
      );

    }

  };


// =====================================================
// OPEN PENDING TICKET
// =====================================================
//
// App start hone ke time NavigationContainer ready
// nahi tha to ticket pendingTicketData mein save hua tha.
//
// Ab NavigationContainer ready hone par yahan se
// ViewTicketDetail open hoga.
//
// =====================================================

export const openPendingTicket =
  () => {

    try {

      console.log(
        '=========================================='
      );

      console.log(
        'CHECKING PENDING NOTIFICATION TICKET'
      );

      console.log(
        'Navigation ready:',
        navigationRef.isReady()
      );

      console.log(
        'Pending ticket:',
        pendingTicketData
      );

      console.log(
        '=========================================='
      );


      // -------------------------------------------------
      // NOTHING PENDING
      // -------------------------------------------------

      if (
        !pendingTicketData
      ) {

        console.log(
          'ℹ️ No pending notification ticket'
        );

        return;

      }


      // -------------------------------------------------
      // NAVIGATION NOT READY
      // -------------------------------------------------

      if (
        !navigationRef.isReady()
      ) {

        console.log(
          '⏳ Navigation still not ready'
        );

        return;

      }


      // -------------------------------------------------
      // COPY TICKET
      // -------------------------------------------------

      const ticket =
        pendingTicketData;


      // -------------------------------------------------
      // CLEAR PENDING FIRST
      // -------------------------------------------------

      pendingTicketData =
        null;


      // -------------------------------------------------
      // OPEN TICKET
      // -------------------------------------------------

      console.log(
        '➡️ Opening pending notification ticket:',
        ticket
      );


      navigationRef.navigate(
        'ViewTicketDetail',
        ticket
      );


    } catch (error) {

      console.log(
        '❌ openPendingTicket error:',
        error
      );

    }

  };