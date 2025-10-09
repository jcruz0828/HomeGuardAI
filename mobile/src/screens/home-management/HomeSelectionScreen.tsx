import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  Alert,
  Dimensions,
  Modal,
  TextInput,
  ActivityIndicator,
  AppState
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { Home } from '../../types/Home';
import { homeService, HomeResponse } from '../../services/home-management/HomeService';
import { homeActivityService, HomeActivity } from '../../services/home-management/HomeActivityService';

interface HomeSelectionScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');

const HomeSelectionScreen: React.FC<HomeSelectionScreenProps> = ({ navigation }) => {
  const { isDark } = useTheme();
  const { user } = useUser();
  
  // State for homes data
  const [homes, setHomes] = useState<Home[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllHomes, setShowAllHomes] = useState(false);
  const [hasMoreHomes, setHasMoreHomes] = useState(false);
  
  // Pagination settings
  const HOMES_PER_PAGE = 3;
  const [displayedHomes, setDisplayedHomes] = useState<Home[]>([]);

  // State for activities data
  const [globalActivities, setGlobalActivities] = useState<HomeActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [lastActivityFetch, setLastActivityFetch] = useState<number>(0);

  // Queued Requests (keeping mock data for now as this might be a different service)
  interface QueuedRequest {
    id: string;
    timestamp: string;
    type: 'door_open' | 'call' | 'emergency' | 'maintenance';
    personName: string;
    homeName: string;
    location: string;
    message?: string;
    status: 'pending' | 'approved' | 'denied';
  }

  const [queuedRequests] = useState<QueuedRequest[]>([
    {
      id: '1',
      timestamp: '1 minute ago',
      type: 'door_open',
      personName: 'John Doe',
      homeName: 'Main Residence',
      location: 'Front Door',
      message: 'Requesting access to front door',
      status: 'pending'
    },
    {
      id: '2',
      timestamp: '3 minutes ago',
      type: 'call',
      personName: 'Jane Smith',
      homeName: 'Beach House',
      location: 'Intercom',
      message: 'Video call from front gate',
      status: 'pending'
    },
    {
      id: '3',
      timestamp: '5 minutes ago',
      type: 'maintenance',
      personName: 'Maintenance Team',
      homeName: 'Main Residence',
      location: 'Service Entrance',
      message: 'Scheduled maintenance access',
      status: 'approved'
    }
  ]);

  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showActivityDetailModal, setShowActivityDetailModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<HomeActivity | null>(null);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);


  // Convert API response to Home type
  const convertApiResponseToHome = useCallback((apiHome: HomeResponse): Home => {
    return {
      id: apiHome.id,
      name: apiHome.name,
      address: apiHome.fullAddress || apiHome.address,
      isActive: apiHome.isActive,
      isArmed: false, // This would come from security settings
      lastActivity: 'Just now', // This would come from activity logs
      deviceCount: apiHome.deviceCount || 0,
      cameraCount: 0, // This would come from device count by type
      accessCount: 0, // This would come from access logs
      securityLevel: apiHome.securitySystemType === 'premium' ? 'high' : 
                    apiHome.securitySystemType === 'basic' ? 'low' : 'medium',
      timezone: 'America/New_York', // Default timezone
      createdAt: apiHome.createdAt,
      updatedAt: apiHome.updatedAt
    };
  }, []);

  // Load homes from API
  const loadHomes = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const apiHomes = await homeService.getHomesByOwnerId(user.id);
      const convertedHomes = apiHomes.map(convertApiResponseToHome);
      
      setHomes(convertedHomes);
      
      // Set up pagination
      const initialHomes = convertedHomes.slice(0, HOMES_PER_PAGE);
      setDisplayedHomes(initialHomes);
      setHasMoreHomes(convertedHomes.length > HOMES_PER_PAGE);
      
    } catch (err) {
      console.error('Error loading homes:', err);
      setError('Failed to load homes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, convertApiResponseToHome]);


  // Load activities for all homes
  const loadActivities = useCallback(async (forceRefresh = false) => {
    if (!user?.id || homes.length === 0) return;
    
    // Throttle API calls - only fetch if it's been more than 10 seconds since last fetch
    const now = Date.now();
    if (!forceRefresh && now - lastActivityFetch < 10000) {
      return;
    }
    
    try {
      setLoadingActivities(true);
      setActivitiesError(null);
      
      // Get home IDs from the loaded homes
      const homeIds = homes.map(home => home.id);
      const activities = await homeActivityService.getGlobalRecentActivities(homeIds); // All activities
      setGlobalActivities(activities);
      setLastActivityFetch(now);
    } catch (err) {
      console.error('Error loading activities:', err);
      setActivitiesError('Failed to load activities');
    } finally {
      setLoadingActivities(false);
    }
  }, [user?.id, homes, lastActivityFetch]);

  // Load homes on component mount
  useEffect(() => {
    loadHomes();
  }, [loadHomes]);

  // Load activities after homes are loaded
  useEffect(() => {
    if (homes.length > 0) {
      loadActivities();
    }
  }, [homes, loadActivities]);


  // Auto-refresh activities every 30 seconds
  useEffect(() => {
    if (homes.length === 0) return;

    const interval = setInterval(() => {
      loadActivities(true); // Force refresh
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [homes, loadActivities]);

  // Refresh activities when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && homes.length > 0) {
        loadActivities(true); // Force refresh
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [homes, loadActivities]);

  // Refresh activities when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (homes.length > 0) {
        loadActivities(true); // Force refresh
      }
    });

    return unsubscribe;
  }, [navigation, homes, loadActivities]);

  // Handle "See More" functionality
  const handleSeeMore = useCallback(() => {
    if (showAllHomes) {
      // Show only first few homes
      const limitedHomes = homes.slice(0, HOMES_PER_PAGE);
      setDisplayedHomes(limitedHomes);
      setShowAllHomes(false);
    } else {
      // Show all homes
      setDisplayedHomes(homes);
      setShowAllHomes(true);
    }
  }, [homes, showAllHomes]);

  const handleHomeSelect = (home: Home) => {
    navigation.navigate('HomeDashboard', { home });
  };

  const handleAddHome = () => {
    navigation.navigate('HomeList');
  };

  const handleHomeSettings = (home: Home) => {
    navigation.navigate('SecuritySettings', { home });
  };

  const handleViewAllActivities = () => {
    // Navigate to the global activities screen that shows activities from all homes
    navigation.navigate('GlobalActivities');
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


  const handleActivityAction = async (activityId: string, action: 'acknowledge' | 'dismiss' | 'investigate') => {
    if (!user?.id) return;
    
    const actionText = action === 'acknowledge' ? 'acknowledge' : 
                     action === 'dismiss' ? 'dismiss' : 'investigate';
    
    Alert.alert(
      `Activity ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
      `Are you sure you want to ${actionText} this activity?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: actionText.charAt(0).toUpperCase() + actionText.slice(1), 
          style: 'default',
          onPress: async () => {
            try {
              if (action === 'acknowledge') {
                await homeActivityService.acknowledgeActivity(activityId, user.id);
                // Refresh activities
                loadActivities();
              } else if (action === 'investigate') {
                // For now, just show success - could navigate to investigation screen
                Alert.alert('Success', 'Activity marked for investigation');
              } else if (action === 'dismiss') {
                // For now, just show success - could implement dismiss functionality
                Alert.alert('Success', 'Activity dismissed');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to update activity');
            }
          }
        }
      ]
    );
  };

  const toggleActivityExpansion = (activityId: string) => {
    setExpandedActivity(expandedActivity === activityId ? null : activityId);
  };

  const toggleRequestExpansion = (requestId: string) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
  };

  const handleRequestAction = (requestId: string, action: 'approve' | 'deny') => {
    Alert.alert(
      action === 'approve' ? 'Approve Request' : 'Deny Request',
      `Are you sure you want to ${action} this request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action === 'approve' ? 'Approve' : 'Deny', 
          style: action === 'approve' ? 'default' : 'destructive',
          onPress: () => {
            // Update request status optimistically
            setQueuedRequests(prev => prev.map(request => 
              request.id === requestId 
                ? { ...request, status: action === 'approve' ? 'approved' : 'denied' }
                : request
            ));
            Alert.alert('Success', `Request ${action}d successfully`);
          }
        }
      ]
    );
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

  const getActivityStatus = (activity: HomeActivity) => {
    if (activity.isResolved) return 'completed';
    if (activity.isAcknowledged) return 'approved';
    return 'pending';
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


  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-error';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-success';
      default: return 'bg-neutral-500';
    }
  };

  const getSecurityLevelText = (level: string) => {
    switch (level) {
      case 'high': return 'High Security';
      case 'medium': return 'Medium Security';
      case 'low': return 'Low Security';
      default: return 'Unknown';
    }
  };

  const HomeCard = ({ home }: { home: Home }) => (
    <TouchableOpacity
      className={`p-6 rounded-xl mb-4 ${isDark ? 'bg-neutral-800' : 'bg-white'} border ${
        isDark ? 'border-neutral-700' : 'border-neutral-200'
      }`}
      onPress={() => handleHomeSelect(home)}
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1">
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            {home.name}
          </Text>
          <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'} mt-1`}>
            {home.address}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleHomeSettings(home)}
          className="p-2"
        >
          <Ionicons 
            name="settings-outline" 
            size={20} 
            color={isDark ? '#a3a3a3' : '#737373'} 
          />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className={`w-3 h-3 rounded-full mr-2 ${
            home.isActive ? 'bg-success' : 'bg-neutral-400'
          }`} />
          <Text className={`text-sm font-medium ${
            home.isActive ? 'text-success' : 'text-neutral-500'
          }`}>
            {home.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
        
        <View className="flex-row items-center">
          <Ionicons 
            name={home.isArmed ? 'shield-checkmark' : 'shield-outline'} 
            size={16} 
            color={home.isArmed ? '#10b981' : '#a3a3a3'} 
          />
          <Text className={`text-sm ml-1 ${
            home.isArmed ? 'text-success' : 'text-neutral-500'
          }`}>
            {home.isArmed ? 'Armed' : 'Disarmed'}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <Ionicons name="videocam" size={16} color="#3b82f6" />
          <Text className={`text-sm ml-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
            {home.cameraCount} cameras
          </Text>
        </View>
        
        <View className="flex-row items-center">
          <Ionicons name="hardware-chip" size={16} color="#3b82f6" />
          <Text className={`text-sm ml-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
            {home.deviceCount} devices
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center">
        <View className={`px-3 py-1 rounded-full ${getSecurityLevelColor(home.securityLevel)}`}>
          <Text className="text-white text-xs font-semibold">
            {getSecurityLevelText(home.securityLevel)}
          </Text>
        </View>
        
        <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
          Last activity: {home.lastActivity}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View className="px-6 py-4">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1">
            <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              My Homes
            </Text>
            <Text className={`text-base ${isDark ? 'text-neutral-400' : 'text-neutral-600'} mt-1`}>
              Select a home to manage security
            </Text>
          </View>
          <View className="flex-row">
            <TouchableOpacity 
              onPress={() => navigation.navigate('HomeList')}
              className="mr-4"
            >
              <Ionicons 
                name="home-outline" 
                size={24} 
                color={isDark ? '#ffffff' : '#000000'} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('AppSettings')}>
              <Ionicons 
                name="settings-outline" 
                size={24} 
                color={isDark ? '#ffffff' : '#000000'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View className="mb-6">
          <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            Quick Actions
          </Text>
          
          <View className="flex-row justify-between mb-3">
            <TouchableOpacity 
              className={`flex-1 p-4 rounded-xl mr-2 ${
                isDark ? 'bg-neutral-800' : 'bg-white'
              }`}
              onPress={() => handleViewAllActivities()}
            >
              <Ionicons 
                name="pulse" 
                size={24} 
                color={isDark ? '#3b82f6' : '#2563eb'} 
              />
              <Text className={`text-sm font-medium mt-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Global Activity
              </Text>
              <Text className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {loadingActivities ? '...' : `${globalActivities.filter(activity => !activity.isAcknowledged).length} new events`}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`flex-1 p-4 rounded-xl ml-2 ${
                isDark ? 'bg-neutral-800' : 'bg-white'
              }`}
              onPress={() => navigation.navigate('QueuedRequests')}
            >
              <Ionicons 
                name="list" 
                size={24} 
                color={isDark ? '#10b981' : '#059669'} 
              />
              <Text className={`text-sm font-medium mt-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Queued Requests
              </Text>
              <Text className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {queuedRequests.filter(r => r.status === 'pending').length} pending
              </Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row justify-between">
            <TouchableOpacity 
              className={`flex-1 p-4 rounded-xl mr-2 ${
                isDark ? 'bg-neutral-800' : 'bg-white'
              }`}
              onPress={() => Alert.alert('Emergency', 'Emergency features coming soon!')}
            >
              <Ionicons 
                name="alert-circle" 
                size={24} 
                color={isDark ? '#ef4444' : '#dc2626'} 
              />
              <Text className={`text-sm font-medium mt-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Emergency
              </Text>
              <Text className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Quick access
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`flex-1 p-4 rounded-xl ml-2 ${
                isDark ? 'bg-neutral-800' : 'bg-white'
              }`}
              onPress={() => navigation.navigate('AllHomesDevices')}
            >
              <Ionicons 
                name="hardware-chip" 
                size={24} 
                color={isDark ? '#8b5cf6' : '#7c3aed'} 
              />
              <Text className={`text-sm font-medium mt-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                All Devices
              </Text>
              <Text className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Device control
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity Summary */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Recent Activity
              </Text>
              {!loadingActivities && globalActivities.filter(activity => !activity.isAcknowledged).length > 0 && (
                <View className={`ml-2 px-2 py-1 rounded-full ${
                  isDark ? 'bg-red-600' : 'bg-red-500'
                }`}>
                  <Text className="text-white text-xs font-semibold">
                    {globalActivities.filter(activity => !activity.isAcknowledged).length}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => handleViewAllActivities()}>
              <Text className={`text-sm ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          
          {loadingActivities ? (
            <View className="items-center py-4">
              <ActivityIndicator 
                size="small" 
                color={isDark ? '#3b82f6' : '#2563eb'} 
              />
              <Text className={`text-sm mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Loading activities...
              </Text>
            </View>
          ) : activitiesError ? (
            <View className="items-center py-4">
              <Ionicons 
                name="alert-circle" 
                size={24} 
                color={isDark ? '#ef4444' : '#dc2626'} 
              />
              <Text className={`text-sm mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {activitiesError}
              </Text>
            </View>
          ) : globalActivities.length === 0 ? (
            <View className="items-center py-4">
              <Ionicons 
                name="checkmark-circle" 
                size={24} 
                color={isDark ? '#10b981' : '#059669'} 
              />
              <Text className={`text-sm mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                No recent activities
              </Text>
            </View>
          ) : (
            globalActivities.slice(0, 2).map(activity => {
              const home = homes.find(h => h.id === activity.homeId);
              const homeName = home?.name || 'Unknown Home';
              
              return (
                <View key={activity.id} className={`p-4 rounded-xl mb-3 ${
                  isDark ? 'bg-neutral-800' : 'bg-white'
                }`}>
                  <TouchableOpacity 
                    onPress={() => handleActivityClick(activity)}
                    className="flex-row items-start"
                  >
                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3`} 
                          style={{ backgroundColor: getPriorityColor(activity.priority) }}>
                      <Ionicons 
                        name={getTypeIcon(activity.activityType) as any} 
                        size={16} 
                        color="white" 
                      />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        {activity.title}
                      </Text>
                      <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        {activity.description || activity.activityType.replace('_', ' ')}
                      </Text>
                      <Text className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                        {homeName} • {formatActivityTimestamp(activity.activityTimestamp)}
                      </Text>
                    </View>
                    <View className="relative">
                      {!activity.isAcknowledged && (
                        <View className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {/* Queued Requests Summary */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Queued Requests
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('QueuedRequests')}>
              <Text className={`text-sm ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          
          {queuedRequests.slice(0, 2).map(request => (
            <View key={request.id} className={`p-4 rounded-xl mb-3 ${
              isDark ? 'bg-neutral-800' : 'bg-white'
            }`}>
              <TouchableOpacity 
                onPress={() => toggleRequestExpansion(request.id)}
                className="flex-row items-start"
              >
                <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                  isDark ? 'bg-primary-600' : 'bg-primary-500'
                }`}>
                  <Ionicons 
                    name={getTypeIcon(request.type) as any} 
                    size={16} 
                    color="white" 
                  />
                </View>
                <View className="flex-1">
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    {request.personName}
                  </Text>
                  <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    {request.type.charAt(0).toUpperCase() + request.type.slice(1)} at {request.location}
                  </Text>
                  {request.message && (
                    <Text className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      "{request.message}"
                    </Text>
                  )}
                  <Text className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                    {request.homeName} • {request.timestamp}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className={`px-2 py-1 rounded-full mr-2 ${
                    request.status === 'pending' 
                      ? (isDark ? 'bg-yellow-600' : 'bg-yellow-500')
                      : request.status === 'approved'
                      ? (isDark ? 'bg-green-600' : 'bg-green-500')
                      : (isDark ? 'bg-red-600' : 'bg-red-500')
                  }`}>
                    <Text className="text-xs font-medium text-white">
                      {request.status}
                    </Text>
                  </View>
                  <Ionicons 
                    name={expandedRequest === request.id ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color={isDark ? '#a3a3a3' : '#737373'} 
                  />
                </View>
              </TouchableOpacity>
              
              {/* Expanded Request Actions */}
              {expandedRequest === request.id && (
                <View className="mt-4 pt-4 border-t border-neutral-600">
                  <View className="flex-row justify-between mb-3">
                    <Text className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      Actions
                    </Text>
                    <Text className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                      {request.type.toUpperCase()}
                    </Text>
                  </View>
                  
                  {request.status === 'pending' ? (
                    <View>
                      <TouchableOpacity 
                        className={`w-full py-4 px-6 rounded-2xl mb-4 ${
                          isDark ? 'bg-green-600' : 'bg-green-500'
                        }`}
                        onPress={() => handleRequestAction(request.id, 'approve')}
                        style={{ shadowColor: '#10b981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3 }}
                      >
                        <View className="flex-row items-center justify-center">
                          <Ionicons name="checkmark-circle" size={20} color="white" />
                          <Text className="text-white text-base font-semibold ml-3">
                            Approve
                          </Text>
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        className={`w-full py-4 px-6 rounded-2xl ${
                          isDark ? 'bg-red-600' : 'bg-red-500'
                        }`}
                        onPress={() => handleRequestAction(request.id, 'deny')}
                        style={{ shadowColor: '#ef4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3 }}
                      >
                        <View className="flex-row items-center justify-center">
                          <Ionicons name="close-circle" size={20} color="white" />
                          <Text className="text-white text-base font-semibold ml-3">
                            Deny
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="flex-row items-center justify-center py-2">
                      <View className={`px-3 py-1 rounded-full ${
                        request.status === 'approved' 
                          ? (isDark ? 'bg-green-600' : 'bg-green-500')
                          : (isDark ? 'bg-red-600' : 'bg-red-500')
                      }`}>
                        <Text className="text-white text-xs font-medium">
                          {request.status === 'approved' ? '✓ Approved' : '✗ Denied'}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Homes List */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              My Homes
            </Text>
            {hasMoreHomes && (
              <TouchableOpacity onPress={handleSeeMore}>
                <Text className={`text-sm ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                  {showAllHomes ? 'Show Less' : 'See More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator 
                size="large" 
                color={isDark ? '#3b82f6' : '#2563eb'} 
              />
              <Text className={`text-sm mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Loading homes...
              </Text>
            </View>
          ) : error ? (
            <View className="items-center py-8">
              <Ionicons 
                name="alert-circle" 
                size={48} 
                color={isDark ? '#ef4444' : '#dc2626'} 
              />
              <Text className={`text-lg font-semibold mt-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Error Loading Homes
              </Text>
              <Text className={`text-sm text-center mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {error}
              </Text>
              <TouchableOpacity 
                className={`mt-4 px-4 py-2 rounded-lg ${
                  isDark ? 'bg-primary-600' : 'bg-primary-500'
                }`}
                onPress={loadHomes}
              >
                <Text className="text-white font-medium">Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : displayedHomes.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons 
                name="home-outline" 
                size={48} 
                color={isDark ? '#a3a3a3' : '#737373'} 
              />
              <Text className={`text-lg font-semibold mt-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                No Homes Yet
              </Text>
              <Text className={`text-sm text-center mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Add your first home to get started
              </Text>
            </View>
          ) : (
            displayedHomes.map(home => (
              <HomeCard key={home.id} home={home} />
            ))
          )}
        </View>

        {/* Add Home Button */}
        <TouchableOpacity
          className={`p-6 rounded-xl border-2 border-dashed ${
            isDark ? 'border-neutral-600' : 'border-neutral-300'
          } items-center mb-6`}
          onPress={handleAddHome}
        >
          <Ionicons 
            name="add-circle-outline" 
            size={32} 
            color={isDark ? '#a3a3a3' : '#737373'} 
          />
          <Text className={`text-lg font-semibold mt-2 ${
            isDark ? 'text-neutral-300' : 'text-neutral-600'
          }`}>
            Add New Home
          </Text>
          <Text className={`text-sm text-center mt-1 ${
            isDark ? 'text-neutral-500' : 'text-neutral-500'
          }`}>
            Set up security for another property
          </Text>
        </TouchableOpacity>

        {/* Quick Stats */}
        {!isLoading && !error && homes.length > 0 && (
          <View className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-neutral-800' : 'bg-white'} border ${
            isDark ? 'border-neutral-700' : 'border-neutral-200'
          }`}>
            <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Overview
            </Text>
            
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  {homes.length}
                </Text>
                <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Total Homes
                </Text>
              </View>
              
              <View className="items-center">
                <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  {homes.filter(h => h.isActive).length}
                </Text>
                <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Active
                </Text>
              </View>
              
              <View className="items-center">
                <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  {homes.filter(h => h.isArmed).length}
                </Text>
                <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Armed
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Global Activity Modal */}
      <Modal
        visible={showActivityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowActivityModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className={`rounded-t-3xl ${isDark ? 'bg-neutral-800' : 'bg-white'} p-6 max-h-96`}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Global Activity
              </Text>
              <TouchableOpacity onPress={() => setShowActivityModal(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#ffffff' : '#000000'} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {globalActivities.map(activity => {
                const home = homes.find(h => h.id === activity.homeId);
                const homeName = home?.name || 'Unknown Home';
                
                return (
                  <View key={activity.id} className={`p-4 rounded-xl mb-3 ${
                    isDark ? 'bg-neutral-700' : 'bg-neutral-100'
                  }`}>
                    <TouchableOpacity 
                      onPress={() => handleActivityClick(activity)}
                      className="flex-row items-start"
                    >
                      <View className={`w-8 h-8 rounded-full items-center justify-center mr-3`} 
                            style={{ backgroundColor: getPriorityColor(activity.priority) }}>
                        <Ionicons 
                          name={getTypeIcon(activity.activityType) as any} 
                          size={16} 
                          color="white" 
                        />
                      </View>
                      <View className="flex-1">
                        <Text className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                          {activity.title}
                        </Text>
                        <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                          {activity.description || activity.activityType.replace('_', ' ')}
                        </Text>
                        <Text className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                          {homeName} • {formatActivityTimestamp(activity.activityTimestamp)}
                        </Text>
                      </View>
                      <View className="relative">
                        {!activity.isAcknowledged && (
                          <View className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                        )}
                      </View>
                    </TouchableOpacity>
                </View>
              );
            })}
            </ScrollView>
          </View>
        </View>
      </Modal>


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
                      {homes.find(h => h.id === selectedActivity.homeId)?.name || 'Unknown Home'}
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
                        const home = homes.find(h => h.id === selectedActivity.homeId);
                        if (home) {
                          setShowActivityDetailModal(false);
                          navigation.navigate('RecentActivities', { home });
                        }
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

export default HomeSelectionScreen;
