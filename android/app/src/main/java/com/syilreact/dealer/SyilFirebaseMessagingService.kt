package com.syilreact.dealer

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class SyilFirebaseMessagingService : FirebaseMessagingService() {

    companion object {

        private const val TAG = "SyilFCMService"

        private const val CHANNEL_ID = "syil_support_messages"
        private const val CHANNEL_NAME = "Support Messages"

        private const val CHANNEL_DESCRIPTION =
            "Notifications for SYIL support messages"
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {

        super.onMessageReceived(remoteMessage)

        Log.d(
            TAG,
            "======================================"
        )

        Log.d(
            TAG,
            "FCM message received"
        )

        Log.d(
            TAG,
            "Message ID: ${remoteMessage.messageId}"
        )

        Log.d(
            TAG,
            "Data: ${remoteMessage.data}"
        )

        Log.d(
            TAG,
            "======================================"
        )

        val data = remoteMessage.data

        val title =
            data["notificationTitle"]
                ?: data["title"]
                ?: "SYIL Support"

        val body =
            data["notificationBody"]
                ?: data["body"]
                ?: "You have a new support message."

        val ticketId =
            data["ticketId"]
                ?: ""

        val ticketSubject =
            data["ticketSubject"]
                ?: ""

        val threadId =
            data["threadId"]
                ?: ""

        val totalUnreadCount =
            data["totalUnreadCount"]
                ?.toIntOrNull()
                ?.coerceAtLeast(0)
                ?: 1

        Log.d(
            TAG,
            "Title: $title"
        )

        Log.d(
            TAG,
            "Body: $body"
        )

        Log.d(
            TAG,
            "Ticket ID: $ticketId"
        )

        Log.d(
            TAG,
            "Total unread count: $totalUnreadCount"
        )

        createNotificationChannel()

        showNotification(
            title = title,
            body = body,
            ticketId = ticketId,
            ticketSubject = ticketSubject,
            threadId = threadId
        )
    }

    private fun createNotificationChannel() {

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            )

            channel.description =
                CHANNEL_DESCRIPTION

            channel.setShowBadge(true)

            val notificationManager =
                getSystemService(
                    NotificationManager::class.java
                )

            notificationManager.createNotificationChannel(
                channel
            )
        }
    }

    private fun showNotification(
        title: String,
        body: String,
        ticketId: String,
        ticketSubject: String,
        threadId: String
    ) {

        val notificationManager =
            getSystemService(
                NotificationManager::class.java
            )

        val intent = Intent(
            this,
            MainActivity::class.java
        ).apply {

            flags =
                Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP

            putExtra(
                "ticketId",
                ticketId
            )

            putExtra(
                "ticketSubject",
                ticketSubject
            )

            putExtra(
                "threadId",
                threadId
            )

            putExtra(
                "fromNotification",
                true
            )
        }

        val pendingIntent =
            PendingIntent.getActivity(
                this,
                ticketId.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or
                        PendingIntent.FLAG_IMMUTABLE
            )

        /*
         * Every message gets its own notification.
         *
         * IMPORTANT:
         * Do NOT use setNumber(totalUnreadCount) here.
         *
         * Android launchers may aggregate the numbers from
         * all active notifications. If we used:
         *
         * 1 + 2 + 3 + 4
         *
         * the launcher could show 10 instead of 4.
         */

        val notificationId =
            System.currentTimeMillis().toInt()

        val notification =
            NotificationCompat.Builder(
                this,
                CHANNEL_ID
            )
                .setSmallIcon(
                    applicationInfo.icon
                )
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(
                    NotificationCompat.BigTextStyle()
                        .bigText(body)
                )
                .setPriority(
                    NotificationCompat.PRIORITY_HIGH
                )
                .setAutoCancel(true)
                .setContentIntent(
                    pendingIntent
                )
                .setShowWhen(true)
                .build()

        val notificationTag =
            "FCM-Ticket:$ticketId:$notificationId"

        notificationManager.notify(
            notificationTag,
            notificationId,
            notification
        )

        Log.d(
            TAG,
            "Notification displayed"
        )

        Log.d(
            TAG,
            "Notification tag: $notificationTag"
        )

        Log.d(
            TAG,
            "Notification ID: $notificationId"
        )
    }
}