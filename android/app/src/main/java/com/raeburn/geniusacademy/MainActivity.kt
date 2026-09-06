package com.raeburn.geniusacademy

import android.annotation.SuppressLint
import android.net.Uri
import android.os.Bundle
import android.webkit.CookieManager
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.ComponentActivity

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private val appUri: Uri by lazy { Uri.parse(BuildConfig.APP_URL) }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this)
        setContentView(webView)

        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.databaseEnabled = true
        webView.settings.allowFileAccess = false
        webView.settings.allowContentAccess = false
        webView.settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        webView.settings.safeBrowsingEnabled = true
        webView.settings.mediaPlaybackRequiresUserGesture = false

        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false)

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val target = request.url
                val allowed = target.scheme == "https" && target.host.equals(appUri.host, ignoreCase = true)
                return !allowed
            }
        }

        webView.loadUrl(BuildConfig.APP_URL)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })
    }

    override fun onDestroy() {
        webView.stopLoading()
        webView.loadUrl("about:blank")
        webView.clearHistory()
        webView.removeAllViews()
        webView.destroy()
        super.onDestroy()
    }
}
