import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getApiConfig } from '../../config/api';
import { networkRequest, parseJsonResponse } from '../../utils/networkClient';
import { logNetworkDiagnostics } from '../../utils/networkDebugger';

// Get API configuration
const apiConfig = getApiConfig();

// Create Supabase client
export const supabase = createClient(apiConfig.SUPABASE_URL, apiConfig.SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Types matching your Spring Boot User entity
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  userState: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  message?: string;
}

export interface SignUpData {
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
}

export interface LoginData {
  email: string;
  password: string;
}

// Spring Boot API configuration
const SPRING_API_BASE_URL = apiConfig.SPRING_API_BASE_URL;

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private _diagnosticsLogged = false;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // React Native-compatible fetch wrapper using networkClient
  // This prevents duplicate requests and handles timeouts properly
  private async safeFetch(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = 15000
  ): Promise<Response> {
    try {
      // Log network diagnostics on first call
      if (!this._diagnosticsLogged) {
        logNetworkDiagnostics();
        this._diagnosticsLogged = true;
      }
      
      console.log(`🌐 Fetching: ${url}`);
      console.log(`⏱️  Timeout: ${timeoutMs}ms`);
      
      // Use networkClient which handles deduplication and proper timeout
      const response = await networkRequest(url, {
        ...options,
        timeout: timeoutMs,
        // Don't skip deduplication - we want to prevent double calls
        skipDeduplication: false,
      });
      
      console.log(`✅ Response status: ${response.status} ${response.statusText}`);
      return response;
    } catch (error: any) {
      console.error(`❌ Fetch error for ${url}:`, error.message);
      console.error(`❌ Error stack:`, error.stack);
      
      // Provide more specific error messages
      if (error.message?.includes('timeout')) {
        throw new Error(`Request to ${url} timed out after ${timeoutMs}ms. Check your network connection and backend status.`);
      }
      if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
        throw new Error(`Network error: Cannot reach ${url}. Ensure the backend is running at ${getApiConfig().SPRING_API_BASE_URL} and accessible from this device.`);
      }
      throw error;
    }
  }

  // Get current user
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Sign up with Supabase and create user in Spring Boot
  public async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      
      // Step 1: Create user in Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        return {
          success: false,
          error: authError.message,
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Failed to create user account',
        };
      }


      // Step 2: Create user profile in Spring Boot backend
      const userProfile = {
        id: authData.user.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || null,
        role: 'USER',
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zipCode: data.zipCode || null,
        userState: 'PENDING_VERIFICATION',
        emergencyContact: data.emergencyContact || null,
      };

      console.log('Creating user in Spring Boot backend:', userProfile);

      const springResponse = await this.safeFetch(
        `${SPRING_API_BASE_URL}${API_CONFIG.ENDPOINTS.USERS}`,
        {
          method: 'POST',
          body: JSON.stringify(userProfile),
        },
        15000
      );

      if (!springResponse.ok) {
        const errorText = await springResponse.text();
        console.error('Spring Boot user creation failed:', {
          status: springResponse.status,
          statusText: springResponse.statusText,
          error: errorText,
        });
        
        // Note: We can't delete Supabase user from client side (requires admin)
        // The user will need to be cleaned up manually or via a backend cleanup job
        return {
          success: false,
          error: `Unable to create your account: ${errorText || 'Please try again or contact support'}`,
        };
      }

      const springUser = await springResponse.json();
      
      this.currentUser = springUser;

      return {
        success: true,
        user: springUser,
        message: 'Account created successfully! Please check your email to verify your account.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Something went wrong during sign up. Please try again.',
      };
    }
  }

  // Sign in with Supabase and fetch user from Spring Boot
  public async signIn(data: LoginData): Promise<AuthResponse> {
    try {
      // Step 1: Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        return {
          success: false,
          error: authError.message,
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Step 2: Fetch user profile from Spring Boot backend
      const springResponse = await this.safeFetch(
        `${SPRING_API_BASE_URL}${API_CONFIG.ENDPOINTS.USERS}/${authData.user.id}`,
        { method: 'GET' },
        15000
      );

      if (!springResponse.ok) {
        const errorText = await springResponse.text();
        
        return {
          success: false,
          error: 'Unable to sign you in. Please check your credentials and try again.',
        };
      }

      const springUser = await springResponse.json();
      
      this.currentUser = springUser;

      return {
        success: true,
        user: springUser,
        message: 'Welcome back!',
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Something went wrong during sign in. Please try again.',
      };
    }
  }

  // Sign out
  public async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      this.currentUser = null;
      return {
        success: true,
        message: 'Signed out successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Unable to sign out. Please try again.',
      };
    }
  }

  // Reset password
  public async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'homeguardai://reset-password', // Deep link for password reset
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        message: 'Password reset email sent! Please check your inbox.',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Unable to send password reset email. Please try again.',
      };
    }
  }

  // Update user profile in Spring Boot
  public async updateProfile(updates: Partial<User>): Promise<AuthResponse> {
    try {
      if (!this.currentUser) {
        return {
          success: false,
          error: 'No user logged in',
        };
      }

      const springResponse = await this.safeFetch(
        `${SPRING_API_BASE_URL}${API_CONFIG.ENDPOINTS.USERS}/${this.currentUser.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            ...updates,
            updatedAt: new Date().toISOString(),
          }),
        },
        15000
      );

      if (!springResponse.ok) {
        return {
          success: false,
          error: 'Failed to update user profile',
        };
      }

      const updatedUser = await springResponse.json();
      this.currentUser = updatedUser;

      return {
        success: true,
        user: updatedUser,
        message: 'Profile updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Unable to update your profile. Please try again.',
      };
    }
  }

  // Initialize auth state on app start
  public async initializeAuth(): Promise<AuthResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch user profile from Spring Boot
        const springResponse = await this.safeFetch(
          `${SPRING_API_BASE_URL}${API_CONFIG.ENDPOINTS.USERS}/${session.user.id}`,
          { method: 'GET' },
          15000
        );

        if (springResponse.ok) {
          const springUser = await springResponse.json();
          this.currentUser = springUser;
          return {
            success: true,
            user: springUser,
          };
        }
      }

      this.currentUser = null;
      return {
        success: true,
        message: 'No active session',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Unable to initialize the app. Please restart and try again.',
      };
    }
  }

  // Listen to auth state changes
  public onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          // Fetch user profile from Spring Boot
          const springResponse = await this.safeFetch(
            `${SPRING_API_BASE_URL}${API_CONFIG.ENDPOINTS.USERS}/${session.user.id}`,
            { method: 'GET' },
            15000
          );

          if (springResponse.ok) {
            const springUser = await springResponse.json();
            this.currentUser = springUser;
            callback(springUser);
          } else {
            this.currentUser = null;
            callback(null);
          }
        } catch (error) {
          this.currentUser = null;
          callback(null);
        }
      } else {
        this.currentUser = null;
        callback(null);
      }
    });
  }
}

export default AuthService;
