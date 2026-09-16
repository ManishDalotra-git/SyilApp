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

            val activeNotifications = notificationManager.activeNotifications

            val ticketPrefix = "FCM-Ticket:$ticketId:"

            activeNotifications.forEach { statusBarNotification ->

                val tag = statusBarNotification.tag

                if (tag != null && tag.startsWith(ticketPrefix)) {

                    notificationManager.cancel(
                        tag,
                        statusBarNotification.id
                    )

                    android.util.Log.d(
                        "NotificationBadge",
                        "Cancelled notification: $tag"
                    )
                }
            }
        }
    }
}