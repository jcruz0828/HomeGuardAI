import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  Alert,
  Dimensions,
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { Home, Device, AccessEvent } from '../../types/Home';
import { homeActivityService, HomeActivity, ActivityCounts } from '../../services/home-management/HomeActivityService';
import { API_CONFIG } from '../../config/api';

interface HomeDashboardScreenProps {
  navigation: any;
  route: {
    params: {
      home: Home;
    };
  };
}

const { width } = Dimensions.get('window');

const HomeDashboardScreen: React.FC<HomeDashboardScreenProps> = ({ navigation, route }) => {
  const { isDark } = useTheme();
  const { user } = useUser();
  
  // Early safety check - prevent any code execution if route params are not ready
  if (!route || !route.params) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
        <View className="flex-1 justify-center items-center px-6">
          <Text className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const { home } = route.params;
  
  // Safety check for home object
  if (!home || !home.id) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
        <View className="flex-1 justify-center items-center px-6">
          <Text className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            Home Not Found
          </Text>
          <Text className={`text-sm text-center ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Please select a home first
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mt-4 px-6 py-3 bg-primary-600 rounded-xl"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const [cameraStatus, setCameraStatus] = useState('online');
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isStreamLoading, setIsStreamLoading] = useState(true);
  const [useWebView, setUseWebView] = useState(false);
  
  // Activity states
  const [recentActivities, setRecentActivities] = useState<HomeActivity[]>([]);
  const [activityCounts, setActivityCounts] = useState<ActivityCounts>({ unacknowledged: 0, unresolved: 0 });
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [showActivityDetailModal, setShowActivityDetailModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<HomeActivity | null>(null);
  
  // Get stream URL for the specific home
  const getStreamUrl = () => {
    const targetHomeId = '22e0d413-bf1c-47a5-8a00-cc18d9c6abd6';
    if (home.id === targetHomeId) {
      const url = `${API_CONFIG.STREAM_BASE_URL}/stream?key=${API_CONFIG.STREAM_SECRET_KEY}`;
      console.log('Stream URL:', url);
      return url;
    }
    return null;
  };
  
  const streamUrl = getStreamUrl();
  
  // Create video player for expo-video (only create if not using WebView fallback)
  const player = useVideoPlayer(streamUrl && !useWebView ? streamUrl : '', (player) => {
    if (streamUrl && !useWebView) {
      player.loop = true;
      player.play();
    }
  });
  
  // Test stream URL accessibility on mount
  useEffect(() => {
    if (!streamUrl) return;
    
    // Test if URL is reachable
    fetch(streamUrl, { method: 'HEAD', mode: 'no-cors' })
      .then(() => {
        console.log('Stream URL is reachable');
      })
      .catch((err) => {
        console.warn('Stream URL might not be reachable:', err);
        console.log('Note: For iOS simulator, try using localhost or your Mac IP instead of 172.20.10.2');
      });
  }, [streamUrl]);
  
  // Handle player status changes
  useEffect(() => {
    if (!player || !streamUrl || useWebView) return;
    
    const subscription = player.addListener('statusChange', (status: any) => {
      console.log('Player status:', status);
      if (status.status === 'readyToPlay') {
        setIsStreamLoading(false);
        setStreamError(null);
      } else if (status.status === 'error') {
        console.log('Video player error, switching to WebView fallback');
        setUseWebView(true);
        setIsStreamLoading(false);
      }
    });
    
    return () => {
      subscription?.remove();
    };
  }, [player, streamUrl, useWebView]);

  // Set loading timeout - if video player times out, try WebView
  useEffect(() => {
    if (!streamUrl || useWebView) return;
    
    const timeout = setTimeout(() => {
      if (isStreamLoading) {
        console.log('Stream timeout, switching to WebView fallback');
        setUseWebView(true);
        setIsStreamLoading(false);
      }
    }, 8000); // 8 second timeout before switching to WebView
    
    return () => clearTimeout(timeout);
  }, [streamUrl, isStreamLoading, useWebView]);

  // Devices for this home
  const [devices] = useState<Device[]>([]);

  // Recent events
  const [recentEvents] = useState<AccessEvent[]>([]);

  // Load activities on mount
  useEffect(() => {
    loadActivities();
  }, [home.id]);

  const loadActivities = async () => {
    try {
      setLoadingActivities(true);
      const [activities, counts] = await Promise.all([
        homeActivityService.getRecentActivities(home.id, 24),
        homeActivityService.getActivityCounts(home.id)
      ]);
      setRecentActivities(activities);
      setActivityCounts(counts);
    } catch (err) {
      // Don't show error for activities, just log it
      console.error('Error loading activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleActivityClick = async (activity: HomeActivity) => {
    if (!user?.id) return;
    
    try {
      // If the activity is not acknowledged, acknowledge it first
      if (!activity.isAcknowledged) {
        await homeActivityService.acknowledgeActivity(activity.id, user.id);
        // Refresh activities to show updated status
        loadActivities();
      }
      
      // Show activity detail modal
      setSelectedActivity(activity);
      setShowActivityDetailModal(true);
    } catch (error) {
      console.error('Error acknowledging activity:', error);
      // Still show modal even if acknowledgment fails
      setSelectedActivity(activity);
      setShowActivityDetailModal(true);
    }
  };

  const handleLogout = async () => {
    const response = await useUser().signOut();
    if (response.success) {
      // Navigation handled automatically by AppNavigator
    } else {
      Alert.alert('Logout Error', response.error || 'Failed to logout');
    }
  };


  const handleSecuritySettings = () => {
    navigation.navigate('SecuritySettings', { home });
  };

  const handleDeviceManagement = () => {
    navigation.navigate('DeviceManagement', { home });
  };

  const handleMemberManagement = () => {
    navigation.navigate('MemberManagement', { home });
  };

  const handleAccessLog = () => {
    Alert.alert('Access Log', 'Access log coming soon!');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'CRITICAL': return isDark ? '#ef4444' : '#dc2626';
      case 'HIGH': return isDark ? '#f59e0b' : '#d97706';
      case 'MEDIUM': return isDark ? '#3b82f6' : '#2563eb';
      case 'LOW': return isDark ? '#10b981' : '#059669';
      default: return isDark ? '#6b7280' : '#6b7280';
    }
  };

  const getTypeIcon = (activityType: string) => {
    switch (activityType.toLowerCase()) {
      case 'door_access':
      case 'door_request': return 'key';
      case 'face_detection':
      case 'face_recognition': return 'person';
      case 'rfid_scan':
      case 'rfid_access': return 'card';
      case 'system_alert':
      case 'security_alert': return 'warning';
      case 'device_offline':
      case 'device_status': return 'hardware-chip';
      case 'motion_detected': return 'eye';
      case 'door_open': return 'lock-open';
      case 'call': return 'call';
      case 'emergency': return 'alert-circle';
      case 'maintenance': return 'construct';
      default: return 'information-circle';
    }
  };

  const formatActivityTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`;
  };

  const SecurityStatusCard = ({ title, status, icon, color, onPress }: any) => (
    <TouchableOpacity
      className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-neutral-800' : 'bg-white'} border ${
        isDark ? 'border-neutral-700' : 'border-neutral-200'
      }`}
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${color}`}>
            <Ionicons name={icon} size={24} color="white" />
          </View>
          <View>
            <Text className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {title}
            </Text>
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {status}
            </Text>
          </View>
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={isDark ? '#a3a3a3' : '#737373'} 
        />
      </View>
    </TouchableOpacity>
  );

  const QuickActionButton = ({ title, icon, color, onPress }: any) => (
    <TouchableOpacity
      className={`flex-1 p-4 rounded-xl mx-1 ${color}`}
      onPress={onPress}
    >
      <View className="items-center">
        <Ionicons name={icon} size={32} color="white" />
        <Text className="text-white font-semibold text-sm mt-2 text-center">
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const DeviceCard = ({ device }: { device: Device }) => (
    <View className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-neutral-800' : 'bg-white'} border ${
      isDark ? 'border-neutral-700' : 'border-neutral-200'
    }`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
            device.status === 'online' ? 'bg-success' : 'bg-error'
          }`}>
            <Ionicons 
              name={device.type === 'camera' ? 'videocam' : 
                    device.type === 'sensor' ? 'eye' : 
                    device.type === 'lock' ? 'lock-closed' : 'hardware-chip'} 
              size={20} 
              color="white" 
            />
          </View>
          <View>
            <Text className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {device.name}
            </Text>
            <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {device.location}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className={`text-sm font-medium ${
            device.status === 'online' ? 'text-success' : 'text-error'
          }`}>
            {device.status}
          </Text>
          {device.batteryLevel && (
            <Text className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {device.batteryLevel}% battery
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        <View className="flex-1">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="mb-2"
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={isDark ? '#ffffff' : '#000000'} 
            />
          </TouchableOpacity>
          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            {home.name}
          </Text>
          <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            {home.address}
          </Text>
        </View>
        
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
       

        {/* Live Camera Feed */}
        <View className="mb-6">
          <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            Live Camera Feed
          </Text>
          
          <View className={`rounded-xl overflow-hidden ${isDark ? 'bg-neutral-800' : 'bg-white'} border ${
            isDark ? 'border-neutral-700' : 'border-neutral-200'
          }`}>
            {streamUrl ? (
              <View className="aspect-video bg-neutral-900 relative">
                {useWebView ? (
                  <WebView
                    source={{
                      html: `
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                            <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;">
                            <style>
                              * { margin: 0; padding: 0; box-sizing: border-box; }
                              body, html { width: 100%; height: 100%; overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center; }
                              video { 
                                width: 100%; 
                                height: 100%; 
                                object-fit: cover; 
                                background: #000;
                              }
                              .error {
                                color: #fff;
                                text-align: center;
                                padding: 20px;
                              }
                            </style>
                          </head>
                          <body>
                            <video id="videoPlayer" autoplay muted playsinline webkit-playsinline>
                              <source src="${streamUrl}" type="video/mp4">
                              <source src="${streamUrl}" type="application/x-mpegURL">
                              <source src="${streamUrl}">
                            </video>
                            <div id="error" class="error" style="display: none;"></div>
                            <script>
                              const video = document.getElementById('videoPlayer');
                              const errorDiv = document.getElementById('error');
                              
                              function sendMessage(type) {
                                if (window.ReactNativeWebView) {
                                  window.ReactNativeWebView.postMessage(type);
                                }
                              }
                              
                              video.addEventListener('loadstart', () => {
                                console.log('Video loadstart');
                                sendMessage('loadstart');
                              });
                              
                              video.addEventListener('loadedmetadata', () => {
                                console.log('Video loadedmetadata');
                                sendMessage('loaded');
                              });
                              
                              video.addEventListener('loadeddata', () => {
                                console.log('Video loadeddata');
                                sendMessage('loaded');
                                video.play().catch(e => {
                                  console.error('Play error:', e);
                                  sendMessage('error');
                                });
                              });
                              
                              video.addEventListener('canplay', () => {
                                console.log('Video canplay');
                                sendMessage('playing');
                              });
                              
                              video.addEventListener('playing', () => {
                                console.log('Video playing');
                                sendMessage('playing');
                              });
                              
                              video.addEventListener('error', (e) => {
                                console.error('Video error:', e, video.error);
                                errorDiv.textContent = 'Stream error: ' + (video.error ? video.error.message : 'Unknown error');
                                errorDiv.style.display = 'block';
                                sendMessage('error');
                              });
                              
                              // Try to play immediately
                              video.play().catch(e => {
                                console.log('Initial play failed, will retry:', e);
                              });
                              
                              // Fallback: if video doesn't load, try img tag for MJPEG
                              setTimeout(() => {
                                if (video.readyState === 0) {
                                  console.log('Video not loading, trying MJPEG fallback');
                                  const img = document.createElement('img');
                                  img.src = '${streamUrl}';
                                  img.style.width = '100%';
                                  img.style.height = '100%';
                                  img.style.objectFit = 'cover';
                                  img.onload = () => {
                                    console.log('MJPEG image loaded');
                                    sendMessage('playing');
                                    document.body.innerHTML = '';
                                    document.body.appendChild(img);
                                  };
                                  img.onerror = () => {
                                    console.error('MJPEG also failed');
                                    sendMessage('error');
                                  };
                                }
                              }, 5000);
                            </script>
                          </body>
                        </html>
                      `
                    }}
                    style={{ width: '100%', height: '100%', backgroundColor: '#000000' }}
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    javaScriptEnabled={true}
                    mixedContentMode="always"
                    onLoadStart={() => {
                      console.log('WebView load start');
                      setIsStreamLoading(true);
                      setStreamError(null);
                    }}
                    onLoad={() => {
                      console.log('WebView loaded');
                    }}
                    onMessage={(event) => {
                      const message = event.nativeEvent.data;
                      console.log('WebView message:', message);
                      if (message === 'loaded' || message === 'playing') {
                        setIsStreamLoading(false);
                        setStreamError(null);
                      } else if (message === 'error') {
                        setIsStreamLoading(false);
                        setStreamError('Failed to load stream. The stream format may not be supported.');
                      } else if (message === 'loadstart') {
                        setIsStreamLoading(true);
                      }
                    }}
                    onError={(syntheticEvent: any) => {
                      const { nativeEvent } = syntheticEvent;
                      console.error('WebView error:', nativeEvent);
                      setIsStreamLoading(false);
                      setStreamError('Failed to load stream in WebView');
                    }}
                  />
                ) : player ? (
                  <VideoView
                    player={player}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    nativeControls={false}
                    allowsPictureInPicture={false}
                  />
                ) : null}
                {isStreamLoading && (
                  <View className="absolute inset-0 items-center justify-center bg-neutral-900">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className={`text-sm mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      Connecting to stream...
                    </Text>
                    <Text className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-500'} text-center px-4`}>
                      {streamUrl?.substring(0, 40)}...
                    </Text>
                  </View>
                )}
                {streamError && (
                  <View className="absolute inset-0 items-center justify-center bg-neutral-900 p-4">
                    <Ionicons name="alert-circle" size={48} color="#ef4444" />
                    <Text className={`text-sm mt-2 text-red-500 text-center px-4`}>
                      {streamError}
                    </Text>
                    <Text className={`text-xs mt-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'} text-center px-4`}>
                      Make sure the stream server is running and accessible
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setStreamError(null);
                        setIsStreamLoading(true);
                        try {
                          player.replay();
                        } catch (error) {
                          console.error('Error reloading video:', error);
                          setStreamError('Failed to reload stream');
                        }
                      }}
                      className="mt-4 px-4 py-2 bg-primary-600 rounded-lg"
                    >
                      <Text className="text-white font-semibold">Retry</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View className="aspect-video bg-neutral-800 items-center justify-center">
                <Ionicons name="videocam" size={48} color="#a3a3a3" />
                <Text className={`text-sm mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Camera feed not available for this home
                </Text>
              </View>
            )}
            <View className="p-4">
              <Text className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Front Door Camera
              </Text>
              <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {streamUrl ? 'Live stream' : 'Camera feed will appear here'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            Quick Actions
          </Text>
          
          <View className="flex-row mb-4">
            <QuickActionButton
              title="Devices"
              icon="hardware-chip"
              color="bg-primary-500"
              onPress={() => navigation.navigate('DeviceManagement', { home })}
            />
            <QuickActionButton
              title="Face Recognition"
              icon="person"
              color="bg-purple-500"
              onPress={() => navigation.navigate('FaceDetection', { home })}
            />
          </View>
          
          <View className="flex-row mb-4">
            <QuickActionButton
              title="Deadbolts"
              icon="lock-closed"
              color="bg-warning"
              onPress={() => navigation.navigate('DeadboltControl', { home })}
            />
            <QuickActionButton
              title="Access Logs"
              icon="document-text"
              color="bg-info"
              onPress={() => navigation.navigate('AccessLogs', { home })}
            />
          </View>
          
          
          <View className="flex-row">
            <QuickActionButton
              title="Member Management"
              icon="people"
              color="bg-purple-600"
              onPress={handleMemberManagement}
            />
            <QuickActionButton
              title="Security Settings"
              icon="settings"
              color="bg-neutral-600"
              onPress={handleSecuritySettings}
            />
          </View>
        </View>

      

        {/* Recent Activities */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Recent Activities
            </Text>
            <View className="flex-row items-center">
              {activityCounts.unacknowledged > 0 && (
                <View className="flex-row items-center mr-3">
                  <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                  <Text className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    {activityCounts.unacknowledged} unacknowledged
                  </Text>
                </View>
              )}
              <TouchableOpacity 
                onPress={() => navigation.navigate('RecentActivities', { home })}
                className="flex-row items-center"
              >
                <Text className={`text-sm ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                  View All
                </Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color={isDark ? '#60a5fa' : '#2563eb'} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {loadingActivities ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color={isDark ? '#3b82f6' : '#3b82f6'} />
              <Text className={`mt-2 text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Loading activities...
              </Text>
            </View>
          ) : recentActivities.length > 0 ? (
            <View>
              {recentActivities.slice(0, 5).map((activity) => (
                <TouchableOpacity 
                  key={activity.id} 
                  className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-neutral-800' : 'bg-white'} border ${
                    isDark ? 'border-neutral-700' : 'border-neutral-200'
                  }`}
                  onPress={() => handleActivityClick(activity)}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        {activity.title}
                      </Text>
                      {activity.description && (
                        <Text className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                          {activity.description}
                        </Text>
                      )}
                      <View className="flex-row items-center mt-2">
                        <View className={`px-2 py-1 rounded-full mr-2 ${
                          activity.priority === 'CRITICAL' ? 'bg-red-100' :
                          activity.priority === 'HIGH' ? 'bg-orange-100' :
                          activity.priority === 'MEDIUM' ? 'bg-yellow-100' : 'bg-green-100'
                        }`}>
                          <Text className={`text-xs font-medium ${
                            activity.priority === 'CRITICAL' ? 'text-red-800' :
                            activity.priority === 'HIGH' ? 'text-orange-800' :
                            activity.priority === 'MEDIUM' ? 'text-yellow-800' : 'text-green-800'
                          }`}>
                            {activity.priority}
                          </Text>
                        </View>
                        <Text className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                          {formatActivityTimestamp(activity.activityTimestamp)}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      {!activity.isAcknowledged && (
                        <View className="w-2.5 h-2.5 bg-red-500 rounded-full mr-2" />
                      )}
                      
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className={`p-6 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-white'} border ${
              isDark ? 'border-neutral-700' : 'border-neutral-200'
            }`}>
              <View className="items-center">
                <Ionicons 
                  name="time-outline" 
                  size={32} 
                  color={isDark ? '#a3a3a3' : '#737373'} 
                />
                <Text className={`mt-2 text-sm font-medium ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  No recent activities
                </Text>
                <Text className={`text-xs text-center mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Activities will appear here when they occur
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Activity Detail Modal */}
      <Modal
        visible={showActivityDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowActivityDetailModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className={`rounded-t-3xl ${isDark ? 'bg-neutral-800' : 'bg-white'} p-6 max-h-96`}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Activity Details
              </Text>
              <TouchableOpacity onPress={() => setShowActivityDetailModal(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#ffffff' : '#000000'} />
              </TouchableOpacity>
            </View>
            
            {selectedActivity && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className={`p-4 rounded-xl mb-4 ${
                  isDark ? 'bg-neutral-700' : 'bg-neutral-100'
                }`}>
                  <View className="flex-row items-start mb-4">
                    <View className={`w-12 h-12 rounded-full items-center justify-center mr-4`} 
                          style={{ backgroundColor: getPriorityColor(selectedActivity.priority) }}>
                      <Ionicons 
                        name={getTypeIcon(selectedActivity.activityType) as any} 
                        size={24} 
                        color="white" 
                      />
                    </View>
                    <View className="flex-1">
                      <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        {selectedActivity.title}
                      </Text>
                      <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        {selectedActivity.activityType.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${
                      selectedActivity.priority === 'CRITICAL' 
                        ? (isDark ? 'bg-red-600' : 'bg-red-500')
                        : selectedActivity.priority === 'HIGH'
                        ? (isDark ? 'bg-orange-600' : 'bg-orange-500')
                        : selectedActivity.priority === 'MEDIUM'
                        ? (isDark ? 'bg-blue-600' : 'bg-blue-500')
                        : (isDark ? 'bg-green-600' : 'bg-green-500')
                    }`}>
                      <Text className="text-white text-xs font-semibold">
                        {selectedActivity.priority}
                      </Text>
                    </View>
                  </View>

                  {selectedActivity.description && (
                    <View className="mb-4">
                      <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                        Description
                      </Text>
                      <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        {selectedActivity.description}
                      </Text>
                    </View>
                  )}

                  <View className="mb-4">
                    <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      Home
                    </Text>
                    <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      {home.name}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      Timestamp
                    </Text>
                    <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      {formatActivityTimestamp(selectedActivity.activityTimestamp)}
                    </Text>
                    <Text className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                      {new Date(selectedActivity.activityTimestamp).toLocaleString()}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      Status
                    </Text>
                    <View className="flex-row items-center">
                      <View className={`w-3 h-3 rounded-full mr-2 ${
                        selectedActivity.isAcknowledged ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        {selectedActivity.isAcknowledged ? 'Acknowledged' : 'Unacknowledged'}
                      </Text>
                    </View>
                    {selectedActivity.isResolved && (
                      <View className="flex-row items-center mt-1">
                        <View className="w-3 h-3 rounded-full mr-2 bg-blue-500" />
                        <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                          Resolved
                        </Text>
                      </View>
                    )}
                  </View>

                  {selectedActivity.additionalData && (
                    <View className="mb-4">
                      <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                        Additional Information
                      </Text>
                      <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        {selectedActivity.additionalData}
                      </Text>
                    </View>
                  )}

                  <View className="flex-row justify-between mt-6">
                    <TouchableOpacity 
                      className={`flex-1 py-3 px-4 rounded-xl mr-2 ${
                        isDark ? 'bg-neutral-600' : 'bg-neutral-200'
                      }`}
                      onPress={() => {
                        setShowActivityDetailModal(false);
                        navigation.navigate('RecentActivities', { home });
                      }}
                    >
                      <Text className={`text-center font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        View All Activities
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      className={`flex-1 py-3 px-4 rounded-xl ml-2 ${
                        isDark ? 'bg-primary-600' : 'bg-primary-500'
                      }`}
                      onPress={() => setShowActivityDetailModal(false)}
                    >
                      <Text className="text-center font-semibold text-white">
                        Close
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HomeDashboardScreen;
