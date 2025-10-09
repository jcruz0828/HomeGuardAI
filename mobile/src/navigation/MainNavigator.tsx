import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MainStackParamList } from './types';

// Import screens
import HomeSelectionScreen from '../screens/home-management/HomeSelectionScreen';
import HomeDashboardScreen from '../screens/home-management/HomeDashboardScreen';
import SecuritySettingsScreen from '../screens/security-access/SecuritySettingsScreen';
import AppSettingsScreen from '../screens/settings/AppSettingsScreen';
import HomeListScreen from '../screens/home-management/HomeListScreen';
import MemberManagementScreen from '../screens/people-management/MemberManagementScreen';
import ManagePeopleScreen from '../screens/people-management/ManagePeopleScreen';
import RecentActivitiesScreen from '../screens/activities/RecentActivitiesScreen';
import GlobalActivitiesScreen from '../screens/activities/GlobalActivitiesScreen';
import DeviceManagementScreen from '../screens/device-management/DeviceManagementScreen';
import AllHomesDevicesScreen from '../screens/device-management/AllHomesDevicesScreen';
import QueuedRequestsScreen from '../screens/requests/QueuedRequestsScreen';
import DeadboltControlScreen from '../screens/security-access/DeadboltControlScreen';
import FaceDetectionScreen from '../screens/security-access/FaceDetectionScreen';
import RFIDManagementScreen from '../screens/security-access/RFIDManagementScreen';
import AccessLogsScreen from '../screens/security-access/AccessLogsScreen';
// Import other main app screens as you create them
// import ProfileScreen from '../screens/ProfileScreen';
// import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator<MainStackParamList>();

const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="HomeSelection"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen 
        name="HomeSelection" 
        component={HomeSelectionScreen}
        options={{
          gestureEnabled: false, // Prevent swipe back on home selection
        }}
      />
      <Stack.Screen 
        name="HomeDashboard" 
        component={HomeDashboardScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="SecuritySettings" 
        component={SecuritySettingsScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="AppSettings" 
        component={AppSettingsScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="HomeList" 
        component={HomeListScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="MemberManagement" 
        component={MemberManagementScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="ManagePeople" 
        component={ManagePeopleScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="RecentActivities" 
        component={RecentActivitiesScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="GlobalActivities" 
        component={GlobalActivitiesScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="DeviceManagement" 
        component={DeviceManagementScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="AllHomesDevices" 
        component={AllHomesDevicesScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="QueuedRequests" 
        component={QueuedRequestsScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="DeadboltControl" 
        component={DeadboltControlScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="FaceDetection" 
        component={FaceDetectionScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="RFIDManagement" 
        component={RFIDManagementScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="AccessLogs" 
        component={AccessLogsScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      {/* Add more main app screens here as you develop them */}
      {/* 
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      */}
    </Stack.Navigator>
  );
};

export default MainNavigator;
