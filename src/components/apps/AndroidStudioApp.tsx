/** Android Studio with the Arcus Engineer React Native app and the Android Emulator. */
import IdeShell, { type IdeFile } from './IdeShell';

const FILES: IdeFile[] = [
  {
    name: 'ArcusEngineer',
    ext: 'ts',
    code: `// ArcusEngineer · Android
// React Native 0.79 · Expo SDK 53 · Kotlin host
// Modules: app, expo-modules`,
  },
  {
    name: 'MainActivity.kt',
    ext: 'ts',
    code: `package com.arcusfm.engineer

import android.os.Bundle
import com.facebook.react.ReactActivity
import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Keep the splash up until the work-order cache is warm.
    setTheme(R.style.AppTheme)
    super.onCreate(null)
  }

  override fun getMainComponentName(): String = "main"
}`,
  },
  {
    name: 'build.gradle.kts',
    ext: 'ts',
    code: `plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
  id("com.facebook.react")
}

android {
  namespace = "com.arcusfm.engineer"
  compileSdk = 35
  defaultConfig {
    applicationId = "com.arcusfm.engineer"
    minSdk = 26
    targetSdk = 35
    versionName = "2.4.1"
  }
}`,
  },
  {
    name: 'useWorkOrders.ts',
    ext: 'ts',
    code: `import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useWorkOrders(engineerId: string) {
  return useQuery({
    queryKey: ['work-orders', engineerId],
    queryFn: () => api.get<WorkOrder[]>(\`/engineers/\${engineerId}/work-orders\`),
    staleTime: 5 * 60_000,
    networkMode: 'offlineFirst',
  });
}`,
  },
  {
    name: 'AndroidManifest.xml',
    ext: 'html',
    code: `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  <application android:label="Arcus Engineer" android:theme="@style/AppTheme">
    <activity android:name=".MainActivity" android:exported="true" />
  </application>
</manifest>`,
  },
];

const BUILD_LOG = [
  'Starting Gradle Daemon…',
  '> Task :app:preDebugBuild',
  '> Task :app:createBundleDebugJsAndAssets (Metro)',
  '> Task :app:compileDebugKotlin',
  '> Task :app:packageDebug',
  'Installing APK on Pixel 10 Pro API 36',
  'BUILD SUCCESSFUL · Launching com.arcusfm.engineer/.MainActivity',
];

export default function AndroidStudioApp() {
  return (
    <IdeShell
      flavour="studio"
      platform="android"
      scheme="app"
      device="Pixel 10 Pro API 36"
      files={FILES}
      buildLog={BUILD_LOG}
      statusLeft="Android Studio Narwhal · browser mock — install Android Studio for the real Emulator"
      navigatorTitle="Android"
      simulatorTitle="Running Devices"
    />
  );
}
