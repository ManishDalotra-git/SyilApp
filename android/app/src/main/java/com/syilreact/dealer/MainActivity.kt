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

    // =====================================================
    // ACTIVITY CREATED
    // =====================================================

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        android.util.Log.d(
            "MainActivity",
            "=========================================="
        )

        android.util.Log.d(
            "MainActivity",
            "MainActivity onCreate()"
        )

        android.util.Log.d(
            "MainActivity",
            "=========================================="
        )

        handleNotificationIntent(intent)
    }


    // =====================================================
    // NEW INTENT
    // =====================================================

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)

        android.util.Log.d(
            "MainActivity",
            "=========================================="
        )

        android.util.Log.d(
            "MainActivity",
            "MainActivity onNewIntent()"
        )

        android.util.Log.d(
            "MainActivity",
            "=========================================="
        )

        setIntent(intent)

        handleNotificationIntent(intent)
    }


    // =====================================================
    // HANDLE NOTIFICATION INTENT
    // =====================================================

    private fun handleNotificationIntent(
        intent: Intent?
    ) {

        if (intent == null) {

            android.util.Log.d(
                "MainActivity",
                "⚠️ Intent is null"
            )

            return
        }


        // =================================================
        // GET EXTRAS
        // =================================================

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


        // =================================================
        // LOG RECEIVED DATA
        // =================================================

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


        // =================================================
        // CHECK NOTIFICATION
        // =================================================

        if (!fromNotification) {

            android.util.Log.d(
                "MainActivity",
                "ℹ️ Normal app launch - no notification"
            )

            return
        }


        // =================================================
        // CHECK TICKET ID
        // =================================================

        if (ticketId.isNullOrBlank()) {

            android.util.Log.e(
                "MainActivity",
                "❌ Notification ticketId is EMPTY"
            )

            return
        }


        // =================================================
        // SAVE PENDING NOTIFICATION
        // =================================================

        android.util.Log.d(
            "MainActivity",
            "------------------------------------------"
        )

        android.util.Log.d(
            "MainActivity",
            "🚀 About to save pending notification"
        )

        android.util.Log.d(
            "MainActivity",
            "ticketId = $ticketId"
        )

        android.util.Log.d(
            "MainActivity",
            "ticketSubject = $ticketSubject"
        )

        android.util.Log.d(
            "MainActivity",
            "threadId = $threadId"
        )

        android.util.Log.d(
            "MainActivity",
            "------------------------------------------"
        )


        try {

            NotificationBadgeModule.savePendingNotification(
                ticketId = ticketId,
                ticketSubject = ticketSubject,
                threadId = threadId,
                fromNotification = true
            )


            android.util.Log.d(
                "MainActivity",
                "=========================================="
            )

            android.util.Log.d(
                "MainActivity",
                "✅ Pending notification SAVE CALL completed"
            )

            android.util.Log.d(
                "MainActivity",
                "Saved ticketId = $ticketId"
            )

            android.util.Log.d(
                "MainActivity",
                "=========================================="
            )

        } catch (error: Exception) {

            android.util.Log.e(
                "MainActivity",
                "❌ ERROR saving pending notification",
                error
            )
        }
    }
}