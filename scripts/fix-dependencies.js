const fs = require('fs');
const path = require('path');

/**
 * Helper to patch or write file content.
 */
function writeFile(targetPath, content) {
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  console.log(`Writing/Patching: ${targetPath}`);
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('Successfully written!\n');
}

// -------------------------------------------------------
// 1. Patch react-native-accurate-step-counter build.gradle
// -------------------------------------------------------
const stepCounterGradle = path.join(
  __dirname, '..', 'node_modules',
  'react-native-accurate-step-counter', 'android', 'build.gradle'
);

writeFile(stepCounterGradle, `
buildscript {
    repositories {
        google()
        mavenCentral()
    }

    dependencies {
        classpath 'com.android.tools.build:gradle:8.0.0'
    }
}

apply plugin: 'com.android.library'

def safeExtGet(prop, fallback) {
    rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
}

android {
    compileSdkVersion safeExtGet('compileSdkVersion', 34)
    buildToolsVersion safeExtGet('buildToolsVersion', '34.0.0')

    defaultConfig {
        minSdkVersion safeExtGet('minSdkVersion', 21)
        targetSdkVersion safeExtGet('targetSdkVersion', 34)
        versionCode 1
        versionName "1.0"
    }
    lintOptions {
        abortOnError false
    }
}

repositories {
    google()
    mavenCentral()
}

dependencies {
    implementation 'com.facebook.react:react-native:+'
    implementation 'androidx.core:core:1.9.0'
}
`);

// -------------------------------------------------------
// 2. Patch react-native-shake build.gradle
// -------------------------------------------------------
const shakeGradle = path.join(
  __dirname, '..', 'node_modules',
  'react-native-accurate-step-counter', 'node_modules',
  'react-native-shake', 'android', 'build.gradle'
);

if (fs.existsSync(path.dirname(shakeGradle))) {
  writeFile(shakeGradle, `
def safeExtGet(prop, fallback) {
    rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
}

apply plugin: 'com.android.library'

android {
    compileSdkVersion safeExtGet('compileSdkVersion', 34)
    buildToolsVersion safeExtGet('buildToolsVersion', '34.0.0')

    defaultConfig {
        minSdkVersion safeExtGet('minSdkVersion', 21)
        versionCode 4
        versionName "4.0.0"
    }
    lintOptions {
       warning 'InvalidPackage'
    }
}

dependencies {
    implementation "com.facebook.react:react-native:+"
}

allprojects {
    repositories {
        maven { url "https://jitpack.io" }
        mavenLocal()
        google()
        mavenCentral()
        maven {
            url "$rootDir/../node_modules/react-native/android"
        }
    }
}
`);
}

// -------------------------------------------------------
// 3. Write RNWalkCounterService.java
// -------------------------------------------------------
const stepCounterServiceJava = path.join(
  __dirname, '..', 'node_modules',
  'react-native-accurate-step-counter', 'android', 'src', 'main', 'java', 'com', 'synclovis', 'RNWalkCounterService.java'
);

writeFile(stepCounterServiceJava, `package com.synclovis;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.IBinder;
import android.text.Html;
import androidx.core.app.NotificationCompat;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class RNWalkCounterService extends Service implements SensorEventListener, StepListener {
    public static final String ACTION_REDISPLAY_NOTIFICATION = "com.synclovis.ACTION_REDISPLAY_NOTIFICATION";
    private static final String CHANNEL_ID = "WalkCounterServiceChannel";
    private static final int NOTIFICATION_ID = 8162;
    private static final long NOTIFICATION_UPDATE_INTERVAL_MS = 1000;
    private static final String PREFS_NAME = "StepCounterPrefs";
    private static final String PREFS_KEY_STEPS = "today_steps";
    private static final String PREFS_KEY_DATE = "step_date";

    private SensorManager sensorManager;
    private Sensor accel;
    private StepDetector simpleStepDetector;

    // numSteps = steps counted in this service session only
    // totalSteps = the authoritative daily total (loaded from SharedPreferences on start)
    private int numSteps = 0;
    private int totalSteps = 0;

    private static RNWalkCounterService instance = null;
    private static ReactContext reactContextRef = null;

    private NotificationCompat.Builder notificationBuilder;
    private NotificationManager notificationManager;
    private SharedPreferences prefs;
    private long lastNotificationUpdateMs = 0;
    private final NumberFormat numberFormat = NumberFormat.getNumberInstance(Locale.getDefault());

    public static RNWalkCounterService getInstance() {
        return instance;
    }

    public static void setReactContext(ReactContext context) {
        reactContextRef = context;
    }

    private CharSequence parseBold(String htmlText) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            return Html.fromHtml(htmlText, Html.FROM_HTML_MODE_LEGACY);
        } else {
            return Html.fromHtml(htmlText);
        }
    }

    /**
     * Returns the current authoritative daily step count.
     * Called from JS (via RNWalkCounterModule) when the app opens to sync UI.
     */
    public int getTodaySteps() {
        return totalSteps;
    }

    /**
     * Loads today's step count from SharedPreferences.
     * Resets to 0 if the saved date is not today (new day).
     */
    private int loadTodaySteps() {
        String today = getTodayDateString();
        String savedDate = prefs.getString(PREFS_KEY_DATE, "");
        if (today.equals(savedDate)) {
            return prefs.getInt(PREFS_KEY_STEPS, 0);
        } else {
            // New day — reset
            prefs.edit()
                .putInt(PREFS_KEY_STEPS, 0)
                .putString(PREFS_KEY_DATE, today)
                .apply();
            return 0;
        }
    }

    /**
     * Persists the current total step count to SharedPreferences.
     */
    private void saveSteps(int steps) {
        prefs.edit()
            .putInt(PREFS_KEY_STEPS, steps)
            .putString(PREFS_KEY_DATE, getTodayDateString())
            .apply();
    }

    private String getTodayDateString() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        notificationManager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        createNotificationChannel();

        if (intent != null && ACTION_REDISPLAY_NOTIFICATION.equals(intent.getAction())) {
            if (notificationBuilder != null && notificationManager != null) {
                notificationBuilder.setContentText(parseBold("<b>Today's Steps: " + numberFormat.format(totalSteps) + "</b>"));
                notificationManager.notify(NOTIFICATION_ID, notificationBuilder.build());
                return START_STICKY;
            }
        }

        // ── Load today's persisted step count ─────────────────────────────────
        totalSteps = loadTodaySteps();
        numSteps = 0;

        // ── Build tap-to-open intent ──────────────────────────────────────────
        Intent notificationIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pendingIntent = null;
        if (notificationIntent != null) {
            notificationIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
        }

        // ── Build delete intent so notification reappears if slid/dismissed ────
        Intent deleteIntent = new Intent(this, RNWalkCounterService.class);
        deleteIntent.setAction(ACTION_REDISPLAY_NOTIFICATION);
        PendingIntent pendingDeleteIntent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            pendingDeleteIntent = PendingIntent.getForegroundService(
                this, 1, deleteIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
        } else {
            pendingDeleteIntent = PendingIntent.getService(
                this, 1, deleteIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
        }

        // ── Resolve notification icon ─────────────────────────────────────────
        int iconResId = getResources().getIdentifier("ic_notification", "drawable", getPackageName());
        if (iconResId == 0) iconResId = android.R.drawable.ic_menu_mylocation;

        // ── Build persistent notification with BOLD text ──────────────────────
        notificationBuilder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(parseBold("<b>🚶 Step Tracker Running</b>"))
                .setContentText(parseBold("<b>Today's Steps: " + numberFormat.format(totalSteps) + "</b>"))
                .setSubText(parseBold("<b>Tracking activity in the background...</b>"))
                .setSmallIcon(iconResId)
                .setContentIntent(pendingIntent)
                .setDeleteIntent(pendingDeleteIntent)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setSilent(true)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .setPriority(NotificationCompat.PRIORITY_LOW);

        startForeground(NOTIFICATION_ID, notificationBuilder.build());

        // ── Start accelerometer sensor ────────────────────────────────────────
        float threshold = 15.0f;
        int delayNs = 150000000;
        if (intent != null) {
            threshold = intent.getFloatExtra("threshold", 15.0f);
            delayNs = intent.getIntExtra("delayNs", 150000000);
        }

        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
        if (sensorManager != null) {
            accel = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            simpleStepDetector = new StepDetector(threshold, delayNs);
            simpleStepDetector.registerListener(this);
            if (accel != null) {
                sensorManager.registerListener(this, accel, SensorManager.SENSOR_DELAY_FASTEST);
            }
        }

        return START_STICKY;
    }

    /**
     * Called on every detected step.
     * Increments count, saves to SharedPreferences, updates notification, and
     * emits event to React Native (if JS thread is alive).
     */
    @Override
    public void step(long timeNs) {
        numSteps++;
        totalSteps++;

        // Check for day rollover (e.g., user walked past midnight)
        String today = getTodayDateString();
        String savedDate = prefs.getString(PREFS_KEY_DATE, today);
        if (!today.equals(savedDate)) {
            // New day — reset both counters
            numSteps = 1;
            totalSteps = 1;
        }

        // Persist natively — works even if JS thread is dead
        saveSteps(totalSteps);

        // Update the notification (throttled to 1/sec)
        updateNotification(totalSteps);

        // Emit to React Native UI — only if JS thread is alive (best-effort)
        if (reactContextRef != null && reactContextRef.hasActiveCatalystInstance()) {
            try {
                WritableMap params = Arguments.createMap();
                params.putString("steps", String.valueOf(numSteps));
                reactContextRef.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("onStepRunning", params);
            } catch (Exception e) {
                // JS thread gone — silently ignore
            }
        }
    }

    private void updateNotification(int steps) {
        if (notificationBuilder == null || notificationManager == null) return;
        long now = System.currentTimeMillis();
        if (now - lastNotificationUpdateMs < NOTIFICATION_UPDATE_INTERVAL_MS) return;
        lastNotificationUpdateMs = now;
        notificationBuilder.setContentText(parseBold("<b>Today's Steps: " + numberFormat.format(steps) + "</b>"));
        notificationManager.notify(NOTIFICATION_ID, notificationBuilder.build());
    }

    @Override
    public void onDestroy() {
        if (sensorManager != null) sensorManager.unregisterListener(this);
        instance = null;
        notificationBuilder = null;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "Step Counter Tracking", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("Shows step count while tracking is active");
            channel.setShowBadge(false);
            if (notificationManager != null) notificationManager.createNotificationChannel(channel);
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            simpleStepDetector.updateAccel(
                    event.timestamp, event.values[0], event.values[1], event.values[2]);
        }
    }
}
`);


// -------------------------------------------------------
// 4. Overwrite RNWalkCounterModule.java to use the service
// -------------------------------------------------------
const stepCounterModuleJava = path.join(
  __dirname, '..', 'node_modules',
  'react-native-accurate-step-counter', 'android', 'src', 'main', 'java', 'com', 'synclovis', 'RNWalkCounterModule.java'
);

writeFile(stepCounterModuleJava, `package com.synclovis;

import android.content.Intent;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.os.Build;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class RNWalkCounterModule extends ReactContextBaseJavaModule implements SensorEventListener, StepListener {

  private static final String PREFS_NAME = "StepCounterPrefs";
  private static final String PREFS_KEY_STEPS = "today_steps";
  private static final String PREFS_KEY_DATE = "step_date";

  private final ReactApplicationContext reactContext;

  public RNWalkCounterModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
    RNWalkCounterService.setReactContext(reactContext);
  }

  @Override
  public String getName() {
    return "RNWalkCounter";
  }

  @ReactMethod
  public void startCounter(float THRESHOLD, int DELAY_NS) {
    RNWalkCounterService.setReactContext(this.reactContext);
    Intent intent = new Intent(this.reactContext, RNWalkCounterService.class);
    intent.putExtra("threshold", THRESHOLD);
    intent.putExtra("delayNs", DELAY_NS);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        this.reactContext.startForegroundService(intent);
    } else {
        this.reactContext.startService(intent);
    }
    this.reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit("onStepStart", null);
  }

  @ReactMethod
  public void defaultStartCounter() {
    RNWalkCounterService.setReactContext(this.reactContext);
    Intent intent = new Intent(this.reactContext, RNWalkCounterService.class);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        this.reactContext.startForegroundService(intent);
    } else {
        this.reactContext.startService(intent);
    }
    this.reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit("onStepStart", null);
  }

  /**
   * Returns today's total step count from native SharedPreferences.
   * The service manages this value — it is valid even if the service was
   * stopped or the app was force-closed and reopened.
   */
  @ReactMethod
  public void getTodaySteps(Promise promise) {
    try {
      SharedPreferences prefs = this.reactContext.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE);
      String today = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
      String savedDate = prefs.getString(PREFS_KEY_DATE, "");
      int steps = today.equals(savedDate) ? prefs.getInt(PREFS_KEY_STEPS, 0) : 0;

      // Also return the date for the JS layer to verify freshness
      WritableMap result = Arguments.createMap();
      result.putInt("steps", steps);
      result.putString("date", today);
      promise.resolve(result);
    } catch (Exception e) {
      promise.reject("GET_STEPS_ERROR", e.getMessage());
    }
  }

  @ReactMethod
  public void stopCounter() {
    Intent intent = new Intent(this.reactContext, RNWalkCounterService.class);
    this.reactContext.stopService(intent);
  }

  @Override
  public void onAccuracyChanged(Sensor sensor, int accuracy) {}

  @Override
  public void onSensorChanged(SensorEvent event) {}

  @Override
  public void step(long timeNs) {}
}
`);


// -------------------------------------------------------
// 5. Overwrite AndroidManifest.xml to declare service
// -------------------------------------------------------
const stepCounterManifest = path.join(
  __dirname, '..', 'node_modules',
  'react-native-accurate-step-counter', 'android', 'src', 'main', 'AndroidManifest.xml'
);

writeFile(stepCounterManifest, `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
          package="com.synclovis">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_HEALTH" />
    
    <application>
        <service
            android:name="com.synclovis.RNWalkCounterService"
            android:foregroundServiceType="health"
            android:exported="false" />
    </application>
</manifest>
`);

console.log('All dependencies patched successfully!');
