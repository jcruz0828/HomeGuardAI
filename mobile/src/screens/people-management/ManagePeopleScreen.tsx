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
  Modal,
  TextInput,
  SafeAreaView,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../services/authentication/AuthService';
import { personService } from '../../services/people-management/PersonService';
import { homePersonService } from '../../services/people-management/HomePersonService';
import { faceEnrollmentService } from '../../services/people-management/FaceEnrollmentService';
import { PersonResponse } from '../../services/people-management/PersonService';
import { HomePersonResponse } from '../../services/people-management/HomePersonService';
import * as ImagePicker from 'expo-image-picker';
import Avatar from '../../components/Avatar';

const { width } = Dimensions.get('window');

interface ManagePeopleScreenProps {
  navigation: any;
  route: {
    params: {
      home: {
        id: string;
        name: string;
        address: string;
      };
    };
  };
}

const ManagePeopleScreen: React.FC<ManagePeopleScreenProps> = ({ navigation, route }) => {
  const { isDark } = useTheme();
  const { user } = useUser();
  const { home } = route.params;

  // State
  const [people, setPeople] = useState<HomePersonResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Person form state
  const [personName, setPersonName] = useState('');
  const [personPhone, setPersonPhone] = useState('');
  const [personEmail, setPersonEmail] = useState('');
  const [personType, setPersonType] = useState<'FAMILY_MEMBER' | 'REGULAR_GUEST' | 'SERVICE_WORKER' | 'DELIVERY_PERSON' | 'MAINTENANCE' | 'VISITOR' | 'UNKNOWN'>('FAMILY_MEMBER');
  const [personNotes, setPersonNotes] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showPersonDetailModal, setShowPersonDetailModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<HomePersonResponse | null>(null);
  const [personPhotos, setPersonPhotos] = useState<string[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [settingAvatar, setSettingAvatar] = useState(false);
  const [addingPhotosToPerson, setAddingPhotosToPerson] = useState(false);
  const [newPersonPhotos, setNewPersonPhotos] = useState<string[]>([]);


  // Load people for this home
  const loadPeople = useCallback(async () => {
    try {
      setLoading(true);
      const peopleData = await homePersonService.getPersonsByHomeId(home.id);
      setPeople(peopleData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load people');
    } finally {
      setLoading(false);
    }
  }, [home.id]);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPeople();
    setRefreshing(false);
  }, [loadPeople]);

  // Image handling
  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1.0, // No compression for better face detection
        allowsEditing: false, // Don't force editing/cropping
        exif: true, // Preserve EXIF data for proper orientation
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setSelectedImages(prev => [...prev, ...newImages].slice(0, 5)); // Max 5 images
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImage = result.assets[0].uri;
        setSelectedImages(prev => [...prev, newImage].slice(0, 5)); // Max 5 images
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Add person
  const handleAddPerson = async () => {
    if (!personName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    try {
      setIsAddingPerson(true);
      
      // Prepare person data
      const personData = {
        name: personName.trim(),
        phone: personPhone.trim() || undefined,
        email: personEmail.trim() || undefined,
        personType,
        notes: personNotes.trim() || undefined,
      };

      let createdPerson: PersonResponse;

      // If images are selected, use the integrated face enrollment service
      if (selectedImages.length > 0) {
        setIsUploadingImages(true);
        try {
          console.log(`Creating person with ${selectedImages.length} face images for automatic face recognition`);
          
          const enrollmentResult = await faceEnrollmentService.createPersonWithFaces(personData, selectedImages);
          
          if (!enrollmentResult.success) {
            throw new Error(enrollmentResult.error || 'Face enrollment failed');
          }
          
          // Get the created person details
          createdPerson = await personService.getPersonById(enrollmentResult.personId);
          
          console.log('Person created with face embeddings:', enrollmentResult.faceEmbeddingsGenerated);
        } catch (imageError) {
          console.error('Face enrollment failed, creating person without face recognition:', imageError);
          // Fallback: create person without face recognition
          createdPerson = await personService.createPerson(personData);
          Alert.alert('Warning', 'Person created but face recognition setup failed. You can add photos later.');
        } finally {
          setIsUploadingImages(false);
        }
      } else {
        // No images selected, create person normally
        createdPerson = await personService.createPerson(personData);
      }
      
      // Link person to home
      const homePersonRequest = {
        homeId: home.id,
        personId: createdPerson.id,
        accessLevel: 'FULL_ACCESS' as const,
        notes: `Added by ${user?.firstName} ${user?.lastName}`,
      };
      
      await homePersonService.linkPersonToHome(homePersonRequest);
      
      const successMessage = selectedImages.length > 0 
        ? 'Person added successfully with face recognition!'
        : 'Person added successfully!';
      
      Alert.alert('Success', successMessage);
      setShowAddPersonModal(false);
      clearPersonForm();
      loadPeople();
    } catch (err) {
      console.error('Error adding person:', err);
      Alert.alert('Error', 'Failed to add person');
    } finally {
      setIsAddingPerson(false);
    }
  };

  const clearPersonForm = () => {
    setPersonName('');
    setPersonPhone('');
    setPersonEmail('');
    setPersonType('FAMILY_MEMBER');
    setPersonNotes('');
    setSelectedImages([]);
  };

  // Remove person from home
  const handleRemovePerson = async (personId: string, personName: string) => {
    Alert.alert(
      'Remove Person',
      `What would you like to do with ${personName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove from Home Only', 
          style: 'default',
          onPress: async () => {
            try {
              // Find the home-person relationship
              const homePerson = people.find(p => p.personId === personId);
              if (homePerson) {
                await homePersonService.removePersonFromHome(homePerson.id);
                loadPeople();
                Alert.alert('Success', `${personName} has been removed from this home`);
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to remove person from home');
            }
          }
        },
        { 
          text: 'Delete Person Completely', 
          style: 'destructive',
          onPress: async () => {
            try {
              // First remove from home
              const homePerson = people.find(p => p.personId === personId);
              if (homePerson) {
                await homePersonService.removePersonFromHome(homePerson.id);
              }
              
              // Then delete the person completely
              await personService.deletePerson(personId);
              loadPeople();
              Alert.alert('Success', `${personName} has been completely deleted`);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete person');
            }
          }
        }
      ]
    );
  };

  const getPersonTypeColor = (type: string) => {
    // Ensure we have a valid type
    const personType = type || 'UNKNOWN';
    
    switch (personType.toUpperCase()) {
      case 'FAMILY_MEMBER': return '#4CAF50'; // Green
      case 'REGULAR_GUEST': return '#2196F3'; // Blue
      case 'SERVICE_WORKER': return '#FF9800'; // Orange
      case 'DELIVERY_PERSON': return '#FF5722'; // Red-Orange
      case 'MAINTENANCE': return '#9C27B0'; // Purple
      case 'VISITOR': return '#607D8B'; // Blue-Grey
      case 'UNKNOWN': return '#9E9E9E'; // Grey
      default: return '#9E9E9E'; // Default grey
    }
  };


  const handlePersonPress = async (person: HomePersonResponse) => {
    setSelectedPerson(person);
    setShowPersonDetailModal(true);
    
    // Load person's photos
    if (person.person?.id) {
      setLoadingPhotos(true);
      try {
    const photos = await personService.getPersonImages(person.person.id);
    const photoUrls = photos.map(photo => photo.publicUrl);
    setPersonPhotos(photoUrls);
      } catch (error) {
        setPersonPhotos([]);
      } finally {
        setLoadingPhotos(false);
      }
    } else {
      setPersonPhotos([]);
    }
  };

  const handleSetAsAvatar = async (photoUrl: string) => {
    if (!selectedPerson?.person?.id) return;
    
    try {
      setSettingAvatar(true);
      
      // Update the person's profile image path
      const updatedPerson = await personService.updatePerson(selectedPerson.person.id, {
        profileImagePath: photoUrl
      });
      
      // Update the selected person state
      setSelectedPerson(prev => prev ? {
        ...prev,
        person: {
          ...prev.person!,
          profileImagePath: photoUrl
        }
      } : null);
      
      // Reload the people list to reflect changes
      await loadPeople();
      
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setSettingAvatar(false);
    }
  };

  const handleAddPhotosToPerson = async () => {
    if (!selectedPerson?.person?.id) return;
    
    try {
      setAddingPhotosToPerson(true);
      
      // Upload the new photos
      const uploadResult = await personService.uploadMultiplePersonImages(selectedPerson.person.id, newPersonPhotos);
      
      // Reload the person's photos
      const photos = await personService.getPersonImages(selectedPerson.person.id);
      setPersonPhotos(photos.map(photo => photo.publicUrl));
      
      // Clear the new photos
      setNewPersonPhotos([]);
      
      Alert.alert('Success', 'Photos added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add photos');
    } finally {
      setAddingPhotosToPerson(false);
    }
  };

  const handlePickPhotosForPerson = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1.0, // No compression for better face detection
        allowsEditing: false, // Don't force editing/cropping
        exif: true, // Preserve EXIF data for proper orientation
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map(asset => asset.uri);
        setNewPersonPhotos(prev => [...prev, ...newPhotos]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick photos');
    }
  };

  const handleTakePhotoForPerson = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newPhoto = result.assets[0].uri;
        setNewPersonPhotos(prev => [...prev, newPhoto]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeNewPhoto = (index: number) => {
    setNewPersonPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    if (!selectedPerson?.person?.id) return;
    
    try {
      // Extract the file path from the photo URL
      const urlParts = photoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0]; // Remove query parameters
      const filePath = `persons/${selectedPerson.person.id}/${fileName}`;
      
      
      // Delete from Supabase storage
      const { error } = await supabase.storage
        .from('person-images')
        .remove([filePath]);
      
      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
      
      // Reload the person's photos
      const photos = await personService.getPersonImages(selectedPerson.person.id);
      setPersonPhotos(photos.map(photo => photo.publicUrl));
      
      // If this was the profile picture, clear it
      if (selectedPerson.person.profileImagePath === photoUrl) {
        await personService.updatePerson(selectedPerson.person.id, { profileImagePath: undefined });
        
        // Update the selected person state
        setSelectedPerson(prev => prev ? {
          ...prev,
          person: {
            ...prev.person!,
            profileImagePath: undefined
          }
        } : null);
        
        // Reload the people list to reflect changes
        await loadPeople();
      }
      
      Alert.alert('Success', 'Photo deleted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete photo');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#000000'} />
          <Text style={[styles.loadingText, { color: isDark ? '#ffffff' : '#000000' }]}>
            Loading people...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View className={`flex-row items-center justify-between px-6 py-4 ${isDark ? 'bg-neutral-800' : 'bg-white'} border-b ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="p-2"
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={isDark ? '#ffffff' : '#000000'} 
          />
        </TouchableOpacity>
        <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
          Manage People
        </Text>
        <TouchableOpacity 
          onPress={() => setShowAddPersonModal(true)}
          className={`p-2 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Home Info */}
      <View className={`px-6 py-4 ${isDark ? 'bg-neutral-800' : 'bg-white'} border-b ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
        <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
          {home.name}
        </Text>
        <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
          {home.address}
        </Text>
      </View>

      {/* People List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#ffffff' : '#000000'}
          />
        }
      >
        {people.length === 0 ? (
          <View className="flex-1 justify-center items-center px-6 py-12">
            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${isDark ? 'bg-neutral-700' : 'bg-neutral-200'}`}>
              <Ionicons 
                name="people-outline" 
                size={32} 
                color={isDark ? '#9ca3af' : '#6b7280'} 
              />
            </View>
            <Text className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              No People Yet
            </Text>
            <Text className={`text-sm text-center mb-6 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Add people to manage access to your home
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddPersonModal(true)}
              className={`px-6 py-3 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}
            >
              <Text className="text-white font-semibold">Add First Person</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="px-6 py-4">
            {people.map((person) => (
                <TouchableOpacity 
                  key={person.id} 
                  onPress={() => handlePersonPress(person)}
                  className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-neutral-800' : 'bg-white'} border ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}
                >
                <View className="flex-row items-center">
                  <View className="mr-4">
                    <Avatar
                      size="medium"
                      imageUri={person.person?.profileImagePath}
                      name={person.person?.name || 'Unknown'}
                      personType={person.person?.personType || 'UNKNOWN'}
                    />
                  </View>
                  
                  <View className="flex-1">
                    <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                      {person.person?.name || 'Unknown'}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <View 
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: getPersonTypeColor(person.person?.personType || '') }}
                      />
                      <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        {person.person?.personType?.replace('_', ' ') || 'Unknown'}
                      </Text>
                    </View>
                    <Text className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      Access: {person.accessLevel.replace('_', ' ')}
                    </Text>
                    {person.notes && (
                      <Text className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        {person.notes}
                      </Text>
                    )}
                  </View>
                  
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={isDark ? '#9ca3af' : '#6b7280'} 
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Person Modal */}
      <Modal
        visible={showAddPersonModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
          <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
          
          {/* Modal Header */}
          <View className={`flex-row items-center justify-between px-6 py-4 ${isDark ? 'bg-neutral-800' : 'bg-white'} border-b ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
            <TouchableOpacity 
              onPress={() => setShowAddPersonModal(false)}
              className="p-2"
            >
              <Ionicons 
                name="close" 
                size={24} 
                color={isDark ? '#ffffff' : '#000000'} 
              />
            </TouchableOpacity>
            <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Add Person
            </Text>
            <TouchableOpacity 
              onPress={handleAddPerson}
              disabled={isAddingPerson || isUploadingImages}
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-blue-500'} ${(isAddingPerson || isUploadingImages) ? 'opacity-50' : ''}`}
            >
              <Text className="text-white font-semibold">Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 py-4">
            {/* Person Form */}
            <View className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-neutral-800' : 'bg-white'} border ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
              <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Person Information
              </Text>
              
              <TextInput
                className={`w-full px-4 py-3 rounded-lg mb-4 border ${isDark ? 'bg-neutral-700 border-neutral-600 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'}`}
                placeholder="Full Name *"
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                value={personName}
                onChangeText={setPersonName}
              />
              
              <TextInput
                className={`w-full px-4 py-3 rounded-lg mb-4 border ${isDark ? 'bg-neutral-700 border-neutral-600 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'}`}
                placeholder="Phone Number"
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                value={personPhone}
                onChangeText={setPersonPhone}
                keyboardType="phone-pad"
              />
              
              <TextInput
                className={`w-full px-4 py-3 rounded-lg mb-4 border ${isDark ? 'bg-neutral-700 border-neutral-600 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'}`}
                placeholder="Email Address"
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                value={personEmail}
                onChangeText={setPersonEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                className={`w-full px-4 py-3 rounded-lg mb-4 border ${isDark ? 'bg-neutral-700 border-neutral-600 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'} min-h-[80px]`}
                placeholder="Notes (optional)"
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                value={personNotes}
                onChangeText={setPersonNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Person Type */}
            <View className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-neutral-800' : 'bg-white'} border ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
              <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Person Type
              </Text>
              
              <View className="flex-row flex-wrap gap-3">
                {[
                  { value: 'FAMILY_MEMBER', label: 'Family Member', icon: 'people' },
                  { value: 'REGULAR_GUEST', label: 'Regular Guest', icon: 'person' },
                  { value: 'SERVICE_WORKER', label: 'Service Worker', icon: 'construct' },
                  { value: 'DELIVERY_PERSON', label: 'Delivery Person', icon: 'car' },
                  { value: 'MAINTENANCE', label: 'Maintenance', icon: 'settings' },
                  { value: 'VISITOR', label: 'Visitor', icon: 'walk' },
                  { value: 'UNKNOWN', label: 'Unknown', icon: 'help' },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => setPersonType(type.value as any)}
                    className={`flex-row items-center px-4 py-3 rounded-lg border ${
                      personType === type.value 
                        ? `${isDark ? 'bg-blue-600 border-blue-500' : 'bg-blue-500 border-blue-400'}` 
                        : `${isDark ? 'bg-neutral-700 border-neutral-600' : 'bg-neutral-50 border-neutral-300'}`
                    }`}
                  >
                    <Ionicons 
                      name={type.icon as any} 
                      size={20} 
                      color={personType === type.value ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280')} 
                    />
                    <Text className={`ml-2 font-medium ${
                      personType === type.value 
                        ? 'text-white' 
                        : (isDark ? 'text-neutral-300' : 'text-neutral-700')
                    }`}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Images */}
            <View className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-neutral-800' : 'bg-white'} border ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
              <Text className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Photos (Optional)
              </Text>
              <Text className={`text-sm mb-4 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {selectedImages.length > 0 
                  ? `✨ ${selectedImages.length} photos selected - Face recognition will be automatically set up!`
                  : 'Add photos to enable automatic face recognition for this person'
                }
              </Text>
              
              <View className="flex-row gap-3 mb-4">
                <TouchableOpacity
                  onPress={pickImages}
                  className={`flex-1 flex-row items-center justify-center px-4 py-3 rounded-lg ${isDark ? 'bg-green-600' : 'bg-green-500'}`}
                >
                  <Ionicons name="images-outline" size={20} color="#ffffff" />
                  <Text className="text-white font-semibold ml-2">Choose Photos</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={takePhoto}
                  className={`flex-1 flex-row items-center justify-center px-4 py-3 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}
                >
                  <Ionicons name="camera-outline" size={20} color="#ffffff" />
                  <Text className="text-white font-semibold ml-2">Take Photo</Text>
                </TouchableOpacity>
              </View>
              
              {selectedImages.length > 0 && (
                <View className="flex-row flex-wrap gap-3">
                  {selectedImages.map((uri, index) => (
                    <View key={index} className="relative">
                      <Image source={{ uri }} className="w-20 h-20 rounded-lg" />
                      <TouchableOpacity
                        onPress={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 items-center justify-center"
                      >
                        <Ionicons name="close" size={16} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {(isAddingPerson || isUploadingImages) && (
            <View className="absolute inset-0 bg-black bg-opacity-50 items-center justify-center">
              <View className={`p-6 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
                <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#000000'} />
                <Text className={`mt-4 text-center ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  {isUploadingImages 
                    ? 'Setting up face recognition...' 
                    : 'Adding person...'
                  }
                </Text>
                {isUploadingImages && (
                  <Text className={`mt-2 text-center text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    Uploading images and generating face embeddings
                  </Text>
                )}
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Person Detail Modal */}
      <Modal
        visible={showPersonDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
          <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
          
          {/* Modal Header */}
          <View className={`flex-row items-center justify-between px-6 py-4 ${isDark ? 'bg-neutral-800' : 'bg-white'} border-b ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
            <TouchableOpacity 
              onPress={() => setShowPersonDetailModal(false)}
              className="p-2"
            >
              <Ionicons 
                name="close" 
                size={24} 
                color={isDark ? '#ffffff' : '#000000'} 
              />
            </TouchableOpacity>
            <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Person Details
            </Text>
            <TouchableOpacity 
              onPress={() => {
                if (selectedPerson) {
                  handleRemovePerson(selectedPerson.personId, selectedPerson.person?.name || 'this person');
                  setShowPersonDetailModal(false);
                }
              }}
              className="p-2"
            >
              <Ionicons 
                name="trash-outline" 
                size={20} 
                color="#ef4444" 
              />
            </TouchableOpacity>
          </View>

          {selectedPerson && (
            <ScrollView className="flex-1 px-6 py-4">
              {/* Person Photo */}
              <View className="items-center mb-6">
                <Avatar
                  size="xlarge"
                  imageUri={selectedPerson.person?.profileImagePath}
                  name={selectedPerson.person?.name || 'Unknown'}
                  personType={selectedPerson.person?.personType || 'UNKNOWN'}
                  showBorder={true}
                  borderColor={isDark ? '#374151' : '#e5e7eb'}
                />
                <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  {selectedPerson.person?.name || 'Unknown'}
                </Text>
                <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {selectedPerson.person?.personType?.replace('_', ' ') || 'Unknown'}
                </Text>
              </View>

              {/* Person Information */}
              <View className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-neutral-800' : 'bg-white'} border ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
                <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  Information
                </Text>
                
                {/* Note: Phone and email are not available in HomePersonResponse.person object */}
                {/* These would need to be fetched separately if needed */}
                
                <View className="flex-row items-center mb-3">
                  <Ionicons name="shield-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                  <Text className={`ml-3 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                    Access Level: {selectedPerson.accessLevel.replace('_', ' ')}
                  </Text>
                </View>
                
                {selectedPerson.notes && (
                  <View className="flex-row items-start mt-3">
                    <Ionicons name="document-text-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                    <Text className={`ml-3 flex-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      {selectedPerson.notes}
                    </Text>
                  </View>
                )}
              </View>

              {/* Access Settings */}
              <View className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-neutral-800' : 'bg-white'} border ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
                <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  Access Settings
                </Text>
                
                <View className="flex-row items-center justify-between mb-3">
                  <Text className={`${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                    Status
                  </Text>
                  <View className={`px-3 py-1 rounded-full ${selectedPerson.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Text className={`text-sm font-medium ${selectedPerson.isActive ? 'text-green-800' : 'text-red-800'}`}>
                      {selectedPerson.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                
                {selectedPerson.accessExpiresAt && (
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                    <Text className={`ml-3 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      Expires: {new Date(selectedPerson.accessExpiresAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                
                {selectedPerson.lastAccessed && (
                  <View className="flex-row items-center mt-3">
                    <Ionicons name="eye-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                    <Text className={`ml-3 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      Last Accessed: {new Date(selectedPerson.lastAccessed).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Person Photos */}
              <View className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-neutral-800' : 'bg-white'} border ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
                <Text className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  Photos ({personPhotos.length})
                </Text>
                <Text className={`text-sm mb-4 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Tap any photo to set as avatar • Blue checkmark shows current avatar • Tap X to delete
                </Text>
                
                {loadingPhotos ? (
                  <View className="items-center py-8">
                    <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#000000'} />
                    <Text className={`mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      Loading photos...
                    </Text>
                  </View>
                ) : personPhotos.length > 0 ? (
                  <View className="flex-row flex-wrap gap-3">
                    {personPhotos.map((photoUrl, index) => {
                      const isCurrentAvatar = selectedPerson?.person?.profileImagePath === photoUrl;
                      return (
                        <View key={index} className="relative">
                          <TouchableOpacity 
                            className="relative"
                            onPress={() => handleSetAsAvatar(photoUrl)}
                            disabled={settingAvatar}
                          >
                            <Image 
                              source={{ uri: photoUrl }} 
                              className="w-24 h-24 rounded-lg"
                              resizeMode="cover"
                              onError={() => {}}
                              onLoad={() => {}}
                            />
                            
                            {/* Loading overlay */}
                            {settingAvatar && (
                              <View className="absolute inset-0 bg-black bg-opacity-50 rounded-lg items-center justify-center">
                                <ActivityIndicator size="small" color="#ffffff" />
                              </View>
                            )}
                          </TouchableOpacity>
                          
                          {/* Current avatar blue checkmark */}
                          {isCurrentAvatar && (
                            <View className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
                              <Ionicons name="checkmark" size={14} color="#ffffff" />
                            </View>
                          )}
                          
                          {/* Delete button */}
                          <TouchableOpacity
                            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 items-center justify-center"
                            onPress={() => {
                              Alert.alert(
                                'Delete Photo',
                                'Are you sure you want to delete this photo?',
                                [
                                  { text: 'Cancel', style: 'cancel' },
                                  { 
                                    text: 'Delete', 
                                    style: 'destructive',
                                    onPress: () => handleDeletePhoto(photoUrl)
                                  }
                                ]
                              );
                            }}
                          >
                            <Ionicons name="close" size={14} color="#ffffff" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                    
                    {/* Add photo buttons */}
                    <View className="flex-row gap-3">
                      <TouchableOpacity 
                        onPress={handlePickPhotosForPerson}
                        className="w-24 h-24 rounded-lg border-2 border-dashed border-neutral-400 items-center justify-center"
                      >
                        <Ionicons 
                          name="images-outline" 
                          size={24} 
                          color={isDark ? '#9ca3af' : '#6b7280'} 
                        />
                        <Text className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                          Gallery
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={handleTakePhotoForPerson}
                        className="w-24 h-24 rounded-lg border-2 border-dashed border-neutral-400 items-center justify-center"
                      >
                        <Ionicons 
                          name="camera-outline" 
                          size={24} 
                          color={isDark ? '#9ca3af' : '#6b7280'} 
                        />
                        <Text className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                          Camera
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View className="items-center py-8">
                    <View className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${isDark ? 'bg-neutral-700' : 'bg-neutral-200'}`}>
                      <Ionicons 
                        name="camera-outline" 
                        size={32} 
                        color={isDark ? '#9ca3af' : '#6b7280'} 
                      />
                    </View>
                    <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      No photos available
                    </Text>
                    <View className="flex-row gap-3 mt-3">
                      <TouchableOpacity 
                        onPress={handlePickPhotosForPerson}
                        className="flex-1 flex-row items-center justify-center px-4 py-2 rounded-lg bg-green-500"
                      >
                        <Ionicons name="images-outline" size={16} color="#ffffff" />
                        <Text className="text-white font-medium ml-2">Gallery</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={handleTakePhotoForPerson}
                        className="flex-1 flex-row items-center justify-center px-4 py-2 rounded-lg bg-blue-500"
                      >
                        <Ionicons name="camera-outline" size={16} color="#ffffff" />
                        <Text className="text-white font-medium ml-2">Camera</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* New Photos Section */}
              {newPersonPhotos.length > 0 && (
                <View className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-neutral-800' : 'bg-white'} border ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
                  <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    New Photos ({newPersonPhotos.length})
                  </Text>
                  
                  <View className="flex-row flex-wrap gap-3 mb-4">
                    {newPersonPhotos.map((photoUri, index) => (
                      <View key={index} className="relative">
                        <Image 
                          source={{ uri: photoUri }} 
                          className="w-20 h-20 rounded-lg"
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          onPress={() => removeNewPhoto(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 items-center justify-center"
                        >
                          <Ionicons name="close" size={16} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  
                  <TouchableOpacity
                    onPress={handleAddPhotosToPerson}
                    disabled={addingPhotosToPerson}
                    className={`px-4 py-3 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-blue-500'} ${addingPhotosToPerson ? 'opacity-50' : ''}`}
                  >
                    <View className="flex-row items-center justify-center">
                      {addingPhotosToPerson ? (
                        <>
                          <ActivityIndicator size="small" color="#ffffff" />
                          <Text className="text-white font-semibold ml-2">Uploading...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="cloud-upload-outline" size={20} color="#ffffff" />
                          <Text className="text-white font-semibold ml-2">Upload Photos</Text>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  homeInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  homeName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  homeAddress: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  peopleList: {
    padding: 16,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  personImageContainer: {
    marginRight: 12,
  },
  personImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  personImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personImagePlaceholderText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  personDetails: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  personTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  personTypeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  personType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  accessLevel: {
    fontSize: 12,
    marginBottom: 2,
  },
  personNotes: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCancelText: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  modalSaveText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  typeOptionSelected: {
    backgroundColor: '#4CAF50',
  },
  typeOptionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  typeOptionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  imageButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  imageButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectedImages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imagePreview: {
    position: 'relative',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#F44336',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlayText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 12,
  },
});

export default ManagePeopleScreen;
