package com.syilreact.dealer

import android.app.NotificationManager
import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NotificationBadgeModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "NotificationBadge"
    }

    @ReactMethod
    fun cancelTicketNotifications(ticketId: String) {

        val notificationManager =
            reactContext.getSystemService(Context.NOTIFICATION_SERVICE)
                    as NotificationManager

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {

            val activeNotifications =
                notificationManager.activeNotifications

            val ticketPrefix = "FCM-Ticket:$ticketId:"

            activeNotifications.forEach { notification ->

                val tag = notification.tag

                if (tag != null && tag.startsWith(ticketPrefix)) {

                    notificationManager.cancel(
                        tag,
                        notification.id
                    )

                    android.util.Log.d(
                        "NotificationBadge",
                        "Cancelled notification: $tag"
                    )
                }
            }
        }
    }

    @ReactMethod
    fun setBadge(count: Int) {

        val safeCount = if (count < 0) 0 else count

        android.util.Log.d(
            "NotificationBadge",
            "Badge requested: $safeCount"
        )

        /*
         * Android launcher badges are derived from
         * active notifications and are launcher/OEM dependent.
         *
         * The native FCM service creates notifications with
         * setNumber() so supported launchers can display
         * the notification count.
         */
    }

    @ReactMethod
    fun clearBadge() {

        android.util.Log.d(
            "NotificationBadge",
            "Badge clear requested"
        )
    }
}