package com.phantomx.launcher;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginHandle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LauncherBridgePlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // Home button pressed while launcher is already open -> go back to the home screen
        if (intent != null && intent.hasCategory(Intent.CATEGORY_HOME) && getBridge() != null) {
            PluginHandle h = getBridge().getPlugin("LauncherBridge");
            if (h != null) ((LauncherBridgePlugin) h.getInstance()).notifyHome();
        }
    }
}
