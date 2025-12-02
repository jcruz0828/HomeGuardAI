import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  Alert,
  Modal,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { accessLogService, AccessLogResponse } from '../../services/security/AccessLogService';

interface AccessLog {
  id: string;
  timestamp: string;
  personName: string;
  accessType: 'face' | 'rfid' | 'app' | 'manual' | 'lock' | 'unlock' | 'emergency' | 'admin';
  result: 'granted' | 'denied' | 'error';
  location: string;
  deviceName: string;
  confidence?: number;
  cardNumber?: string;
  notes?: string;
}

interface AccessLogsScreenProps {
  navigation: any;
  route: {
    params: {
      home: any;
    };
  };
}

const AccessLogsScreen: React.FC<AccessLogsScreenProps> = ({ navigation, route }) => {
  const { isDark } = useTheme();
  const { user } = useUser();
  const { home } = route.params;
  
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AccessLog[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'granted' | 'denied' | 'face' | 'rfid' | 'app' | 'lock' | 'unlock'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Map backend access type to frontend type
  const mapAccessType = (type: string): AccessLog['accessType'] => {
    switch (type) {
      case 'FACIAL_RECOGNITION': return 'face';
      case 'RFID': return 'rfid';
      case 'MOBILE_APP': return 'app';
      case 'MANUAL_OVERRIDE': return 'manual';
      case 'LOCK': return 'lock';
      case 'UNLOCK': return 'unlock';
      case 'EMERGENCY': return 'emergency';
      case 'ADMIN_OVERRIDE': return 'admin';
      default: return 'face';
    }
  };

  // Map backend result to frontend result
  const mapResult = (result: string): AccessLog['result'] => {
    switch (result) {
      case 'GRANTED': return 'granted';
      case 'DENIED': return 'denied';
      case 'ERROR': return 'error';
      case 'TIMEOUT': return 'error';
      case 'MANUAL_REQUIRED': return 'error';
      default: return 'denied';
    }
  };

  // Format timestamp
  const formatTimestamp = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Convert backend response to frontend format
  const convertToAccessLog = (log: AccessLogResponse): AccessLog => {
    return {
      id: log.id,
      timestamp: formatTimestamp(log.createdAt),
      personName: log.personName || log.userName || 'Unknown',
      accessType: mapAccessType(log.accessType),
      result: mapResult(log.result),
      location: log.location || log.homeName || 'Unknown Location',
      deviceName: log.deviceName || 'Unknown Device',
      confidence: log.confidence,
      notes: log.reason,
    };
  };

  // Load access logs
  const loadAccessLogs = useCallback(async (isRefresh = false) => {
    if (!home?.id) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(0);
        setHasMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const currentPage = isRefresh ? 0 : page;
      const response = await accessLogService.getAccessLogsByHomeId(home.id, currentPage, 50);
      
      const convertedLogs = response.content.map(convertToAccessLog);

      if (isRefresh) {
        setAccessLogs(convertedLogs);
      } else {
        setAccessLogs(prev => [...prev, ...convertedLogs]);
      }

      setHasMore(response.number < response.totalPages - 1);
      if (!isRefresh) {
        setPage(prev => prev + 1);
      }
    } catch (err: any) {
      console.error('Error loading access logs:', err);
      setError(err.message || 'Failed to load access logs');
      Alert.alert('Error', err.message || 'Failed to load access logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [home?.id, page]);

  useEffect(() => {
    // For testing: Add a static mock log
    const mockLog: AccessLog = {
      id: 'mock-log-001',
      timestamp: '2m ago',
      personName: 'John Doe',
      accessType: 'face',
      result: 'granted',
      location: '123 Main St, Anytown, ST 12345',
      deviceName: 'Front Door Camera',
      confidence: 92.5,
      notes: 'Person recognized with high confidence'
    };
    setAccessLogs([mockLog]);
    setFilteredLogs([mockLog]);
    setLoading(false);
    
    // Uncomment to load real data:
    // loadAccessLogs();
  }, [home?.id]);

  useEffect(() => {
    let filtered = accessLogs;

    // Apply result filter
    if (selectedFilter === 'granted' || selectedFilter === 'denied') {
      filtered = filtered.filter(log => log.result === selectedFilter);
    }
    // Apply access type filter
    else if (selectedFilter !== 'all') {
      filtered = filtered.filter(log => log.accessType === selectedFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(log => 
        log.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.deviceName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [accessLogs, selectedFilter, searchQuery]);

  const getResultColor = (result: string) => {
    switch (result) {
      case 'granted': return isDark ? '#10b981' : '#059669';
      case 'denied': return isDark ? '#ef4444' : '#dc2626';
      case 'error': return isDark ? '#f59e0b' : '#d97706';
      default: return isDark ? '#6b7280' : '#6b7280';
    }
  };

  const getAccessTypeIcon = (type: string) => {
    switch (type) {
      case 'face': return 'person';
      case 'rfid': return 'card';
      case 'app': return 'phone-portrait';
      case 'manual': return 'hand';
      case 'lock': return 'lock-closed';
      case 'unlock': return 'lock-open';
      case 'emergency': return 'warning';
      case 'admin': return 'shield';
      default: return 'key';
    }
  };

  const getAccessTypeColor = (type: string) => {
    switch (type) {
      case 'face': return isDark ? '#3b82f6' : '#2563eb';
      case 'rfid': return isDark ? '#10b981' : '#059669';
      case 'app': return isDark ? '#8b5cf6' : '#7c3aed';
      case 'manual': return isDark ? '#f59e0b' : '#d97706';
      case 'lock': return isDark ? '#ef4444' : '#dc2626';
      case 'unlock': return isDark ? '#10b981' : '#059669';
      case 'emergency': return isDark ? '#f59e0b' : '#d97706';
      case 'admin': return isDark ? '#8b5cf6' : '#7c3aed';
      default: return isDark ? '#6b7280' : '#6b7280';
    }
  };

  const AccessLogItem = ({ log }: { log: AccessLog }) => (
    <View className={`p-6 rounded-2xl mb-4 border ${
      isDark 
        ? 'bg-neutral-800 border-neutral-700' 
        : 'bg-white border-neutral-200'
    }`}>
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            {log.personName}
          </Text>
          <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            {log.location} • {log.deviceName}
          </Text>
        </View>
        <View className={`px-3 py-1 rounded-full`} style={{ backgroundColor: getResultColor(log.result) }}>
          <Text className="text-xs font-medium text-white">
            {log.result.charAt(0).toUpperCase() + log.result.slice(1)}
          </Text>
        </View>
      </View>
      
      <View className="flex-row items-center mb-3">
        <View className={`w-8 h-8 rounded-full items-center justify-center mr-3`} 
              style={{ backgroundColor: getAccessTypeColor(log.accessType) }}>
          <Ionicons 
            name={getAccessTypeIcon(log.accessType) as any} 
            size={16} 
            color="white" 
          />
        </View>
        <View className="flex-1">
          <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            {log.accessType.charAt(0).toUpperCase() + log.accessType.slice(1)} Access
          </Text>
          {log.confidence && (
            <Text className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {log.confidence}% confidence
            </Text>
          )}
          {log.cardNumber && (
            <Text className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Card: {log.cardNumber}
            </Text>
          )}
        </View>
        <Text className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
          {log.timestamp}
        </Text>
      </View>
      
      {log.notes && (
        <View className={`p-3 rounded-xl ${isDark ? 'bg-neutral-700' : 'bg-neutral-100'}`}>
          <Text className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
            {log.notes}
          </Text>
        </View>
      )}
    </View>
  );

  const FilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className={`rounded-t-3xl ${isDark ? 'bg-neutral-800' : 'bg-white'} p-6`}>
          <View className="flex-row justify-between items-center mb-6">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Filter Logs
            </Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color={isDark ? '#ffffff' : '#000000'} />
            </TouchableOpacity>
          </View>
          
          <View className="mb-6">
            <Text className={`text-sm font-medium mb-3 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Filter by Result
            </Text>
            <View className="flex-row flex-wrap">
              {[
                { value: 'all', label: 'All' },
                { value: 'granted', label: 'Granted' },
                { value: 'denied', label: 'Denied' }
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  className={`p-3 rounded-xl mr-2 mb-2 ${
                    selectedFilter === filter.value
                      ? (isDark ? 'bg-primary-600' : 'bg-primary-500')
                      : (isDark ? 'bg-neutral-700' : 'bg-neutral-100')
                  }`}
                  onPress={() => setSelectedFilter(filter.value as any)}
                >
                  <Text className={`text-sm ${
                    selectedFilter === filter.value ? 'text-white' : (isDark ? 'text-neutral-300' : 'text-neutral-600')
                  }`}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View className="mb-6">
            <Text className={`text-sm font-medium mb-3 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Filter by Access Type
            </Text>
            <View className="flex-row flex-wrap">
              {[
                { value: 'face', label: 'Face Recognition' },
                { value: 'rfid', label: 'RFID Card' },
                { value: 'app', label: 'Mobile App' },
                { value: 'manual', label: 'Manual' },
                { value: 'lock', label: 'Lock' },
                { value: 'unlock', label: 'Unlock' }
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  className={`p-3 rounded-xl mr-2 mb-2 ${
                    selectedFilter === filter.value
                      ? (isDark ? 'bg-primary-600' : 'bg-primary-500')
                      : (isDark ? 'bg-neutral-700' : 'bg-neutral-100')
                  }`}
                  onPress={() => setSelectedFilter(filter.value as any)}
                >
                  <Text className={`text-sm ${
                    selectedFilter === filter.value ? 'text-white' : (isDark ? 'text-neutral-300' : 'text-neutral-600')
                  }`}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <TouchableOpacity
            className={`py-4 px-6 rounded-xl ${isDark ? 'bg-primary-600' : 'bg-primary-500'}`}
            onPress={() => setShowFilterModal(false)}
          >
            <Text className="text-white text-lg font-semibold text-center">
              Apply Filter
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={isDark ? '#ffffff' : '#000000'} 
            />
          </TouchableOpacity>
          <View>
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Access Logs
            </Text>
            <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {home.name} • Activity History
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setShowFilterModal(true)}
          className={`p-2 rounded-full ${isDark ? 'bg-primary-600' : 'bg-primary-500'}`}
        >
          <Ionicons name="filter" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="px-6 mb-4">
        <View className={`p-4 rounded-xl border ${
          isDark 
            ? 'bg-neutral-800 border-neutral-700' 
            : 'bg-white border-neutral-200'
        }`}>
          <View className="flex-row items-center">
            <Ionicons 
              name="search" 
              size={20} 
              color={isDark ? '#a3a3a3' : '#737373'} 
            />
            <TextInput
              className={`flex-1 ml-3 text-base ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}
              placeholder="Search logs..."
              placeholderTextColor={isDark ? '#a3a3a3' : '#737373'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons 
                  name="close-circle" 
                  size={20} 
                  color={isDark ? '#a3a3a3' : '#737373'} 
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-6" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAccessLogs(true)}
            tintColor={isDark ? '#ffffff' : '#000000'}
          />
        }
      >
        {/* Stats */}
        <View className="flex-row justify-between mb-6">
          <View className={`flex-1 p-4 rounded-xl mr-2 ${
            isDark ? 'bg-neutral-800' : 'bg-white'
          }`}>
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {filteredLogs.length}
            </Text>
            <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Total Logs
            </Text>
          </View>
          <View className={`flex-1 p-4 rounded-xl ml-2 ${
            isDark ? 'bg-neutral-800' : 'bg-white'
          }`}>
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {filteredLogs.filter(log => log.result === 'granted').length}
            </Text>
            <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Granted
            </Text>
          </View>
        </View>

        {/* Access Logs */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Recent Activity
            </Text>
            <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {selectedFilter !== 'all' && `Filtered by ${selectedFilter}`}
            </Text>
          </View>
          
          {loading && accessLogs.length === 0 ? (
            <View className={`p-8 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-white'} items-center`}>
              <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#000000'} />
              <Text className={`text-sm mt-4 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Loading access logs...
              </Text>
            </View>
          ) : error && accessLogs.length === 0 ? (
            <View className={`p-8 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-white'} items-center`}>
              <Ionicons 
                name="alert-circle-outline" 
                size={48} 
                color={isDark ? '#ef4444' : '#dc2626'} 
              />
              <Text className={`text-lg font-medium mt-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Error loading logs
              </Text>
              <Text className={`text-sm text-center mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {error}
              </Text>
              <TouchableOpacity
                className={`mt-4 px-6 py-3 rounded-xl ${isDark ? 'bg-primary-600' : 'bg-primary-500'}`}
                onPress={() => loadAccessLogs(true)}
              >
                <Text className="text-white font-medium">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredLogs.length === 0 ? (
            <View className={`p-8 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-white'} items-center`}>
              <Ionicons 
                name="document-text-outline" 
                size={48} 
                color={isDark ? '#a3a3a3' : '#737373'} 
              />
              <Text className={`text-lg font-medium mt-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                No logs found
              </Text>
              <Text className={`text-sm text-center mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {searchQuery ? 'Try adjusting your search' : 'No access logs available'}
              </Text>
            </View>
          ) : (
            <>
              {filteredLogs.map((log) => (
                <AccessLogItem key={log.id} log={log} />
              ))}
              {hasMore && !loading && (
                <TouchableOpacity
                  className={`p-4 rounded-xl mt-4 items-center ${isDark ? 'bg-neutral-800' : 'bg-white'}`}
                  onPress={() => loadAccessLogs()}
                >
                  <Text className={`text-sm font-medium ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                    Load More
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <FilterModal />
    </SafeAreaView>
  );
};

export default AccessLogsScreen;
