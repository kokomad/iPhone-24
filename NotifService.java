package com.phantomx.launcher;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import java.util.HashMap;

public class NotifService extends NotificationListenerService {
    static final HashMap<String, Integer> counts = new HashMap<>();

    @Override public void onListenerConnected() { refresh(); }
    @Override public void onNotificationPosted(StatusBarNotification s) { refresh(); }
    @Override public void onNotificationRemoved(StatusBarNotification s) { refresh(); }

    private void refresh() {
        HashMap<String, Integer> tmp = new HashMap<>();
        try {
            for (StatusBarNotification n : getActiveNotifications()) {
                if (n.isOngoing()) continue;
                Integer c = tmp.get(n.getPackageName());
                tmp.put(n.getPackageName(), c == null ? 1 : c + 1);
            }
        } catch (Exception ignored) {}
        synchronized (counts) { counts.clear(); counts.putAll(tmp); }
        if (LauncherBridgePlugin.onBadges != null) LauncherBridgePlugin.onBadges.run();
    }
}
