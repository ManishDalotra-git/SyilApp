import {
  createNavigationContainerRef,
} from '@react-navigation/native';

// =====================================================
// NAVIGATION REF
// =====================================================

export const navigationRef = createNavigationContainerRef();

// =====================================================
// PENDING NOTIFICATION
// =====================================================

let pendingTicketData = null;

// =====================================================
// OPEN TICKET FROM NOTIFICATION
// =====================================================

export const openTicketFromNotification =
  data => {
    try {
      console.log('==========================================');
      console.log('OPEN TICKET FROM NOTIFICATION');
      console.log('Notification data:', data);
      console.log('Navigation ready:',navigationRef.isReady() );
      console.log('==========================================');

      // -------------------------------------------------
      // CHECK TICKET ID
      // -------------------------------------------------

      if (!data?.ticketId) {
        console.log('Notification ticketId missing');
        return;
      }

      // -------------------------------------------------
      // PREPARE ROUTE PARAMS
      // -------------------------------------------------

      const routeParams = {
        ticketId: String(data.ticketId),
        subject: String(data.ticketSubject || data.subject || 'Ticket Details'),
        threadId: String(data.threadId || ''),
        fromNotification: true,
      };
      console.log( 'Prepared route params:', routeParams );

      // -------------------------------------------------
      // NAVIGATION NOT READY
      // -------------------------------------------------

      if (
        !navigationRef.isReady()
      ) {
        console.log('⏳ Navigation not ready.');
        console.log('Saving pending ticket:', routeParams);
        pendingTicketData = routeParams;
        return;
      }

      // -------------------------------------------------
      // NAVIGATION READY
      // -------------------------------------------------

      console.log('Navigation is ready');
      console.log('Opening ViewTicketDetail');
      navigationRef.navigate('ViewTicketDetail',routeParams);

    } catch (error) {
      console.log('openTicketFromNotification error:',error);
    }

  };

// =====================================================
// OPEN PENDING TICKET
// =====================================================

export const openPendingTicket =
  () => {
    try {
      console.log('==========================================');
      console.log('CHECKING PENDING NOTIFICATION TICKET');
      console.log('Navigation ready:',navigationRef.isReady());
      console.log('Pending ticket:',pendingTicketData);
      console.log('==========================================');

      // -------------------------------------------------
      // NOTHING PENDING
      // -------------------------------------------------

      if (
        !pendingTicketData
      ) {
        console.log('No pending notification ticket');
        return;
      }

      // -------------------------------------------------
      // NAVIGATION NOT READY
      // -------------------------------------------------

      if (
        !navigationRef.isReady()
      ) {
        console.log('Navigation still not ready');
        return;
      }
      
      const ticket = pendingTicketData;
      pendingTicketData = null;

      console.log('Opening pending notification ticket:',ticket);
      navigationRef.navigate('ViewTicketDetail',ticket);
    } catch (error) {
      console.log('openPendingTicket error:',error);
    }
  };