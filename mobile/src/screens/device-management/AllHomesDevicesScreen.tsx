import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { Home } from '../../types/Home';
import { homeService, HomeResponse } from '../../services/home-management/HomeService';
import { API_CONFIG } from '../../config/api';
import { homeActivityService } from '../../services/home-management/HomeActivityService';

interface AllHomesDevicesScreenProps {
  navigation: any;
}

interface Device {
  id: string;
  homeId: string;
  homeName: string;
  name: string;
  type: 'camera' | 'lock' | 'light';
  status: 'online' | 'offline';
  isOn?: boolean;
  isLocked?: boolean;
  brightness?: number;
  location: string;
  lastSeen: string;
}

const AllHomesDevicesScreen: React.FC<AllHomesDevicesScreenProps> = ({ navigation }) => {
  const { isDark } = useTheme();
  const { user } = useUser();
  
  // State
  const [homes, setHomes] = useState<Home[]>([]);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showCameraView, setShowCameraView] = useState(false);
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [unlockCountdown, setUnlockCountdown] = useState<{ [key: string]: number }>({});

  // Convert API response to Home type
  const convertApiResponseToHome = useCallback((apiHome: HomeResponse): Home => {
    return {
      id: apiHome.id,
      name: apiHome.name,
      address: apiHome.fullAddress || apiHome.address,
      isActive: apiHome.isActive,
      isArmed: false,
      lastActivity: 'Just now',
      deviceCount: apiHome.deviceCount || 0,
      cameraCount: 0,
      accessCount: 0,
      securityLevel: apiHome.securitySystemType === 'premium' ? 'high' : 
                    apiHome.securitySystemType === 'basic' ? 'low' : 'medium',
      timezone: 'America/New_York',
      createdAt: apiHome.createdAt,
      updatedAt: apiHome.updatedAt
    };
  }, []);

  // Load homes
  const loadHomes = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const apiHomes = await homeService.getHomesByOwnerId(user.id);
      const convertedHomes = apiHomes.map(convertApiResponseToHome);
      setHomes(convertedHomes);
    } catch (error) {
      console.error('Error loading homes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, convertApiResponseToHome]);

  // Load all devices across all homes
  const loadAllDevices = useCallback(async () => {
    if (homes.length === 0) return;
    
    setDeviceLoading(true);
    try {
      // Static devices for home ID: 22e0d413-bf1c-47a5-8a00-cc18d9c6abd6
      const targetHomeId = '22e0d413-bf1c-47a5-8a00-cc18d9c6abd6';
      const targetHome = homes.find(h => h.id === targetHomeId);
      
      const devices: Device[] = [];
      
      if (targetHome) {
        devices.push(
          {
            id: 'deadbolt-1',
            homeId: targetHomeId,
            homeName: targetHome.name,
            name: 'Front Door Deadbolt',
            type: 'lock',
            status: 'online',
            isLocked: false,
            location: 'Front Door',
            lastSeen: 'Just now'
          },
          {
            id: 'camera-1',
            homeId: targetHomeId,
            homeName: targetHome.name,
            name: 'Front Door Camera',
            type: 'camera',
            status: 'online',
            isOn: true,
            location: 'Front Door',
            lastSeen: 'Just now'
          }
        );
      }
      
      setAllDevices(devices);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setDeviceLoading(false);
    }
  }, [homes]);

  // Fetch lock status from API
  const fetchLockStatus = async (deviceId: string) => {
    try {
      const url = `${API_CONFIG.STREAM_BASE_URL}/status?key=${API_CONFIG.STREAM_SECRET_KEY}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        const isLocked = data.status === 'locked' || data.status === 'Locked';
        
        setAllDevices(prev => prev.map(d => 
          d.id === deviceId && d.type === 'lock'
            ? { ...d, isLocked: isLocked, status: 'online', lastSeen: 'Just now' }
            : d
        ));
      }
    } catch (error) {
      console.error('Error fetching lock status:', error);
    }
  };

  // Device control functions
  const handleDeviceToggle = async (deviceId: string, action: string) => {
    const device = allDevices.find(d => d.id === deviceId);
    if (!device) return;

    // Handle lock/unlock with 3-second countdown
    if (device.type === 'lock') {
      const targetHomeId = '22e0d413-bf1c-47a5-8a00-cc18d9c6abd6';
      if (device.homeId !== targetHomeId) {
        Alert.alert('Error', 'Device not available for this home');
        return;
      }

      const isCurrentlyLocked = device.isLocked ?? true;
      const unlockAction = isCurrentlyLocked ? 'unlock' : 'lock';
      
      setIsLocking(true);
      
      try {
        const url = `${API_CONFIG.STREAM_BASE_URL}/unlock?key=${API_CONFIG.STREAM_SECRET_KEY}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          // Create activity for lock/unlock action
          try {
            await homeActivityService.createActivity({
              homeId: device.homeId,
              userId: user?.id,
              deviceId: deviceId,
              activityType: unlockAction === 'unlock' ? 'DOOR_OPENED' : 'DOOR_CLOSED',
              priority: 'MEDIUM',
              title: unlockAction === 'unlock' 
                ? `${user?.name || 'User'} unlocked ${device.name}`
                : `${user?.name || 'User'} locked ${device.name}`,
              description: unlockAction === 'unlock'
                ? `${device.name} was unlocked via mobile app. Door will auto-lock in 3 seconds.`
                : `${device.name} was locked via mobile app.`,
              location: device.location,
              activityTimestamp: new Date().toISOString(),
            });
          } catch (activityError) {
            console.error('Failed to create activity:', activityError);
          }

          if (unlockAction === 'unlock') {
            setAllDevices(prev => prev.map(d => 
              d.id === deviceId 
                ? { ...d, isLocked: false, lastSeen: 'Just now' }
                : d
            ));
            
            setUnlockCountdown({ [deviceId]: 3 });
            
            const countdownInterval = setInterval(() => {
              setUnlockCountdown(prev => {
                const newCountdown = { ...prev };
                if (newCountdown[deviceId] && newCountdown[deviceId] > 1) {
                  newCountdown[deviceId] = newCountdown[deviceId] - 1;
                  return newCountdown;
                } else {
                  clearInterval(countdownInterval);
                  delete newCountdown[deviceId];
                  return newCountdown;
                }
              });
            }, 1000);
            
            setTimeout(async () => {
              setAllDevices(prev => prev.map(d => 
                d.id === deviceId 
                  ? { ...d, isLocked: true, lastSeen: 'Just now' }
                  : d
              ));
              setUnlockCountdown(prev => {
                const newCountdown = { ...prev };
                delete newCountdown[deviceId];
                return newCountdown;
              });
              clearInterval(countdownInterval);
              
              // Create activity for auto-lock
              try {
                await homeActivityService.createActivity({
                  homeId: device.homeId,
                  deviceId: deviceId,
                  activityType: 'DOOR_CLOSED',
                  priority: 'MEDIUM',
                  title: `${device.name} automatically locked`,
                  description: `${device.name} automatically locked after 3 seconds.`,
                  location: device.location,
                  activityTimestamp: new Date().toISOString(),
                });
              } catch (activityError) {
                console.error('Failed to create auto-lock activity:', activityError);
              }
            }, 3000);
          } else {
            setUnlockCountdown(prev => {
              const newCountdown = { ...prev };
              delete newCountdown[deviceId];
              return newCountdown;
            });
            await fetchLockStatus(deviceId);
          }
        } else {
          Alert.alert('Error', `Failed to ${unlockAction} door. Please try again.`);
        }
      } catch (error) {
        console.error(`Error ${unlockAction}ing door:`, error);
        Alert.alert('Error', 'Network error. Please check your connection and try again.');
      } finally {
        setIsLocking(false);
      }
      return;
    }

    // Handle other device types (camera, light)
    try {
      setAllDevices(prev => prev.map(d => {
        if (d.id === deviceId) {
          switch (d.type) {
            case 'camera':
              return { ...d, isOn: action === 'on' };
            case 'light':
              return { ...d, isOn: action === 'on' };
            default:
              return d;
          }
        }
        return d;
      }));

      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', `Device ${action} successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to control device');
    }
  };

  const handleCameraView = (device: Device) => {
    setSelectedDevice(device);
    setShowCameraView(true);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHomes();
    setRefreshing(false);
  }, [loadHomes]);

  // Load data on mount
  useEffect(() => {
    loadHomes();
  }, [loadHomes]);

  // Load devices when homes change
  useEffect(() => {
    if (homes.length > 0) {
      loadAllDevices();
    }
  }, [homes, loadAllDevices]);

  // Fetch lock status for devices after they're loaded
  useEffect(() => {
    const targetHomeId = '22e0d413-bf1c-47a5-8a00-cc18d9c6abd6';
    const lockDevice = allDevices.find(d => d.id === 'deadbolt-1' && d.homeId === targetHomeId && d.type === 'lock');
    if (lockDevice) {
      fetchLockStatus('deadbolt-1').catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDevices.length]);

  // Get device counts by type
  const getDeviceCounts = () => {
    const cameras = allDevices.filter(d => d.type === 'camera');
    const locks = allDevices.filter(d => d.type === 'lock');
    const lights = allDevices.filter(d => d.type === 'light');
    const onlineDevices = allDevices.filter(d => d.status === 'online');
    
    return {
      total: allDevices.length,
      cameras: cameras.length,
      locks: locks.length,
      lights: lights.length,
      online: onlineDevices.length
    };
  };

  const deviceCounts = getDeviceCounts();

  if (isLoading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={isDark ? '#3b82f6' : '#2563eb'} />
          <Text className={`mt-4 text-lg ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            Loading devices...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View className="px-6 py-4 border-b border-neutral-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="p-2 -ml-2"
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={isDark ? '#ffffff' : '#000000'} 
            />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              All Devices
            </Text>
            <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {deviceCounts.total} devices across {homes.length} homes
            </Text>
          </View>
          <View className="w-8" />
        </View>
      </View>

      {/* Device Stats */}
      <View className="px-6 py-4">
        <View className={`p-4 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-white'} border ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
          <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            Device Overview
          </Text>
          <View className="flex-row justify-between mb-2">
            <Text className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
              Total Devices
            </Text>
            <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {deviceCounts.total}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
              Online Devices
            </Text>
            <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {deviceCounts.online}/{deviceCounts.total}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
              Cameras
            </Text>
            <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {deviceCounts.cameras}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
              Door Locks
            </Text>
            <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {deviceCounts.locks}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
              Smart Lights
            </Text>
            <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {deviceCounts.lights}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#3b82f6' : '#2563eb'}
          />
        }
      >
        {deviceLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color={isDark ? '#3b82f6' : '#2563eb'} />
            <Text className={`text-sm mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Loading devices...
            </Text>
          </View>
        ) : allDevices.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons 
              name="hardware-chip-outline" 
              size={64} 
              color={isDark ? '#a3a3a3' : '#737373'} 
            />
            <Text className={`text-lg font-semibold mt-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              No Devices Found
            </Text>
            <Text className={`text-sm text-center mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Add devices to your homes to see them here
            </Text>
          </View>
        ) : (
          <View>
            {/* Device Categories */}
            {['camera', 'lock', 'light'].map(deviceType => {
              const devices = allDevices.filter(device => device.type === deviceType);
              if (devices.length === 0) return null;
              
              return (
                <View key={deviceType} className="mb-6">
                  <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    {deviceType.charAt(0).toUpperCase() + deviceType.slice(1)}s ({devices.length})
                  </Text>
                  
                  {devices.map(device => (
                    <View key={device.id} className={`p-4 rounded-xl mb-3 ${
                      isDark ? 'bg-neutral-800' : 'bg-white'
                    } border ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                            {device.name}
                          </Text>
                          <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            {device.homeName} • {device.location}
                          </Text>
                          <View className="flex-row items-center mt-1">
                            <View className={`w-2 h-2 rounded-full mr-2 ${
                              device.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <Text className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                              {device.lastSeen}
                            </Text>
                          </View>
                        </View>
                        
                        <View className="flex-row items-center">
                          {device.type === 'camera' && (
                            <>
                              <TouchableOpacity
                                className={`p-2 rounded-lg mr-2 ${
                                  device.isOn ? 'bg-blue-500' : 'bg-gray-500'
                                }`}
                                onPress={() => handleDeviceToggle(device.id, device.isOn ? 'off' : 'on')}
                              >
                                <Ionicons 
                                  name={device.isOn ? 'videocam' : 'videocam-off'} 
                                  size={20} 
                                  color="white" 
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                className="p-2 rounded-lg bg-purple-500"
                                onPress={() => handleCameraView(device)}
                              >
                                <Ionicons name="eye" size={20} color="white" />
                              </TouchableOpacity>
                            </>
                          )}
                          
                          {device.type === 'lock' && (
                            <View className="flex-row items-center">
                              {unlockCountdown[device.id] !== undefined && !device.isLocked && (
                                <Text className={`text-xs mr-2 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                  {unlockCountdown[device.id]}s
                                </Text>
                              )}
                              <TouchableOpacity
                                className={`p-2 rounded-lg ${
                                  device.isLocked ? 'bg-red-500' : 'bg-green-500'
                                }`}
                                onPress={() => handleDeviceToggle(device.id, device.isLocked ? 'unlock' : 'lock')}
                                disabled={isLocking || device.status !== 'online'}
                                style={{ opacity: (isLocking || device.status !== 'online') ? 0.5 : 1 }}
                              >
                                <Ionicons 
                                  name={device.isLocked ? 'lock-closed' : 'lock-open'} 
                                  size={20} 
                                  color="white" 
                                />
                              </TouchableOpacity>
                            </View>
                          )}
                          
                          {device.type === 'light' && (
                            <TouchableOpacity
                              className={`p-2 rounded-lg ${
                                device.isOn ? 'bg-yellow-500' : 'bg-gray-500'
                              }`}
                              onPress={() => handleDeviceToggle(device.id, device.isOn ? 'off' : 'on')}
                            >
                              <Ionicons 
                                name={device.isOn ? 'bulb' : 'bulb-outline'} 
                                size={20} 
                                color="white" 
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Camera View Modal */}
      <Modal
        visible={showCameraView}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCameraView(false)}
      >
        <View className="flex-1 bg-black">
          <View className="flex-row justify-between items-center p-4 bg-black/50">
            <Text className="text-white font-semibold">
              {selectedDevice?.name} - {selectedDevice?.homeName}
            </Text>
            <TouchableOpacity onPress={() => setShowCameraView(false)}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          <View className="flex-1 justify-center items-center">
            <View className="w-80 h-60 bg-gray-800 rounded-xl items-center justify-center">
              <Ionicons name="videocam" size={48} color="white" />
              <Text className="text-white mt-4">Live Camera Feed</Text>
              <Text className="text-gray-400 text-sm mt-2">
                Camera view would appear here
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AllHomesDevicesScreen;
