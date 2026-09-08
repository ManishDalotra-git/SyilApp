import {
  createNavigationContainerRef,
} from '@react-navigation/native';

export const navigationRef =
  createNavigationContainerRef();

let pendingTicketData = null;

export const openTicketFromNotification = data => {
  console.log(
    'Notification navigation data:',
    data,
  );

  if (!data?.ticketId) {
    console.log(
      'Notification ticketId missing',
    );
    return;
  }

  const routeParams = {
    ticketId: String(data.ticketId),

    subject: String(
      data.ticketSubject ||
      'Ticket Details',
    ),

    threadId: String(
      data.threadId || '',
    ),

    fromNotification: true,
  };

  if (!navigationRef.isReady()) {
    console.log(
      'Navigation not ready, saving ticket temporarily',
    );

    pendingTicketData =
      routeParams;

    return;
  }

  console.log(
    'Opening ViewTicketDetail:',
    routeParams,
  );

  navigationRef.navigate(
    'ViewTicketDetail',
    routeParams,
  );
};

export const openPendingTicket = () => {
  if (
    !navigationRef.isReady() ||
    !pendingTicketData
  ) {
    return;
  }

  console.log(
    'Opening pending notification ticket:',
    pendingTicketData,
  );

  navigationRef.navigate(
    'ViewTicketDetail',
    pendingTicketData,
  );

  pendingTicketData = null;
};