import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  imageUri?: string;
  name?: string;
  personType?: string;
  onPress?: () => void;
  showBorder?: boolean;
  borderColor?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  size = 'medium',
  imageUri,
  name = '',
  personType = 'UNKNOWN',
  onPress,
  showBorder = false,
  borderColor = '#e5e7eb'
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  // Size configurations
  const sizeConfig = {
    small: { container: 'w-8 h-8', text: 'text-sm', icon: 16 },
    medium: { container: 'w-12 h-12', text: 'text-lg', icon: 20 },
    large: { container: 'w-16 h-16', text: 'text-2xl', icon: 24 },
    xlarge: { container: 'w-32 h-32', text: 'text-4xl', icon: 32 }
  };

  // Person type colors
  const getPersonTypeColor = (type: string) => {
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

  // Check if we should show default avatar
  const shouldShowDefault = !imageUri || imageFailed;

  // Get first initial
  const firstInitial = name.charAt(0)?.toUpperCase() || '?';

  // Get background color
  const backgroundColor = getPersonTypeColor(personType);

  const config = sizeConfig[size];

  const AvatarContent = () => (
    <View 
      className={`${config.container} rounded-full overflow-hidden ${
        showBorder ? 'border-2' : ''
      }`}
      style={showBorder ? { borderColor } : {}}
    >
      {shouldShowDefault ? (
        <View 
          className="w-full h-full items-center justify-center"
          style={{ backgroundColor }}
        >
          <Text className={`text-white font-bold ${config.text}`}>
            {firstInitial}
          </Text>
        </View>
      ) : (
        <Image 
          source={{ uri: imageUri }} 
          className="w-full h-full"
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress}>
        <AvatarContent />
      </TouchableOpacity>
    );
  }

  return <AvatarContent />;
};

export default Avatar;
