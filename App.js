import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/services/firebase';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import MapScreen from './src/screens/MapScreen';
import AddPlaceScreen from './src/screens/AddPlaceScreen';
import TimelineScreen from './src/screens/TimelineScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111',
          borderTopColor: '#222',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#00C896',
        tabBarInactiveTintColor: '#555',
      }}
    >
      <Tab.Screen name="Map" component={MapScreen} options={{ tabBarLabel: 'Explore', tabBarIcon: () => null }} />
      <Tab.Screen name="AddPlace" component={AddPlaceScreen} options={{ tabBarLabel: 'Add Place', tabBarIcon: () => null }} />
      <Tab.Screen name="Timeline" component={TimelineScreen} options={{ tabBarLabel: 'Timeline', tabBarIcon: () => null }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile', tabBarIcon: () => null }} />
    </Tab.Navigator>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

registerRootComponent(App);