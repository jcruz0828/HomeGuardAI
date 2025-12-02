# HomeGuard AI - Mobile Application Documentation

## Overview

The HomeGuard AI mobile application is a cross-platform React Native app built with Expo, providing a comprehensive interface for managing homes, people, security settings, and monitoring access activities.

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS)
- **Navigation**: React Navigation
- **State Management**: React Context API
- **Backend Integration**: REST API + Supabase Client
- **Camera**: Expo Camera
- **Image Picker**: Expo Image Picker

## Project Structure

```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── config/              # Configuration files
│   ├── contexts/            # React Context providers
│   ├── navigation/          # Navigation setup
│   ├── screens/             # Screen components
│   │   ├── authentication/  # Login, SignUp, etc.
│   │   ├── home-management/ # Home dashboard, list
│   │   ├── people-management/ # People management
│   │   ├── device-management/ # Device management
│   │   ├── security-access/ # Security controls
│   │   ├── activities/      # Activity logs
│   │   ├── requests/        # Access requests
│   │   └── settings/        # App settings
│   ├── services/            # API service layer
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── assets/                   # Images, icons
├── App.tsx                   # Root component
└── package.json
```

## Key Features

### Authentication
- User registration
- Login/logout
- Terms of service acceptance
- Session management

### Home Management
- Create and manage multiple homes
- Set primary home
- Home selection screen
- Home dashboard with overview
- Home list view

### People Management
- Add people to homes
- Face enrollment with camera
- Person profiles
- Member management
- Invite users to homes

### Security & Access
- Security settings per home
- Face detection configuration
- RFID card management
- Deadbolt control
- Access logs viewing

### Activity Monitoring
- Recent activities per home
- Global activities across all homes
- Activity filtering
- Real-time updates

### Device Management
- View all devices for a home
- Device status monitoring
- All devices across homes view

### Settings
- App settings
- User preferences
- Theme management

## Navigation Structure

### Auth Navigator
Handles authentication flow:
- `LandingScreen` - Initial landing page
- `LoginScreen` - User login
- `SignUpScreen` - User registration
- `TermsOfServiceScreen` - Terms acceptance

### Main Navigator
Main application navigation:
- `HomeSelectionScreen` - Select active home
- `HomeDashboardScreen` - Home overview
- `HomeListScreen` - List all homes
- `MemberManagementScreen` - Manage home members
- `ManagePeopleScreen` - Manage people
- `DeviceManagementScreen` - Device management
- `SecuritySettingsScreen` - Security configuration
- `AccessLogsScreen` - View access logs
- `RecentActivitiesScreen` - Home activities
- `GlobalActivitiesScreen` - All activities
- `AppSettingsScreen` - App settings
- And more...

## Services Layer

### Authentication Service (`AuthService.ts`)
- User login
- User registration
- Session management
- Token handling

### Home Services
- `HomeService.ts` - Home CRUD operations
- `HomeActivityService.ts` - Activity management
- `HomeInvitationService.ts` - Invitation handling

### People Services
- `PersonService.ts` - Person management
- `HomePersonService.ts` - Home-person associations
- `FaceEnrollmentService.ts` - Face enrollment workflow

### Security Services
- `SecuritySettingsService.ts` - Security configuration
- `FaceRecognitionSettingsService.ts` - Face recognition settings
- `AccessLogService.ts` - Access log retrieval

### Storage Service
- `SupabaseStorageService.ts` - File uploads to Supabase

## Context Providers

### UserContext
Manages user state:
- Current user information
- Authentication status
- User preferences

### ThemeContext
Manages app theming:
- Light/dark mode
- Theme preferences

## Key Screens

### Home Dashboard Screen
- Overview of home status
- Quick access to features
- Recent activities preview
- Security status

### Face Detection Screen
- Camera interface for face enrollment
- Image capture
- Multiple image upload
- Face processing status

### Access Logs Screen
- List of access attempts
- Filtering options
- Access result indicators
- Timestamp information

### Member Management Screen
- List of home members
- Invite new members
- Manage roles
- Remove members

## API Integration

### Configuration
API base URL configured in `src/config/api.ts`:
```typescript
const API_BASE_URL = 'http://your-backend-url/api/v1';
```

### Service Pattern
Services use fetch with timeout:
```typescript
// Example from PersonService
async createPerson(data: PersonRequestDto): Promise<Person> {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/persons`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
  );
  return response.json();
}
```

## Camera Integration

### Face Enrollment Flow
1. User navigates to Face Detection screen
2. Camera interface opens
3. User captures multiple images
4. Images uploaded to Supabase Storage
5. Backend processes images via ML service
6. Face embeddings generated and stored

### Implementation
Uses `expo-camera` for camera access:
```typescript
import { Camera } from 'expo-camera';
```

## Image Handling

### Image Picker
Uses `expo-image-picker`:
- Select from gallery
- Take new photos
- Multiple image selection

### Storage
Images stored in Supabase Storage:
- Private buckets
- Signed URLs for access
- Integration with backend API

## Styling

### NativeWind (Tailwind CSS)
Utility-first CSS framework:
```typescript
<View className="flex-1 bg-white p-4">
  <Text className="text-xl font-bold">Title</Text>
</View>
```

### Global Styles
Defined in `global.css`:
- Base styles
- Theme variables
- Custom utilities

## State Management

### Context API
- `UserContext` - User state
- `ThemeContext` - Theme state

### Local State
- React hooks (`useState`, `useEffect`)
- Component-level state management

## Error Handling

### Network Errors
- Timeout handling (`fetchWithTimeout`)
- Retry logic
- Error messages to users

### API Errors
- Error response handling
- User-friendly error messages
- Logging for debugging

## Utilities

### Network Utilities
- `networkClient.ts` - HTTP client wrapper
- `fetchWithTimeout.ts` - Fetch with timeout
- `networkDebugger.ts` - Network debugging

### Debug Utilities
- `debugSupabase.ts` - Supabase debugging

## Environment Configuration

### Environment Variables
Configured via `react-native-dotenv`:
- API URLs
- Supabase configuration
- Feature flags

### Type Definitions
Environment types in `src/types/env.d.ts`

## Running the Application

### Development
```bash
cd mobile
npm install
npm start
```

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Web
```bash
npm run web
```

## Build Configuration

### Expo Configuration
`app.json` contains:
- App name and version
- Icon and splash screen
- Permissions
- Build settings

### TypeScript Configuration
`tsconfig.json`:
- Strict type checking
- Path aliases
- Module resolution

## Dependencies

### Core Dependencies
- `react` - React library
- `react-native` - React Native framework
- `expo` - Expo SDK
- `@react-navigation/*` - Navigation
- `@supabase/supabase-js` - Supabase client
- `nativewind` - Tailwind CSS
- `expo-camera` - Camera access
- `expo-image-picker` - Image selection

### Development Dependencies
- `typescript` - TypeScript compiler
- `@types/react` - React types
- `@types/react-native` - React Native types

## Testing

### Manual Testing
- Test on iOS simulator
- Test on Android emulator
- Test on physical devices

### Debugging
- React Native Debugger
- Expo DevTools
- Network debugging utilities

## Performance Considerations

### Image Optimization
- Image compression
- Lazy loading
- Caching strategies

### Network Optimization
- Request batching
- Caching API responses
- Offline support (future)

### Rendering Optimization
- React.memo for components
- useMemo/useCallback hooks
- List virtualization (if needed)

## Security

### Authentication
- Secure token storage
- Session management
- Auto-logout on token expiry

### Data Protection
- HTTPS for all API calls
- Secure storage for sensitive data
- Input validation

## Future Enhancements

- Push notifications
- Offline mode
- Biometric authentication
- Real-time updates (WebSocket)
- Advanced analytics
- Dark mode improvements
- Accessibility enhancements
- Performance monitoring
- Error tracking (Sentry)

---

**Last Updated**: 2024

