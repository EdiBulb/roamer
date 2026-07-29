module.exports = {
  expo: {
    name: 'Roamer',
    slug: 'random-run',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0D1B2A',
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      package: 'com.anonymous.randomrun',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0D1B2A',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        'android.permission.ACCESS_BACKGROUND_LOCATION',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.FOREGROUND_SERVICE_LOCATION',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      '@rnmapbox/maps',
      ['expo-location', {
        locationAlwaysAndWhenInUsePermission: 'Roamer needs your location to track your run, including in the background when your screen is off.',
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      }],
    ],
    extra: {
      eas: {
        projectId: '0667cdd2-f70b-43f3-b5de-09c564accb6c',
      },
    },
  },
};
