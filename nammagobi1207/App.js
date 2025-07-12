import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

// Screen Imports
import RetailScreen from './screens/RetailScreen';
import ManufacturerScreen from './screens/ManufacturerScreen';
import ServiceScreen from './screens/ServiceScreen';
import PreOwnedScreen from './screens/PreOwnedScreen';
import RetailListScreen from './screens/RetailListScreen';
import EventsScreen from './screens/EventsScreen';
import PreOwnedListScreen from './screens/PreOwnedListScreen';
import ServiceListScreen from './screens/ServiceListScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Retail':
              iconName = 'cart';
              break;
            case 'Manufacturer':
              iconName = 'business';
              break;
            case 'Service':
              iconName = 'construct';
              break;
            case 'Pre-Owned':
              iconName = 'cube';
              break;
            case 'Events':
              iconName = 'calendar';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Retail" component={RetailScreen} />
      <Tab.Screen name="Manufacturer" component={ManufacturerScreen} />
      <Tab.Screen name="Service" component={ServiceScreen} />
      <Tab.Screen name="Pre-Owned" component={PreOwnedScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [address, setAddress] = useState('Fetching location...');

  useEffect(() => {
    let subscription;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress('Location permission denied');
        Alert.alert('Permission Denied', 'Unable to access location.');
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 100,
        },
        async (loc) => {
          try {
            const geocode = await Location.reverseGeocodeAsync(loc.coords);
            if (geocode.length > 0) {
              const { city, district, region, country } = geocode[0];
              setAddress(`${district || city}, ${region}, ${country}`);
            } else {
              setAddress('Location not found');
            }
          } catch (err) {
            console.error(err);
            setAddress('Location error');
          }
        }
      );
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  return (
    <NavigationContainer>
      <View style={styles.container}>
        <View style={styles.locationBar}>
          <Ionicons name="location-outline" size={16} color="#007bff" />
          <Text style={styles.locationText}>{address}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeTabs" component={BottomTabs} />
            <Stack.Screen name="ProductList" component={RetailListScreen} />
            <Stack.Screen name="PreOwnedListScreen" component={PreOwnedListScreen} options={{ title: 'Pre-Owned Items' }} />
            <Stack.Screen name="ServiceListScreen" component={ServiceListScreen} options={{ title: 'Services' }} />
          </Stack.Navigator>
        </View>
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingTop: 40,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  locationText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#333',
  },
});