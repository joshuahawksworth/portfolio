/** Xcode with the Arcus Engineer React Native app and the iOS Simulator. */
import IdeShell, { type IdeFile } from './IdeShell';

const FILES: IdeFile[] = [
  {
    name: 'ArcusEngineer',
    ext: 'ts',
    code: `// ArcusEngineer.xcworkspace
// React Native 0.79 · Expo SDK 53 · TypeScript
// Targets: ArcusEngineer (iOS 17+), ArcusEngineerTests`,
  },
  {
    name: 'App.tsx',
    ext: 'tsx',
    code: `import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import TodayScreen from './screens/TodayScreen';
import WorkOrderScreen from './screens/WorkOrderScreen';

const Stack = createNativeStackNavigator<RootStack>();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Today" component={TodayScreen} />
          <Stack.Screen name="WorkOrder" component={WorkOrderScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}`,
  },
  {
    name: 'useWorkOrders.ts',
    ext: 'ts',
    code: `import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

// Work orders for the signed-in engineer, cached so the job sheet
// still opens in a plant room with no signal.
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
    name: 'AppDelegate.swift',
    ext: 'ts',
    code: `import Expo
import React

@UIApplicationMain
class AppDelegate: ExpoAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    self.moduleName = "main"
    self.initialProps = [:]
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}`,
  },
  {
    name: 'Info.plist',
    ext: 'html',
    code: `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
  <key>CFBundleDisplayName</key>
  <string>Arcus Engineer</string>
  <key>NSCameraUsageDescription</key>
  <string>Photograph completed work for the job sheet.</string>
  <key>NSLocationWhenInUseUsageDescription</key>
  <string>Confirm you are on site before starting a job.</string>
</dict>
</plist>`,
  },
];

const BUILD_LOG = [
  'Resolve Package Graph',
  'Compiling ArcusEngineer (Debug, iphonesimulator)',
  'Bundling JavaScript with Metro…',
  'Linking ArcusEngineer.app',
  'Signing with Apple Development: Joshua Hawksworth',
  'Installing on iPhone 17 Pro',
  'Build Succeeded · Launching Arcus Engineer',
];

export default function XcodeApp() {
  return (
    <IdeShell
      flavour="xcode"
      platform="ios"
      scheme="ArcusEngineer"
      device="iPhone 17 Pro"
      files={FILES}
      buildLog={BUILD_LOG}
      statusLeft="Xcode 26 · browser mock — install Xcode from the Mac App Store for the real Simulator"
      navigatorTitle="Project navigator"
      simulatorTitle="Simulator"
    />
  );
}
