import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { isDark } = useTheme();
  const { signIn, isLoading } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    console.log('=== LOGIN SCREEN: LOGIN ATTEMPT ===');
    console.log('Email entered:', email);
    console.log('Password provided:', !!password);
    console.log('Password length:', password.length);
    
    if (!email || !password) {
      console.warn('❌ Validation failed: Missing email or password');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    console.log('Calling signIn service...');
    const response = await signIn(email, password);
    
    console.log('Sign in response received:');
    console.log('Success:', response.success);
    console.log('Error:', response.error);
    console.log('Message:', response.message);
    console.log('User:', response.user ? 'Present' : 'Missing');
    
    if (response.success) {
      console.log('✅ Login successful');
      Alert.alert('Success', response.message || 'Login successful!', [
        { text: 'OK', onPress: () => {
          // Navigation will be handled automatically by AppNavigator
          // when user state changes
        }}
      ]);
    } else {
      console.error('❌ Login failed:', response.error);
      Alert.alert('Error', response.error || 'Login failed');
    }
  
    console.log('=== LOGIN SCREEN: LOGIN ATTEMPT COMPLETE ===');
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-neutral-900' : 'bg-white'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-8">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="mb-8"
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={isDark ? '#ffffff' : '#000000'} 
            />
          </TouchableOpacity>
          
          <Text className={`text-4xl font-bold mb-3 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            Welcome Back
          </Text>
          <Text className={`text-lg ${isDark ? 'text-neutral-300' : 'text-neutral-600'} mb-8`}>
            Sign in to your HomeGuard AI account
          </Text>
        </View>

        {/* Form */}
        <View className="flex-1 px-6">
          <View className="space-y-8">
            {/* Email Input */}
            <View className="mb-6">
              <Text className={`text-sm font-semibold mb-3 ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
                Email Address
              </Text>
              <View className={`flex-row items-center border-2 rounded-xl px-4 py-4 ${
                isDark ? 'border-neutral-600 bg-neutral-800' : 'border-neutral-200 bg-white'
              }`} style={{ minHeight: 56 }}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={isDark ? '#a3a3a3' : '#737373'}
                  
                />
                <TextInput
                  className={`flex-1 ml-3 text-lg ${isDark ? 'text-white' : 'text-neutral-900'}`}
                  placeholder="Enter your email"
                  placeholderTextColor={isDark ? '#a3a3a3' : '#737373'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{ 
                    textAlignVertical: 'center',
                    paddingVertical: 0,
                    includeFontPadding: false,
                    lineHeight: 24,
                    fontSize: 18,
                    marginBottom: 2
                  }}
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-6">
              <Text className={`text-sm font-semibold mb-3 ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
                Password
              </Text>
              <View className={`flex-row items-center border-2 rounded-xl px-4 py-4 ${
                isDark ? 'border-neutral-600 bg-neutral-800' : 'border-neutral-200 bg-white'
              }`} style={{ minHeight: 56 }}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={isDark ? '#a3a3a3' : '#737373'} 
                />
                <TextInput
                  className={`flex-1 ml-3 text-lg ${isDark ? 'text-white' : 'text-neutral-900'}`}
                  placeholder="Enter your password"
                  placeholderTextColor={isDark ? '#a3a3a3' : '#737373'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={{ 
                    textAlignVertical: 'center',
                    paddingVertical: 0,
                    includeFontPadding: false,
                    lineHeight: 24,
                    fontSize: 18,
                    marginBottom: 2
                  }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={isDark ? '#a3a3a3' : '#737373'} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity className="self-end">
              <Text className={`text-sm ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            className={`py-5 px-6 rounded-xl mt-12 ${isDark ? 'bg-primary-600' : 'bg-primary-500'} ${
              isLoading ? 'opacity-50' : ''
            }`}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text className="text-white text-lg font-semibold text-center" >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View className="flex-row justify-center items-center mt-10">
            <Text className={`text-base ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text className={`text-base font-semibold ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
