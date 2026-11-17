package com.phantomx.launcher;

import android.Manifest;
import android.app.Activity;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationManager;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.List;
import java.util.Locale;
import android.app.Activity;
import android.app.SearchManager;
import android.app.role.RoleManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.provider.AlarmClock;
import android.provider.MediaStore;
import android.provider.Settings;
import android.speech.RecognizerIntent;
import android.util.Base64;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;

@CapacitorPlugin(name = "LauncherBridge", permissions = {
    @Permission(alias = "location", strings = { Manifest.permission.ACCESS_COARSE_LOCATION })
})
public class LauncherBridgePlugin extends Plugin {
    private BroadcastReceiver pkgReceiver;
    static Runnable onBadges;

    @Override
    public void load() {
        onBadges = () -> notifyListeners("badges", badges());
        IntentFilter f = new IntentFilter();
        f.addAction(Intent.ACTION_PACKAGE_ADDED);
        f.addAction(Intent.ACTION_PACKAGE_REMOVED);
        f.addAction(Intent.ACTION_PACKAGE_REPLACED);
        f.addDataScheme("package");
        pkgReceiver = new BroadcastReceiver() {
            @Override public void onReceive(Context c, Intent i) { notifyListeners("appsChanged", new JSObject()); }
        };
        ContextCompat.registerReceiver(getContext(), pkgReceiver, f, ContextCompat.RECEIVER_NOT_EXPORTED);
    }

    public void notifyHome() { notifyListeners("homePressed", new JSObject()); }

    private Intent selector(String category) {
        return Intent.makeMainSelectorActivity(Intent.ACTION_MAIN, category);
    }

    private void start(Intent i) { i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); getContext().startActivity(i); }

    private String iconB64(PackageManager pm, ResolveInfo ri) {
        try {
            Drawable d = ri.loadIcon(pm);
            int s = 108;
            Bitmap b = Bitmap.createBitmap(s, s, Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(b);
            d.setBounds(0, 0, s, s);
            d.draw(c);
            ByteArrayOutputStream o = new ByteArrayOutputStream();
            b.compress(Bitmap.CompressFormat.PNG, 100, o);
            b.recycle();
            return Base64.encodeToString(o.toByteArray(), Base64.NO_WRAP);
        } catch (Throwable t) { return ""; }
    }

    @PluginMethod
    public void getApps(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        Intent q = new Intent(Intent.ACTION_MAIN, null).addCategory(Intent.CATEGORY_LAUNCHER);
        JSArray apps = new JSArray();
        java.util.HashSet<String> seen = new java.util.HashSet<>();
        for (ResolveInfo ri : pm.queryIntentActivities(q, 0)) {
            String p = ri.activityInfo.packageName;
            if (p.equals(getContext().getPackageName()) || !seen.add(p)) continue;
            JSObject o = new JSObject();
            o.put("label", ri.loadLabel(pm).toString());
            o.put("packageName", p);
            o.put("icon", iconB64(pm, ri));
            apps.put(o);
        }
        JSObject r = new JSObject(); r.put("apps", apps); call.resolve(r);
    }

    @PluginMethod
    public void resolveDefaults(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        JSObject d = new JSObject();
        put(pm, d, "camera", new Intent(MediaStore.ACTION_IMAGE_CAPTURE));
        put(pm, d, "gallery", selector(Intent.CATEGORY_APP_GALLERY));
        put(pm, d, "browser", selector(Intent.CATEGORY_APP_BROWSER));
        put(pm, d, "contacts", selector(Intent.CATEGORY_APP_CONTACTS));
        put(pm, d, "messages", selector(Intent.CATEGORY_APP_MESSAGING));
        put(pm, d, "phone", new Intent(Intent.ACTION_DIAL, Uri.parse("tel:")));
        put(pm, d, "settings", new Intent(Settings.ACTION_SETTINGS));
        if (pm.getLaunchIntentForPackage("com.android.vending") != null) d.put("store", "com.android.vending");
        if (pm.getLaunchIntentForPackage("com.google.android.youtube") != null) d.put("youtube", "com.google.android.youtube");
        JSObject r = new JSObject(); r.put("defaults", d); call.resolve(r);
    }

    private void put(PackageManager pm, JSObject d, String key, Intent i) {
        try {
            ResolveInfo ri = pm.resolveActivity(i, 0);
            if (ri != null && ri.activityInfo != null && !"android".equals(ri.activityInfo.packageName))
                d.put(key, ri.activityInfo.packageName);
        } catch (Throwable ignored) {}
    }

    @PluginMethod
    public void launchApp(PluginCall call) {
        String p = call.getString("packageName");
        if (p == null || p.isEmpty()) { call.reject("packageName required"); return; }
        try {
            Intent i = getContext().getPackageManager().getLaunchIntentForPackage(p);
            if (i == null) { call.reject("App not found"); return; }
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) { call.reject("launch failed", e); }
    }

    @PluginMethod
    public void open(PluginCall call) {
        String kind = call.getString("kind", "");
        String arg = call.getString("arg", "");
        try {
            Intent i;
            switch (kind) {
                case "dial": i = new Intent(Intent.ACTION_DIAL); break;
                case "sms": i = selector(Intent.CATEGORY_APP_MESSAGING); break;
                case "music": i = selector(Intent.CATEGORY_APP_MUSIC); break;
                case "calendar": i = selector(Intent.CATEGORY_APP_CALENDAR); break;
                case "alarms": i = new Intent(AlarmClock.ACTION_SHOW_ALARMS); break;
                case "search":
                    if (arg.isEmpty()) i = new Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com"));
                    else { i = new Intent(Intent.ACTION_WEB_SEARCH); i.putExtra(SearchManager.QUERY, arg); }
                    break;
                case "voice":
                    i = new Intent(Intent.ACTION_VOICE_COMMAND);
                    if (i.resolveActivity(getContext().getPackageManager()) == null) i = new Intent(RecognizerIntent.ACTION_WEB_SEARCH);
                    break;
                case "storage": i = new Intent(Settings.ACTION_INTERNAL_STORAGE_SETTINGS); break;
                case "battery": i = new Intent(Intent.ACTION_POWER_USAGE_SUMMARY); break;
                case "boost": i = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS); break;
                case "cool": i = new Intent(Settings.ACTION_BATTERY_SAVER_SETTINGS); break;
                case "privacy": i = new Intent("android.settings.PRIVACY_SETTINGS"); break;
                case "settings": i = new Intent(Settings.ACTION_SETTINGS); break;
                case "homeSettings": i = new Intent(Settings.ACTION_HOME_SETTINGS); break;
                case "appinfo": i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + arg)); break;
                case "uninstall": i = new Intent(Intent.ACTION_DELETE, Uri.parse("package:" + arg)); break;
                default: call.reject("unknown kind"); return;
            }
            start(i);
            call.resolve();
        } catch (Exception e) { call.reject("cannot open " + kind, e); }
    }

    @PluginMethod
    public void getBattery(PluginCall call) {
        Intent b = getContext().registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        JSObject r = new JSObject();
        if (b != null) {
            int level = b.getIntExtra(BatteryManager.EXTRA_LEVEL, -1), scale = b.getIntExtra(BatteryManager.EXTRA_SCALE, 100);
            int st = b.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
            r.put("level", scale > 0 ? Math.round(level * 100f / scale) : level);
            r.put("charging", st == BatteryManager.BATTERY_STATUS_CHARGING || st == BatteryManager.BATTERY_STATUS_FULL);
            r.put("temp", b.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0) / 10.0);
        }
        long ms = -1;
        if (Build.VERSION.SDK_INT >= 28) {
            BatteryManager bm = (BatteryManager) getContext().getSystemService(Context.BATTERY_SERVICE);
            if (bm != null) ms = bm.computeChargeTimeRemaining();
        }
        r.put("chargeMs", ms);
        call.resolve(r);
    }

    @PluginMethod
    public void isDefaultHome(PluginCall call) {
        Intent h = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME);
        ResolveInfo ri = getContext().getPackageManager().resolveActivity(h, PackageManager.MATCH_DEFAULT_ONLY);
        JSObject r = new JSObject();
        r.put("isDefault", ri != null && ri.activityInfo != null && getContext().getPackageName().equals(ri.activityInfo.packageName));
        call.resolve(r);
    }

    @PluginMethod
    public void requestHome(PluginCall call) {
        try {
            Activity a = getActivity();
            if (Build.VERSION.SDK_INT >= 29) {
                RoleManager rm = (RoleManager) getContext().getSystemService(Context.ROLE_SERVICE);
                if (rm != null && rm.isRoleAvailable(RoleManager.ROLE_HOME) && !rm.isRoleHeld(RoleManager.ROLE_HOME)) {
                    a.startActivityForResult(rm.createRequestRoleIntent(RoleManager.ROLE_HOME), 4242);
                    call.resolve(); return;
                }
            }
            start(new Intent(Settings.ACTION_HOME_SETTINGS));
            call.resolve();
        } catch (Exception e) {
            try { start(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)); call.resolve(); }
            catch (Exception e2) { call.reject("cannot request home", e2); }
        }
    }

    private JSObject badges() {
        JSObject o = new JSObject();
        synchronized (NotifService.counts) { for (java.util.Map.Entry<String, Integer> e : NotifService.counts.entrySet()) o.put(e.getKey(), e.getValue()); }
        return o;
    }

    @PluginMethod
    public void getBadges(PluginCall call) {
        JSObject r = new JSObject();
        r.put("enabled", NotificationManagerCompat.getEnabledListenerPackages(getContext()).contains(getContext().getPackageName()));
        r.put("badges", badges());
        call.resolve(r);
    }

    @PluginMethod
    public void openNotifAccess(PluginCall call) {
        try { start(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)); call.resolve(); }
        catch (Exception e) { call.reject("cannot open", e); }
    }

    @PluginMethod
    public void expandPanel(PluginCall call) {
        try {
            Object sb = getContext().getSystemService("statusbar");
            Class.forName("android.app.StatusBarManager").getMethod("expandNotificationsPanel").invoke(sb);
            call.resolve();
        } catch (Throwable t) { call.reject("cannot expand"); }
    }

    @PluginMethod
    public void getLocation(PluginCall call) {
        if (getPermissionState("location") != PermissionState.GRANTED) { requestPermissionForAlias("location", call, "locCb"); return; }
        doLoc(call);
    }

    @PermissionCallback
    private void locCb(PluginCall call) {
        if (getPermissionState("location") == PermissionState.GRANTED) doLoc(call); else call.reject("denied");
    }

    private void doLoc(PluginCall call) {
        try {
            LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
            Location best = null;
            for (String pr : lm.getProviders(true)) { Location l = lm.getLastKnownLocation(pr); if (l != null && (best == null || l.getTime() > best.getTime())) best = l; }
            if (best == null) { call.reject("no location"); return; }
            JSObject r = new JSObject(); r.put("lat", best.getLatitude()); r.put("lon", best.getLongitude());
            try {
                List<Address> a = new Geocoder(getContext(), new Locale("ar")).getFromLocation(best.getLatitude(), best.getLongitude(), 1);
                if (a != null && !a.isEmpty()) r.put("name", a.get(0).getLocality() != null ? a.get(0).getLocality() : a.get(0).getAdminArea());
            } catch (Exception ignored) {}
            call.resolve(r);
        } catch (SecurityException e) { call.reject("denied"); }
    }
}
