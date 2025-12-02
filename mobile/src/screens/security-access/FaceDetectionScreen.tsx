import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  Alert,
  TextInput,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { homePersonService, HomePersonResponse } from '../../services/people-management/HomePersonService';
import { faceRecognitionSettingsService } from '../../services/security/FaceRecognitionSettingsService';
import Avatar from '../../components/Avatar';

interface FaceProfile {
  id: string;
  name: string;
  image: string;
  confidence: number;
  isActive: boolean;
  lastSeen: string;
  accessCount: number;
  enrollmentMethod: 'manual' | 'automatic';
  faceFeatures: string;
}

interface FaceDetectionScreenProps {
  navigation: any;
  route: {
    params: {
      home: any;
    };
  };
}

const FaceDetectionScreen: React.FC<FaceDetectionScreenProps> = ({ navigation, route }) => {
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
  
  const [homePersons, setHomePersons] = useState<HomePersonResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [aiDetectionEnabled, setAiDetectionEnabled] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(80);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [showThresholdInput, setShowThresholdInput] = useState(false);
  const [thresholdInputValue, setThresholdInputValue] = useState('');

  // Load persons and settings on mount
  useEffect(() => {
    loadPersons();
    loadSettings();
  }, [home.id]);

  // Load face recognition settings from backend
  const loadSettings = async () => {
    try {
      setSettingsLoading(true);
      const settings = await faceRecognitionSettingsService.getSettingsByHomeId(home.id);
      setAiDetectionEnabled(settings.aiDetectionEnabled);
      setConfidenceThreshold(settings.confidenceThreshold);
    } catch (error) {
      console.error('Error loading face recognition settings:', error);
      // Use defaults if backend fails
    } finally {
      setSettingsLoading(false);
    }
  };

  // Save AI detection setting
  const handleToggleAiDetection = async (value: boolean) => {
    try {
      setAiDetectionEnabled(value);
      await faceRecognitionSettingsService.updateSettingsByHomeId(home.id, {
        aiDetectionEnabled: value
      });
    } catch (error) {
      console.error('Error saving AI detection setting:', error);
      Alert.alert('Error', 'Failed to save AI detection setting');
      // Revert on error
      setAiDetectionEnabled(!value);
    }
  };

  // Save confidence threshold
  const handleThresholdChange = async (value: number) => {
    try {
      const clampedValue = Math.max(0, Math.min(100, value));
      setConfidenceThreshold(clampedValue);
      await faceRecognitionSettingsService.updateSettingsByHomeId(home.id, {
        confidenceThreshold: clampedValue
      });
      setShowThresholdInput(false);
    } catch (error) {
      console.error('Error saving confidence threshold:', error);
      Alert.alert('Error', 'Failed to save confidence threshold');
    }
  };

  const handleOpenThresholdInput = () => {
    setThresholdInputValue(confidenceThreshold.toString());
    setShowThresholdInput(true);
  };

  const handleSaveThreshold = () => {
    const numValue = parseInt(thresholdInputValue, 10);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      Alert.alert('Invalid Value', 'Please enter a number between 0 and 100');
      return;
    }
    handleThresholdChange(numValue);
  };

  const handleCancelThreshold = () => {
    setShowThresholdInput(false);
    setThresholdInputValue('');
  };

  const loadPersons = async () => {
    try {
      setIsLoading(true);
      const homePersonsData = await homePersonService.getPersonsByHomeId(home.id);
      setHomePersons(homePersonsData);
    } catch (error) {
      console.error('Error loading persons:', error);
      Alert.alert('Error', 'Failed to load persons');
    } finally {
      setIsLoading(false);
    }
  };


  const FaceProfileCard = ({ homePerson }: { homePerson: HomePersonResponse }) => {
    const person = homePerson.person;
    if (!person) return null;
    
    return (
    <View className={`p-6 rounded-2xl mb-4 border ${
      isDark 
        ? 'bg-neutral-800 border-neutral-700' 
        : 'bg-white border-neutral-200'
    }`}>
      <View className="flex-row items-start mb-4">
        <View className="mr-4">
          <Avatar
            size="large"
            imageUri={person.profileImagePath}
            name={person.name || 'Unknown'}
            personType={person.personType || 'UNKNOWN'}
          />
        </View>
        <View className="flex-1">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                {person.name}
              </Text>
              <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {person.personType.replace('_', ' ')} • {person.profileImagePath ? 'Face Profile ✓' : 'No Face Profile'}
              </Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${
              homePerson.isActive 
                ? (isDark ? 'bg-green-600' : 'bg-green-500')
                : (isDark ? 'bg-neutral-600' : 'bg-neutral-300')
            }`}>
              <Text className={`text-xs font-medium ${
                homePerson.isActive ? 'text-white' : (isDark ? 'text-neutral-300' : 'text-neutral-600')
              }`}>
                {homePerson.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Face Profile Status */}
      <View className="flex-row items-center mb-4">
        <Ionicons 
          name={person.profileImagePath ? "checkmark-circle" : "close-circle"} 
          size={16} 
          color={person.profileImagePath ? (isDark ? '#10b981' : '#059669') : (isDark ? '#ef4444' : '#dc2626')} 
        />
        <Text className={`text-sm ml-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
          {person.profileImagePath ? 'Face profile ready' : 'No face profile'}
        </Text>
      </View>
      
      {/* Last Seen */}
      <View className="flex-row items-center mb-4">
        <Text className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
          {homePerson.lastAccessed ? `Last accessed: ${homePerson.lastAccessed}` : 'Never accessed'}
        </Text>
      </View>
    </View>
    );
  };

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
              Face Recognition
            </Text>
            <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {home.name} • AI Detection
            </Text>
          </View>
        </View>
        <View className="flex-row space-x-2">
          
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* AI Detection Settings */}
        <View className={`p-6 rounded-2xl mb-6 border ${
          isDark 
            ? 'bg-neutral-800 border-neutral-700' 
            : 'bg-white border-neutral-200'
        }`}>
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-1 mr-4">
              <Text className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                AI Detection
              </Text>
              <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {aiDetectionEnabled 
                  ? 'Automatic face recognition is enabled' 
                  : 'Automatic face recognition is disabled'}
              </Text>
            </View>
            <Switch
              value={aiDetectionEnabled}
              onValueChange={handleToggleAiDetection}
              trackColor={{ false: '#767577', true: '#3b82f6' }}
              thumbColor={aiDetectionEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          
          {aiDetectionEnabled && (
            <View className="mt-6">
              {!showThresholdInput ? (
                <>
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-1">
                      <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        Confidence Threshold
                      </Text>
                      <Text className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        Higher threshold = stricter matching (fewer false positives)
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className={`text-2xl font-bold ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                        {confidenceThreshold}%
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={handleOpenThresholdInput}
                    className="mt-3"
                  >
                    <Text className={`text-sm font-medium ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                      Change Threshold →
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View className="mb-4">
                    <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                      Confidence Threshold (0-100)
                    </Text>
                    <TextInput
                      className={`p-4 rounded-xl border ${
                        isDark 
                          ? 'bg-neutral-700 border-neutral-600 text-white' 
                          : 'bg-neutral-100 border-neutral-200 text-neutral-900'
                      }`}
                      placeholder="Enter threshold (0-100)"
                      placeholderTextColor={isDark ? '#a3a3a3' : '#737373'}
                      value={thresholdInputValue}
                      onChangeText={setThresholdInputValue}
                      keyboardType="numeric"
                      autoFocus
                    />
                    <Text className={`text-xs mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      Current: {confidenceThreshold}% • Higher = stricter matching
                    </Text>
                  </View>
                  <View className="flex-row space-x-3">
                    <TouchableOpacity
                      className={`flex-1 py-3 px-4 rounded-xl border ${
                        isDark ? 'border-neutral-600' : 'border-neutral-300'
                      }`}
                      onPress={handleCancelThreshold}
                    >
                      <Text className={`text-center font-medium ${
                        isDark ? 'text-neutral-300' : 'text-neutral-600'
                      }`}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className={`flex-1 py-3 px-4 rounded-xl ${isDark ? 'bg-primary-600' : 'bg-primary-500'}`}
                      onPress={handleSaveThreshold}
                    >
                      <Text className="text-white text-center font-medium">
                        Save
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}
          
          {!aiDetectionEnabled && (
            <View className={`mt-6 p-3 rounded-lg ${isDark ? 'bg-neutral-700/50' : 'bg-neutral-100'}`}>
              <Text className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                AI detection is disabled. Face recognition will not run automatically.
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View className="flex-row justify-between mb-6">
          <View className={`flex-1 p-4 rounded-xl mr-2 ${
            isDark ? 'bg-neutral-800' : 'bg-white'
          }`}>
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {homePersons.length}
            </Text>
            <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Total Persons
            </Text>
          </View>
          <View className={`flex-1 p-4 rounded-xl ml-2 ${
            isDark ? 'bg-neutral-800' : 'bg-white'
          }`}>
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {homePersons.filter(hp => hp.person?.profileImagePath).length}
            </Text>
            <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              With Face Profiles
            </Text>
          </View>
        </View>

        {/* Face Profiles */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Face Profiles
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('MemberManagement', { home })}
              className="px-3 py-1 rounded-full bg-primary-500"
            >
              <Text className="text-white text-sm font-medium">
                Manage All
              </Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View className={`p-8 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-white'} items-center`}>
              <Ionicons 
                name="refresh" 
                size={48} 
                color={isDark ? '#a3a3a3' : '#737373'} 
              />
              <Text className={`text-lg font-medium mt-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Loading persons...
              </Text>
            </View>
          ) : homePersons.length === 0 ? (
            <View className={`p-8 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-white'} items-center`}>
              <Ionicons 
                name="person-outline" 
                size={48} 
                color={isDark ? '#a3a3a3' : '#737373'} 
              />
              <Text className={`text-lg font-medium mt-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                No persons yet
              </Text>
              <Text className={`text-sm text-center mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Add persons in Member Management to set up face recognition
              </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('MemberManagement', { home })}
                className="mt-4 px-4 py-2 rounded-lg bg-primary-500"
              >
                <Text className="text-white font-medium">
                  Go to Member Management
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            homePersons.map((homePerson) => (
              <FaceProfileCard key={homePerson.id} homePerson={homePerson} />
            ))
          )}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
};

export default FaceDetectionScreen;
