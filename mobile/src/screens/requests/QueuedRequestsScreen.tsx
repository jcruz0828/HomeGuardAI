import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  Alert,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface QueuedRequestsScreenProps {
  navigation: any;
}

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

const QueuedRequestsScreen: React.FC<QueuedRequestsScreenProps> = ({ navigation }) => {
  const { isDark } = useTheme();
  
  // State
  const [queuedRequests, setQueuedRequests] = useState<QueuedRequest[]>([
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
      message: 'Calling from intercom',
      status: 'pending'
    },
    {
      id: '3',
      timestamp: '5 minutes ago',
      type: 'emergency',
      personName: 'Mike Johnson',
      homeName: 'Main Residence',
      location: 'Emergency Button',
      message: 'Emergency assistance needed',
      status: 'pending'
    },
    {
      id: '4',
      timestamp: '10 minutes ago',
      type: 'maintenance',
      personName: 'Sarah Wilson',
      homeName: 'Beach House',
      location: 'Back Door',
      message: 'Scheduled maintenance visit',
      status: 'approved'
    },
    {
      id: '5',
      timestamp: '15 minutes ago',
      type: 'door_open',
      personName: 'Alex Brown',
      homeName: 'Main Residence',
      location: 'Garage Door',
      message: 'Delivery access request',
      status: 'denied'
    }
  ]);
  
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Helper functions
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'door_open': return 'door-open';
      case 'call': return 'call';
      case 'emergency': return 'warning';
      case 'maintenance': return 'construct';
      default: return 'help';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'door_open': return '#3b82f6'; // blue
      case 'call': return '#8b5cf6'; // purple
      case 'emergency': return '#ef4444'; // red
      case 'maintenance': return '#f59e0b'; // amber
      default: return '#6b7280'; // gray
    }
  };

  const toggleRequestExpansion = (requestId: string) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
  };

  const handleRequestAction = async (requestId: string, action: 'approve' | 'deny') => {
    try {
      // Update request status optimistically
      setQueuedRequests(prev => prev.map(request => 
        request.id === requestId 
          ? { ...request, status: action === 'approve' ? 'approved' : 'denied' }
          : request
      ));

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Success', 
        `Request ${action === 'approve' ? 'approved' : 'denied'} successfully`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process request');
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  // Get request counts
  const getRequestCounts = () => {
    const pending = queuedRequests.filter(r => r.status === 'pending');
    const approved = queuedRequests.filter(r => r.status === 'approved');
    const denied = queuedRequests.filter(r => r.status === 'denied');
    
    return {
      total: queuedRequests.length,
      pending: pending.length,
      approved: approved.length,
      denied: denied.length
    };
  };

  const requestCounts = getRequestCounts();

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
              Queued Requests
            </Text>
            <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {requestCounts.total} total requests
            </Text>
          </View>
          <View className="w-8" />
        </View>
      </View>

      {/* Request Stats */}
      <View className="px-6 py-4">
        <View className={`p-4 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-white'} border ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
          <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            Request Overview
          </Text>
          <View className="flex-row justify-between mb-2">
            <Text className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
              Pending Requests
            </Text>
            <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {requestCounts.pending}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
              Approved Today
            </Text>
            <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {requestCounts.approved}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
              Denied Today
            </Text>
            <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {requestCounts.denied}
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
        {queuedRequests.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons 
              name="list-outline" 
              size={64} 
              color={isDark ? '#a3a3a3' : '#737373'} 
            />
            <Text className={`text-lg font-semibold mt-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              No Requests Found
            </Text>
            <Text className={`text-sm text-center mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              All caught up! No pending requests at the moment.
            </Text>
          </View>
        ) : (
          <View>
            {/* Filter by status */}
            <View className="flex-row mb-4">
              <TouchableOpacity className={`px-4 py-2 rounded-full mr-2 ${
                isDark ? 'bg-neutral-700' : 'bg-neutral-200'
              }`}>
                <Text className={`text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  All ({requestCounts.total})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className={`px-4 py-2 rounded-full mr-2 ${
                isDark ? 'bg-yellow-600' : 'bg-yellow-500'
              }`}>
                <Text className="text-sm text-white">
                  Pending ({requestCounts.pending})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className={`px-4 py-2 rounded-full ${
                isDark ? 'bg-green-600' : 'bg-green-500'
              }`}>
                <Text className="text-sm text-white">
                  Approved ({requestCounts.approved})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Request List */}
            {queuedRequests.map(request => (
              <View key={request.id} className={`p-4 rounded-xl mb-3 ${
                isDark ? 'bg-neutral-800' : 'bg-white'
              } border ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
                <TouchableOpacity 
                  onPress={() => toggleRequestExpansion(request.id)}
                  className="flex-row items-start"
                >
                  <View className={`w-8 h-8 rounded-full items-center justify-center mr-3`}
                    style={{ backgroundColor: getTypeColor(request.type) }}>
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
                      <View className={`py-3 px-4 rounded-xl ${
                        request.status === 'approved' 
                          ? (isDark ? 'bg-green-600/20' : 'bg-green-100')
                          : (isDark ? 'bg-red-600/20' : 'bg-red-100')
                      }`}>
                        <View className="flex-row items-center">
                          <Ionicons 
                            name={request.status === 'approved' ? 'checkmark-circle' : 'close-circle'} 
                            size={20} 
                            color={request.status === 'approved' ? '#10b981' : '#ef4444'} 
                          />
                          <Text className={`ml-2 font-medium ${
                            request.status === 'approved' 
                              ? (isDark ? 'text-green-400' : 'text-green-700')
                              : (isDark ? 'text-red-400' : 'text-red-700')
                          }`}>
                            {request.status === 'approved' ? 'Request Approved' : 'Request Denied'}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default QueuedRequestsScreen;
