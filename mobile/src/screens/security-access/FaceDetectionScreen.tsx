import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  Alert,
  Modal,
  TextInput,
  Image,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { homePersonService } from '../../services/people-management/HomePersonService';
import { HomePersonResponse } from '../../services/people-management/HomePersonService';
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

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [aiDetectionEnabled, setAiDetectionEnabled] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(80);

  // Load persons on mount
  useEffect(() => {
    loadPersons();
  }, [home.id]);

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

  const handleToggleProfile = async (homePersonId: string) => {
    try {
      const homePerson = homePersons.find(hp => hp.id === homePersonId);
      if (!homePerson) return;

      await homePersonService.updatePersonAccess(homePersonId, {
        accessLevel: homePerson.accessLevel
      });
      
      loadPersons(); // Refresh the list
    } catch (error) {
      console.error('Error toggling person:', error);
      Alert.alert('Error', 'Failed to update person status');
    }
  };

  const handleDeleteProfile = (homePersonId: string) => {
    Alert.alert(
      'Remove Person',
      'Are you sure you want to remove this person from the home?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await homePersonService.removePersonFromHome(homePersonId);
              loadPersons(); // Refresh the list
            } catch (error) {
              console.error('Error removing person:', error);
              Alert.alert('Error', 'Failed to remove person');
            }
          }
        }
      ]
    );
  };

  const handleAddProfile = async () => {
    if (!newProfileName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    try {
      // First create the person
      const { personService } = await import('../services/PersonService');
      const newPerson = await personService.createPerson({
        name: newProfileName.trim(),
        personType: 'FAMILY_MEMBER',
        isActive: true
      });

      // Then link them to the home
      await homePersonService.linkPersonToHome({
        homeId: home.id,
        personId: newPerson.id,
        accessLevel: 'FULL_ACCESS'
      });
      
      setNewProfileName('');
      setShowAddModal(false);
      setShowEnrollmentModal(true);
      loadPersons(); // Refresh the list
    } catch (error) {
      console.error('Error creating person:', error);
      Alert.alert('Error', 'Failed to create person');
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return isDark ? '#10b981' : '#059669';
    if (confidence >= 60) return isDark ? '#f59e0b' : '#d97706';
    return isDark ? '#ef4444' : '#dc2626';
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

  const AddProfileModal = () => (
    <Modal
      visible={showAddModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAddModal(false)}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className={`rounded-t-3xl ${isDark ? 'bg-neutral-800' : 'bg-white'} p-6`}>
          <View className="flex-row justify-between items-center mb-6">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Add Face Profile
            </Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={isDark ? '#ffffff' : '#000000'} />
            </TouchableOpacity>
          </View>
          
          <View className="mb-6">
            <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Person Name
            </Text>
            <TextInput
              className={`p-4 rounded-xl border ${
                isDark 
                  ? 'bg-neutral-700 border-neutral-600 text-white' 
                  : 'bg-neutral-100 border-neutral-200 text-neutral-900'
              }`}
              placeholder="Enter person's name"
              placeholderTextColor={isDark ? '#a3a3a3' : '#737373'}
              value={newProfileName}
              onChangeText={setNewProfileName}
            />
          </View>
          
          <TouchableOpacity
            className={`py-4 px-6 rounded-xl ${isDark ? 'bg-primary-600' : 'bg-primary-500'}`}
            onPress={handleAddProfile}
          >
            <Text className="text-white text-lg font-semibold text-center">
              Add Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const EnrollmentModal = () => (
    <Modal
      visible={showEnrollmentModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowEnrollmentModal(false)}
    >
      <View className="flex-1 justify-center bg-black/50 px-6">
        <View className={`rounded-2xl ${isDark ? 'bg-neutral-800' : 'bg-white'} p-6`}>
          <View className="items-center mb-6">
            <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${
              isDark ? 'bg-primary-600' : 'bg-primary-500'
            }`}>
              <Ionicons name="camera" size={32} color="white" />
            </View>
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Face Enrollment
            </Text>
            <Text className={`text-sm text-center mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Position your face in front of the camera and look straight ahead
            </Text>
          </View>
          
          <View className="mb-6">
            <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Enrollment Progress
            </Text>
            <View className={`h-2 rounded-full ${isDark ? 'bg-neutral-700' : 'bg-neutral-200'}`}>
              <View className="h-2 rounded-full bg-primary-500" style={{ width: '75%' }} />
            </View>
            <Text className={`text-xs mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              75% complete - 3 of 4 angles captured
            </Text>
          </View>
          
          <View className="flex-row space-x-3">
            <TouchableOpacity
              className={`flex-1 py-3 px-4 rounded-xl border ${
                isDark ? 'border-neutral-600' : 'border-neutral-300'
              }`}
              onPress={() => setShowEnrollmentModal(false)}
            >
              <Text className={`text-center font-medium ${
                isDark ? 'text-neutral-300' : 'text-neutral-600'
              }`}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 px-4 rounded-xl ${isDark ? 'bg-primary-600' : 'bg-primary-500'}`}
              onPress={() => setShowEnrollmentModal(false)}
            >
              <Text className="text-white text-center font-medium">
                Complete
              </Text>
            </TouchableOpacity>
          </View>
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
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                AI Detection
              </Text>
              <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Enable automatic face recognition
              </Text>
            </View>
            <Switch
              value={aiDetectionEnabled}
              onValueChange={setAiDetectionEnabled}
              trackColor={{ false: '#767577', true: '#3b82f6' }}
              thumbColor={aiDetectionEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          
          <View className="mb-4">
            <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Confidence Threshold: {confidenceThreshold}%
            </Text>
            <View className={`h-2 rounded-full ${isDark ? 'bg-neutral-700' : 'bg-neutral-200'}`}>
              <View 
                className="h-2 rounded-full bg-primary-500" 
                style={{ width: `${confidenceThreshold}%` }} 
              />
            </View>
          </View>
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

      <AddProfileModal />
      <EnrollmentModal />
    </SafeAreaView>
  );
};

export default FaceDetectionScreen;
