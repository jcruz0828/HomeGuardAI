import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AuthService, { User, AuthResponse } from '../services/authentication/AuthService';
import { appSettingsService } from '../services/settings/AppSettingsService';
import { useTheme } from './ThemeContext';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    emergencyContact?: string;
  }) => Promise<AuthResponse>;
  signOut: () => Promise<AuthResponse>;
  resetPassword: (email: string) => Promise<AuthResponse>;
  updateProfile: (updates: Partial<User>) => Promise<AuthResponse>;
  fetchUserTheme: (userId: string) => Promise<string | null>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authService = AuthService.getInstance();
  const { setThemeFromUserSettings } = useTheme();

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await authService.initializeAuth();
        if (response.success && response.user) {
          setUser(response.user);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen to auth state changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [authService]);

  const fetchUserTheme = async (userId: string): Promise<string | null> => {
    try {
      const settings = await appSettingsService.getAppSettingsByUserId(userId);
      return settings.theme;
    } catch (error) {
      console.error('Failed to fetch user theme:', error);
      return null;
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    console.log('=== USER CONTEXT: SIGN IN START ===');
    console.log('Email:', email);
    setIsLoading(true);
    try {
      console.log('Calling authService.signIn...');
      const response = await authService.signIn({ email, password });
      console.log('AuthService response received in UserContext:');
      console.log('Success:', response.success);
      console.log('Error:', response.error);
      console.log('User present:', !!response.user);
      
      if (response.success && response.user) {
        console.log('Setting user in context...');
        console.log('User object:', JSON.stringify(response.user, null, 2));
        setUser(response.user);
        console.log('✅ User set successfully in context');
        console.log('Navigation should trigger automatically via AppNavigator...');
        
        // Fetch and apply user's theme preference (non-blocking)
        try {
          console.log('Fetching user theme...');
          const userTheme = await fetchUserTheme(response.user.id);
          if (userTheme) {
            console.log('Applying user theme:', userTheme);
            setThemeFromUserSettings(userTheme);
          } else {
            console.log('No theme found for user');
          }
        } catch (error) {
          console.error('Failed to apply user theme (non-critical):', error);
          // Don't fail sign-in if theme fetch fails
        }
      } else {
        console.warn('❌ Sign in response indicates failure or missing user');
        console.warn('Response:', JSON.stringify(response, null, 2));
      }
      console.log('=== USER CONTEXT: SIGN IN COMPLETE ===');
      return response;
    } catch (error) {
      console.error('❌ USER CONTEXT: Sign in exception:');
      console.error('Error:', error);
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('=== USER CONTEXT: SIGN IN FAILED ===');
      return {
        success: false,
        error: `An unexpected error occurred during sign in: ${error?.message || 'Unknown error'}`,
      };
    } finally {
      setIsLoading(false);
      console.log('Loading state set to false');
    }
  };

  const signUp = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    emergencyContact?: string;
  }): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.signUp(data);
      if (response.success && response.user) {
        setUser(response.user);
      }
      return response;
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during sign up',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.signOut();
      
      if (response.success) {
        setUser(null);
      }
      return response;
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during sign out',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<AuthResponse> => {
    try {
      return await authService.resetPassword(email);
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during password reset',
      };
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.updateProfile(updates);
      if (response.success && response.user) {
        setUser(response.user);
      }
      return response;
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during profile update',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const value: UserContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    fetchUserTheme,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
