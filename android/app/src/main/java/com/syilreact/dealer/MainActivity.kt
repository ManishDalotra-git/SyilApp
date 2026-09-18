package com.syilreact.dealer

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "syilReact"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(
            this,
            mainComponentName,
            fabricEnabled
        )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        handleNotificationIntent(intent)
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)

        setIntent(intent)

        handleNotificationIntent(intent)
    }

    private fun handleNotificationIntent(intent: Intent?) {

        if (intent == null) {
            return
        }

        val ticketId =
            intent.getStringExtra("ticketId")

        val ticketSubject =
            intent.getStringExtra("ticketSubject")

        val threadId =
            intent.getStringExtra("threadId")

        val fromNotification =
            intent.getBooleanExtra(
                "fromNotification",
                false
            )

        android.util.Log.d(
            "MainActivity",
            "=========================================="
        )

        android.util.Log.d(
            "MainActivity",
            "Notification Intent received"
        )

        android.util.Log.d(
            "MainActivity",
            "ticketId: $ticketId"
        )

        android.util.Log.d(
            "MainActivity",
            "ticketSubject: $ticketSubject"
        )

        android.util.Log.d(
            "MainActivity",
            "threadId: $threadId"
        )

        android.util.Log.d(
            "MainActivity",
            "fromNotification: $fromNotification"
        )

        android.util.Log.d(
            "MainActivity",
            "=========================================="
        )
    }
}