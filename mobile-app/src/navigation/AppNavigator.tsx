import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { RunScreen } from '../screens/RunScreen';
import { CalendarScreen } from '../screens/CalendarScreen';

const Tab = createBottomTabNavigator();

const icons = {
  discoveries: {
    active: require('../../assets/icons/tab-discoveries-active.png'),
    inactive: require('../../assets/icons/tab-discoveries-inactive.png'),
  },
  journey: {
    active: require('../../assets/icons/tab-journey-active.png'),
    inactive: require('../../assets/icons/tab-journey-inactive.png'),
  },
  trail: {
    active: require('../../assets/icons/tab-trail-active.png'),
    inactive: require('../../assets/icons/tab-trail-inactive.png'),
  },
};


export function AppNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E0E0E0',
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#BDBDBD',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Discoveries',
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused ? icons.discoveries.active : icons.discoveries.inactive}
              style={{ width: 100, height: 100 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Run"
        component={RunScreen}
        options={{
          tabBarLabel: 'Journey',
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused ? icons.journey.active : icons.journey.inactive}
              style={{ width: 100, height: 100 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Trail',
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused ? icons.trail.active : icons.trail.inactive}
              style={{ width: 100, height: 100 }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
