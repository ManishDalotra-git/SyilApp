package com.syilreact.dealer

import android.app.NotificationManager
import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap

class NotificationBadgeModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "NotificationBadge"
        private const val TICKET_PREFIX = "FCM-Ticket:"

        // -----------------------------------------------
        // Pending notification data
        // -----------------------------------------------

        @Volatile
        private var pendingTicketId: String? = null

        @Volatile
        private var pendingTicketSubject: String? = null

        @Volatile
        private var pendingThreadId: String? = null

        @Volatile
        private var pendingFromNotification: Boolean = false

        fun savePendingNotification(
            ticketId: String?,
            ticketSubject: String?,
            threadId: String?,
            fromNotification: Boolean
        ) {

            if (ticketId.isNullOrBlank()) {
                return
            }

            pendingTicketId = ticketId
            pendingTicketSubject = ticketSubject ?: ""
            pendingThreadId = threadId ?: ""
            pendingFromNotification = fromNotification

            android.util.Log.d(
                TAG,
                "Pending notification saved: " +
                        "ticketId=$pendingTicketId, " +
                        "ticketSubject=$pendingTicketSubject, " +
                        "threadId=$pendingThreadId, " +
                        "fromNotification=$pendingFromNotification"
            )
        }

        fun clearPendingNotification() {

            pendingTicketId = null
            pendingTicketSubject = null
            pendingThreadId = null
            pendingFromNotification = false

            android.util.Log.d(
                TAG,
                "Pending notification cleared"
            )
        }
    }

    override fun getName(): String {
        return "NotificationBadge"
    }

    // =====================================================
    // PENDING NOTIFICATION
    // =====================================================

    /**
     * MainActivity se notification click ka data
     * temporarily store kiya jaata hai.
     *
     * JS startup hone ke baad getPendingNotification()
     * se ye data retrieve hoga.
     */
    @ReactMethod
    fun getPendingNotification(
        promise: Promise
    ) {

        try {

            val ticketId = pendingTicketId

            // -------------------------------------------
            // No pending notification
            // -------------------------------------------

            if (ticketId.isNullOrBlank()) {

                android.util.Log.d(
                    TAG,
                    "No pending notification found"
                )

                promise.resolve(null)

                return
            }

            // -------------------------------------------
            // Create JS object
            // -------------------------------------------

            val result: WritableMap =
                Arguments.createMap()

            result.putString(
                "ticketId",
                ticketId
            )

            result.putString(
                "ticketSubject",
                pendingTicketSubject ?: ""
            )

            result.putString(
                "threadId",
                pendingThreadId ?: ""
            )

            result.putBoolean(
                "fromNotification",
                pendingFromNotification
            )

            android.util.Log.d(
                TAG,
                "Returning pending notification: $result"
            )

            // -------------------------------------------
            // Clear after reading
            // -------------------------------------------

            clearPendingNotification()

            promise.resolve(result)

        } catch (error: Exception) {

            android.util.Log.e(
                TAG,
                "Error getting pending notification",
                error
            )

            promise.reject(
                "PENDING_NOTIFICATION_ERROR",
                error.message,
                error
            )
        }
    }

    // =====================================================
    // CANCEL TICKET NOTIFICATIONS
    // =====================================================

    /**
     * Cancel all active notifications belonging to a ticket.
     *
     * When a ticket is opened/read, its notifications are removed.
     * Android launcher badge will then be recalculated from the
     * remaining active notifications.
     */
    @ReactMethod
    fun cancelTicketNotifications(ticketId: String) {

        val notificationManager =
            reactContext.getSystemService(
                Context.NOTIFICATION_SERVICE
            ) as NotificationManager

        if (
            android.os.Build.VERSION.SDK_INT <
            android.os.Build.VERSION_CODES.M
        ) {
            return
        }

        val activeNotifications =
            notificationManager.activeNotifications

        val ticketPrefix =
            "$TICKET_PREFIX$ticketId:"

        var cancelledCount = 0

        activeNotifications.forEach { notification ->

            val tag = notification.tag

            if (
                tag != null &&
                tag.startsWith(ticketPrefix)
            ) {

                notificationManager.cancel(
                    tag,
                    notification.id
                )

                cancelledCount++

                android.util.Log.d(
                    TAG,
                    "Cancelled notification: $tag"
                )
            }
        }

        android.util.Log.d(
            TAG,
            "Ticket $ticketId notifications cancelled: $cancelledCount"
        )

        android.util.Log.d(
            TAG,
            "Remaining active notifications: " +
                    notificationManager.activeNotifications.size
        )
    }

    // =====================================================
    // BADGE SYNCHRONIZATION
    // =====================================================

    /**
     * Badge synchronization.
     *
     * We intentionally do NOT call NotificationCompat.setNumber()
     * here because setNumber() on individual notifications can make
     * launcher badges aggregate incorrectly.
     */
    @ReactMethod
    fun setBadge(count: Int) {

        val safeCount =
            if (count < 0) 0 else count

        val notificationManager =
            reactContext.getSystemService(
                Context.NOTIFICATION_SERVICE
            ) as NotificationManager

        android.util.Log.d(
            TAG,
            "Badge synchronization requested: $safeCount"
        )

        if (
            android.os.Build.VERSION.SDK_INT >=
            android.os.Build.VERSION_CODES.M
        ) {

            val activeCount =
                notificationManager.activeNotifications.size

            android.util.Log.d(
                TAG,
                "Current active notification count: $activeCount"
            )
        }
    }

    // =====================================================
    // CLEAR BADGE
    // =====================================================

    /**
     * Clear all SYIL FCM notifications.
     *
     * Used when total unread count becomes zero.
     */
    @ReactMethod
    fun clearBadge() {

        val notificationManager =
            reactContext.getSystemService(
                Context.NOTIFICATION_SERVICE
            ) as NotificationManager

        if (
            android.os.Build.VERSION.SDK_INT >=
            android.os.Build.VERSION_CODES.M
        ) {

            val activeNotifications =
                notificationManager.activeNotifications

            var cancelledCount = 0

            activeNotifications.forEach { notification ->

                val tag = notification.tag

                if (
                    tag != null &&
                    tag.startsWith(TICKET_PREFIX)
                ) {

                    notificationManager.cancel(
                        tag,
                        notification.id
                    )

                    cancelledCount++

                    android.util.Log.d(
                        TAG,
                        "Cleared notification: $tag"
                    )
                }
            }

            android.util.Log.d(
                TAG,
                "Total SYIL notifications cleared: $cancelledCount"
            )
        }
    }
}