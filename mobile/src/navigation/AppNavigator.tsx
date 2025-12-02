import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useUser } from '../contexts/UserContext';
import { RootStackParamList } from './types';

// Import navigators
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import LoadingScreen from '../screens/common/LoadingScreen';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { user, isLoading } = useUser();

  useEffect(() => {
    console.log('=== APP NAVIGATOR: State Change ===');
    console.log('isLoading:', isLoading);
    console.log('user:', user ? `Present (${user.email})` : 'null');
    console.log('Will show:', user ? 'Main Navigator' : 'Auth Navigator');
  }, [user, isLoading]);

  // Show loading screen while checking authentication
  if (isLoading) {
    console.log('AppNavigator: Showing loading screen');
    return <LoadingScreen />;
  }

  console.log('AppNavigator: Rendering navigator, user:', user ? 'authenticated' : 'not authenticated');

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Disable gestures for root navigator
      }}
    >
      {user ? (
        // User is authenticated, show main app
        <>
          {console.log('AppNavigator: Rendering Main Navigator')}
        <Stack.Screen name="Main" component={MainNavigator} />
        </>
      ) : (
        // User is not authenticated, show auth flow
        <>
          {console.log('AppNavigator: Rendering Auth Navigator')}
        <Stack.Screen name="Auth" component={AuthNavigator} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
