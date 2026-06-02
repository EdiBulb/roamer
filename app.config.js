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
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      '@rnmapbox/maps',
    ],
    extra: {
      eas: {
        projectId: '0667cdd2-f70b-43f3-b5de-09c564accb6c',
      },
    },
  },
};
